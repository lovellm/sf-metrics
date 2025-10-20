import { useMemo, useState } from "react";
import Box from "../basic/Box";
import { SelectedValues } from "@/types/filterTypes";
import { defaultCache } from "@/data/dataCache";
import LoadingFitParent from "../basic/LoadingFitParent";
import ErrorMessage from "../basic/ErrorMessage";
import { TableColumn } from "../table/TableTypes";
import { div0, formatCreditCostDefault, formatPercent2 } from "@/utils/formatters";
import Table from "../table/Table";
import { basicTableCell, basicTableRowSelected, basicTableTR } from "@/constants";
import { IoCaretDown, IoCaretForward } from "react-icons/io5";
import { DbDynamicTables, specForDynamicTablesDb } from "@/specs/dynamicTableSpecs";
import { useQuery } from "@/hooks/useApiData";
import parseQueryResponse from "@/utils/parseQueryResponse";

interface DTDbSummaryProps {
  filters?: SelectedValues;
  db?: string;
  setDb?: (db: string) => void;
}

const dtDbColumns: TableColumn<DbDynamicTables>[] = [
  { accessor: "database_name", Header: "DB", width: 110 },
  {
    accessor: "query_credits_used",
    Header: "Credit Cost",
    width: 110,
    format: formatCreditCostDefault,
  },
  {
    accessor: "credits_used_cloud_services",
    Header: "Cloud Services",
    width: 110,
    format: formatCreditCostDefault,
    cellClass: (row: DbDynamicTables) =>
      basicTableCell +
      ((row.query_credits_used || 0) * 0.1 > (row.credits_used_cloud_services || 0)
        ? " line-through"
        : ""),
  },
  {
    accessor: "table_count",
    Header: "Table Count",
    width: 100,
  },
  {
    accessor: "count",
    Header: "Table Refreshes",
    width: 100,
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
    Cell: (row: DbDynamicTables) => formatPercent2(div0(row.events_no_data, row.count)),
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

export default function DTDbSummary({ filters, db, setDb }: DTDbSummaryProps) {
  const [open, setOpen] = useState<boolean>(true);

  const query = useMemo(() => {
    return specForDynamicTablesDb(filters);
  }, [filters]);
  const { data, isLoading, error } = useQuery(query, {
    dataCache: defaultCache,
    skip: !filters,
  });
  const objs = useMemo(() => {
    const objs = parseQueryResponse<DbDynamicTables>(data, query.columns);
    return objs;
  }, [data, query]);

  return (
    <Box className="p-2">
      <button
        type="button"
        className="flex cursor-pointer items-center gap-x-2 text-left text-lg"
        onClick={() => setOpen((old) => !old)}
      >
        {open ? <IoCaretDown /> : <IoCaretForward />}
        Dynamic Tables Summary by Database
      </button>
      {open && (
        <div className="relative mt-1 min-h-20">
          {isLoading && <LoadingFitParent>Loading Dynamic Tables Summary</LoadingFitParent>}
          <div className="max-h-80 overflow-auto">
            <Table<DbDynamicTables>
              data={objs}
              columns={dtDbColumns}
              fullWidth
              getTRClass={(row) => {
                if (row.database_name === db) {
                  return basicTableRowSelected + " cursor-pointer";
                }
                return basicTableTR + " cursor-pointer";
              }}
              onTRClick={
                typeof setDb === "function"
                  ? (row) => {
                      if (row.database_name !== db) {
                        setDb(row.database_name || "");
                      } else {
                        setDb("");
                      }
                    }
                  : undefined
              }
            />
          </div>
        </div>
      )}
      {error && <ErrorMessage error={error} message="Error Retrieving DB Summary" />}
    </Box>
  );
}
