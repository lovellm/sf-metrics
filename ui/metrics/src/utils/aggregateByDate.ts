import { GenericObject, Identifier, SimpleAgg } from "@/types/dataApi";
import { PeriodType, truncDateString } from "./dates";
import { getOrMakeObject } from "./chartUtils";

const getColumnName = (column: Identifier | SimpleAgg): string => {
  return typeof column === "string" ? column : column.alias || column.name;
};

/** perform date aggregation on a given dataset.
 * only count, sum, min, max aggregation types will be aggregated. Others will be ignored.
 */
export default function aggregateByDate<T extends GenericObject>(
  objs: T[],
  dateField: keyof T,
  periodType: PeriodType,
  /** columns to aggregate */
  columns?: Array<Identifier | SimpleAgg>,
): T[] {
  if (!Array.isArray(objs) || !objs.length) {
    return [];
  }
  /** output data aggregated to the periodType, keyed by aggregatred date */
  const agg: Record<string, T> = {};
  /** aggregated values */
  const aggs: Record<string, number> = {};
  objs.forEach((row) => {
    const nextDate = truncDateString((row[dateField] as string) || undefined, periodType);
    if (!nextDate) {
      return;
    }
    let key = nextDate;
    // build the aggregation key from all none aggregated fields
    columns?.forEach((column) => {
      const colName = getColumnName(column);
      if (colName === dateField) {
        return;
      }

      if (typeof column === "string" || (!("agg" in column) && typeof row[colName] === "string")) {
        key += row[colName] as string;
      }
    });
    // aggregate the remaining fields for the key
    columns?.forEach((column) => {
      if (typeof column === "string" || !("agg" in column)) {
        return;
      }
      const columnName = getColumnName(column);
      const fieldKey = key + columnName;
      switch (column.agg) {
        case "count":
        case "sum":
          if (!(fieldKey in aggs)) {
            aggs[fieldKey] = 0;
          }
          if (typeof row[columnName] === "number") {
            aggs[fieldKey] += row[columnName];
          }
          break;
        case "min":
          if (!(fieldKey in aggs) || (row[columnName] as number) < aggs[fieldKey]) {
            aggs[fieldKey] = row[columnName] as number;
          }
          break;
        case "max":
          if (!(fieldKey in aggs) || (row[columnName] as number) > aggs[fieldKey]) {
            aggs[fieldKey] = row[columnName] as number;
          }
          break;
      }
    });

    const obj = getOrMakeObject<T>(agg, key);
    obj[dateField] = nextDate as T[keyof T];
    // add the fields back to the aggregated object
    columns?.forEach((column) => {
      const columnName = getColumnName(column);
      if (columnName === dateField) {
        return;
      }
      if (typeof column === "string" || !("agg" in column)) {
        obj[columnName as keyof T] = row[columnName] as T[keyof T];
      } else if (columnName in aggs) {
        const fieldKey = key + columnName;
        obj[columnName as keyof T] = aggs[fieldKey] as T[keyof T];
      }
    });
  });

  // add aggregated totals back to each record
  Object.entries(agg).forEach(([key, obj]) => {
    columns?.forEach((column) => {
      if (typeof column !== "string" && "agg" in column) {
        const columnName = getColumnName(column);
        const fieldKey = key + columnName;
        obj[columnName as keyof T] = aggs[fieldKey] as T[keyof T];
      }
    });
    return obj;
  });

  return Object.values(agg);
}
