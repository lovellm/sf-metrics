import crypto from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { ConnectionOptions } from "snowflake-sdk";
import logger from "../logging/logger.js";
import SnowflakeConnection, { CachedConnectionData } from "./SnowflakeConnection.js";
import { readCacheFile, writeCacheFile } from "../utils/localFileCache.js";
import { AuthError } from "../errors.js";

export interface ConnectionOptionsOverride {
  /** application to use instead of server configured one */
  application?: string;
  /** warehouse to use instead of server configured one */
  warehouse?: string;
  /** role to use intead of server configured one */
  role?: string;
  /** for spsc, this is the user token to append to the service token */
  userToken?: string;
}

/** time during which an API connection can be re-used. after this it is closed and new one made */
const apiConnectionReuseMs = 1000 * 60 * 30;
// only keep connections for a short duration
const userConnectionCacheMs = 1000 * 60 * 5;
interface UserConnectionCache {
  id: string;
  connection: Promise<SnowflakeConnection>;
  firstMade: Date;
  lastUsed?: Date;
  timeout?: NodeJS.Timeout;
}
// cache user connectons to prevent many logins. should improve performance.
const userConnectionCache: Record<string, UserConnectionCache> = {};

class ConnectionFactory {
  private apiDBPromise: Record<string, Promise<SnowflakeConnection> | undefined> = {};
  private apiDBTime: Date | undefined;

  constructor() {}

  /** Returns an already connected Snowflake connection using API NPSA credentials.
   * If one does not yet exist, this will create it.
   * @param {boolean} createNew If true, close the existing connection and make a fresh one
   */
  async getConnection(
    options: ConnectionOptionsOverride = {},
    createNew?: boolean,
  ): Promise<SnowflakeConnection> {
    const key = (options.application || "") + (options.warehouse || "") + (options.role || "");
    const now = new Date();
    if (createNew === true) {
      // only obey createNew param if at least 1s since last time it was used
      // to prevent odd timing conflicts that should not be possible
      if (!this.apiDBTime || now.valueOf() - this.apiDBTime.valueOf() > 1000) {
        logger.debug("forcing new api connection");
        const previous = this.apiDBPromise[key];
        this.apiDBPromise[key] = undefined;
        this.apiDBTime = now;

        // close previous connection without waiting for it
        if (previous) {
          previous.then((db) => db.close()).catch(() => undefined);
        }
      }
    }

    // if existing connection is old and this is not requesting a new one, request a new one instead
    if (
      !createNew &&
      this.apiDBTime &&
      now.valueOf() - this.apiDBTime.valueOf() > apiConnectionReuseMs
    ) {
      return this.getConnection(options, true);
    }

    // existing promise exists, use it
    if (this.apiDBPromise[key]) {
      return this.apiDBPromise[key];
    }

    // make new promise, save it, and return it
    this.apiDBPromise[key] = this.createConnection(options, createNew);
    this.apiDBPromise[key]?.catch((e) => {
      logger.warn("existing apiDBPromise threw, removing it", e);
      this.apiDBPromise[key] = undefined;
    });
    this.apiDBTime = now;
    return this.apiDBPromise[key];
  }

