import { ColumnDefinition, Filter, GenericObject, Query } from "@spcs-apps/data-utils";
import { SelectedValues } from "@/types/filterTypes";
import { getMonthForMonthsAgo } from "@/utils/dates";
import MakeFilters, {
  addDatesToFieldMap,
  combineFilters,
  ReplaceValues,
  valuesToUpper,
} from "@/utils/filterUtils";

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

const replaceSearchFields = {
  db: valuesToUpper,
  schema: valuesToUpper,
} as ReplaceValues;

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
  const cortexSearchFields: Record<string, string> = { db: "database_name", schema: "schema_name" };
  addDatesToFieldMap(cortexSearchFields, "logdate", "usage_date");
  const cortexSearchFilters = new MakeFilters(cortexSearchFields);
  const filters: Filter[] = cortexSearchFilters.makeFilters(selectedValues, replaceSearchFields);
  addDefaultFilters(filters, selectedValues, "usage_date");
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

/*
 * For Rest API
 */
export interface CortexRestApi extends GenericObject {
  model_name?: string;
  name?: string;
  display_name?: string;
  tokens?: number;
  first_date?: string;
  last_date?: string;
}
const cortexRestApiColumns: ColumnDefinition[] = [
  { name: "model_name" },
  { name: "name", from: "v_users" },
  { name: "display_name", from: "v_users" },
  { name: "tokens", agg: "sum", alias: "tokens" },
  { name: "start_time", agg: "min", alias: "first_date" },
  { name: "start_time", agg: "max", alias: "last_date" },
];
export const specForCortexRestApi = (selectedValues?: SelectedValues): Query => {
  const filterFields: Record<string, string> = { model: "model_name", userId: "name" };
  addDatesToFieldMap(filterFields, "logdate", "start_time");
  const maker = new MakeFilters(filterFields);
  const filters: Filter[] = maker.makeFilters(selectedValues);
  addDefaultFilters(filters, selectedValues, "start_time");
  const finalFilters = combineFilters(filters);

  return {
    schema: "SF_METRICS",
    table: "V_CORTEX_REST_API_USAGE_HISTORY",
    joins: [
      {
        schema: "SF_METRICS",
        table: "V_USERS",
        type: "left",
        on: {
          eq: [
            { name: "user_id", from: "v_cortex_rest_api_usage_history" },
            { name: "user_id", from: "v_users" },
          ],
        },
      },
    ],
    filter: finalFilters,
    columns: cortexRestApiColumns,
    order: [
      {
        name: { name: "tokens", agg: "sum", from: "V_CORTEX_REST_API_USAGE_HISTORY" },
        dir: "desc",
      },
    ],
    limit: 1000,
  } as Query;
};

/*
 * For AISQL
 */
export interface CortexAISql extends GenericObject {
  model_name?: string;
  name?: string;
  display_name?: string;
  tokens?: number;
  first_date?: string;
  last_date?: string;
}
const cortexAISqlColumns: ColumnDefinition[] = [
  { name: "model_name" },
  { name: "function_name" },
  { name: "name", from: "v_users" },
  { name: "display_name", from: "v_users" },
  { name: "tokens", agg: "sum", alias: "tokens" },
  { name: "token_credits", agg: "sum", alias: "token_credits" },
  { name: "usage_time", agg: "min", alias: "first_date" },
  { name: "usage_time", agg: "max", alias: "last_date" },
];
export const specForCortexAISql = (selectedValues?: SelectedValues): Query => {
  const filterFields: Record<string, string> = { model: "model_name", userId: "name" };
  addDatesToFieldMap(filterFields, "logdate", "usage_time");
  const maker = new MakeFilters(filterFields);
  const filters: Filter[] = maker.makeFilters(selectedValues);
  addDefaultFilters(filters, selectedValues, "usage_time");
  const finalFilters = combineFilters(filters);

  return {
    schema: "SF_METRICS",
    table: "V_CORTEX_AISQL_USAGE_HISTORY",
    joins: [
      {
        schema: "SF_METRICS",
        table: "V_USERS",
        type: "left",
        on: {
          eq: [
            { name: "user_id", from: "V_CORTEX_AISQL_USAGE_HISTORY" },
            { name: "user_id", from: "v_users" },
          ],
        },
      },
    ],
    filter: finalFilters,
    columns: cortexAISqlColumns,
    order: [
      {
        name: { name: "token_credits", agg: "sum", from: "V_CORTEX_AISQL_USAGE_HISTORY" },
        dir: "desc",
      },
    ],
    limit: 1000,
  } as Query;
};

/*
 * For Cortext Agents
 */
export interface CortexAgent extends GenericObject {
  agent_database_name?: string;
  agent_schema_name?: string;
  agent_name?: string;
  user_name?: string;
  display_name?: string;
  tokens?: number;
  token_credits?: number;
  first_date?: string;
  last_date?: string;
}
const cortexAgentColumns: ColumnDefinition[] = [
  { name: "agent_database_name" },
  { name: "agent_schema_name" },
  { name: "agent_name" },
  { name: "user_name" },
  { name: "display_name", from: "v_users" },
  { name: "tokens", agg: "sum", alias: "tokens" },
  { name: "token_credits", agg: "sum", alias: "token_credits" },
  { name: "start_time", agg: "min", alias: "first_date" },
  { name: "start_time", agg: "max", alias: "last_date" },
];
export const specForCortexAgent = (selectedValues?: SelectedValues): Query => {
  const filterFields: Record<string, string> = {
    userId: "user_name",
    db: "agent_database_name",
    schema: "agent_schema_name",
  };
  addDatesToFieldMap(filterFields, "logdate", "start_time");
  const maker = new MakeFilters(filterFields);
  const filters: Filter[] = maker.makeFilters(selectedValues, replaceSearchFields);
  addDefaultFilters(filters, selectedValues, "start_time");
  const finalFilters = combineFilters(filters);

  return {
    schema: "SF_METRICS",
    table: "V_CORTEX_AGENT_USAGE_HISTORY",
    joins: [
      {
        schema: "SF_METRICS",
        table: "V_USERS",
        type: "left",
        on: {
          eq: [
            { name: "user_id", from: "V_CORTEX_AGENT_USAGE_HISTORY" },
            { name: "user_id", from: "v_users" },
          ],
        },
      },
    ],
    filter: finalFilters,
    columns: cortexAgentColumns,
    order: [
      {
        name: { name: "token_credits", agg: "sum", from: "V_CORTEX_AGENT_USAGE_HISTORY" },
        dir: "desc",
      },
    ],
    limit: 1000,
  } as Query;
};
