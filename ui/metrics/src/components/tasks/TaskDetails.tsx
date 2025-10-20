import { useMemo, useState } from "react";
import Box from "../basic/Box";
import { SelectedValues } from "@/types/filterTypes";
import { specForTasksDetails, TaskInfo } from "@/specs/taskSpecs";
import { defaultCache } from "@/data/dataCache";
import LoadingFitParent from "../basic/LoadingFitParent";
import ErrorMessage from "../basic/ErrorMessage";
import { TableColumn } from "../table/TableTypes";
import {
  bytesToGbString,
  div0,
  formatCreditCostDefault,
  formatInteger,
  formatMs,
  formatPercent0,
} from "@/utils/formatters";
import Table from "../table/Table";
import { basicTableTR } from "@/constants";
import PageSelector from "../table/PageSelector";
import { useQuery } from "@/hooks/useApiData";
import parseQueryResponse from "@/utils/parseQueryResponse";
import useAppState from "@/context/useAppState";
import { AppStateAction } from "@/context/AppState";
import SessionDetails from "../session/SessionDetails";

interface TaskDetailsProps {
  filters?: SelectedValues;
  db?: string;
  schema?: string;
  task?: string;
}

const getTaskDetailColumns = (dispatch: React.ActionDispatch<[action: AppStateAction]>) => {
  const taskDetailColumns: TableColumn<TaskInfo>[] = [
    { accessor: "start_time", Header: "Start Time", width: 220 },
    { accessor: "warehouse_name", Header: "Warehouse", width: 110 },
    { accessor: "role_name", Header: "Role", width: 110 },
    { accessor: "scheduled_from", Header: "Run Via", width: 110 },
    { accessor: "execution_status", Header: "Status", width: 110 },
    {
      accessor: "query_credits_used",
      Header: "Cost",
      width: 70,
      format: formatCreditCostDefault,
    },
    {
      accessor: "total_elapsed_time",
      Header: "Duration",
      format: formatMs,
      width: 80,
    },
    {
      accessor: "queued_overload_time",
      Header: "Queued Time",
      format: formatMs,
      width: 80,
    },
    { accessor: "bytes_scanned", Header: "GB Scanned", format: bytesToGbString, width: 90 },
    {
      accessor: "bytes_spilled_to_local_storage",
      Header: "GB Spilled Local",
      format: bytesToGbString,
      width: 100,
    },
    {
      accessor: "bytes_spilled_to_remote_storage",
      Header: "GB Spilled Remote",
      format: bytesToGbString,
      width: 100,
    },
    {
      accessor: "partitions_scanned",
      Header: "Partitions",
      width: 150,
      Cell: (row) =>
        row.partitions_total
          ? `${formatPercent0(div0(row.partitions_scanned, row.partitions_total))} out of ${row.partitions_total}`
          : "0",
    },
    {
      accessor: "count_queries",
      Header: "Queries",
      width: 75,
    },
    {
      accessor: "rows_inserted",
      Header: "Rows Inserted",
      width: 120,
      format: formatInteger,
    },
    {
      accessor: "rows_updated",
      Header: "Rows Updated",
      width: 120,
      format: formatInteger,
    },
    {
      accessor: "rows_deleted",
      Header: "Rows Deleted",
      width: 120,
      format: formatInteger,
    },
    {
      accessor: "session_id",
      Header: "Session",
      Cell: (row) => (
        <button
          className="a-main cursor-pointer"
          type="button"
          onClick={() => {
            dispatch({
              type: "setOverlay",
              payload: <SessionDetails sessionId={row.session_id} />,
            });
          }}
        >
          {row.session_id}
        </button>
      ),
      width: 150,
    },
  ];
  return taskDetailColumns;
};

const PAGE_SIZE = 100;

export default function TaskDetails({ filters, db, schema, task }: TaskDetailsProps) {
  const [, dispatch] = useAppState();
  const [page, setPage] = useState<number>(0);

  const taskDetailColumns = useMemo(() => getTaskDetailColumns(dispatch), [dispatch]);

  const spec = useMemo(() => {
    return specForTasksDetails({
      selectedValues: filters,
      db,
      schema,
      task,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    });
  }, [filters, db, schema, task, page]);
  const { data, isLoading, error } = useQuery(spec, { dataCache: defaultCache, skip: !task });
  const objs = useMemo(() => {
    const objs = parseQueryResponse<TaskInfo>(data, spec?.columns);
    return objs;
  }, [data, spec]);

  return (
    <Box className="p-2">
      <div className="text-lg">Task Details</div>
      {!task && <div>Select a task to see run details</div>}
      <div className="relative">
        {task && (
          <div>
            Database: {db || "ALL"}, Schema: {schema || "ALL"}, Task: {task}
          </div>
        )}
        {isLoading && <LoadingFitParent>Loading Task Details</LoadingFitParent>}
        {objs.length > 0 && (
          <div className="max-h-80 overflow-auto">
            <Table<TaskInfo>
              data={objs}
              columns={taskDetailColumns}
              fullWidth
              getTRClass={basicTableTR}
            />
          </div>
        )}
        {(objs.length === PAGE_SIZE || page > 0) && (
          <PageSelector page={page} pageSize={PAGE_SIZE} onPageChange={setPage} />
        )}
      </div>
      {error && <ErrorMessage error={error} message="Error Retrieving Task Details" />}
    </Box>
  );
}
