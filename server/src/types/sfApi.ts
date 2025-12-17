import { Type } from "@sinclair/typebox";

export type SnowflakeTokenType = "OAUTH" | "KEYPAIR_JWT";
export type SnowflakeApiHeaders = {
  Authorization: string;
  Accept: "application/json";
  "Content-Type": "application/json";
  "X-Snowflake-Authorization-Token-Type": SnowflakeTokenType;
};

export const InferenceMessageSchema = Type.Object({
  role: Type.Union([Type.Literal("user"), Type.Literal("system"), Type.Literal("assistant")]),
  content: Type.String(),
});
// https://docs.snowflake.com/developer-guide/snowflake-rest-api/reference/cortex-inference#post--api-v2-cortex-inference-complete
export const InferenceRequestSchema = Type.Object({
  model: Type.String(),
  messages: Type.Array(InferenceMessageSchema),
  temperature: Type.Optional(Type.Number()),
  top_p: Type.Optional(Type.Number()),
  max_tokens: Type.Optional(Type.Integer({ minimum: 1 })),
  response_format: Type.Optional(
    Type.Object({
      type: Type.String(),
      schema: Type.Record(Type.String(), Type.Unknown()),
    }),
  ),
  guardrails: Type.Optional(
    Type.Object({
      enabled: Type.Boolean(),
      response_when_unsafe: Type.String(),
    }),
  ),
  asUser: Type.Optional(Type.Boolean()),
});

// https://docs.snowflake.com/en/developer-guide/snowflake-rest-api/reference/cortex-search-service#post--api-v2-databases-database-schemas-schema-cortex-search-services-service_name-query
export const CortexSearchRequestSchema = Type.Object({
  query: Type.String(),
  columns: Type.Array(Type.String()),
  filter: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
  limit: Type.Optional(Type.Number({ minimum: 1 })),
  asUser: Type.Optional(Type.Boolean()),
});
export const CortexUrlParams = Type.Object({
  database: Type.String(),
  schema: Type.String(),
  service: Type.String(),
});
