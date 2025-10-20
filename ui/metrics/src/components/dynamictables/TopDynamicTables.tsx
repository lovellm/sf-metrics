import { useCallback, useMemo, useState } from "react";
import Box from "../basic/Box";
import { SelectedValues } from "@/types/filterTypes";
import { defaultCache } from "@/data/dataCache";
import LoadingFitParent from "../basic/LoadingFitParent";
import ErrorMessage from "../basic/ErrorMessage";
import {
  bytesToGbString,
  div0,
  formatCreditCostDefault,
  formatMs,
  formatPercent2,
} from "@/utils/formatters";
import Table from "../table/Table";
import { basicTableCell, basicTableRowSelected, basicTableTR } from "@/constants";
import { IoCaretDown, IoCaretForward } from "react-icons/io5";
import { DynamicTableInfo, specForTopDynamicTables } from "@/specs/dynamicTableSpecs";
import SortableHeader, { SortableTableColumn } from "../table/SortableHeader";
import { SortEntry, TableColumn } from "../table/TableTypes";
import { useQuery } from "@/hooks/useApiData";
import parseQueryResponse from "@/utils/parseQueryResponse";

interface TopDynamicTablesProps {
  filters?: SelectedValues;
  db?: string;
  schema?: string;
  table?: string;
  setTable?: (task: string) => void;
  tableSearch?: string;
  setTableSearch?: (task: string) => void;
}

const topDtColumns: SortableTableColumn<DynamicTableInfo>[] = [
  { accessor: "database_name", Header: "DB", width: 110 },
  { accessor: "schema_name", Header: "Schema", width: 110 },
  { accessor: "table_name", Header: "Table Name", width: 160 },
  { accessor: "warehouse_name", Header: "Warehouse", width: 110 },
  { accessor: "role_name", Header: "Role", width: 110 },
  {
    accessor: "query_credits_used",
    Header: "Credit Cost",
    sortable: true,
    width: 110,
    format: formatCreditCostDefault,
  },
  {
    accessor: "credits_used_cloud_services",
    Header: "Cloud Services",
    sortable: true,
    width: 90,
    format: formatCreditCostDefault,
    cellClass: (row: DynamicTableInfo) =>
      basicTableCell +
      ((row.query_credits_used || 0) * 0.1 > (row.credits_used_cloud_services || 0)
        ? " line-through"
        : ""),
  },
  {
    accessor: "count",
    Header: "Table Refreshes",
    width: 90,
  },
  {
    accessor: "events_full",
    Header: "Full Refreshes",
    width: 90,
  },
  {
    accessor: "events_incremental",
    Header: "Incremental Refreshes",
    width: 90,
  },
  {
    accessor: "events_no_data",
    Header: "No Data Refreshes",
    width: 90,
  },
  {
    accessor: "percent_no_data",
    Header: "% No Data",
    width: 110,
    Cell: (row: DynamicTableInfo) => formatPercent2(div0(row.events_no_data, row.count)),
  },
  {
    accessor: "total_elapsed_time",
    Header: "Avg Duration",
    format: formatMs,
    width: 100,
  },
  { accessor: "bytes_scanned", Header: "Avg GB Scanned", format: bytesToGbString, width: 110 },
  {
    accessor: "bytes_spilled_to_local_storage",
    Header: "Avg GB Spilled Local",
    format: bytesToGbString,
    width: 130,
  },
  {
    accessor: "bytes_spilled_to_remote_storage",
    Header: "Avg GB Spilled Remote",
    format: bytesToGbString,
    width: 130,
  },
  {
    accessor: "min_logdate",
    Header: "Earliest",
    width: 100,
  },
  {
    accessor: "max_logdate",
    Header: "Latest",
    width: 100,
  },
];

export default function TopDynamicTables({
  filters,
  db,
  schema,
  table,
  setTable,
  setTableSearch,
  tableSearch,
}: TopDynamicTablesProps) {
  const [open, setOpen] = useState<boolean>(true);
  const [sorts, setSorts] = useState<SortEntry[]>([]);

  const spec = useMemo(() => {
    return specForTopDynamicTables({
      selectedValues: filters,
      db,
      schema,
      sortField: sorts[0]?.accessor,
    });
  }, [filters, db, schema, sorts]);
  const { data, isLoading, error } = useQuery(spec, {
    dataCache: defaultCache,
    skip: !filters,
  });
  const objs = useMemo(() => {
    const objs = parseQueryResponse<DynamicTableInfo>(data, spec.columns);
    return objs;
  }, [data, spec]);
  // Search the objects
  const searchedObjs = useMemo(() => {
    if (!objs || !tableSearch) {
      return objs;
    }
    return objs.filter((o) => o.table_name?.toUpperCase().includes(tableSearch?.toUpperCase()));
  }, [tableSearch, objs]);

  const onSort = useCallback((accessor: string) => {
    setSorts([{ accessor: accessor, direction: -1 }]);
  }, []);

  // update the columns when needed
  const columns = useMemo(() => {
    // add sortability where needed
    const cols = topDtColumns.map((h) => {
      if (h.sortable === true && typeof h.Header === "string") {
        const alteredH = { ...h };
        alteredH.Header = (
          <SortableHeader currentSort={sorts} onSort={onSort} accessor={h.accessor}>
            {h.Header}
          </SortableHeader>
        );
        return alteredH;
      } else {
        return h;
      }
    });

    return cols as TableColumn<DynamicTableInfo>[];
  }, [sorts, onSort]);

  return (
    <Box className="p-2">
      <button
        type="button"
        className="flex cursor-pointer items-center gap-x-2 text-left text-lg"
        onClick={() => setOpen((old) => !old)}
      >
        {open ? <IoCaretDown /> : <IoCaretForward />}
        Top Dynamic Tables{" "}
        <span className="text-sm">(select both db and schema to see a longer list)</span>
      </button>
      {open && (
        <div className="relative mt-1 min-h-20">
          {setTableSearch && (
            <input
              className="input-main border-main grow border px-2"
              placeholder="Search..."
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
            />
          )}
          {isLoading && <LoadingFitParent>Loading Top Dynamic Tables</LoadingFitParent>}
          <div className="max-h-80 overflow-auto">
            <Table<DynamicTableInfo>
              data={searchedObjs}
              columns={columns}
              fullWidth
              getTRClass={(row) => {
                if (row.table_name === table) {
                  return basicTableRowSelected + " cursor-pointer";
                }
                return basicTableTR + " cursor-pointer";
              }}
              onTRClick={
                typeof setTable === "function"
                  ? (row) => {
                      if (row.table_name !== table) {
                        setTable(row.table_name || "");
                      } else {
                        setTable("");
                      }
                    }
                  : undefined
              }
            />
          </div>
        </div>
      )}
      {error && <ErrorMessage error={error} message="Error Retrieving Dynamic Tables" />}
    </Box>
  );
}
