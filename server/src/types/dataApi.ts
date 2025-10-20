import { Type, type Static } from "@sinclair/typebox";

// IDENTIFIERS
// ====================
// ====================
/** an identifier name as a string */
export const IdentifierNameSchema = Type.String({
  minLength: 1,
  maxLength: 255,
  description: "an identifier",
});
/** an identifier name as an object for additional features */
export const IdentifierObjectSchema = Type.Object({
  name: IdentifierNameSchema,
  quoted: Type.Optional(
    Type.Boolean({ description: "if true, this identifier requires quotes around it" }),
  ),
  // only valid on Columns. If given for a Table, errors will occur
  from: Type.Optional(IdentifierNameSchema),
  // only valid on Columns
  alias: Type.Optional(IdentifierNameSchema),
});
export const IdentifierSchema = Type.Union([IdentifierNameSchema, IdentifierObjectSchema]);

// custome defining type instead of Static<typeof IdentifierSchema> for better comments
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

// AGGREGATION
// ====================
// ====================
/** Basic Aggregation Functions */
export const AggregationSchema = Type.Union(
  [
    Type.Literal("sum"),
    Type.Literal("min"),
    Type.Literal("max"),
    Type.Literal("avg"),
    Type.Literal("median"),
    Type.Literal("mode"),
    Type.Literal("count"),
    Type.Literal("countdistinct"),
    Type.Literal("any_value"),
  ],
  { description: "a basic aggregation function that takes a single column as input" },
);
export type Aggregation = Static<typeof AggregationSchema>;

/** Column Aggregation using Basic Agg Functions */
export const SimpleAggSchema = Type.Composite([
  IdentifierObjectSchema,
  Type.Object({
    agg: AggregationSchema,
  }),
]);
export type SimpleAgg = Static<typeof SimpleAggSchema>;

/** List Aggregation */
export const ListAggSchema = Type.Composite([
  IdentifierObjectSchema,
  Type.Object({
    agg: Type.Literal("listagg"),
    distinct: Type.Optional(
      Type.Literal(true, { description: "if true, add distinct keyword to the function" }),
    ),
    delim: Type.Optional(
      Type.String({
        minLength: 1,
        maxLength: 8,
        pattern: "[^']",
        description: "the delimeter to use. cannot be single quote.",
      }),
    ),
    order: Type.Optional(IdentifierSchema),
    desc: Type.Optional(
      Type.Boolean({
        description: "if true, should be ordered descending instead of the default ascending",
      }),
    ),
  }),
]);
export type ListAgg = Static<typeof ListAggSchema>;

/** Aggregation with an agg_by function */
export const AggBySchema = Type.Composite([
  IdentifierObjectSchema,
  Type.Object({
    agg: Type.Union([Type.Literal("max_by"), Type.Literal("min_by")], {
      description: "an aggregation function that can be by another column",
    }),
    by: IdentifierSchema,
  }),
]);
export type AggBy = Static<typeof AggBySchema>;

/** Function on a column */
export const FunctionColumnSchema = Type.Composite([
  IdentifierObjectSchema,
  Type.Object({
    args: Type.Array(Type.Union([IdentifierSchema, Type.Number()])),
  }),
]);
export type FunctionColumn = Static<typeof FunctionColumnSchema>;

// COLUMNS
// ====================
// ====================
/** A Column to Select from a Table */
export const ColumnSchema = Type.Union([
  IdentifierSchema,
  SimpleAggSchema,
  ListAggSchema,
  AggBySchema,
  FunctionColumnSchema,
]);
export type ColumnDefinition = Static<typeof ColumnSchema>;

