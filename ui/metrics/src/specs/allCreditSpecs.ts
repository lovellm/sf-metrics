import { ColumnDefinition, Filter, GenericObject, Query } from "@/types/dataApi";
import { SelectedValues } from "@/types/filterTypes";
import { getMonthForMonthsAgo } from "@/utils/dates";
import MakeFilters, { addDatesToFieldMap, combineFilters } from "@/utils/filterUtils";

const defaultStartDate = getMonthForMonthsAgo(1);

// filter set 1, using start_time for logdate
const allCreditFields: Record<string, string> = {
  serviceType: "service_type",
};
addDatesToFieldMap(allCreditFields, "logdate", "usage_date");
export const allCreditFilters = new MakeFilters(allCreditFields);
export const addDefaultFiltersSummary = (filters: Filter[], selectedValues?: SelectedValues) => {
  if (!selectedValues?.["logdate"]?.length) {
    filters.push({ gte: ["usage_date", `'${defaultStartDate}'`] });
  }
};

export interface AllCreditsData extends GenericObject {
  usage_date?: string;
  service_type?: string;
  credits_billed?: number;
  credits_used_compute?: number;
  credits_used_cloud_services?: number;
  credits_used?: number;
  credits_adjustment_cloud_services?: number;
  cloud_services_billed?: number;
}
const allCreditsColumns: ColumnDefinition[] = [
  { name: "usage_date" },
  { name: "service_type" },
  { name: "credits_billed", agg: "sum" },
  { name: "credits_used_compute", agg: "sum" },
  { name: "credits_used_cloud_services", agg: "sum" },
  { name: "credits_used", agg: "sum" },
  { name: "credits_adjustment_cloud_services", agg: "sum" },
];
export const specForAllCredits = (selectedValues?: SelectedValues): Query => {
  const filters: Filter[] = allCreditFilters.makeFilters(selectedValues);
  addDefaultFiltersSummary(filters, selectedValues);
  const finalFilters = combineFilters(filters);

  return {
    schema: "SF_METRICS",
    table: "V_METERING_DAILY_HISTORY",
    filter: finalFilters,
    columns: allCreditsColumns,
    order: [{ name: "usage_date", dir: "desc" }, { name: "service_type" }],
    limit: 10000,
  } as Query;
};
