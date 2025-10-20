import { ColumnDefinition, DataResult, DataValue } from "../types/dataApi";

/** converts a query response to objects instead of arrays */
export default function parseQueryResponse<T>(
  response?: DataResult,
  columns: ColumnDefinition[] = [],
): T[] {
  const objs: Record<string, DataValue>[] = [];
  if (!response) {
    return objs as T[];
  }
  const rows = response.data;
  rows?.forEach((row) => {
    const outRow: Record<string, DataValue> = {};
    row.forEach((col, i) => {
      const entry = columns[i];
      if (!entry) {
        outRow[i] = col;
      } else if (typeof entry === "string") {
        outRow[entry.toLowerCase()] = col;
      } else if (entry.alias) {
        outRow[entry.alias.toLowerCase()] = col;
      } else {
        outRow[entry.name.toLowerCase()] = col;
      }
    });
    objs.push(outRow);
  });

  return objs as T[];
}
