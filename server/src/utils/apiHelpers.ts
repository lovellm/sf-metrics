import { RequestError } from "../errors.js";
import { ApiOptions, Identifier, TableIdentifier } from "../types/dataApi.js";
import tableAccess from "./tableAccess.js";

const checkBasicIdentifier = /^(?:[a-zA-Z_][a-zA-Z0-9_$]*|\*)$/;
const checkQuotedIdentifier = /^[^"]+$/;
const checkStringLiteral = /^'.*'$/;

/** tests that the given string is a valid basic identifier. throws a RequestError if it is not */
export const testBasicIdentifier = (id: string): void => {
  if (!checkBasicIdentifier.test(id)) {
    throw new RequestError("unquoted identifier contains invalid chracters: " + id);
  }
};
/** tests that the given string is a valid quoted identifier. throws a RequestError if it is not */
export const testQuotedIdentifier = (id: string): void => {
  if (!checkQuotedIdentifier.test(id)) {
    throw new RequestError("quoted identifier is invalid: " + id);
  }
};
/** given a string, escape all \ and ' in it */
export const escapeString = (value: string): string => {
  return value.replaceAll("\\", "\\\\").replaceAll("'", "\\'");
};
/** if the given value is a string literal wrapped in single quotes, escapes any other single quotes in it and retursn it. otherwise returns undefined*/
export const cleanStringLiteral = (value: string): string | undefined => {
  if (!value || !checkStringLiteral.test(value)) {
    return undefined;
  }
  // wrapped in single quotes, escape any remaining single quotes
  const innerValue = value.substring(1, value.length - 1);
  return "'" + escapeString(innerValue) + "'";
};
/** given a potential identifier, tests it and returns it as it should be used in a query */
export const getIdentifier = (id?: Identifier, noFrom?: boolean): string => {
  if (!id) {
    throw new RequestError("recieved an undefined identifier");
  }
  if (typeof id === "string") {
    testBasicIdentifier(id);
    return id.toUpperCase();
  } else if (id?.name) {
    let col = "";
    if (id.quoted === true) {
      testQuotedIdentifier(id.name);
      col = `"${id.name}"`;
    } else {
      testBasicIdentifier(id.name);
      col = id.name.toUpperCase();
    }
    if (id.from && !noFrom) {
      testBasicIdentifier(id.from);
      col = id.from.toUpperCase() + "." + col;
    }
    return col;
  } else {
    throw new RequestError("invalid identifier: " + JSON.stringify(id));
  }
};

export interface QueryTableInfo {
  /** validated table name */
  table: string;
  /** the alias for the table, if one was given, otherwise the table name */
  alias: string;
  /** table path included db and schema, if they were given */
  path: string;
  /** path with table alias, if it was given */
  withAlias: string;
  /** table path using default db and schema to fill in if they were not given */
  defaultPath: string;
  /** schema.table, using the default schema if one is not provided */
  pathId: string;
}
/** extract table information from a query definition */
export const getTable = (query: Partial<TableIdentifier>, options?: ApiOptions): QueryTableInfo => {
  const table = getIdentifier(query.table, true);
  /** table path, with db and schema if given */
  let path = table;
  let schema = process.env.SNOWFLAKE_SCHEMA;
  let db = process.env.SNOWFLAKE_DATABASE;
  let alias = "";

  if (query.schema) {
    testBasicIdentifier(query.schema);
    schema = query.schema.toUpperCase();
    path = query.schema + "." + path;
  }
  if (query.db) {
    if (!query.schema) {
      throw new RequestError("cannot specifiy a db without a schema");
    }
    testBasicIdentifier(query.db);
    db = query.db.toUpperCase();
    path = query.db + "." + path;
  }
  let withAlias = path;
  const defaultPath = db + "." + schema + "." + table;
  const pathId = schema + "." + table;

  if (query.tableAlias) {
    testBasicIdentifier(query.tableAlias);
    alias = query.tableAlias.toUpperCase();
    withAlias += " AS " + alias;
  }

  if (options?.checkTableAccess === true) {
    tableAccess.canRead({
      db: db,
      schema: schema,
      table: table,
      as: options?.asCaller ? "caller" : undefined,
    });
  }

  return {
    table,
    withAlias,
    path,
    defaultPath,
    pathId,
    alias: alias || table,
  };
};
