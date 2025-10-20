import { RequestError } from "../errors.js";
import {
  ColumnDefinition,
  Filter,
  FilterBoolean,
  FilterCompare,
  FilterIn,
  FilterNot,
  FilterUnary,
  GenericObject,
  OperatorMap,
  OperatorsBoolean,
  OperatorsIn,
  OperatorsUnary,
  OpereratorsCompare,
} from "../types/dataApi.js";
import { cleanStringLiteral, escapeString } from "../utils/apiHelpers.js";
import { columnToSql } from "./planSelect.js";

interface FilterOptions {
  isHaving?: boolean;
}

/** get the SQL for a WHERE clause */
export const planFilter = (filter?: Filter, options?: FilterOptions): string | undefined => {
  // make sure we have an object with 1 property (the operator)
  if (!filter) {
    return undefined;
  }
  return processFilter(filter, options);
};

/** mapping of CompareOperator to the associated SQL command */
const CompareOperatorToSql: Record<OpereratorsCompare, string> = {
  eq: "=",
  "=": "=",
  ne: "!=",
  "<>": "!=",
  "!=": "!=",
  gt: ">",
  ">": ">",
  gte: ">=",
  ">=": ">=",
  lt: "<",
  "<": "<",
  lte: "<=",
  "<=": "<=",
  like: "LIKE",
  notlike: "NOT LIKE",
  ilike: "ILIKE",
  notilike: "NOT ILIKE",
};
/** mapping of OperatorsIn to associated SQL command */
const InOperatorToSql: Record<OperatorsIn, string> = {
  in: "IN",
  nin: "NOT IN",
  likeany: "LIKE ANY",
  notlikeany: "NOT LIKE ANY",
};

/** generates the SQL for the given filter */
export const processFilter = (filter: Filter, options?: FilterOptions): string => {
  if (typeof filter !== "object") {
    throw new RequestError("invalid filter - not an object");
  }
  const keys = Object.getOwnPropertyNames(filter);
  if (keys.length !== 1) {
    throw new RequestError("unexpected number of properties on filter object, expected 1");
  }
  const op = keys[0];

  // parse based on operator
  switch (OperatorMap[op]) {
    case "unary": {
      return processUnary(filter as FilterUnary, op as OperatorsUnary, options);
    }
    case "comp": {
      return processCompare(filter as FilterCompare, op as OpereratorsCompare, options);
    }
    case "not": {
      return "NOT " + processFilter((filter as FilterNot).not, options);
    }
    case "in": {
      return processIn(filter as FilterIn, op as OperatorsIn);
    }
    case "bool": {
      return processBoolean(filter as FilterBoolean, op as OperatorsBoolean, options);
    }
    default:
      throw new RequestError("unexpected property on object filter: " + keys[0]);
  }
};

/** generate the sql text for a unary filter */
export const processUnary = (
  filter: FilterUnary,
  op: OperatorsUnary,
  options?: FilterOptions,
): string => {
  const val = processCompareValue(filter[op], options?.isHaving);
  switch (op) {
    case "isnull":
      return val + " IS NULL";
    case "notnull":
      return val + " IS NOT NULL";
    default:
      throw new RequestError("unexpected unary operator: " + (op as string));
  }
};

/** generate the sql text for a compare filter */
export const processCompare = (
  filter: FilterCompare,
  op: OpereratorsCompare,
  options?: FilterOptions,
): string => {
  const values = filter[op];
  if (!Array.isArray(values) || values.length !== 2) {
    throw new RequestError(op + " filter value is not a tuple length 2");
  }
  const v1 = processCompareValue(values[0], options?.isHaving);
  const v2 = processCompareValue(values[1], options?.isHaving);

  return `${v1} ${CompareOperatorToSql[op]} ${v2}`;
};

export const processIn = (filter: FilterIn, op: OperatorsIn): string => {
  const values = filter[op];
  if (!Array.isArray(values) || values.length !== 2) {
    throw new RequestError(op + " filter value is not a tuple length 2");
  }
  const v1 = processCompareValue(values[0]);
  const v2 = values[1];
  if (!Array.isArray(v2) || v2.length < 1) {
    throw new RequestError("values for in operator not an array");
  }
  return `${v1} ${InOperatorToSql[op]} (${v2
    .map((o) => {
      switch (typeof o) {
        case "string":
          return "'" + escapeString(o) + "'";
        case "boolean":
        case "number":
          return o;
        default:
          throw new RequestError("invalid datatype in value list");
      }
    })
    .join(", ")})`;
};

/** process the compare value by extracting column definition from it if needed or validating content */
export const processCompareValue = (
  value?: string | number | boolean | GenericObject,
  allowAgg?: boolean,
): string | number | boolean => {
  if (typeof value === "string") {
    // see if it is really a number, since fastify converts numbers to strings for unknown reasons
    const asNum = value ? Number(value) : undefined;
    if (asNum !== undefined && Number.isFinite(asNum)) {
      return asNum;
    }
    const lit = cleanStringLiteral(value);
    // if not a literal, then a column name
    return lit || columnToSql(value).sql;
  }
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (value && typeof value === "object") {
    const col = columnToSql(value as ColumnDefinition);
    if (col.isAgg && !allowAgg) {
      throw new RequestError("filter column cannot be an aggregation");
    }
    return col.sql;
  }
  throw new RequestError("unknown compare value: " + JSON.stringify(value));
};

export const processBoolean = (
  filter: FilterBoolean,
  op: OperatorsBoolean,
  options?: FilterOptions,
): string => {
  if (!Array.isArray(filter[op])) {
    throw new RequestError("boolean filter must be given an array of values");
  }
  const sqlOp = " " + op.toUpperCase() + " ";
  const parts = filter[op].map((part) => processFilter(part as Filter, options));
  if (parts.length < 1) {
    throw new RequestError("boolean filter array must have at least 1 item");
  }
  return "(" + parts.join(sqlOp) + ")";
};