  /** Creates a new Snowflake connection using API NPSA credentials */
  private async createConnection(
    overrides: ConnectionOptionsOverride = {},
    noCache?: boolean,
  ): Promise<SnowflakeConnection> {
    const options: Partial<ConnectionOptions> = {
      warehouse: process.env.SNOWFLAKE_WAREHOUSE,
      database: process.env.SNOWFLAKE_DATABASE,
      schema: process.env.SNOWFLAKE_SCHEMA,
      account: process.env.SNOWFLAKE_ACCOUNT,
      host: process.env.SNOWFLAKE_HOST || undefined,
      application: process.env.APP_NAME || undefined,
      accessUrl:
        "https://" +
        (process.env.SNOWFLAKE_HOST || process.env.SNOWFLAKE_ACCOUNT + ".snowflakecomputing.com"),
    };
    if (existsSync("/snowflake/session/token")) {
      options.authenticator = "OAUTH";
      options.token = readFileSync("/snowflake/session/token", "ascii");
      if (overrides.userToken !== undefined) {
        options.token += "." + overrides.userToken;
      }
    } else {
      options.username = process.env.SNOWFLAKE_USER;
      options.role = process.env.SNOWFLAKE_ROLE;
      options.privateKeyPass = process.env.SNOWFLAKE_PK_PASS;
      options.privateKeyPath = process.env.SNOWFLAKE_PK_PATH;
      options.privateKey = process.env.SNOWFLAKE_PK_STRING;
    }
    if (overrides.application) {
      options.application = overrides.application;
    }
    if (overrides.warehouse) {
      options.warehouse = overrides.warehouse;
    }
    if (overrides.role) {
      options.role = overrides.role;
    }

    // Check private key if provided
    // driver has issues if empty string, so make undefined if falsey
    if (options.privateKey) {
      const pk = options.privateKey.toString().trim();
      // received encrypted file, need to decrypt to use it
      if (pk.startsWith("-----BEGIN ENC")) {
        const pass = options.privateKeyPass;
        if (pass) {
          try {
            const privateKeyObject = crypto.createPrivateKey({
              key: pk,
              format: "pem",
              passphrase: pass,
            });
            options.privateKey = privateKeyObject.export({
              format: "pem",
              type: "pkcs8",
            }) as string;
          } catch (e) {
            logger.warn("unable to decrypt and convert private key, ignoring it");
          }
        } else {
          logger.warn(
            "sf api connection received encrypted private key but no passphrase, ignoring it",
          );
          options.privateKey = undefined;
        }
      }
    } else {
      options.privateKey = undefined;
    }
    if (!options.privateKeyPath) {
      options.privateKeyPath = undefined;
    }

    // attempt to use a restore connection if one exists
    let cachedData: CachedConnectionData | undefined = undefined;
    if (!noCache && process.env.IS_LOCAL === "true" && !overrides.userToken) {
      try {
        const cachedString = await readCacheFile(options.account + ".sf.json");
        if (cachedString) {
          cachedData = JSON.parse(cachedString) as CachedConnectionData;
        }
      } catch (e) {
        logger.warn("unable to read cached connection");
      }
    }

    const db = new SnowflakeConnection(options as ConnectionOptions);
    await db.connect(cachedData);

    if (process.env.IS_LOCAL === "true" && !overrides.userToken) {
      // save the connection to a cache file
      try {
        const connection = db.getConnection();
        if (connection) {
          const dataToCache: CachedConnectionData = {
            // use getConfig instead of above config, as it does not contain password
            config: db.getConfig(),
            serialized: connection.serialize(),
          };
          await writeCacheFile(options.account + ".sf.json", JSON.stringify(dataToCache));
        }
      } catch (e) {
        logger.error("error serializing connection", e);
      }
    }

    return db;
  }

  /** returns a Snowflake connection for the user represented in the provided token
   * @param token The Access Token for the current user, as a string
   */
  async AsUserConnection(
    token: string,
    options: ConnectionOptionsOverride = {},
  ): Promise<SnowflakeConnection> {
    if (!token) {
      throw new AuthError("no user token provided");
    }
    const now = new Date();

    const overrideId =
      (options.application || "") + (options.warehouse || "") + (options.role || "");
    const cacheId = token + overrideId;

    // if existing cached connection record for this user token, reset removal and return it
    const cachedConnection = userConnectionCache[cacheId];
    if (cachedConnection && cachedConnection.lastUsed) {
      // reschedule removal (resets timeout)
      scheduleCacheRemoval(cachedConnection, true);
      // logger.debug("using cached as user connection");
      return cachedConnection.connection;
    }

    // add the token to the options object, since createConnection will use it with the service token
    options.userToken = token;

    // logger.debug("creating new as user connection");
    const db = this.createConnection(options);
    const newCache: UserConnectionCache = {
      id: cacheId,
      firstMade: now,
      connection: db.catch((e) => {
        // don't want to keep a connection that failed, so remove it
        if (userConnectionCache[cacheId]) {
          delete userConnectionCache[cacheId];
        }

        // then rethrow the error so whatever is trying to connect can handle it
        throw e;
      }),
    };

    userConnectionCache[cacheId] = newCache;
    scheduleCacheRemoval(newCache, true);

    return newCache.connection;
  }
}

const scheduleCacheRemoval = (cache: UserConnectionCache, newQuery?: boolean) => {
  if (!cache) {
    return;
  }
  if (cache.timeout) {
    clearTimeout(cache.timeout);
  }
  const cacheId = cache.id;
  if (newQuery) {
    cache.lastUsed = new Date();
  }
  cache.timeout = setTimeout(() => {
    try {
      const cacheToRemove = userConnectionCache[cacheId];
      if (cacheToRemove) {
        cacheToRemove.connection
          .then((db) => {
            if (db.isExecuting()) {
              logger.debug("connection still in use when scheduled to remove - rescheduling");
              scheduleCacheRemoval(cacheToRemove);
            } else {
              // remove connection object from cache store
              delete userConnectionCache[cacheId];
              // close the connection
              db.close().catch(() => undefined);
            }
          })
          .catch(() => {
            // remove connection object from cache store
            delete userConnectionCache[cacheId];
          });
      }
    } catch (e) {
      logger.error("Error in cached connection timeout!", e as Error);
    }
  }, userConnectionCacheMs);
};

const connectionFactory = new ConnectionFactory();
export default connectionFactory;
