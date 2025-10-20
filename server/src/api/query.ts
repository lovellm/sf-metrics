import { StatementInfo } from "../sf/SnowflakeConnection.js";
import { ApiOptions, DataResult, QueryDefinition } from "../types/dataApi.js";
import generateQuery from "../query/generateQuery.js";
import { rethrowWithQuery } from "../errors.js";
import runQuery from "../sf/runQuery.js";
import { FastifyRequest } from "fastify";

/** convert a QueryDefinition to a SQL string */
export default async function query(
  request: FastifyRequest,
  query: QueryDefinition,
  options?: ApiOptions,
): Promise<DataResult> {
  const q = generateQuery(query, options);
  const info: StatementInfo = {};
  const result: DataResult = { data: [] };
  try {
    const resultData = await runQuery(q.sql, {
      info: info,
      request: request,
      asUser: query.asUser,
    });
    result.data = resultData;
    result.queryId = info.queryId;
  } catch (e) {
    rethrowWithQuery(e, q.sql);
  }

  if (query.sql) {
    result.sql = q.sql;
  }
  if (query.includeColumns) {
    result.columns = info.columns;
  }
  return result;
}
