import { ColumnDefinition, Filter, GenericObject, Query } from "@/types/dataApi";
import { SelectedValues } from "@/types/filterTypes";
import { getMonthForMonthsAgo } from "@/utils/dates";
import MakeFilters, { addDatesToFieldMap, combineFilters } from "@/utils/filterUtils";

const defaultStartDate = getMonthForMonthsAgo(1);

// filter set 1, using start_time for logdate
const mvFilterFields: Record<string, string> = {
  db: "database_name",
  schema: "schema_name",
};
addDatesToFieldMap(mvFilterFields, "logdate", "start_time");
export const mvFilters = new MakeFilters(mvFilterFields);
export const addDefaultFiltersSummary = (filters: Filter[], selectedValues?: SelectedValues) => {
  if (!selectedValues?.["logdate"]?.length) {
    filters.push({ gte: ["start_time", `'${defaultStartDate}'`] });
  }
};

/*
 * Trend Data
 */
export interface MvTrendData extends GenericObject {
  logdate?: string;
  database_name?: string;
  credits_used?: number;
}
const mvTrendColumns: ColumnDefinition[] = [
  { name: "date_trunc", args: ["'day'", "start_time"], alias: "logdate" },
  { name: "database_name" },
  { name: "credits_used", agg: "sum" },
];
export const specForMvTrend = (selectedValues?: SelectedValues): Query => {
  const filters: Filter[] = mvFilters.makeFilters(selectedValues);
  addDefaultFiltersSummary(filters, selectedValues);
  const finalFilters = combineFilters(filters);

  return {
    schema: "SF_METRICS",
    table: "V_MATERIALIZED_VIEW_REFRESH_HISTORY",
    filter: finalFilters,
    columns: mvTrendColumns,
    order: [{ name: "logdate" }, { name: "database_name" }],
    limit: 1000,
  } as Query;
};

/*
 * By Schema Data
 */
export interface MvDetailData extends GenericObject {
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
];
export const specForMvDetail = (selectedValues?: SelectedValues): Query => {
  const filters: Filter[] = mvFilters.makeFilters(selectedValues);
  addDefaultFiltersSummary(filters, selectedValues);
  const finalFilters = combineFilters(filters);

  return {
    schema: "SF_METRICS",
    table: "V_MATERIALIZED_VIEW_REFRESH_HISTORY",
    filter: finalFilters,
    columns: mvDetailColumns,
    order: [{ name: { name: "credits_used", agg: "sum" }, dir: "desc" }],
    limit: 1000,
  } as Query;
};
