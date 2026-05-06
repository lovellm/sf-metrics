import createCsv, { ExportColumn } from "../utils/createCsv";
import ButtonSnowflakeQuery, { ButtonSnowflakeQueryProps } from "./ButtonSnowflakeQuery";
import saveAs from "../utils/saveAs";
import { SnowflakeApiResultRowType } from "./SnowflakeApiRequest";

export interface ButtonSnowflakeExportProps extends ButtonSnowflakeQueryProps {
  filename?: string;
  columns?: ExportColumn[];
  /** if provided will map the given ExportColumns using this function.
   * First arg is the originally provided ExportColumn.
   * Second arg is the ApiResultRowType at the same index position of the column.
   * Meaning, columns array and sql select must be same order or bad stuff will happen.
   */
  mapColumns?: (expCol: ExportColumn, dataCol?: SnowflakeApiResultRowType) => ExportColumn;
}

export default function ButtonSnowflakeExport(props: ButtonSnowflakeExportProps) {
  return (
    <ButtonSnowflakeQuery
      {...props}
      onDone={(result) => {
        let cols = props.columns || result.columns.map((c) => ({ accessor: c.name }));
        if (typeof props.mapColumns === "function") {
          cols = cols.map((col, i) => props.mapColumns!(col, result.columns?.[i]));
        }
        const csv = createCsv(result.data, cols);
        saveAs(new Blob([csv]), props.filename || "export.csv");
        if (typeof props.onDone === "function") {
          props.onDone(result);
        }
      }}
    />
  );
}
