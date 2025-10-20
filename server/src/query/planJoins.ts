import { ApiOptions, JoinDefinition, JoinList, JoinType } from "../types/dataApi.js";
import { getTable } from "../utils/apiHelpers.js";
import { planFilter } from "./planFilter.js";

const JoinTypeSql: Record<JoinType, string> = {
  inner: "INNER JOIN",
  left: "LEFT JOIN",
  right: "RIGHT JOIN",
  fullouter: "FULL OUTER JOIN",
};

/** generate the sql for a join list */
export default function planJoins(joins?: JoinList, options?: ApiOptions): string[] | undefined {
  if (!joins || !joins.length) {
    return undefined;
  }

  return joins.map((join) => planJoin(join, options));
}

/** generate the SQL for a join */
export const planJoin = (join: JoinDefinition, options?: ApiOptions): string => {
  const joinTable = getTable(join, options);
  const joinType = join.type ? JoinTypeSql[join.type] || JoinTypeSql.inner : JoinTypeSql.inner;
  let condition = planFilter(join.on);

  if (condition && condition.charAt(0) !== "(") {
    condition = "(" + condition + ")";
  }
  return `${joinType} ${joinTable.withAlias} ON ${condition}`;
};
