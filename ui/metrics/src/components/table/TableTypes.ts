import { ReactNode } from "react";

export type CellTextAlignment = "left" | "right" | "center";
export type CellClassFunction<T> = (
  row: T,
  column: TableColumn<T>,
  rowIndex: number,
) => string | undefined;
export type CellContentFunction<T> = (
  row: T,
  column: TableColumn<T>,
  rowIndex: number,
) => ReactNode | undefined;
export type TRClickHandler<T> = (row: T) => void;

export interface TableColumn<T> {
  /** unique id/key for the column. defaults to accessor */
  key?: string;
  /** The accessor (field name) in the data row for this column */
  accessor: string;
  /** The header for the table. Defaults to accessor if not given */
  Header?: (() => ReactNode) | ReactNode;
  /** The rendered cell content for the table. Defaults to value of row[accessor] if not given */
  Cell?: CellContentFunction<T> | ReactNode;
  /** The rendered cell content for footer cells. Defaults to value of row[accessor] if not given */
  Footer?: CellContentFunction<T> | ReactNode;
  /** Default column width */
  width?: number;
  /** Text alignment for this column's cell content */
  align?: CellTextAlignment;
  /** If true column cannot be resized */
  fixedSize?: boolean;
  /** Formatter for the cell. A function that receives the value and returns something renderable. Not used if Cell/Footer is given  */
  format?: (value: unknown, row: T) => ReactNode;
  /** If true, row content for this column should always be uppercase */
  uppercase?: boolean;
  /** If true, will not render the column */
  hidden?: boolean;
  /** Fix the column to the left or the right */
  fixed?: "left" | "right";
  /** Class Name(s) to apply to the header */
  headerClass?: string;
  /** Class Name(s) to apply to the cell in the row */
  cellClass?: string | CellClassFunction<T>;
  /** Class Name(s) to apply to the footer cells. Will use cellClass if not given*/
  footerClass?: string | CellClassFunction<T>;
  /** Set the row span on each tr's td */
  rowSpan?: number | ((row: T, column: TableColumn<T>) => number | undefined);
  /** column span of the header */
  colSpan?: number;
  /** If this function returns true, skip rendering the td, to accomodate a rowSpan  */
  skipTd?: (row: T, column: TableColumn<T>) => boolean | undefined;
  /** If given, adds an onClick to the td and will call this function to handle it */
  onCellClick?: (row: T, column: TableColumn<T>) => void;
  /** Location of left fixed column, set internally */
  _fixedLeft?: number;
  /** Location of right fixed column, set internally */
  _fixedRight?: number;
  /** Width after user resized it, set internally */
  _resizeWidth?: number;
}

export type ExtraHeader = TableColumn<unknown>;
export type ExtraHeaderRow = ExtraHeader[];

export const sumColumnWidths = <T>(columns: TableColumn<T>[]): number => {
  if (!columns || !columns.length) {
    return 0;
  }
  return columns.reduce((prev, col) => {
    return prev + (col.width || 0);
  }, 0);
};

export interface NestedObject {
  [key: string]: unknown;
}
export function getNested(obj: NestedObject, path: string): unknown {
  if (!obj || !path) {
    return undefined;
  }
  if (obj[path]) {
    return obj[path];
  }
  let checkedPath = path;
  if (path.charAt(0) === ".") {
    checkedPath = path.substring(1);
  }

  return checkedPath.split(".").reduce((prev, cur) => {
    return prev && (prev[cur] as NestedObject);
  }, obj);
}

export type SortDirection = -1 | 1 | undefined;
export interface SortEntry {
  accessor: string;
  direction?: -1 | 1;
}

/** given an existing sort list and a sort to apply, returns a new sort list */
export const applySort = (
  accessor: string,
  nextDirection: SortDirection,
  currentSort?: SortEntry[],
): SortEntry[] => {
  let next: SortEntry[] = Array.isArray(currentSort) ? currentSort : [];
  if (!nextDirection) {
    next = next.filter((s) => s.accessor !== accessor);
  } else {
    const entry = next.find((s) => s.accessor === accessor);
    if (entry) {
      entry.direction = nextDirection;
    } else {
      next.push({ accessor: accessor, direction: nextDirection });
    }
  }

  return [...next];
};
/** given a sort direction, returns the next direction for it */
export const nextDirection = (direction?: SortDirection): SortDirection => {
  if (!direction) {
    return 1;
  }
  if (direction === 1) {
    return -1;
  }
  return undefined;
};
/** given an existing sort list and an accessor, returns the next sort direction for that accessor */
export const nextSort = (accessor: string, currentSort?: SortEntry[]): SortDirection => {
  if (!currentSort || !currentSort.length) {
    return 1;
  }
  const entry = currentSort.find((s) => s.accessor !== accessor);
  return nextDirection(entry?.direction);
};