// FILTERS
// ====================
// ====================
export const ConstantValueSchema = Type.Union([Type.String(), Type.Number(), Type.Boolean()]);
export const GenericObjectSchema = Type.Record(Type.String(), Type.Unknown());
export const CompareValueSchema = Type.Union([
  Type.String(),
  Type.Number(),
  Type.Boolean(),
  // a ColumnSchema
  Type.Record(Type.String(), Type.Unknown()),
]);
// Filter Operators
export const OperatorsCompareSchema = Type.Union([
  Type.Literal("eq"),
  Type.Literal("="),
  Type.Literal("ne"),
  Type.Literal("<>"),
  Type.Literal("!="),
  Type.Literal("gt"),
  Type.Literal(">"),
  Type.Literal("gte"),
  Type.Literal(">="),
  Type.Literal("lt"),
  Type.Literal("<"),
  Type.Literal("lte"),
  Type.Literal("<="),
  Type.Literal("like"),
  Type.Literal("notlike"),
  Type.Literal("ilike"),
  Type.Literal("notilike"),
]);
export const OperatorsInSchema = Type.Union([
  Type.Literal("in"),
  Type.Literal("nin"),
  Type.Literal("likeany"),
  Type.Literal("notlikeany"),
]);
export const OperatorsBooleanSchema = Type.Union([Type.Literal("and"), Type.Literal("or")]);
export const OperatorsUnarySchema = Type.Union([Type.Literal("isnull"), Type.Literal("notnull")]);
export const OperatorMap: Record<string, "comp" | "in" | "not" | "bool" | "unary"> = {
  eq: "comp",
  "=": "comp",
  ne: "comp",
  "<>": "comp",
  "!=": "comp",
  gt: "comp",
  ">": "comp",
  gte: "comp",
  ">=": "comp",
  lt: "comp",
  "<": "comp",
  lte: "comp",
  "<=": "comp",
  like: "comp",
  notlike: "comp",
  ilike: "comp",
  notilike: "comp",
  in: "in",
  nin: "in",
  likeany: "in",
  notlikeany: "in",
  not: "not",
  and: "bool",
  or: "bool",
  isnull: "unary",
  notnull: "unary",
};
// Tuple to compare values
export const CompareValuesSchema = Type.Tuple([CompareValueSchema, CompareValueSchema]);
// Compare Filter
export const FilterCompareSchema = Type.Partial(
  Type.Record(OperatorsCompareSchema, CompareValuesSchema, { maxProperties: 1, minProperties: 1 }),
);
// In / Not In filter
export const FilterInSchema = Type.Partial(
  Type.Record(
    OperatorsInSchema,
    Type.Tuple([Type.Union([Type.String(), GenericObjectSchema]), Type.Array(ConstantValueSchema)]),
    {
      maxProperties: 1,
      minProperties: 1,
    },
  ),
);
// Not filter
export const FilterNotSchema = Type.Object(
  {
    not: GenericObjectSchema,
  },
  { minProperties: 1, maxProperties: 1 },
);
// Unary Filter
export const FilterUnarySchema = Type.Partial(
  Type.Record(
    OperatorsUnarySchema,
    Type.Union([
      Type.String(),
      // a ColumnSchema
      Type.Record(Type.String(), Type.Unknown()),
    ]),
  ),
);
// And / Or filter
export const FilterBooleanSchema = Type.Partial(
  Type.Record(OperatorsBooleanSchema, Type.Array(GenericObjectSchema, { minItems: 2 }), {
    minProperties: 1,
    maxProperties: 1,
  }),
);
// Filter
export const FilterSchema = Type.Union([
  FilterCompareSchema,
  FilterInSchema,
  FilterNotSchema,
  FilterBooleanSchema,
  FilterUnarySchema,
]);

/** compare operators*/
export type OpereratorsCompare = Static<typeof OperatorsCompareSchema>;
/** in / not in operators */
export type OperatorsIn = Static<typeof OperatorsInSchema>;
/** not operator */
export type OperatorsNot = "not";
export type OperatorsUnary = Static<typeof OperatorsUnarySchema>;
/** and / or operators */
export type OperatorsBoolean = Static<typeof OperatorsBooleanSchema>;
/** a constant value for filtering */
export type ConstantValue = Static<typeof ConstantValueSchema>;
/** a generic object for filtering. most likely a ColumnSchema */
export type GenericObject = Static<typeof GenericObjectSchema>;
/** the values to compare in a comparator filter */
export type CompareValues = Static<typeof CompareValuesSchema>;
/** a record of a comparator to the values to compare */
export type FilterCompare = Static<typeof FilterCompareSchema>;
/** a record of an in operator and the values for it */
export type FilterIn = Static<typeof FilterInSchema>;
/** a not filter */
export type FilterNot = Static<typeof FilterNotSchema>;
export type FilterUnary = Static<typeof FilterUnarySchema>;
/** an and/or filter */
export type FilterBoolean = Partial<Record<OperatorsBoolean, Array<GenericObject>>>;
export type Filter = FilterBoolean | FilterNot | FilterIn | FilterCompare | FilterUnary;

