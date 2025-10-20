import { ColumnDefinition, Filter, GenericObject, Query } from "@/types/dataApi";
import { SelectedValues } from "@/types/filterTypes";
import { getMonthForMonthsAgo } from "@/utils/dates";
import MakeFilters, { addDatesToFieldMap, combineFilters } from "@/utils/filterUtils";

export type UserQueryFact = {
  /** iso formatted string */
  logdate?: string;
  query_id?: string;
  session_id?: string;
  connector_type?: string;
  application?: string;
  query_parameterized_hash?: string;
  query_type?: string;
  user_name?: string;
  role_name?: string;
  warehouse_name?: string;
  warehouse_size?: string;
  query_tag?: string;
  query_text?: string;
  query_credits_used?: number;
  credits_attributed_compute?: number;
  credits_used_query_acceleration?: number;
  database_name?: string;
  schema_name?: string;
  /** SUCCESS, FAIL */
  execution_status?: string;
  error_code?: string;
  error_message?: string;
  /** iso formatted timestamp (without the T) */
  start_time?: string;
  /** iso formatted timestamp (without the T) */
  end_time?: string;
  /** ms */
  total_elapsed_time?: number;
  bytes_scanned?: number;
  partitions_scanned?: number;
  partitions_total?: number;
  query_acceleration_bytes_scanned?: number;
  bytes_spilled_to_local_storage?: number;
  bytes_spilled_to_remote_storage?: number;
  rows_written_to_result?: number;
  rows_inserted?: number;
  rows_updated?: number;
  rows_deleted?: number;
  compilation_time?: number;
  execution_time?: number;
  credits_used_cloud_services?: number;
  query_load_percent?: number;
  allowed_users?: string;
};

export interface CommonQueryOptions {
  userId?: string;
  selectedValues?: SelectedValues;
}

const filterFieldMap: Record<string, string> = {
  warehouseName: "warehouse_name",
  queryType: "query_type",
  userId: "user_name",
  application: "application",
  executionStatus: "execution_status",
};
addDatesToFieldMap(filterFieldMap, "logdate", "logdate");
export const userQueryFactFilters = new MakeFilters(filterFieldMap);

/** start of month 2 months ago */
const defaultStartDate = getMonthForMonthsAgo(2);
/** add a default user and date to the filters if a selected value for them does not exist */
export const addDefaultFilters = (
  filters: Filter[],
  selectedValues?: SelectedValues,
  userId?: string,
) => {
  if (
    userId &&
    !selectedValues?.["userId"]?.length &&
    selectedValues?.["defaultUser"]?.[0]?.value !== "TRUE"
  ) {
    filters.push({ eq: ["USER_NAME", `'${userId.toUpperCase()}'`] });
  } else if (
    !selectedValues?.["userId"]?.length &&
    selectedValues?.["defaultUser"]?.[0]?.value !== "TRUE"
  ) {
    // filters.push({ eq: ["USER_NAME", `'${userId.toUpperCase()}'`] });
    filters.push({ eq: ["USER_NAME", "CURRENT_USER"] });
  }
  if (!selectedValues?.["logdate"]?.length) {
    filters.push({ gte: ["LOGDATE", `'${defaultStartDate}'`] });
  }
};

// Top Users
// ============
/** data structure for Top Users */
export interface DataTopUsers extends GenericObject {
  user_name?: string;
  full_name?: string;
  query_credits_used?: number;
  credits_attributed_compute?: number;
  credits_used_query_acceleration?: number;
  credits_used_cloud_services?: number;
  count?: number;
}
export interface TopUsersProps extends CommonQueryOptions {
  limit?: number;
  offset?: number;
}
/** top users */
export function topUsers({ userId, selectedValues, limit, offset }: TopUsersProps): Query {
  const filters: Filter[] = [{ notnull: "WAREHOUSE_NAME" }];
  addDefaultFilters(filters, selectedValues, userId);

  filters.push(...userQueryFactFilters.makeFilters(selectedValues));

  const columns: ColumnDefinition[] = [
    { name: "user_name" },
    { name: "name", from: "V_USERS", alias: "full_name" },
    { name: "query_credits_used", agg: "sum" },
    { name: "credits_attributed_compute", agg: "sum" },
    { name: "credits_used_query_acceleration", agg: "sum" },
    { name: "credits_used_cloud_services", agg: "sum" },
    { name: "*", agg: "count", alias: "count" },
  ];

  const query: Query = {
    schema: "SF_METRICS",
    table: "V_USER_QUERY_FACT",
    columns: columns,
    filter: combineFilters(filters),
    joins: [
      {
        schema: "SF_METRICS",
        table: "V_USERS",
        type: "left",
        on: {
          eq: [
            { name: "USER_NAME", from: "V_USER_QUERY_FACT" },
            { name: "NAME", from: "V_USERS" },
          ],
        },
      },
    ],
    limit: limit || 20,
    offset: offset || undefined,
    order: [{ name: { name: "query_credits_used", agg: "sum" }, dir: "desc" }],
    asUser: true,
  };

  return query;
}

