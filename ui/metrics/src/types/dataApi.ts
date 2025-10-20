/** a basic identifier. will be uppercased, must be 1-255 characters, [a-zA-Z_][a-zA-Z0-9_$]* */
export type IdentifierName = string;
/** an identifier that is more than a simple string */
export interface IdentifierObject {
  /** the name of the identifier. unless quoted=true, will be made uppercase and must be [a-zA-Z_][a-zA-Z0-9_$]* */
  name: IdentifierName;
  /** if true, the name should be wrapped in quotes before being used */
  quoted?: boolean;
  /** if this identifier is a column, the table alias it is from, otherwise ignored */
  from?: IdentifierName;
  /** if this identifier is a column, this will be used to alias that column */
  alias?: string;
}
/** a database identifier, such as a column or table */
export type Identifier = IdentifierName | IdentifierObject;

/** basic aggregation types */
export type Aggregation =
  | "sum"
  | "min"
  | "max"
  | "avg"
  | "median"
  | "mode"
  | "count"
  | "countdistinct"
  | "any_value";

/** column using simple aggregation */
export type SimpleAgg = IdentifierObject & {
  agg: Aggregation;
};

/** a column using list aggregation */
export type ListAgg = IdentifierObject & {
  agg: "listagg";
  disticint?: boolean;
  delim?: string;
  order?: Identifier;
  desc?: boolean;
};

/** a column use by aggregation */
export type AggBy = IdentifierObject & {
  agg: "max_by" | "min_by";
  by: Identifier;
};

export type FunctionColumn = IdentifierObject & {
  args: Array<Identifier | number | boolean>;
};

/** a column definition */
export type ColumnDefinition = Identifier | SimpleAgg | ListAgg | AggBy | FunctionColumn;

/** operators for a compare filter */
export type OpereratorsCompare =
  | "eq"
  | "="
  | "ne"
  | "<>"
  | "!="
  | "gt"
  | ">"
  | "gte"
  | ">="
  | "lt"
  | "<"
  | "lte"
  | "<="
  | "like"
  | "notlike"
  | "ilike"
  | "notilike";
/** operators for an in filter */
export type OperatorsIn = "in" | "nin" | "likeany" | "notlikeany";
/** not operator */
export type OperatorsNot = "not";
/** operators for null checks*/
export type OperatorsUnary = "isnull" | "notnull";
/** operators for joining conditions together */
export type OperatorsBoolean = "and" | "or";
/** a constant value that can be used in a filter */
export type ConstantValue = string | number | boolean;
/** a generic object for filtering. most likely a ColumnSchema or a filter object.
 * leaving generic to simplify nesting
 */

export type GenericObject = {
  [x: string]: unknown;
};
/** the values to compare in a comparator filter */
export type CompareValues = [ConstantValue | GenericObject, ConstantValue | GenericObject];
/** a filter to compare two values. should only contain a single property */
export type FilterCompare = Partial<Record<OpereratorsCompare, CompareValues>>;
/** an in filter. should only contain a single property */
export type FilterIn = Partial<Record<OperatorsIn, [string | GenericObject, Array<ConstantValue>]>>;
/** a negation filter. the generic object should be some other Filter* type */
export type FilterNot = Record<OperatorsNot, GenericObject>;
/** a unary filter, such as isnull. The generic object should be a ColumnDefinition */
export type FilterUnary = Partial<Record<OperatorsUnary, string | GenericObject>>;
/** a boolean filter. generic object should be some Filter* type */
export type FilterBoolean = Partial<Record<OperatorsBoolean, Array<GenericObject>>>;
/** a query filter */
export type Filter = FilterCompare | FilterIn | FilterNot | FilterUnary | FilterBoolean;

/** a table, with option alias, db, and schema */
export type TableIdentifier = {
  /** table to be queried */
  table: Identifier;
  /** table alias for the query, can use this in other query elements instead of the name */
  tableAlias?: IdentifierName;
  /** db the table is in */
  db?: IdentifierName;
  /** schema for the table */
  schema?: IdentifierName;
};

/** join types */
export type JoinType = "inner" | "left" | "right" | "fullouter";
/** a join to another table */
export type JoinDefinition = TableIdentifier & {
  type: JoinType;
  on: Filter;
};
export type JoinList = Array<JoinDefinition>;

/** the direction for an ORDER BY */
export type OrderDirection = "asc" | "desc";
/** the definition of an ORDER BY entry */
export type OrderEntry = {
  name: ColumnDefinition;
  dir?: OrderDirection;
};
export type QueryOrder = Array<OrderEntry>;

export type Query = TableIdentifier & {
  /** list of columns to return */
  columns: Array<ColumnDefinition>;
  /** joins to additional tables */
  joins?: JoinList;
  /** filters for the query */
  filter?: Filter;
  /** having filters for the query */
  having?: Filter;
  /** order for the query */
  order?: QueryOrder;
  /** limit the number of records */
  limit?: number;
  /** offset for the query */
  offset?: number;
  /** if true, add DISTINCT to the select */
  distinct?: boolean;
  /** if true, returns the generated sql with the result */
  sql?: boolean;
  /** if true, return the column list in the result, as returned by the query */
  includeColumns?: boolean;
  /** run with caller rights */
  asUser?: boolean;
};

/** a data value in a result set */
export type DataValue = string | number | boolean | null;
/** a row in a result set */
export type DataRow = Array<DataValue>;
/** a column definition from the result set */
export interface ResultColumnInfo {
  id: number;
  name: string;
  type: string;
}
/** the result of a query */
export type DataResult = {
  data: Array<DataRow>;
  queryId?: string;
  sql?: string;
  columns?: Array<ResultColumnInfo>;
};

export interface UserRequest {
  roles?: string[];
}
export interface UserResponse {
  user: string;
  roles: string[];
}
