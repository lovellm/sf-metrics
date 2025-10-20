import { RequestError } from "../errors.js";
import { QueryOrder } from "../types/dataApi.js";
import { columnToSql } from "./planSelect.js";

export default function planOrder(order?: QueryOrder) {
  if (!order) {
    return undefined;
  }

  const sql = order.map<string>((entry) => {
    if (!entry.name) {
      throw new RequestError("order array contains an entry without a name property");
    }
    const col = columnToSql(entry.name);
    const dir = entry.dir === "desc" ? " DESC NULLS LAST" : " ASC NULLS LAST";

    return col.sql + dir;
  });

  if (sql && sql.length > 0) {
    return sql;
  }

  return undefined;
}
