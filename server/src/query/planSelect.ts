import { RequestError } from "../errors.js";
import { ColumnDefinition } from "../types/dataApi.js";
import { cleanStringLiteral, getIdentifier } from "../utils/apiHelpers.js";

export interface SelectPlan {
  /** SQL select parts. should be comma concatenated */
  selectParts: string[];
  /** list of column aliases corresponding to selectParts */
  aliasList: string[];
  /** column names or alias to use in a GROUP BY. undefined if no GROUP BY needed. should be comma concatenated */
  groupParts?: string[];
  /** booleans of whether the selectPart at the same index needs to be part of a GROUP BY */
  groupBools?: boolean[];
}

export default function planSelect(columns: ColumnDefinition[]): SelectPlan {
  if (!columns || !columns.length) {
    throw new RequestError("no column list provided");
  }
  const aliasList: string[] = [];
  const selectParts: string[] = [];
  const groupParts: string[] = [];
  const groupBools: boolean[] = [];
  let hasAgg = false;
  let hasStar = false;
  columns.forEach((col) => {
    const { sql, isAgg, isStar } = columnToSql(col);
    let thisAlias = sql;
    if (typeof col !== "string" && "alias" in col && col.alias) {
      // an alias was specified, add it
      const alias = col.alias.toUpperCase();
      selectParts.push(sql + " AS " + alias);
      thisAlias = alias;
    } else {
      selectParts.push(sql);
    }
    aliasList.push(thisAlias);

    if (isAgg) {
      groupBools.push(false);
      hasAgg = true;
    } else {
      groupParts.push(thisAlias);
      groupBools.push(true);
    }
    if (isStar) {
      hasStar = true;
    }
  });

  // cannot SELECT * and have aggregation, group by gets in the way
  if (hasStar && hasAgg) {
    throw new RequestError("cannot request the column * and have aggregation in the same query");
  }

  return {
    aliasList,
    selectParts,
    groupParts: hasAgg ? groupParts : undefined,
    groupBools: hasAgg ? groupBools : undefined,
  };
}

interface ColumnToSqlResult {
  sql: string;
  isAgg?: boolean;
  isStar?: boolean;
}

/** convert a Column definition to the SQL need to SELECT it */
export const columnToSql = (column: ColumnDefinition): ColumnToSqlResult => {
  // get the main column identifier
  const col = getIdentifier(column);
  const columnResult: ColumnToSqlResult = {
    sql: col,
  };
  // column is just an identifier
  if (typeof column === "string") {
    return columnResult;
  }
  // Has Aggregation
  if ("agg" in column) {
    columnResult.isAgg = true;
    switch (column.agg) {
      case "countdistinct":
        columnResult.sql = `COUNT(DISTINCT ${col})`;
        break;
      case "max_by":
      case "min_by": {
        const aggBy = getIdentifier(column.by);
        columnResult.sql = `${column.agg.toUpperCase()}(${col}, ${aggBy})`;
        break;
      }
      case "listagg": {
        const parts: string[] = ["LISTAGG("];
        if (column.distinct === true) {
          parts.push("DISTINCT ");
        }
        parts.push(col);
        if (column.delim) {
          parts.push(`, '${column.delim}'`);
        }

        parts.push(")");

        if (column.order) {
          const orderBy = getIdentifier(column.order);
          parts.push(` WITHIN GROUP (ORDER BY ${orderBy}`);
          if (column.desc === true) {
            parts.push(" DESC");
          }
          parts.push(")");
        }
        columnResult.sql = parts.join("");
        break;
      }
      default:
        columnResult.sql = `${column.agg.toUpperCase()}(${col})`;
    }
  } else if ("args" in column) {
    const args = column.args;
    if (!Array.isArray(args)) {
      throw new RequestError(`args for column ${col} must be an array`);
    }
    const values = args.map((a) => {
      if (typeof a === "string") {
        // see if it is really a number, since fastify converts numbers to strings for unknown reasons
        const asNum = a ? Number(a) : undefined;
        if (asNum !== undefined && Number.isFinite(asNum)) {
          return asNum;
        }
        const lit = cleanStringLiteral(a);
        // if not a literal, then a column name
        return lit || getIdentifier(a);
      }
      if (typeof a === "number") {
        return a;
      }
      if (typeof a === "boolean") {
        return a;
      }
      if (a && typeof a === "object") {
        return getIdentifier(a);
      }
    });
    columnResult.sql += `(${values.join(", ")})`;
  } else {
    if (col === "*") {
      columnResult.isStar = true;
    }
  }

  return columnResult;
};
