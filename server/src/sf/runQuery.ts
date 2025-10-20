import type { FastifyRequest } from "fastify";
import type { Binds } from "snowflake-sdk";
import SnowflakeConnection, { StatementInfo } from "./SnowflakeConnection.js";
import connectionFactory from "./ConnectionFactory.js";
import ApiError, { AuthError, ErrorCodes, RequestError } from "../errors.js";
import { abortOnClose } from "../api/routeHelpers.js";
import { HeaderSfCurrentUser, HeaderSfUserToken, SfContextHeaders } from "../types/spscTypes.js";

export interface runQueryOptions {
  /** Must be provided if wanting to run query as the user */
  request?: FastifyRequest;
  /** Bindings if the query is parameterized */
  bindings?: Binds;
  /** If given, will populate it with query statement ids */
  info?: StatementInfo;
  asUser?: boolean;
}

export default async function runQuery<T extends Array<unknown>>(
  query: string,
  options: runQueryOptions = {},
): Promise<T[]> {
  // if given a request, create an abort controller
  const abortController = options.request ? new AbortController() : undefined;
  try {
    let userId: string | undefined = undefined;
    let con: SnowflakeConnection;
    if (options.asUser && options.request) {
      let userToken: string | undefined;
      if (process.env.IS_LOCAL) {
        // if local, make a fake user token. connection config will ignore it if no snowflake token file
        userToken = "local-fake";
      } else {
        userToken = (options.request.headers as unknown as SfContextHeaders)[HeaderSfUserToken];
        if (!userToken) {
          throw new AuthError("unable to use caller rights, user token not in headers");
        }
      }
      con = await connectionFactory.AsUserConnection(userToken);
    } else {
      if (options.request) {
        userId = (options.request.headers as unknown as SfContextHeaders)[HeaderSfCurrentUser];
      }
      con = await connectionFactory.getConnection();
    }
    // array of promises to race
    // default has the actual query execution
    const promises: Promise<unknown>[] = [
      con.execute(query, {
        bindings: options.bindings,
        info: options.info,
        abortSignal: abortController?.signal,
        queryTagAddon: userId,
      }),
    ];
    // if we have a request and abort controller, add a promise that will abort the signal if request ends
    if (options.request && abortController) {
      promises.push(abortOnClose(options.request, abortController, [] as T[]));
    }
    // if query finished first, will be data result
    // if abort happened, will be empty array
    const data = await Promise.race(promises);
    return data as T[];
  } catch (e) {
    if (e instanceof ApiError) {
      throw e;
    }
    if (e instanceof Error) {
      const error = new RequestError(e.message, ErrorCodes.QUERY);
      throw error;
    }
    throw new ApiError("an unknown error occurred");
  }
}
