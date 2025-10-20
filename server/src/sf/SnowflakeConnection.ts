import { once } from "node:events";
import snowflake, { Connection, Binds, ConnectionOptions, RowStatement } from "snowflake-sdk";
import logger from "../logging/logger.js";

/** statement timeout to send as a query parameter */
const STATEMENT_TIMEOUT = 180;

/** Modified version of SnowflakeError that uses number instead of enum for code, since enum was missing key entries */
export interface CustomSnowflakeError {
  code?: string | number;
  sqlState?: string;
  data?: Record<string, unknown>;
  response?: Record<string, unknown>;
  responseBody?: string;
  cause?: Error;
  isFatal?: boolean;
  message?: string;
}
export interface ResultColumnInfo {
  id: number;
  name: string;
  type: string;
}
export interface StatementInfo {
  queryId?: string;
  requestId?: string;
  columns?: ResultColumnInfo[];
}
export interface ExecuteOptions {
  bindings?: Binds;
  info?: StatementInfo;
  /** abort signal with which to cancel the query */
  abortSignal?: AbortSignal;
  /** additional text to add to the query tag */
  queryTagAddon?: string;
}
export interface CachedConnectionData {
  serialized: string;
  config: Partial<ConnectionOptions>;
}
const browserSSO = "EXTERNALBROWSER";
const keyPairAuth = "SNOWFLAKE_JWT";

export default class SnowflakeConnection {
  private connection?: Connection;
  private config: ConnectionOptions;
  private activeQueries: number;

  constructor(config: ConnectionOptions) {
    this.config = config;
    this.activeQueries = 0;

    if (this.config.privateKey || this.config.privateKeyPath) {
      this.config.authenticator = keyPairAuth;
    } else if (!this.config.authenticator && !this.config.password) {
      this.config.authenticator = browserSSO;
    }

    snowflake.configure({
      disableOCSPChecks: true,
      logLevel: "OFF",
    });
  }

  /** restore a cached connection to this instance
   * @param serialized serialized connection string
   * @returns true if cached string was valid
   */
  private async connectCached(cachedConnection?: CachedConnectionData): Promise<boolean> {
    try {
      if (cachedConnection && cachedConnection.config) {
        if (
          !(
            this.config.account === cachedConnection.config.account &&
            this.config.username === cachedConnection.config.username &&
            this.config.warehouse === cachedConnection.config.warehouse &&
            this.config.database === cachedConnection.config.database &&
            this.config.schema === cachedConnection.config.schema &&
            this.config.role === cachedConnection.config.role
          )
        ) {
          logger.warn("cached connection has different config than current, ignoring it");
          return false;
        }
        const serialized = cachedConnection.serialized;
        const appendedConfig: ConnectionOptions = {
          ...this.config,
          accessUrl: `https://${this.config.account}.snowflakecomputing.com`,
          host: `https://${this.config.account}.snowflakecomputing.com`,
        };
        const cached = snowflake.deserializeConnection(appendedConfig, serialized);
        if (await cached.isValidAsync()) {
          this.connection = cached;
          logger.debug("Using Cached Snowflake Connection");
          return true;
        } else {
          this.connection = undefined;
          logger.debug("Cached connection expired, ignoring it");
        }
      }
    } catch (e) {
      logger.error("Error trying to restore cached connection", e);
    }
    return false;
  }

  async connect(cached?: CachedConnectionData): Promise<snowflake.Connection> {
    // attempt to restore a cached connection
    const wasCached = await this.connectCached(cached);
    if (wasCached) {
      // cast as connection since should not be possible to be undefined
      return this.connection as snowflake.Connection;
    }

    // create a new connection
    const pendingConnection = snowflake.createConnection(this.config);

    await new Promise<snowflake.Connection>((resolve, reject) => {
      if (this.config.authenticator === browserSSO) {
        pendingConnection
          .connectAsync((err) => {
            if (err) {
              reject(err);
            } else {
              this.connection = pendingConnection;
              resolve(this.connection);
            }
          })
          .catch(() => undefined);
      } else {
        pendingConnection.connect((err) => {
          if (err) {
            reject(err);
          } else {
            this.connection = pendingConnection;
            resolve(this.connection);
          }
        });
      }
    });

    // cast as Connection, since if undefined an error should have been thrown
    return this.connection as snowflake.Connection;
  }

