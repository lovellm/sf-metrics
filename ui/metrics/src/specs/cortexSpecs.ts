import { ColumnDefinition, Filter, GenericObject, Query } from "@/types/dataApi";
import { SelectedValues } from "@/types/filterTypes";
import { getMonthForMonthsAgo } from "@/utils/dates";
import MakeFilters, {
  addDatesToFieldMap,
  combineFilters,
  ReplaceValues,
  valuesToUpper,
} from "@/utils/filterUtils";

const defaultStartDate = getMonthForMonthsAgo(1);

// filter set 1, using start_time for logdate
const cortexSummaryFields: Record<string, string> = {};
addDatesToFieldMap(cortexSummaryFields, "logdate", "start_time");
export const cortexSummaryFilters = new MakeFilters(cortexSummaryFields);
export const addDefaultFiltersSummary = (filters: Filter[], selectedValues?: SelectedValues) => {
  if (!selectedValues?.["logdate"]?.length) {
    filters.push({ gte: ["start_time", `'${defaultStartDate}'`] });
  }
};

// filter set 2, using usage_date for logdate
const cortexSearchFields: Record<string, string> = { db: "database_name", schema: "schema_name" };
addDatesToFieldMap(cortexSearchFields, "logdate", "usage_date");
export const cortexSearchFilters = new MakeFilters(cortexSearchFields);
export const addDefaultFiltersSearch = (filters: Filter[], selectedValues?: SelectedValues) => {
  if (!selectedValues?.["logdate"]?.length) {
    filters.push({ gte: ["usage_date", `'${defaultStartDate}'`] });
  }
};

const replaceSearchFields = {
  db: valuesToUpper,
  schema: valuesToUpper,
} as ReplaceValues;

/*
 * Total By Model
 */
export interface CortexTotals extends GenericObject {
  function_name?: string;
  model_name?: string;
  credits?: number;
  tokens?: number;
  first_date?: string;
  last_date?: string;
}
const cortexTotalsColumns: ColumnDefinition[] = [
  { name: "function_name" },
  { name: "model_name" },
  { name: "token_credits", agg: "sum", alias: "credits" },
  { name: "tokens", agg: "sum", alias: "tokens" },
  { name: "start_time", agg: "min", alias: "first_date" },
  { name: "start_time", agg: "max", alias: "last_date" },
];
export const specForCortexTotals = (selectedValues?: SelectedValues): Query => {
  const filters: Filter[] = cortexSummaryFilters.makeFilters(selectedValues);
  addDefaultFiltersSummary(filters, selectedValues);
  const finalFilters = combineFilters(filters);

  return {
    schema: "SF_METRICS",
    table: "V_CORTEX_FUNCTIONS_USAGE_HISTORY",
    filter: finalFilters,
    columns: cortexTotalsColumns,
    order: [{ name: { name: "token_credits", agg: "sum" }, dir: "desc" }],
    limit: 1000,
  } as Query;
};

/*
 * Search Service
 */
export interface CortexSearchService extends GenericObject {
  usage_date?: string;
  database_name?: string;
  schema_name?: string;
  service_name?: string;
  consumption_type?: string;
  credits?: number;
  model_name?: string;
  tokens?: number;
}
const cortexSearchColumns: ColumnDefinition[] = [
  { name: "database_name" },
  { name: "schema_name" },
  { name: "service_name" },
  { name: "consumption_type" },
  { name: "model_name" },
  { name: "credits", agg: "sum" },
  { name: "tokens", agg: "sum" },
];
export const specForCortexSearch = (selectedValues?: SelectedValues): Query => {
  const filters: Filter[] = cortexSearchFilters.makeFilters(selectedValues, replaceSearchFields);
  addDefaultFiltersSearch(filters, selectedValues);
  const finalFilters = combineFilters(filters);

  return {
    schema: "SF_METRICS",
    table: "V_CORTEX_SEARCH_DAILY_USAGE_HISTORY",
    filter: finalFilters,
    columns: cortexSearchColumns,
    order: [{ name: { name: "credits", agg: "sum" }, dir: "desc" }],
    limit: 1000,
  } as Query;
};
