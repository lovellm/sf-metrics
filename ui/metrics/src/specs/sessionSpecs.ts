import { ColumnDefinition, Filter, GenericObject, Query } from "@/types/dataApi";
import { getMonthForMonthsAgo } from "@/utils/dates";
import { combineFilters } from "@/utils/filterUtils";

const defaultStartDate = getMonthForMonthsAgo(3);

export interface SessionData extends GenericObject {
  // logdate?: string;
  query_id?: string;
  session_id?: string;
  user_name?: string;
  query_type?: string;
  query_text?: string;
  // database_name?: string;
  // schema_name?: string;
  role_name?: string;
  warehouse_name?: string;
  // warehoue_size?: string;
  // warehouse_type?: string;
  cluster_number?: string;
  query_tag?: string;
  execution_status?: string;
  error_code?: string;
  error_message?: string;
  start_time?: string;
  // end_time?: string;
  total_elapsed_Time?: number;
  compilation_time?: number;
  execution_time?: number;
  queued_overload_time?: number;
  bytes_scanned?: number;
  bytes_written?: number;
  bytes_written_to_result?: number;
  rows_written_to_result?: number;
  rows_inserted?: number;
  rows_updated?: number;
  rows_deleted?: number;
  partitions_scanned?: number;
  partitions_total?: number;
  bytes_spilled_to_local_storage?: number;
  bytes_spilled_to_remote_storage?: number;
  bytes_sent_over_the_network?: number;
  credits_used_cloud_services?: number;
  query_credits_used?: number;
}
const sessonColumns: ColumnDefinition[] = [
  // { name: "logdate", from: "qh" },
  { name: "query_id", from: "qh" },
  // { name: "session_id", from: "qh" },
  { name: "user_name", from: "qh", alias: "user_name" },
  { name: "query_type", from: "qh" },
  { name: "query_text" },
  // { name: "database_name" },
  // { name: "schema_name" },
  { name: "role_name", from: "qh" },
  { name: "warehouse_name", from: "qh" },
  // { name: "warehouse_size" },
  // { name: "warehouse_type" },
  { name: "cluster_number" },
  { name: "query_tag", from: "qh" },
  { name: "execution_status" },
  { name: "error_code" },
  { name: "error_message" },
  { name: "start_time" },
  // { name: "end_time" },
  { name: "total_elapsed_Time" },
  { name: "compilation_time" },
  { name: "execution_time" },
  { name: "queued_overload_time" },
  { name: "bytes_scanned" },
  { name: "bytes_written" },
  { name: "bytes_written_to_result" },
  { name: "rows_written_to_result" },
  { name: "rows_inserted" },
  { name: "rows_updated" },
  { name: "rows_deleted" },
  { name: "partitions_scanned" },
  { name: "partitions_total" },
  { name: "bytes_spilled_to_local_storage" },
  { name: "bytes_spilled_to_remote_storage" },
  { name: "bytes_sent_over_the_network" },
  { name: "credits_used_cloud_services" },
  { name: "query_credits_used", from: "qc" },
];
export const querySession = (sessionId?: string, limit: number = 2000): Query => {
  const filters: Filter[] = [{ gte: [{ name: "logdate", from: "qh" }, `'${defaultStartDate}'`] }];
  filters.push({ eq: [{ name: "session_id", from: "qh" }, sessionId || "''"] });
  const finalFilters = combineFilters(filters);

  return {
    schema: "SF_METRICS",
    table: "V_QUERY_HISTORY",
    tableAlias: "qh",
    joins: [
      {
        schema: "SF_METRICS",
        table: "V_QUERY_CREDITS",
        type: "left",
        tableAlias: "qc",
        on: {
          eq: [
            { name: "QUERY_ID", from: "qh" },
            { name: "QUERY_ID", from: "qc" },
          ],
        },
      },
    ],
    filter: finalFilters,
    columns: sessonColumns,
    order: [{ name: "start_time" }],
    limit: limit,
    asUser: true,
  } as Query;
};
