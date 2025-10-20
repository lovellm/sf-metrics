import { useMemo, useState } from "react";
import Box from "../basic/Box";
import { SelectedValues } from "@/types/filterTypes";
import { DbTasks, specForTopTasks, TaskInfo } from "@/specs/taskSpecs";
import { defaultCache } from "@/data/dataCache";
import LoadingFitParent from "../basic/LoadingFitParent";
import ErrorMessage from "../basic/ErrorMessage";
import { TableColumn } from "../table/TableTypes";
import { bytesToGbString, formatCreditCostDefault, formatMs } from "@/utils/formatters";
import Table from "../table/Table";
import { basicTableCell, basicTableRowSelected, basicTableTR } from "@/constants";
import { IoCaretDown, IoCaretForward } from "react-icons/io5";
import { useQuery } from "@/hooks/useApiData";
import parseQueryResponse from "@/utils/parseQueryResponse";

interface TopTasksProps {
  filters?: SelectedValues;
  db?: string;
  schema?: string;
  task?: string;
  setTask?: (task: string) => void;
  taskSearch?: string;
  setTaskSearch?: (task: string) => void;
}

const topTaskColumns: TableColumn<TaskInfo>[] = [
  { accessor: "task_database", Header: "DB", width: 110 },
  { accessor: "task_schema", Header: "Schema", width: 110 },
  { accessor: "task_name", Header: "Task Name", width: 200 },
  {
    accessor: "query_credits_used",
    Header: "Total Cost",
    width: 110,
    format: formatCreditCostDefault,
  },
  {
    accessor: "count",
    Header: "Task Runs",
    width: 70,
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
    accessor: "credits_serverless",
    Header: "Serverless",
    width: 100,
    format: formatCreditCostDefault,
  },
  {
    accessor: "credits_used_cloud_services",
    Header: "Cloud Services",
    width: 90,
    format: formatCreditCostDefault,
    cellClass: (row: DbTasks) =>
      basicTableCell +
      ((row.query_credits_used || 0) * 0.1 > (row.credits_used_cloud_services || 0)
        ? " line-through"
        : ""),
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

export default function TopTasks({
  filters,
  db,
  schema,
  task,
  setTask,
  taskSearch,
  setTaskSearch,
}: TopTasksProps) {
  const [open, setOpen] = useState<boolean>(true);

  const spec = useMemo(() => {
    return specForTopTasks({ selectedValues: filters, db, schema });
  }, [filters, db, schema]);
  const { data, isLoading, error } = useQuery(spec, {
    dataCache: defaultCache,
    skip: !filters,
  });
  const objs = useMemo(() => {
    const objs = parseQueryResponse<TaskInfo>(data, spec?.columns);
    return objs;
  }, [data, spec]);
  // Search the objects
  const searchedObjs = useMemo(() => {
    if (!objs || !taskSearch) {
      return objs;
    }
    return objs.filter((o) => o.task_name?.toUpperCase().includes(taskSearch?.toUpperCase()));
  }, [taskSearch, objs]);

  return (
    <Box className="p-2">
      <button
        type="button"
        className="flex cursor-pointer items-center gap-x-2 text-left text-lg"
        onClick={() => setOpen((old) => !old)}
      >
        {open ? <IoCaretDown /> : <IoCaretForward />}
        Top Tasks <span className="text-sm">(select both db and schema to see a longer list)</span>
      </button>
      {open && (
        <div className="relative mt-1 min-h-20">
          {setTaskSearch && (
            <input
              className="input-main border-main grow border px-2"
              placeholder="Search..."
              type="text"
              value={taskSearch}
              onChange={(e) => setTaskSearch(e.target.value)}
            />
          )}
          {isLoading && <LoadingFitParent>Loading Top Tasks</LoadingFitParent>}
          <div className="max-h-80 overflow-auto">
            <Table<TaskInfo>
              data={searchedObjs}
              columns={topTaskColumns}
              fullWidth
              getTRClass={(row) => {
                if (row.task_name === task) {
                  return basicTableRowSelected + " cursor-pointer";
                }
                return basicTableTR + " cursor-pointer";
              }}
              onTRClick={
                typeof setTask === "function"
                  ? (row) => {
                      if (row.task_name !== task) {
                        setTask(row.task_name || "");
                      } else {
                        setTask("");
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
