import React, { useReducer, useMemo, CSSProperties } from "react";
import TableHeader, { DEFAULT_WIDTH } from "./TableHeader";
import { ExtraHeaderRow, getNested, TableColumn, TRClickHandler } from "./TableTypes";
import { basicTable, basicTableCell } from "../../constants";

const emptyArray: never[] = [];

type ClassFromRow<T> = string | ((row: T) => string | undefined);
export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  extraHeadersTop?: ExtraHeaderRow[];
  extraHeadersBelow?: ExtraHeaderRow[];
  footerData?: T[];
  /** Function that receives the row and returns a class that should be applied to the TR */
  getTRClass?: ClassFromRow<T>;
  onTRClick?: TRClickHandler<T>;
  /** function that receives the row and returns class that should be applied to the tr of the footer */
  getFooterClass?: ClassFromRow<T>;
  /** If true, table width is 100% */
  fullWidth?: boolean;
  /** Skip calling format function if provided */
  noFormat?: boolean;
  /** if true, no thead */
  noHeader?: boolean;
  /** classname for table element */
  className?: string;
}

export interface RenderTableRowProps<T> {
  rows: T[];
  columns: TableColumn<T>[];
  getTRClass?: ClassFromRow<T>;
  noFormat?: boolean;
  columnHighlight?: string;
  isFooter?: boolean;
  onTRClick?: TRClickHandler<T>;
}

function cellContent<T>(
  row: T,
  column: TableColumn<T>,
  i: number,
  isFooter?: boolean,
  noFormat?: boolean,
): React.ReactNode {
  let value: React.ReactNode = "";
  if (isFooter && column.Footer) {
    if (typeof column.Footer === "function") {
      value = column.Footer(row, column, i);
    } else {
      value = column.Footer;
    }
  } else if (!isFooter && column.Cell) {
    if (typeof column.Cell === "function") {
      value = column.Cell(row, column, i);
    } else {
      value = column.Cell;
    }
  } else if (column.accessor) {
    value = getNested(
      row as unknown as Record<string, React.ReactNode>,
      column.accessor,
    ) as React.ReactNode;
    if (typeof column.format === "function" && noFormat !== true) {
      value = column.format(value, row);
    }
  }
  if (column.uppercase && typeof value === "string") {
    value = value.toUpperCase();
  }
  return value;
}

const highlightReducer: React.Reducer<string, string> = (current: string, given: string) => {
  if (current === given) {
    return "";
  }
  return given;
};

const incrementReducer: React.ReducerWithoutAction<number> = (current: number) => current + 1;

function extraHeaderWidths<T>(extraHeader: ExtraHeaderRow, columns: TableColumn<T>[]) {
  const visibleColumns = columns?.filter((col) => !col.hidden);
  let colStart = 0;
  extraHeader?.forEach((eh) => {
    let width = 0;
    let spanned = 0;
    visibleColumns.find((col, i) => {
      if (i >= colStart) {
        // column within this cols span
        width += col._resizeWidth || col.width || DEFAULT_WIDTH;
        spanned += 1;
      }
      if (spanned >= (eh.colSpan || 1)) {
        // stop check columns, reach the span
        return true;
      }
      return false;
    });

    colStart += eh.colSpan || 1;
    eh.width = width;
  });
}

