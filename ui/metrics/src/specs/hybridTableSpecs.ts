import { ColumnDefinition, Filter, GenericObject, Query } from "@/types/dataApi";
import { SelectedValues } from "@/types/filterTypes";
import { getMonthForMonthsAgo } from "@/utils/dates";
import MakeFilters, { addDatesToFieldMap, combineFilters } from "@/utils/filterUtils";

const filterFieldMap: Record<string, string> = {};
addDatesToFieldMap(filterFieldMap, "logdate", "start_time");
export const hybridTableFilters = new MakeFilters(filterFieldMap);
const defaultStartDate = getMonthForMonthsAgo(1);
export const addDefaultFilters = (filters: Filter[], selectedValues?: SelectedValues) => {
  if (!selectedValues?.["logdate"]?.length) {
    filters.push({ gte: ["START_TIME", `'${defaultStartDate}'`] });
  }
};

/*
 * Daily Summary
 */
export interface HybridTableUsage extends GenericObject {
  logdate?: string;
  credits_used?: number;
}
const hybridTableUsageColumns: ColumnDefinition[] = [
  { name: "date_trunc", args: ["'day'", "start_time"], alias: "logdate" },
  { name: "credits_used", agg: "sum" },
];
export const specForHybridTableUsage = (selectedValues?: SelectedValues): Query => {
  const filters = hybridTableFilters.makeFilters(selectedValues);
  addDefaultFilters(filters, selectedValues);

  return {
    schema: "SF_METRICS",
    table: "V_HYBRID_TABLE_USAGE_HISTORY",
    filter: combineFilters(filters),
    columns: hybridTableUsageColumns,
    order: [{ name: "logdate", dir: "desc" }],
    limit: 1000,
  } as Query;
};

/*
 * List of Tables
 */
export interface HybridTableStorage extends GenericObject {
  database_name: string;
  schema_name: string;
  name?: string;
  row_count?: number;
  bytes?: number;
}
const hybridTableStorageColumns: ColumnDefinition[] = [
  { name: "database_name" },
  { name: "schema_name" },
  { name: "name" },
  { name: "row_count" },
  { name: "bytes" },
];
interface HybridTableStorageProps {
  selectedValues?: SelectedValues;
  offset?: number;
}
export const specForHybridTableStorage = ({ offset = 0 }: HybridTableStorageProps): Query => {
  const filters: Filter[] = [{ notnull: "DELETED" }];

  const pageSize = 1000;

  return {
    schema: "SF_METRICS",
    table: "V_HYBRID_TABLES",
    filter: combineFilters(filters),
    columns: hybridTableStorageColumns,
    order: [{ name: { name: "bytes" }, dir: "desc" }],
    limit: pageSize,
    offset: offset,
  } as Query;
};