// Top Queries
// ============
export interface TopQueriesProps extends CommonQueryOptions {
  limit?: number;
  offset?: number;
}
/** data structure for Top Queries */
export interface DataTopQueries extends GenericObject {
  user_name?: string;
  full_name?: string;
  query_id?: string;
  query_type?: string;
  query_text?: string;
  application?: string;
  query_tag?: string;
  warehouse_name?: number;
  start_time?: string;
  total_elapsed_time?: number;
  execution_status?: string;
  query_credits_used?: number;
  credits_used_query_acceleration?: number;
  bytes_scanned?: number;
  partitions_scanned?: number;
  partitions_total?: number;
  bytes_spilled_to_local_storage?: number;
}
export function topQueries({ userId, selectedValues, limit, offset }: TopQueriesProps): Query {
  const filters: Filter[] = [{ notnull: "WAREHOUSE_NAME" }, { gte: ["QUERY_CREDITS_USED", 0.03] }];
  addDefaultFilters(filters, selectedValues, userId);
  filters.push(...userQueryFactFilters.makeFilters(selectedValues));

  const columns: ColumnDefinition[] = [
    { name: "user_name" },
    { name: "name", from: "V_USERS", alias: "full_name" },
    { name: "query_id" },
    { name: "query_type" },
    { name: "query_text" },
    { name: "application" },
    { name: "query_tag" },
    { name: "warehouse_name" },
    { name: "start_time" },
    { name: "total_elapsed_time" },
    { name: "execution_status" },
    { name: "query_credits_used" },
    { name: "credits_used_query_acceleration" },
    { name: "bytes_scanned" },
    { name: "partitions_scanned" },
    { name: "partitions_total" },
    { name: "bytes_spilled_to_local_storage" },
  ];

  const query: Query = {
    schema: "SF_METRICS",
    table: "V_USER_QUERY_FACT",
    joins: [
      {
        schema: "SF_METRICS",
        table: "V_USERS",
        type: "left",
        on: {
          eq: [
            { name: "USER_NAME", from: "V_USER_QUERY_FACT" },
            { name: "name", from: "V_USERS" },
          ],
        },
      },
    ],
    columns: columns,
    filter: combineFilters(filters),
    limit: limit || 20,
    offset: offset || undefined,
    order: [{ name: "query_credits_used", dir: "desc" }],
    asUser: true,
  };

  return query;
}

// Warehouse Trend
// ===============
export interface DataWarehouseTrend extends GenericObject {
  logdate?: string;
  warehouse_name?: string;
  query_credits_used?: number;
  count?: number;
}
/** warehouse trend for a user */
export function warehouseTrend({ userId, selectedValues }: CommonQueryOptions): Query {
  const filters: Filter[] = [{ notnull: "WAREHOUSE_NAME" }];
  addDefaultFilters(filters, selectedValues, userId);
  filters.push(...userQueryFactFilters.makeFilters(selectedValues));

  const columns: ColumnDefinition[] = [
    { name: "logdate" },
    { name: "warehouse_name" },
    { name: "query_credits_used", agg: "sum" },
    { name: "*", agg: "count", alias: "count" },
  ];

  const query: Query = {
    schema: "SF_METRICS",
    table: "V_USER_QUERY_FACT",
    columns: columns,
    filter: combineFilters(filters),
    asUser: true,
  };

  return query;
}

// Top Apps
// ==========
export interface DataTopApps extends GenericObject {
  application?: string;
  warehouse_name?: string;
  query_credits_used?: number;
  count?: number;
}
export interface TopAppsProps extends CommonQueryOptions {
  limit?: number;
  offset?: number;
}
/** warehouse trend for a user */
export function topApps({ userId, selectedValues, limit, offset }: TopAppsProps): Query {
  const filters: Filter[] = [{ notnull: "WAREHOUSE_NAME" }];
  addDefaultFilters(filters, selectedValues, userId);
  filters.push(...userQueryFactFilters.makeFilters(selectedValues));

  const columns: ColumnDefinition[] = [
    { name: "application" },
    { name: "warehouse_name" },
    { name: "query_credits_used", agg: "sum" },
    { name: "*", agg: "count", alias: "count" },
  ];

  const query: Query = {
    schema: "SF_METRICS",
    table: "V_USER_QUERY_FACT",
    columns: columns,
    filter: combineFilters(filters),
    limit: limit || 20,
    offset: offset || undefined,
    having: { gt: [{ name: "query_credits_used", agg: "sum" }, 0.01] },
    order: [{ name: { name: "query_credits_used", agg: "sum" }, dir: "desc" }],
    asUser: true,
  };

  return query;
}
