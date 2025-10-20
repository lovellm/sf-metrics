import { ColumnDefinition, Filter, GenericObject, Query, QueryOrder } from "@/types/dataApi";
import { SelectedValues } from "@/types/filterTypes";
import { getMonthForMonthsAgo } from "@/utils/dates";
import MakeFilters, {
  addDatesToFieldMap,
  combineFilters,
  ReplaceValues,
  valuesToUpper,
} from "@/utils/filterUtils";

const filterFieldMap: Record<string, string> = {
  warehouseName: "warehouse_name",
  db: "database_name",
  schema: "schema_name",
};
addDatesToFieldMap(filterFieldMap, "logdate", "logdate");
export const dynamicTableFilters = new MakeFilters(filterFieldMap);
const defaultStartDate = getMonthForMonthsAgo(1);
export const addDefaultFilters = (filters: Filter[], selectedValues?: SelectedValues) => {
  if (!selectedValues?.["logdate"]?.length) {
    filters.push({ gte: ["LOGDATE", `'${defaultStartDate}'`] });
  }
};

const replaceSearchFields = {
  db: valuesToUpper,
  schema: valuesToUpper,
} as ReplaceValues;

/*
 * Summary by DB
 */
export interface DbDynamicTables extends GenericObject {
  database_name: string;
  query_credits_used?: number;
  credits_used_cloud_services?: number;
  table_count?: number;
  count?: number;
  events_full?: number;
  events_incremental?: number;
  events_no_data?: number;
}
const dbDTColumns: ColumnDefinition[] = [
  { name: "database_name" },
  { name: "query_credits_used", agg: "sum" },
  { name: "credits_used_cloud_services", agg: "sum" },
  { name: "table_name", agg: "countdistinct", alias: "table_count" },
  { name: "*", agg: "count", alias: "count" },
  { name: "events_full", agg: "sum" },
  { name: "events_incremental", agg: "sum" },
  { name: "events_no_data", agg: "sum" },
  { name: "logdate", agg: "min", alias: "min_logdate" },
  { name: "logdate", agg: "max", alias: "max_logdate" },
];
export const specForDynamicTablesDb = (selectedValues?: SelectedValues): Query => {
  const filters = dynamicTableFilters.makeFilters(selectedValues, replaceSearchFields);
  addDefaultFilters(filters, selectedValues);

  return {
    schema: "SF_METRICS",
    table: "V_DYNAMIC_TABLE_FACT",
    filter: combineFilters(filters),
    columns: dbDTColumns,
    order: [{ name: { name: "query_credits_used", agg: "sum" }, dir: "desc" }],
    having: {
      or: [
        { gt: [{ name: "query_credits_used", agg: "sum" }, 0.1] },
        { gt: [{ name: "credits_used_cloud_services", agg: "sum" }, 0.1] },
      ],
    },
    limit: 1000,
  } as Query;
};

/*
 * Summary by Schema
 */
export interface SchemaDynamicTables extends GenericObject {
  database_name: string;
  schema_name: string;
  query_credits_used?: number;
  total_elapsed_time?: number;
  credits_used_cloud_services?: number;
  table_count?: number;
  count?: number;
  events_full?: number;
  events_incremental?: number;
  events_no_data?: number;
}
const schemaDTColumns: ColumnDefinition[] = [
  { name: "database_name" },
  { name: "schema_name" },
  { name: "query_credits_used", agg: "sum" },
  { name: "credits_used_cloud_services", agg: "sum" },
  { name: "table_name", agg: "countdistinct", alias: "table_count" },
  { name: "events_full", agg: "sum" },
  { name: "events_incremental", agg: "sum" },
  { name: "events_no_data", agg: "sum" },
  { name: "*", agg: "count", alias: "count" },
  { name: "logdate", agg: "min", alias: "min_logdate" },
  { name: "logdate", agg: "max", alias: "max_logdate" },
];
interface SchemaDTProps {
  selectedValues?: SelectedValues;
  db?: string;
  offset?: number;
}
export const specForDynamicTablesSchema = ({
  selectedValues,
  db,
  offset,
}: SchemaDTProps): Query => {
  const filters = dynamicTableFilters.makeFilters(selectedValues, replaceSearchFields);
  addDefaultFilters(filters, selectedValues);
  if (db) {
    filters.push({ eq: ["database_name", `'${db}'`] });
  }
  const pageSize = 1000;

  return {
    schema: "SF_METRICS",
    table: "V_DYNAMIC_TABLE_FACT",
    filter: combineFilters(filters),
    columns: schemaDTColumns,
    order: [{ name: { name: "query_credits_used", agg: "sum" }, dir: "desc" }],
    having: {
      or: [
        { gt: [{ name: "query_credits_used", agg: "sum" }, 0.1] },
        { gt: [{ name: "credits_used_cloud_services", agg: "sum" }, 0.1] },
      ],
    },
    limit: pageSize,
    offset: offset,
  } as Query;
};

/*
 * Summary By Table
 */
