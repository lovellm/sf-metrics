import { ColumnDefinition, Filter, GenericObject, Query } from "@/types/dataApi";
import { SelectedValues } from "@/types/filterTypes";
import { getMonthForMonthsAgo } from "@/utils/dates";
import MakeFilters, { addDatesToFieldMap, combineFilters } from "@/utils/filterUtils";

const defaultStartDate = getMonthForMonthsAgo(1);

// filter set 1, using start_time for logdate
const computePoolFields: Record<string, string> = {};
addDatesToFieldMap(computePoolFields, "logdate", "start_time");
export const computePoolFilters = new MakeFilters(computePoolFields);
export const addDefaultFiltersSummary = (filters: Filter[], selectedValues?: SelectedValues) => {
  if (!selectedValues?.["logdate"]?.length) {
    filters.push({ gte: ["start_time", `'${defaultStartDate}'`] });
  }
};

export interface ComputePoolData extends GenericObject {
  logdate?: string;
  compute_pool_name?: string;
  credits_used?: number;
}
const computePoolColumns: ColumnDefinition[] = [
  { name: "date_trunc", args: ["'day'", "start_time"], alias: "logdate" },
  { name: "compute_pool_name" },
  { name: "credits_used", agg: "sum" },
];
export const specForComputePool = (selectedValues?: SelectedValues): Query => {
  const filters: Filter[] = computePoolFilters.makeFilters(selectedValues);
  addDefaultFiltersSummary(filters, selectedValues);
  const finalFilters = combineFilters(filters);

  return {
    schema: "SF_METRICS",
    table: "V_SNOWPARK_CONTAINER_SERVICES_HISTORY",
    filter: finalFilters,
    columns: computePoolColumns,
    order: [{ name: "logdate", dir: "desc" }, { name: "compute_pool_name" }],
    limit: 10000,
  } as Query;
};
