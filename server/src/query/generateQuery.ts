import { Static, Type } from "@sinclair/typebox/type";
import planQuery from "./planQuery.js";
import { ApiOptions, QueryDefinition } from "../types/dataApi.js";

export const GeneratedQuerySchema = Type.Object({
  sql: Type.String({ description: "the generated SQL statement" }),
});
type GeneratedQuery = Static<typeof GeneratedQuerySchema>;

/** convert a QueryDefinition to a SQL string */
export default function generateQuery(
  query: QueryDefinition,
  options?: ApiOptions,
): GeneratedQuery {
  const plan = planQuery(query, options);
  const sqlParts: Array<string | undefined> = [
    plan.select,
    plan.from,
    plan.joins,
    plan.filter,
    plan.groupBy,
    plan.having,
    plan.order,
    plan.limit,
    plan.offset,
    ";",
  ];
  return { sql: sqlParts.filter((o) => o).join("\n") };
}
