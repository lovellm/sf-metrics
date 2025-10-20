import { ColumnDefinition, Filter, GenericObject, Query } from "@/types/dataApi";
import { SelectedValues } from "@/types/filterTypes";
import { getMonthForMonthsAgo } from "@/utils/dates";
import MakeFilters, { addDatesToFieldMap, combineFilters } from "@/utils/filterUtils";

const filternameMap: Record<string, string> = {
  warehouseName: "warehouse_name",
  db: "task_database",
  schema: "task_schema",
};
addDatesToFieldMap(filternameMap, "logdate", "logdate");
export const taskFactFilters = new MakeFilters(filternameMap);
const defaultStartDate = getMonthForMonthsAgo(1);
export const addDefaultFilters = (filters: Filter[], selectedValues?: SelectedValues) => {
  if (!selectedValues?.["logdate"]?.length) {
    filters.push({ gte: ["logdate", `'${defaultStartDate}'`] });
  }
};

/*
 * Summary by DB
 */
export interface DbTasks extends GenericObject {
  task_database: string;
  query_credits_used?: number;
  credits_serverless?: number;
  credits_used_cloud_services?: number;
  task_count?: number;
  count?: number;
}
const dbTaskColumns: ColumnDefinition[] = [
  { name: "task_database" },
  { name: "query_credits_used", agg: "sum" },
  { name: "credits_serverless", agg: "sum" },
  { name: "credits_used_cloud_services", agg: "sum" },
  { name: "task_name", agg: "countdistinct", alias: "task_count" },
  { name: "*", agg: "count", alias: "count" },
  { name: "logdate", agg: "min", alias: "min_logdate" },
  { name: "logdate", agg: "max", alias: "max_logdate" },
];
export const specForTaskDb = (selectedValues?: SelectedValues): Query => {
  const filters = taskFactFilters.makeFilters(selectedValues);
  addDefaultFilters(filters, selectedValues);

  return {
    schema: "SF_METRICS",
    table: "V_TASK_FACT",
    filter: combineFilters(filters),
    columns: dbTaskColumns,
    order: [{ name: { name: "query_credits_used", agg: "sum" }, dir: "desc" }],
    having: { gt: [{ name: "query_credits_used", agg: "sum" }, 0.1] },
  } as Query;
};

/*
 * Summary by Schema
 */
export interface SchemaTasks extends GenericObject {
  task_database: string;
  task_schema: string;
  query_credits_used?: number;
  credits_serverless?: number;
  credits_used_query_acceleration?: number;
  total_elapsed_time?: number;
  credits_used_cloud_services?: number;
  task_count?: number;
  count?: number;
}
const schemaTaskColumns: ColumnDefinition[] = [
  { name: "task_database" },
  { name: "task_schema" },
  { name: "query_credits_used", agg: "sum" },
  // { name: "credits_attributed_compute", agg: "sum" },
  { name: "credits_serverless", agg: "sum" },
  // { name: "credits_used_query_acceleration", agg: "sum" },
  // { name: "total_elapsed_time", agg: "sum" },
  { name: "credits_used_cloud_services", agg: "sum" },
  { name: "task_name", agg: "countdistinct", alias: "task_count" },
  { name: "*", agg: "count", alias: "count" },
  { name: "logdate", agg: "min", alias: "min_logdate" },
  { name: "logdate", agg: "max", alias: "max_logdate" },
];
interface SchemaTaskProps {
  selectedValues?: SelectedValues;
  db?: string;
  offset?: number;
}
export const specForTaskSchema = ({ selectedValues, db, offset }: SchemaTaskProps): Query => {
  const filters = taskFactFilters.makeFilters(selectedValues);
  addDefaultFilters(filters, selectedValues);
  if (db) {
    filters.push({ eq: ["task_database", `'${db}'`] });
  }
  const pageSize = 1000;

  return {
    schema: "SF_METRICS",
    table: "V_TASK_FACT",
    filter: combineFilters(filters),
    columns: schemaTaskColumns,
    order: [{ name: { name: "query_credits_used", agg: "sum" }, dir: "desc" }],
    limit: pageSize,
    offset: offset,
  } as Query;
};

/*
 * Summary By Task
 */
export interface TaskInfo extends GenericObject {
  task_database: string;
  task_schema: string;
  task_name: string;
  query_credits_used?: number;
  // credits_attributed_compute?: number;
  credits_serverless?: number;
  credits_used_query_acceleration?: number;
  total_elapsed_time?: number;
  credits_used_cloud_services?: number;
  count?: number;
  bytes_scanned?: number;
  bytes_spilled_to_local_storage?: number;
  bytes_spilled_to_remote_storage?: number;