export interface DynamicTableInfo extends GenericObject {
  database_name: string;
  schema_name: string;
  table_name: string;
  query_credits_used?: number;
  total_elapsed_time?: number;
  credits_used_cloud_services?: number;
  count?: number;
  bytes_scanned?: number;
  bytes_spilled_to_local_storage?: number;
  bytes_spilled_to_remote_storage?: number;
  logdate?: string;
  target_lag_sec?: number;
  refresh_action?: string;
  refresh_trigger?: string;
  role_name: string;
  warehouse_name: string;
  state?: string;
  start_time?: string;
  queued_overload_time?: number;
  partitions_scanned?: number;
  partitions_total?: number;
  rows_inserted?: number;
  rows_updated?: number;
  rows_deleted?: number;
  count_queries?: number;
  events_full?: number;
  events_incremental?: number;
  events_no_data?: number;
}
const topDTColumns: ColumnDefinition[] = [
  { name: "database_name" },
  { name: "schema_name" },
  { name: "table_name" },
  { name: "role_name" },
  { name: "warehouse_name" },
  { name: "query_credits_used", agg: "sum" },
  { name: "total_elapsed_time", agg: "avg" },
  { name: "bytes_scanned", agg: "avg" },
  { name: "bytes_spilled_to_local_storage", agg: "avg" },
  { name: "bytes_spilled_to_remote_storage", agg: "avg" },
  { name: "credits_used_cloud_services", agg: "sum" },
  { name: "events_full", agg: "sum" },
  { name: "events_incremental", agg: "sum" },
  { name: "events_no_data", agg: "sum" },
  { name: "*", agg: "count", alias: "count" },
  { name: "logdate", agg: "min", alias: "min_logdate" },
  { name: "logdate", agg: "max", alias: "max_logdate" },
];
interface TopDTProps {
  selectedValues?: SelectedValues;
  db?: string;
  schema?: string;
  offset?: number;
  sortField?: string;
}
export const specForTopDynamicTables = ({
  selectedValues,
  db,
  schema,
  offset,
  sortField,
}: TopDTProps): Query => {
  const filters = dynamicTableFilters.makeFilters(selectedValues, replaceSearchFields);
  addDefaultFilters(filters, selectedValues);
  filters.push({ notnull: "WAREHOUSE_NAME" });
  if (db) {
    filters.push({ eq: ["database_name", `'${db}'`] });
  }
  if (schema) {
    filters.push({ eq: ["schema_name", `'${schema}'`] });
  }
  const pageSize = db && schema ? 3000 : 40;

  const order: QueryOrder = [
    { name: { name: sortField || "query_credits_used", agg: "sum" }, dir: "desc" },
  ];

  return {
    schema: "SF_METRICS",
    table: "V_DYNAMIC_TABLE_FACT",
    filter: combineFilters(filters),
    columns: topDTColumns,
    order: order,
    limit: pageSize,
    offset: offset,
  } as Query;
};

/*
 * Table Details
 */
const dynamicTablesDetailsColumns: ColumnDefinition[] = [
  { name: "role_name" },
  { name: "warehouse_name" },
  { name: "query_credits_used" },
  { name: "total_elapsed_time" },
  { name: "bytes_scanned" },
  { name: "bytes_spilled_to_local_storage" },
  { name: "bytes_spilled_to_remote_storage" },
  { name: "count_queries" },
  { name: "logdate" },
  { name: "start_time" },
  { name: "queued_overload_time" },
  { name: "partitions_scanned" },
  { name: "partitions_total" },
  { name: "rows_inserted" },
  { name: "rows_updated" },
  { name: "rows_deleted" },
  { name: "target_lag_sec" },
  { name: "refresh_action" },
  { name: "refresh_trigger" },
  { name: "state" },
];
interface TopDTProps {
  selectedValues?: SelectedValues;
  db?: string;
  schema?: string;
  task?: string;
  offset?: number;
  limit?: number;
}
export const specForTasksDetails = ({
  selectedValues,
  db,
  schema,
  task,
  offset,
  limit,
}: TopDTProps): Query => {
  const filters = dynamicTableFilters.makeFilters(selectedValues, replaceSearchFields);
  addDefaultFilters(filters, selectedValues);
  if (db) {
    filters.push({ eq: ["database_name", `'${db}'`] });
  }
  if (schema) {
    filters.push({ eq: ["schema_name", `'${schema}'`] });
  }
  if (task) {
    filters.push({ eq: ["table_name", `'${task}'`] });
  }

  return {
    schema: "SF_METRICS",
    table: "V_DYNAMIC_TABLE_FACT",
    filter: combineFilters(filters),
    columns: dynamicTablesDetailsColumns,
    order: [{ name: "start_time", dir: "desc" }],
    limit: limit || 100,
    offset: offset,
  } as Query;
};

/*
 * By Warehouse
 */
export interface DynamicTablesWarehouseData extends GenericObject {
  logdate?: string;
  warehouse_name?: string;
  query_credits_used?: number;
  credits_used_cloud_services?: number;
}
const dynamicTablesWarehouseColumns: ColumnDefinition[] = [
  { name: "logdate" },
  { name: "warehouse_name" },
  { name: "query_credits_used", agg: "sum" },
  { name: "credits_used_cloud_services", agg: "sum" },
];
interface DTWarehouseProps {
  selectedValues?: SelectedValues;
  db?: string;
  schema?: string;
}
export const specForDynamicTablesWarehouse = ({
  selectedValues,
  db,
  schema,
}: DTWarehouseProps): Query => {
  const filters = dynamicTableFilters.makeFilters(selectedValues, replaceSearchFields);
  addDefaultFilters(filters, selectedValues);

  if (db) {
    filters.push({ eq: ["database_name", `'${db}'`] });
  }
  if (schema) {
    filters.push({ eq: ["schema_name", `'${schema}'`] });
  }
  return {
    schema: "SF_METRICS",
    table: "V_DYNAMIC_TABLE_FACT",
    filter: combineFilters(filters),
    columns: dynamicTablesWarehouseColumns,
    order: [{ name: "logdate" }],
    limit: 1000,
  } as Query;
};
