import { Type } from "@sinclair/typebox";
import { ApiOptions, QueryDefinition } from "../types/dataApi.js";
import { getTable } from "../utils/apiHelpers.js";
import { planFilter } from "./planFilter.js";
import planJoins from "./planJoins.js";
import planSelect from "./planSelect.js";
import planOrder from "./planOrder.js";

export const DEFAULT_QUERY_LIMIT = 1000;

export interface QueryPlan {
  select: string;
  from: string;
  joins?: string;
  filter?: string;
  having?: string;
  groupBy?: string;
  order?: string;
  limit?: string;
  offset?: string;
}

export const QueryPlanSchema = Type.Object({
  select: Type.String({ description: "SQL SELECT string" }),
  from: Type.String({ description: "SQL FROM string, coming after select" }),
  joins: Type.Optional(Type.String({ description: "SQL Joins, coming after from." })),
  filter: Type.Optional(Type.String({ description: "SQL WHERE string, coming after joins." })),
  groupBy: Type.Optional(
    Type.String({
      description: "SQL GROUP BY, by number, only if select has aggregation, coming after filter.",
    }),
  ),
  having: Type.Optional(Type.String({ description: "SQL HAVING clause, coming after groupBy" })),
  limit: Type.Optional(
    Type.Number({
      description: "LIMIT clause at the end of the query",
      default: DEFAULT_QUERY_LIMIT,
    }),
  ),
  offset: Type.Optional(Type.Number()),
  order: Type.Optional(Type.String()),
});

export default function planQuery(query: QueryDefinition, options?: ApiOptions): QueryPlan {
  const selectPlan = planSelect(query.columns);
  const tableInfo = getTable(query, options);
  let groupBy: string | undefined = undefined;
  if (selectPlan.groupBools) {
    const groupByIndex = selectPlan.groupBools
      .map<string>((isGroupBy, i) => (isGroupBy ? i + 1 + "" : ""))
      .filter((o) => o)
      .join(", ");
    if (groupByIndex) {
      groupBy = "GROUP BY " + groupByIndex;
    }
  }

  let filter: string | undefined = undefined;
  let having: string | undefined = undefined;
  if (query.filter) {
    filter = planFilter(query.filter);
  }
  if (query.having) {
    having = planFilter(query.having, { isHaving: true });
  }

  const joins = planJoins(query.joins, options);

  const distinct = query.distinct === true && !selectPlan.groupBools;

  const order = planOrder(query.order);

  return {
    select: `SELECT${distinct ? " DISTINCT" : ""} ${selectPlan.selectParts.join(", ")}`,
    from: "FROM " + tableInfo.withAlias,
    joins: joins ? joins.join("\n") : undefined,
    filter: filter ? "WHERE " + filter : undefined,
    having: having ? "HAVING " + having : undefined,
    groupBy: groupBy,
    order: order && order.length > 0 ? "ORDER BY " + order.join(", ") : undefined,
    limit: "LIMIT " + (query.limit || DEFAULT_QUERY_LIMIT),
    offset: query.offset ? "OFFSET " + query.offset : undefined,
  };
}