  logdate?: string;
  session_id?: string;
  is_root?: boolean;
  scheduled_from?: string;
  role_name: string;
  warehouse_name: string;
  execution_status?: string;
  start_time?: string;
  queued_overload_time?: number;
  partitions_scanned?: number;
  partitions_total?: number;
  rows_inserted?: number;
  rows_updated?: number;
  rows_deleted?: number;
  count_queries?: number;
}
const topTaskColumns: ColumnDefinition[] = [
  { name: "task_database" },
  { name: "task_schema" },
  { name: "task_name" },
  { name: "role_name" },
  // { name: "warehouse_name" },
  { name: "query_credits_used", agg: "sum" },
  // { name: "credits_attributed_compute", agg: "sum" },
  { name: "credits_serverless", agg: "sum" },
  // { name: "credits_used_query_acceleration", agg: "sum" },
  { name: "total_elapsed_time", agg: "avg" },
  { name: "bytes_scanned", agg: "avg" },
  { name: "bytes_spilled_to_local_storage", agg: "avg" },
  { name: "bytes_spilled_to_remote_storage", agg: "avg" },
  { name: "credits_used_cloud_services", agg: "sum" },
  { name: "*", agg: "count", alias: "count" },
  { name: "logdate", agg: "min", alias: "min_logdate" },
  { name: "logdate", agg: "max", alias: "max_logdate" },
];
interface TopTasksProps {
  selectedValues?: SelectedValues;
  db?: string;
  schema?: string;
  offset?: number;
}
export const specForTopTasks = ({ selectedValues, db, schema, offset }: TopTasksProps): Query => {
  const filters = taskFactFilters.makeFilters(selectedValues);
  addDefaultFilters(filters, selectedValues);
  filters.push({ notnull: "WAREHOUSE_NAME" });
  if (db) {
    filters.push({ eq: ["task_database", `'${db}'`] });
  }
  if (schema) {
    filters.push({ eq: ["task_schema", `'${schema}'`] });
  }
  const pageSize = db && schema ? 3000 : 40;

  return {
    schema: "SF_METRICS",
    table: "V_TASK_FACT",
    filter: combineFilters(filters),
    columns: topTaskColumns,
    order: [{ name: { name: "query_credits_used", agg: "sum" }, dir: "desc" }],
    limit: pageSize,
    offset: offset,
  } as Query;
};

/*
 * Task Details
 */
const taskDetailsColumns: ColumnDefinition[] = [
  // { name: "task_database" },
  // { name: "task_schema" },
  // { name: "task_name" },
  { name: "role_name" },
  { name: "warehouse_name" },
  { name: "query_credits_used" },
  { name: "total_elapsed_time" },
  { name: "bytes_scanned" },
  { name: "bytes_spilled_to_local_storage" },
  { name: "bytes_spilled_to_remote_storage" },
  { name: "count_queries" },
  { name: "logdate" },
  { name: "session_id" },
  { name: "scheduled_from" },
  { name: "execution_status" },
  { name: "start_time" },
  { name: "queued_overload_time" },
  { name: "partitions_scanned" },
  { name: "partitions_total" },
  { name: "rows_inserted" },
  { name: "rows_updated" },
  { name: "rows_deleted" },
];
interface TopTasksProps {
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
}: TopTasksProps): Query => {
  const filters = taskFactFilters.makeFilters(selectedValues);
  addDefaultFilters(filters, selectedValues);
  if (db) {
    filters.push({ eq: ["task_database", `'${db}'`] });
  }
  if (schema) {
    filters.push({ eq: ["task_schema", `'${schema}'`] });
  }
  if (task) {
    filters.push({ eq: ["task_name", `'${task}'`] });
  }

  return {
    schema: "SF_METRICS",
    table: "V_TASK_FACT",
    filter: combineFilters(filters),
    columns: taskDetailsColumns,
    order: [{ name: "start_time", dir: "desc" }],
    limit: limit || 100,
    offset: offset,
  } as Query;
};

/*
 * By Warehouse
 */
export interface TaskWarehouseData extends GenericObject {
  logdate?: string;
  warehouse_name?: string;
  query_credits_used?: number;
}
const taskWarehouseColumns: ColumnDefinition[] = [
  { name: "logdate" },
  { name: "warehouse_name" },
  { name: "query_credits_used", agg: "sum" },
];
interface TaskWarehouseProps {
  selectedValues?: SelectedValues;
  db?: string;
  schema?: string;
}
export const specForTaskWarehouse = ({ selectedValues, db, schema }: TaskWarehouseProps): Query => {
  const filters = taskFactFilters.makeFilters(selectedValues);
  addDefaultFilters(filters, selectedValues);
  if (db) {
    filters.push({ eq: ["task_database", `'${db}'`] });
  }
  if (schema) {
    filters.push({ eq: ["task_schema", `'${schema}'`] });
  }
  return {
    schema: "SF_METRICS",
    table: "V_TASK_FACT",
    filter: combineFilters(filters),
    columns: taskWarehouseColumns,
    order: [{ name: "logdate" }],
  } as Query;
};
