export type ExportRecord = Record<string, unknown>;
export type ExportArray = unknown[];
export interface ExportColumn {
  accessor: string;
  columnName?: string;
  /** if true, wrap value in quotes */
  escape?: boolean;
  process?: (value: unknown) => string;
}

export const exportLimit = 500000;
export const getExportFileName = (component: string): string =>
  `${component}_${new Date().toISOString().substring(0, 16).replace("T", "_")}.csv`;

const quoteValue = (value: string): string => {
  if (!value || typeof value !== "string") {
    return "";
  }
  return `"${value.replaceAll(/"/g, '""')}"`;
};
const needQuote = (value: string): boolean => {
  if (!value || typeof value !== "string") {
    return false;
  }
  return /[^a-zA-Z0-9_.]/.test(value);
};

export default function createCsv(
  data: ExportRecord[] | ExportArray[],
  columns: ExportColumn[],
  delim: string = ",",
) {
  const headerLine =
    columns.map((col) => quoteValue(col.columnName || col.accessor)).join(delim) + "\n";
  const lines: string[] = [];
  data.forEach((row) => {
    const isArray = Array.isArray(row);
    lines.push(
      columns
        .map<string>((col, i) => {
          if (!col.accessor) {
            return "";
          }
          // not technically true, but coerced to string so good enough
          let cellValue: string | undefined = undefined;
          if (isArray) {
            cellValue = row[i] as string;
          } else {
            cellValue = row[col.accessor] as string;
          }
          if (typeof cellValue === "number" && cellValue < 0.000001) {
            cellValue = "0";
          }
          let asString = cellValue ? "" + cellValue : "";
          if (typeof col.process === "function") {
            asString = col.process(asString);
          }
          if (asString && (col.escape || needQuote(asString))) {
            return quoteValue(asString);
          }
          return asString;
        })
        .join(delim),
    );
  });
  return headerLine + lines.join("\n");
}
