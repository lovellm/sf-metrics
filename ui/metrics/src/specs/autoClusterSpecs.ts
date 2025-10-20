import { ColumnDefinition, Filter, GenericObject, Query } from "@/types/dataApi";
import { SelectedValues } from "@/types/filterTypes";
import { getMonthForMonthsAgo } from "@/utils/dates";
import MakeFilters, { addDatesToFieldMap, combineFilters } from "@/utils/filterUtils";

const defaultStartDate = getMonthForMonthsAgo(1);

// filter set 1, using start_time for logdate
const acFilterFields: Record<string, string> = {
  db: "database_name",
  schema: "schema_name",
};
addDatesToFieldMap(acFilterFields, "logdate", "start_time");
export const acFilters = new MakeFilters(acFilterFields);
export const addDefaultFiltersSummary = (filters: Filter[], selectedValues?: SelectedValues) => {
  if (!selectedValues?.["logdate"]?.length) {
    filters.push({ gte: ["start_time", `'${defaultStartDate}'`] });
  }
};

/*
 * Trend Data
 */
export interface ACTrendData extends GenericObject {
  logdate?: string;
  database_name?: string;
  credits_used?: number;
  num_bytes_reclustered?: number;
  num_rows_reclustered?: number;
}
const acTrendColumns: ColumnDefinition[] = [
  { name: "date_trunc", args: ["'day'", "start_time"], alias: "logdate" },
  { name: "database_name" },
  { name: "credits_used", agg: "sum" },
  { name: "num_bytes_reclustered", agg: "sum" },
  { name: "num_rows_reclustered", agg: "sum" },
];
export const specForACTrend = (selectedValues?: SelectedValues): Query => {
  const filters: Filter[] = acFilters.makeFilters(selectedValues);
  addDefaultFiltersSummary(filters, selectedValues);
  const finalFilters = combineFilters(filters);

  return {
    schema: "SF_METRICS",
    table: "V_AUTOMATIC_CLUSTERING_HISTORY",
    filter: finalFilters,
    columns: acTrendColumns,
    order: [{ name: "logdate" }, { name: "database_name" }],
    limit: 1000,
  } as Query;
};

/*
 * By Schema Data
 */
export interface ACDetailData extends GenericObject {
  datbase_name?: string;
  schema_name?: string;
  table_name?: string;
  credits_used?: number;
  avg_credits_used?: number;
  count?: number;
}
const mvDetailColumns: ColumnDefinition[] = [
  { name: "database_name" },
  { name: "schema_name" },
  { name: "table_name" },
  { name: "credits_used", agg: "sum" },
  { name: "credits_used", agg: "avg", alias: "avg_credits_used" },
  { name: "*", agg: "count", alias: "count" },
  { name: "num_bytes_reclustered", agg: "avg" },
  { name: "num_rows_reclustered", agg: "avg" },
];
export const specForACDetail = (selectedValues?: SelectedValues): Query => {
  const filters: Filter[] = acFilters.makeFilters(selectedValues);
  addDefaultFiltersSummary(filters, selectedValues);
  const finalFilters = combineFilters(filters);

  return {
    schema: "SF_METRICS",
    table: "V_AUTOMATIC_CLUSTERING_HISTORY",
    filter: finalFilters,
    columns: mvDetailColumns,
    order: [{ name: { name: "credits_used", agg: "sum" }, dir: "desc" }],
    limit: 1000,
  } as Query;
};
