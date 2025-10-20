import { useCallback, useEffect, useMemo, useState } from "react";
import Table, { TableProps } from "./Table";
import SortableHeader from "./SortableHeader";
import { applySort, SortDirection, SortEntry, TableColumn } from "./TableTypes";
import PageSelector from "./PageSelector";

export interface TableLocalSortProps<T> extends TableProps<T> {
  multiSort?: boolean;
  columns: TableColumnSortable<T>[];
  pageSize?: number;
}
export interface TableColumnSortable<T> extends TableColumn<T> {
  sortable?: boolean;
}

export default function TableLocalSort<T>(props: TableLocalSortProps<T>) {
  const [sorts, setSorts] = useState<SortEntry[]>([]);
  const [page, setPage] = useState<number>(0);

  // set the next sort state
  const onSort = useCallback(
    (accessor: string, dir: SortDirection) => {
      if (props.multiSort) {
        setSorts(applySort(accessor, dir, sorts));
      } else {
        setSorts([{ accessor: accessor, direction: dir }]);
      }
    },
    [sorts, props.multiSort],
  );

  // add sort functionality to all string-based headers
  const columns = useMemo(() => {
    if (!props.columns) {
      return [];
    }
    return props.columns.map((c) => {
      if (c.sortable && typeof c.Header === "string") {
        return {
          ...c,
          Header: (
            <SortableHeader
              currentSort={sorts}
              onSort={onSort}
              accessor={c.accessor}
              align={c.align}
            >
              {c.Header}
            </SortableHeader>
          ),
        };
      } else {
        return c;
      }
    });
  }, [props.columns, onSort, sorts]);

  const rows = useMemo(() => {
    if (!props.data) {
      return [];
    }
    const next = [...props.data];
    if (sorts && sorts.length) {
      next.sort((a, b) => {
        const rowA = a as unknown as Record<string, unknown>;
        const rowB = b as unknown as Record<string, unknown>;
        for (let sortI = 0; sortI < sorts.length; sortI++) {
          const accessor = sorts[sortI].accessor;
          const dir = sorts[sortI].direction || 0;
          let valA = rowA ? rowA[accessor] : undefined;
          if (typeof valA === "string") {
            valA = valA.trim();
          } else if (typeof valA === "boolean") {
            valA = valA ? 2 : 1;
          } else if (typeof valA !== "number") {
            valA = "";
          }

          let valB = rowB ? rowB[accessor] : undefined;
          if (typeof valB === "string") {
            valB = valB.trim();
          } else if (typeof valB === "boolean") {
            valB = valB ? 2 : 1;
          } else if (typeof valB !== "number") {
            valB = "";
          }
          if ((valA as string) > (valB as string)) {
            return 1 * dir;
          }
          if ((valA as string) < (valB as string)) {
            return -1 * dir;
          }
        }
        return 0;
      });
    }

    if (props.pageSize && props.pageSize > 0) {
      const start = props.pageSize * page;
      const end = start + props.pageSize;
      return next.slice(start, end);
    }
    return next;
  }, [props.data, sorts, page, props.pageSize]);

  useEffect(() => {
    setPage(0);
  }, [props.data?.length]);

  return (
    <>
      <Table {...props} columns={columns} data={rows} />
      {props.pageSize && (
        <PageSelector
          align="left"
          page={page}
          pageSize={props.pageSize}
          onPageChange={setPage}
          length={props.data?.length}
        />
      )}
    </>
  );
}
