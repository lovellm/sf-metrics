// https://docs.snowflake.com/en/developer-guide/sql-api/authenticating#using-key-pair-authentication
import crypto from "node:crypto";
import fs, { existsSync, readFileSync } from "node:fs";
import jwt from "jsonwebtoken";
import { ConfigError } from "../errors.js";
import { SnowflakeTokenType } from "../types/sfApi.js";

// For local use only, cache the token to not have to recreate every time
let existingToken: string | undefined = undefined;
let existingExpire: number | undefined = undefined;

type TokenResult = {
  token: string;
  type: SnowflakeTokenType;
};

/** returns a BEARER token for use with Snowflake Web API.
 * When used locally, userToken arg is ignored, token is generated using KeyPair auth from env config
 * (must have KeyPair config or it will not work).
 * When deployed in SPCS, uses the session token for the service.
 * When userToken given, appends it to the service token to run as the user.
 */
export default function getOauthToken(userToken?: string): TokenResult {
  if (existingToken && existingExpire && existingExpire > new Date().valueOf() / 1000 + 120000) {
    // when deployed, these will always be undefined so this will never happen
    return { token: existingToken, type: "KEYPAIR_JWT" };
  }

  if (existsSync("/snowflake/session/token")) {
    // we are deployed in spcs. use token from file
    let token = readFileSync("/snowflake/session/token", "ascii");
    if (userToken) {
      token += "." + userToken;
    }
    return { token: token, type: "OAUTH" };
  } else {
    // we are running locally. create the token
    if (!process.env.SNOWFLAKE_ACCOUNT || !process.env.SNOWFLAKE_USER) {
      throw new ConfigError("No SF_ACCOUNT or SF_USERNAME configured");
    }

    let pkText = process.env.SNOWFLAKE_PK_STRING;
    if (!pkText && process.env.SNOWFLAKE_PK_PATH) {
      pkText = fs.readFileSync(process.env.SNOWFLAKE_PK_PATH, "utf-8");
    }
    if (!pkText) {
      throw new ConfigError("Requires either SNOWFLAKE_PK_PATH or SNOWFLAKE_PK_STRING");
    }
    const pkPass = process.env.SNOWFLAKE_PK_PASS;
    const qualified_username =
      process.env.SNOWFLAKE_ACCOUNT.toUpperCase() + "." + process.env.SNOWFLAKE_USER.toUpperCase();

    const privateKeyObject = crypto.createPrivateKey({
      key: pkText,
      format: "pem",
      passphrase: pkPass,
    });
    const privateKey = privateKeyObject.export({ format: "pem", type: "pkcs8" });

    const publicKeyObject = crypto.createPublicKey({ key: privateKey, format: "pem" });
    const publicKey = publicKeyObject.export({ format: "der", type: "spki" });
    const publicKeyFingerprint =
      "SHA256:" + crypto.createHash("sha256").update(publicKey).digest("base64");

    const signOptions = {
      iss: qualified_username + "." + publicKeyFingerprint,
      sub: qualified_username,
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    };

    const token = jwt.sign(signOptions, privateKey, { algorithm: "RS256" });
    existingToken = token;
    existingExpire = signOptions.exp;

    return { token: token, type: "KEYPAIR_JWT" };
  }
}