export default function Table<T>({
  data,
  columns = emptyArray as TableColumn<T>[],
  extraHeadersTop = emptyArray as ExtraHeaderRow[],
  extraHeadersBelow = emptyArray as ExtraHeaderRow[],
  footerData = emptyArray as T[],
  getTRClass,
  getFooterClass,
  fullWidth,
  noFormat,
  noHeader,
  onTRClick,
  className,
}: TableProps<T>) {
  const [columnHighlight, setColumnHighlight] = useReducer(highlightReducer, "");
  const [columnResizedCount, redrawTable] = useReducer(incrementReducer, 0);

  // Calculate Fixed Column Positions
  useMemo(() => {
    const headerRows: TableColumn<T>[][] = [columns];
    if (extraHeadersTop) {
      extraHeadersTop.forEach((eh) => {
        extraHeaderWidths<T>(eh, columns);
      });
      headerRows.push(...(extraHeadersTop as unknown as TableColumn<T>[][]));
    }
    if (extraHeadersBelow) {
      extraHeadersBelow.forEach((eh) => {
        extraHeaderWidths<T>(eh, columns);
      });
      headerRows.push(...(extraHeadersBelow as unknown as TableColumn<T>[][]));
    }
    headerRows.forEach((columns) => {
      let left = 0;
      let right = 0;
      const rightCols: number[] = [];
      columns.forEach((col, i) => {
        if (col.fixed === "left") {
          // Can build left position as we go
          col._fixedLeft = left;
          left += col._resizeWidth || col.width || DEFAULT_WIDTH;
        } else if (col.fixed === "right") {
          // Track the index of columns on the right
          rightCols.push(i);
        }
      });
      // Reverse the order of right fixed columns, so we start at right most
      rightCols.reverse();
      rightCols.forEach((colI) => {
        const col = columns[colI];
        if (col && col.fixed === "right") {
          // This condition should always be true, but checking just incase something bad happened
          col._fixedRight = right;
          right += col._resizeWidth || col.width || DEFAULT_WIDTH;
        }
      });
    });
    // columnResizedCount is an "extra" dep since not used in the memo,
    // But I need it to trigger when it changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, columnResizedCount, extraHeadersTop, extraHeadersBelow]);

  return (
    <table
      className={"relative " + basicTable + " " + (className || "")}
      style={{
        width: fullWidth ? "100%" : 400,
        position: "relative",
        tableLayout: "fixed",
        userSelect: "text",
        borderSpacing: 0,
        textAlign: "left",
        zIndex: 0,
      }}
    >
      {!noHeader && (
        <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
          {extraHeadersTop.map((tr, i) => (
            <tr key={i}>
              {tr.map((th, j) => {
                if (th.hidden) {
                  return null;
                }
                return (
                  <TableHeader
                    key={th.key || th.accessor || j}
                    column={th}
                    highlightColumn={columnHighlight}
                    onHighlightColumn={setColumnHighlight}
                    onResizeFinished={redrawTable}
                    noResize={true}
                  />
                );
              })}
            </tr>
          ))}
          <tr>
            {columns.map((column) => {
              if (column.hidden) {
                return null;
              }
              return (
                <TableHeader
                  key={column.key || column.accessor}
                  column={column}
                  highlightColumn={columnHighlight}
                  onHighlightColumn={setColumnHighlight}
                  onResizeFinished={redrawTable}
                />
              );
            })}
          </tr>
          {extraHeadersBelow.map((tr, i) => (
            <tr key={i}>
              {tr.map((th, j) => {
                if (th.hidden) {
                  return null;
                }
                return (
                  <TableHeader
                    key={th.accessor || j}
                    column={th}
                    highlightColumn={columnHighlight}
                    onHighlightColumn={setColumnHighlight}
                    onResizeFinished={redrawTable}
                    noResize
                  />
                );
              })}
            </tr>
          ))}
        </thead>
      )}
      <tbody>
        {renderRows<T>({ rows: data, columns, getTRClass, noFormat, columnHighlight, onTRClick })}
      </tbody>
      {footerData.length > 0 && (
        <tfoot style={{ position: "sticky", bottom: 0, zIndex: 1 }}>
          {renderRows<T>({
            rows: footerData,
            columns,
            getTRClass: getFooterClass,
            noFormat,
            columnHighlight,
            isFooter: true,
            onTRClick,
          })}
        </tfoot>
      )}
    </table>
  );
}

/** render the rows (tr) of data
 * @returns array of tr nodes
 */
function renderRows<T>({
  rows,
  columns,
  getTRClass,
  noFormat,
  columnHighlight,
  isFooter,
  onTRClick,
}: RenderTableRowProps<T>) {
  return rows.map((row, i) => {
    if (!row) {
      return null;
    }

    // determine the class name for the tr
    let rowClass: string | undefined = undefined;
    if (typeof getTRClass === "function") {
      const addedTrClass = getTRClass(row);
      if (addedTrClass) {
        rowClass = addedTrClass;
      }
    } else if (typeof getTRClass === "string") {
      rowClass = getTRClass;
    }
    return (
      <tr
        key={i}
        className={rowClass}
        onClick={() => {
          if (typeof onTRClick === "function") {
            onTRClick(row);
          }
        }}
      >
        {columns.map((column) => {
          if (column.hidden) {
            return null;
          }
          if (typeof column.skipTd === "function") {
            if (column.skipTd(row, column) === true) {
              return null;
            }
          }

          // add style attributes
          const style: CSSProperties = {
            left: column.fixed === "left" ? column._fixedLeft : undefined,
            right: column.fixed === "right" ? column._fixedRight : undefined,
            overflow: "hidden",
            textOverflow: "ellipsis",
          };
          if (column.align) {
            style.textAlign = column.align;
          }
          if (column.fixed) {
            style.position = "sticky";
            style.zIndex = isFooter ? 5 : 2;
            style.boxSizing = "border-box";
          }

          // determine row span
          let rowSpan = undefined;
          if (column.rowSpan) {
            if (typeof column.rowSpan === "function") {
              rowSpan = column.rowSpan(row, column);
            } else {
              rowSpan = column.rowSpan;
            }
          }

          // determine class name for the td
          let className: string | undefined = undefined;
          if (isFooter && column.footerClass) {
            if (typeof column.footerClass === "function") {
              const addedClass = column.footerClass(row, column, i);
              if (addedClass) {
                className = addedClass;
              }
            } else {
              className = column.footerClass;
            }
          } else if (column.cellClass) {
            if (typeof column.cellClass === "function") {
              const addedClass = column.cellClass(row, column, i);
              if (addedClass) {
                className = addedClass;
              }
            } else {
              className = column.cellClass;
            }
          } else if (!column.cellClass) {
            className = basicTableCell;
          }
          if (column.accessor === columnHighlight) {
            if (className) {
              className += " highlight";
            } else {
              className = "highlight";
            }
          }

          // create click handler
          let onClick: (() => void) | undefined = undefined;
          if (typeof column.onCellClick === "function") {
            onClick = () => {
              if (column.onCellClick) {
                column.onCellClick(row, column);
              }
            };
          }
          return (
            <td
              key={column.key || column.accessor}
              rowSpan={rowSpan}
              style={style}
              className={className}
              onClick={onClick}
              onKeyDown={
                onClick
                  ? (ev) => {
                      if (ev.key === "Enter" || ev.key === " ") {
                        if (onClick) {
                          onClick();
                        }
                      }
                    }
                  : undefined
              }
              role={onClick ? "button" : undefined}
              tabIndex={onClick ? 0 : undefined}
            >
              {cellContent(row, column, i, isFooter, noFormat)}
            </td>
          );
        })}
      </tr>
    );
  });
}
