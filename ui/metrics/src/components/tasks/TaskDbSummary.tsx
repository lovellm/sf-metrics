import { useMemo, useState } from "react";
import Box from "../basic/Box";
import { SelectedValues } from "@/types/filterTypes";
import { DbTasks, specForTaskDb } from "@/specs/taskSpecs";
import { defaultCache } from "@/data/dataCache";
import LoadingFitParent from "../basic/LoadingFitParent";
import ErrorMessage from "../basic/ErrorMessage";
import { TableColumn } from "../table/TableTypes";
import { formatCreditCostDefault } from "@/utils/formatters";
import Table from "../table/Table";
import { basicTableCell, basicTableRowSelected, basicTableTR } from "@/constants";
import { IoCaretDown, IoCaretForward } from "react-icons/io5";
import { useQuery } from "@/hooks/useApiData";
import parseQueryResponse from "@/utils/parseQueryResponse";

interface TaskDbSummaryProps {
  filters?: SelectedValues;
  db?: string;
  setDb?: (db: string) => void;
}

const taskDbColumns: TableColumn<DbTasks>[] = [
  { accessor: "task_database", Header: "DB", width: 110 },
  {
    accessor: "query_credits_used",
    Header: "Total Cost",
    width: 110,
    format: formatCreditCostDefault,
  },
  {
    accessor: "credits_serverless",
    Header: "Serverless",
    width: 110,
    format: formatCreditCostDefault,
  },
  {
    accessor: "credits_used_cloud_services",
    Header: "Cloud Services",
    width: 110,
    format: formatCreditCostDefault,
    cellClass: (row: DbTasks) =>
      basicTableCell +
      ((row.query_credits_used || 0) * 0.1 > (row.credits_used_cloud_services || 0)
        ? " line-through"
        : ""),
  },
  {
    accessor: "task_count",
    Header: "Task Count",
    width: 100,
  },
  {
    accessor: "count",
    Header: "Task Runs",
    width: 100,
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

export default function TaskDbSummary({ filters, db, setDb }: TaskDbSummaryProps) {
  const [open, setOpen] = useState<boolean>(true);

  const dbSpec = useMemo(() => {
    return specForTaskDb(filters);
  }, [filters]);
  const { data, isLoading, error } = useQuery(dbSpec, {
    dataCache: defaultCache,
    skip: !filters,
  });
  const objs = useMemo(() => {
    const objs = parseQueryResponse<DbTasks>(data, dbSpec?.columns);
    return objs;
  }, [data, dbSpec]);

  return (
    <Box className="p-2">
      <button
        type="button"
        className="flex cursor-pointer items-center gap-x-2 text-left text-lg"
        onClick={() => setOpen((old) => !old)}
      >
        {open ? <IoCaretDown /> : <IoCaretForward />}
        Task Summary by Database
      </button>
      {open && (
        <div className="relative mt-1 min-h-20">
          {isLoading && <LoadingFitParent>Loading Task Summary</LoadingFitParent>}
          <div className="max-h-80 w-min overflow-auto">
            <Table<DbTasks>
              data={objs}
              columns={taskDbColumns}
              // fullWidth
              getTRClass={(row) => {
                if (row.task_database === db) {
                  return basicTableRowSelected + " cursor-pointer";
                }
                return basicTableTR + " cursor-pointer";
              }}
              onTRClick={
                typeof setDb === "function"
                  ? (row) => {
                      if (row.task_database !== db) {
                        setDb(row.task_database || "");
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
