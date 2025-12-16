import { FastifyInstance, FastifyReply } from "fastify";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import {
  CortexSearchRequestSchema,
  CortexUrlParams,
  InferenceRequestSchema,
  SnowflakeApiHeaders,
} from "../types/sfApi.js";
import { HeaderSfUserToken, SfContextHeaders, SfContextHeadersSchema } from "../types/spscTypes.js";
import ApiError from "../errors.js";
import getOauthToken from "../sf/getOauthToken.js";

/** appends the endpoint to the base snowflake url and returns it.
 * expects endpoint to start with a slash (/)
 */
export function getSnowflakeUrl(endpoint: string): string {
  return (
    "https://" +
    (process.env.SNOWFLAKE_HOST || process.env.SNOWFLAKE_ACCOUNT + ".snowflakecomputing.com") +
    endpoint
  );
}

export function getHeaders(userToken?: string): SnowflakeApiHeaders {
  const tokenResult = getOauthToken(userToken);
  return {
    Authorization: "Bearer " + tokenResult.token,
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Snowflake-Authorization-Token-Type": tokenResult.type,
  };
}

export default function sfProxyRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<TypeBoxTypeProvider>();

  // Inference Complete
  server.post(
    "/sf/api/v2/cortex/inference::complete",
    {
      schema: {
        body: InferenceRequestSchema,
        headers: SfContextHeadersSchema,
      },
    },
    async (request, reply) => {
      const apiUrl = "/api/v2/cortex/inference:complete";
      return await proxyRequestToSf({
        apiUrl,
        body: request.body,
        headers: request.headers,
        reply: reply,
        replyContentType: "text/event-stream",
      });
    },
  );

  // Search Query
  // NOTE: this ends in /query whereas real api ends in :query. I could not figure out proper route syntax to get correct one to work
  server.post(
    "/sf/api/v2/databases/:database/schemas/:schema/cortex-search-services/:service/query",
    {
      schema: {
        body: CortexSearchRequestSchema,
        headers: SfContextHeadersSchema,
        params: CortexUrlParams,
      },
    },
    async (request, reply) => {
      const { database, schema, service } = request.params;
      const apiUrl = `/api/v2/databases/${database}/schemas/${schema}/cortex-search-services/${service}:query`;
      return await proxyRequestToSf({
        apiUrl,
        body: request.body,
        headers: request.headers,
        reply: reply,
      });
    },
  );
}

interface ProxyRequestToSfArgs {
  apiUrl: string;
  body: Record<string, unknown> & { asUser?: boolean };
  reply: FastifyReply;
  headers?: SfContextHeaders;
  replyContentType?: string;
}
/** sends the body and headers to the apiUrl for the configured Snowflake. streams the response to the given reply */
const proxyRequestToSf = async ({
  apiUrl,
  body,
  reply,
  headers,
  replyContentType = "application/json",
}: ProxyRequestToSfArgs) => {
  // shallow copy the body so we can modify it
  const requestBoy = { ...body };
  // get the userToken if needing to run as user
  const userToken = requestBoy.asUser && headers ? headers[HeaderSfUserToken] : "";
  // delete asUser since it is not in real sf api, just ours
  delete requestBoy.asUser;
  const requestHeaders = getHeaders(userToken);
  const url = getSnowflakeUrl(apiUrl);

  try {
    const fetchResult = await fetch(url, {
      body: JSON.stringify(requestBoy),
      headers: requestHeaders,
      method: "POST",
    });
    if (fetchResult.status !== 200) {
      // request failed, send an error
      const value = await fetchResult.text();
      throw new ApiError(value, fetchResult.status, "SF_API");
    }
    reply.header("content-type", replyContentType);
    if (fetchResult.body) {
      return reply.send(fetchResult.body);
    } else {
      throw new ApiError("No Response Body", 500, "SF_API");
    }
  } catch (e) {
    if (e instanceof ApiError) {
      throw e;
    }
    if (e instanceof Error) {
      let message = e.message;
      if (typeof e.cause === "string") {
        message += ": " + e.cause;
      }
      throw new ApiError(message, 500, "SF_API_FETCH");
    } else {
      throw e;
    }
  }
};
