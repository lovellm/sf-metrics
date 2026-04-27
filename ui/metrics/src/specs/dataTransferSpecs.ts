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

export interface DataTransferData extends GenericObject {
  logdate?: string;
  source_cloud?: string;
  source_region?: string;
  target_cloud?: string;
  target_region?: string;
  cost_per_tb?: number;
  bytes_transferred?: number;
}
const dataTransferColumns: ColumnDefinition[] = [
  { name: "logdate" },
  { name: "source_cloud" },
  { name: "source_region" },
  { name: "target_cloud" },
  { name: "target_region" },
  { name: "cost_per_tb", agg: "max", alias: "cost_per_tb" },
  { name: "bytes_transferred", agg: "sum" },
];
export const specForDataTransfer = (selectedValues?: SelectedValues): Query => {
  const filterFields: Record<string, string> = {
    source_cloud: "source_cloud",
    target_cloud: "target_cloud",
  };
  addDatesToFieldMap(filterFields, "logdate", "start_time");
  const filterMaker = new MakeFilters(filterFields);
  const filters: Filter[] = filterMaker.makeFilters(selectedValues);
  addDefaultFilters(filters, selectedValues, "start_time");
  const finalFilters = combineFilters(filters);

  return {
    schema: "SF_METRICS",
    table: "V_DATA_TRANSFER_HISTORY",
    filter: finalFilters,
    columns: dataTransferColumns,
    order: [
      { name: "logdate", dir: "desc" },
      { name: { name: "bytes_transferred", agg: "sum" }, dir: "desc" },
    ],
    limit: 1000,
  } as Query;
};