// OTHER
// ====================
// ====================
/** a mapping of names to boolean of whether they are allowed to be used */
export type AllowableTables = Record<string, boolean>;
export const TableIdentifierSchema = Type.Object({
  table: IdentifierSchema,
  tableAlias: Type.Optional(IdentifierNameSchema),
  db: Type.Optional(IdentifierNameSchema),
  schema: Type.Optional(IdentifierNameSchema),
});
export type TableIdentifier = Static<typeof TableIdentifierSchema>;
/** options to pass to api handlers */
export interface ApiOptions {
  /** if true, requested tables should have their access checked */
  checkTableAccess?: boolean;
  /** if true, run query using caller rights */
  asCaller?: boolean;
}

// JOINS
// ====================
// ====================
export const JoinTypeSchema = Type.Union([
  Type.Literal("inner"),
  Type.Literal("left"),
  Type.Literal("right"),
  Type.Literal("fullouter"),
]);
export const JoinDefinitionSchema = Type.Composite([
  TableIdentifierSchema,
  Type.Object({
    type: Type.Optional(JoinTypeSchema),
    on: FilterSchema,
  }),
]);
export const JoinListSchema = Type.Array(JoinDefinitionSchema);
export type JoinType = Static<typeof JoinTypeSchema>;
export type JoinDefinition = Static<typeof JoinDefinitionSchema>;
export type JoinList = Static<typeof JoinListSchema>;

// ORDER BY
// ====================
// ====================
export const OrderDirectionSchema = Type.Union([Type.Literal("asc"), Type.Literal("desc")]);
export const OrderEntrySchema = Type.Object({
  name: ColumnSchema,
  dir: Type.Optional(OrderDirectionSchema),
});
export const OrderSchema = Type.Array(OrderEntrySchema);
export type OrderDirection = Static<typeof OrderDirectionSchema>;
export type OrderEntry = Static<typeof OrderEntrySchema>;
export type QueryOrder = Static<typeof OrderSchema>;

// QUERY
// ====================
// ====================
/** a query request */
export const QuerySchema = Type.Composite([
  TableIdentifierSchema,
  Type.Object({
    columns: Type.Array(ColumnSchema),
    joins: Type.Optional(JoinListSchema),
    filter: Type.Optional(FilterSchema),
    having: Type.Optional(FilterSchema),
    order: Type.Optional(OrderSchema),
    limit: Type.Optional(Type.Number({ minimum: 0 })),
    offset: Type.Optional(Type.Number({ minimum: 0 })),
    distinct: Type.Optional(
      Type.Boolean({
        description:
          "if true, adds the DISTINCT keyword after SELECT, unless the query has aggregation.",
      }),
    ),
    sql: Type.Optional(
      Type.Boolean({ description: "if true, returns the generated SQL query in the response" }),
    ),
    includeColumns: Type.Optional(
      Type.Boolean({
        description: "if true, returns the result column definitions in the reponse",
      }),
    ),
    asUser: Type.Optional(
      Type.Boolean({
        description: "if given, run this with caller rights instead of service rights",
      }),
    ),
  }),
]);
export type QueryDefinition = Static<typeof QuerySchema>;

// RESPONSE
// ====================
// ====================
export const DataValueSchema = Type.Union([
  Type.String(),
  Type.Number(),
  Type.Boolean(),
  Type.Null(),
]);
export const DataRowSchema = Type.Array(Type.Unknown());
export const DataResultSchema = Type.Object({
  data: Type.Array(DataRowSchema),
  queryId: Type.Optional(Type.String()),
  sql: Type.Optional(Type.String()),
  // this is really ResultColumnInfo from SnowflakeConnection, just being lazy because it does not matter
  columns: Type.Optional(Type.Unknown()),
});
export type DataValue = Static<typeof DataValueSchema>;
export type DataRow = Static<typeof DataRowSchema>;
export type DataResult = Static<typeof DataResultSchema>;