  async close() {
    return new Promise<boolean>((resolve) => {
      if (!this.connection) {
        return resolve(true);
      }
      this.connection.destroy((err) => {
        if (err) {
          const error = err as CustomSnowflakeError;
          if (error.code === 406502) {
            // Already disconnected, ignored
          } else {
            logger.debug("error closing sf connection", err);
          }
          return resolve(false);
        }
        return resolve(true);
      });
    }).catch((e) => {
      // this should not happen, just being cautious
      logger.error("unexpected error from close promise", e as Error);
    });
  }

  async execute<T extends Array<unknown>>(
    query: string,
    options: ExecuteOptions = {},
  ): Promise<T[]> {
    const { bindings, info, abortSignal, queryTagAddon } = options;
    let didResolve = false;
    let statement: RowStatement | undefined = undefined;
    const executePromise = new Promise<T[]>((resolve, reject) => {
      if (!this.connection) {
        return reject(new Error("Attempted to execute DB query without first connecting"));
      }
      /** hold the streaming rows as they come in */
      const dataBuffer: T[] = [];
      this.activeQueries += 1;
      let queryTag = process.env.QUERY_TAG;
      if (queryTagAddon) {
        if (queryTag) {
          queryTag += ":" + queryTagAddon;
        } else {
          queryTag = queryTagAddon;
        }
      }
      statement = this.connection.execute({
        sqlText: query,
        binds: bindings,
        streamResult: true,
        rowMode: "array",
        parameters: {
          QUERY_TAG: queryTag,
          STATEMENT_TIMEOUT_IN_SECONDS: STATEMENT_TIMEOUT,
        },
        complete: (err: snowflake.SnowflakeError | undefined, stmt: snowflake.RowStatement) => {
          this.activeQueries -= 1;

          if (err) {
            return reject(err);
          }

          if (info && stmt) {
            info.queryId = stmt.getQueryId();
            info.requestId = stmt.getRequestId();
            const columns = stmt.getColumns();
            try {
              // not sure if this can throw or not, so being safe
              info.columns = columns?.map<ResultColumnInfo>((col) => ({
                id: col.getId(),
                name: col.getName(),
                type: col.getType(),
              }));
            } catch (e) {
              logger.error("error retrieving result columns", e);
            }
          }
          // const resultRows = stmt.getNumRows();
          const stream = stmt.streamRows();
          // Read data from the stream when it is available
          stream
            .on("data", (chunk: T) => {
              // since rowMode: "array" given, each chunk should be an array representing a row of columns
              dataBuffer.push(chunk);
            })
            .on("end", () => {
              didResolve = true;
              resolve(dataBuffer);
            })
            .on("error", (streamError) => {
              didResolve = true;
              reject(streamError);
            });
        },
      });
    });

    if (abortSignal) {
      once(abortSignal, "abort")
        .then(() => {
          // logger.debug("SnowflakeConnection received abort signal");
          if (!didResolve && statement) {
            logger.debug("SnowflakeConnection cancelling statement");
            statement.cancel();
          }
        })
        .catch((e) => {
          logger.debug("SnowflakeConnection abortSignal caught", e);
        });
    }

    return executePromise;
  }

  isExecuting() {
    return this.activeQueries > 0;
  }
  getConnection() {
    return this.connection;
  }
  getConfig(): Partial<ConnectionOptions> {
    return {
      account: this.config.account,
      username: this.config.username,
      warehouse: this.config.warehouse,
      database: this.config.database,
      schema: this.config.schema,
      role: this.config.role,
      authenticator: this.config.authenticator,
    };
  }
}
