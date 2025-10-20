import { ColumnDefinition, Filter, GenericObject, Query } from "@/types/dataApi";
import { SelectedValues } from "@/types/filterTypes";
import { getISOForStringTz, addMsToDate } from "@/utils/dates";
import MakeFilters, { addDatesToFieldMap, getEndFilterPath } from "@/utils/filterUtils";

export interface WarehouseScaleData extends GenericObject {
  timestamp?: string;
  warehouse_name?: string;
  cluster_count?: number;
}

const filterFieldMap: Record<string, string> = {
  warehouseName: "warehouse_name",
  // timestamp: "timestamp",
};
addDatesToFieldMap(filterFieldMap, "timestamp", "timestamp");
const warehouseFilters = new MakeFilters(filterFieldMap);
const days2InMs = 1000 * 60 * 60 * 48;

export const getWarehouseFilters = (filters: SelectedValues): Filter[] => {
  // get the startTime and duration to determine the end time
  const duration = filters.duration?.[0]?.value || "" + days2InMs;
  const startTime = filters.timestamp?.[0]?.value;
  // make a copy of the filters and add the end time
  const filters2 = { ...filters };
  filters2[getEndFilterPath("timestamp")] = [
    { value: addMsToDate(startTime, duration).toISOString(), operator: "<=" },
  ];
  const madeFilters = warehouseFilters.makeFilters(filters2, {
    // convert the datetime-local string to an ISO string with correct timezone
    timestamp: (values) => values.map((o) => getISOForStringTz(o as string)),
  });
  return madeFilters;
};

export const DATA_LIMIT = 10000;

export default function warehouseScale(filters?: Filter[]): undefined | Query {
  if (!filters || !filters.length) {
    return undefined;
  }
  const columns: ColumnDefinition[] = [
    { name: "timestamp" },
    { name: "warehouse_name" },
    { name: "cluster_count", agg: "sum" },
  ];

  return {
    schema: "SF_METRICS",
    table: "V_WAREHOUSE_EVENTS_HISTORY",
    columns: columns,
    order: [{ name: "timestamp" }],
    filter: {
      and: [{ eq: ["event_name", "'WAREHOUSE_CONSISTENT'"] }, ...filters],
    },
    limit: DATA_LIMIT,
    sql: true,
  };
}
