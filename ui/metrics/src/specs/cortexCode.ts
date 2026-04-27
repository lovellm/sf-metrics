import { SelectedValues } from "@/types/filterTypes";
import { getMonthForMonthsAgo } from "@/utils/dates";
import MakeFilters, { addDatesToFieldMap, combineFilters } from "@/utils/filterUtils";
import { ColumnDefinition, Filter, GenericObject, Query } from "@spcs-apps/data-utils";

const defaultStartDate = getMonthForMonthsAgo(1);

/** add default filters for the "logdate" filter value */
const addDefaultFilters = (
  filters: Filter[],
  selectedValues?: SelectedValues,
  dateName: string = "start_time",
) => {
  if (!selectedValues?.["logdate"]?.length) {
    filters.push({ gte: [dateName, `'${defaultStartDate}'`] });
  }
};

export interface CortexCodeTrendData extends GenericObject {
  method?: string;
  logdate?: string;
  tokens?: number;
  token_credits?: number;
}
const cortexCodeTrendColumns: ColumnDefinition[] = [
  { name: "method" },
  { name: "logdate" },
  { name: "tokens", agg: "sum" },
  { name: "token_credits", agg: "sum" },
];
export const specForCortexCodeTrend = (selectedValues?: SelectedValues): Query => {
  const filterFields: Record<string, string> = { userId: "user_name" };
  addDatesToFieldMap(filterFields, "logdate", "usage_time");
  const filterMaker = new MakeFilters(filterFields);
  const filters: Filter[] = filterMaker.makeFilters(selectedValues);
  addDefaultFilters(filters, selectedValues, "usage_time");
  const finalFilters = combineFilters(filters);

  return {
    schema: "SF_METRICS",
    table: "V_CORTEX_CODE_USAGE",
    filter: finalFilters,
    columns: cortexCodeTrendColumns,
    order: [{ name: "logdate" }],
    limit: 1000,
  } as Query;
};

export interface CortexCodeUserData extends GenericObject {
  user_name?: string;
  display_name?: string;
  tokens?: number;
  token_credits?: number;
  cli_token_credits?: number;
  snowsight_token_credits?: number;
}
const cortexCodeUserColumns: ColumnDefinition[] = [
  { name: "user_name" },
  { name: "display_name", agg: "any_value", alias: "display_name" },
  { name: "tokens", agg: "sum" },
  { name: "token_credits", agg: "sum" },
  { name: "cli_token_credits", agg: "sum" },
  { name: "snowsight_token_credits", agg: "sum" },
];
export const specForCortexCodeUser = (selectedValues?: SelectedValues): Query => {
  const filterFields: Record<string, string> = { userId: "user_name" };
  addDatesToFieldMap(filterFields, "logdate", "usage_time");
  const filterMaker = new MakeFilters(filterFields);
  const filters: Filter[] = filterMaker.makeFilters(selectedValues);
  addDefaultFilters(filters, selectedValues, "usage_time");
  const finalFilters = combineFilters(filters);

  return {
    schema: "SF_METRICS",
    table: "V_CORTEX_CODE_USAGE",
    filter: finalFilters,
    columns: cortexCodeUserColumns,
    order: [{ name: { name: "token_credits", agg: "sum" }, dir: "desc" }],
    limit: 1000,
  } as Query;
};
