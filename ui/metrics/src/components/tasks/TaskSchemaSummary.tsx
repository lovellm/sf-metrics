import { useMemo, useState } from "react";
import Box from "../basic/Box";
import { SelectedValues } from "@/types/filterTypes";
import { SchemaTasks, specForTaskSchema } from "@/specs/taskSpecs";
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

interface TaskSchemaSummaryProps {
  filters?: SelectedValues;
  db?: string;
  schema?: string;
  setSchema?: (next: string) => void;
  schemaSearch?: string;
  setSchemaSearch?: (next: string) => void;
}

const taskSchemaColumns: TableColumn<SchemaTasks>[] = [
  { accessor: "task_database", Header: "DB", width: 110 },
  { accessor: "task_schema", Header: "Schema", width: 110 },
  {
    accessor: "query_credits_used",
    Header: "Total Cost",
    width: 110,
    format: formatCreditCostDefault,
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
    width: 110,
    format: formatCreditCostDefault,
    cellClass: (row: SchemaTasks) =>
      basicTableCell +
      ((row.query_credits_used || 0) * 0.1 > (row.credits_used_cloud_services || 0)
        ? " line-through"
        : ""),
  },
  {
    accessor: "task_count",
    Header: "Task Count",
    width: 90,
  },
  {
    accessor: "count",
    Header: "Task Runs",
    width: 90,
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

export default function TaskSchemaSummary({
  filters,
  db,
  schema,
  setSchema,
  schemaSearch,
  setSchemaSearch,
}: TaskSchemaSummaryProps) {
  const [open, setOpen] = useState<boolean>(true);

  const spec = useMemo(() => {
    return specForTaskSchema({ selectedValues: filters, db });
  }, [filters, db]);
  const { data, isLoading, error } = useQuery(spec, {
    dataCache: defaultCache,
    skip: !filters,
  });
  const objs = useMemo(() => {
    const objs = parseQueryResponse<SchemaTasks>(data, spec?.columns);
    return objs;
  }, [data, spec]);
  // Search the objects
  const searchedObjs = useMemo(() => {
    if (!objs || !schemaSearch) {
      return objs;
    }
    return objs.filter((o) => o.task_schema?.toUpperCase().includes(schemaSearch?.toUpperCase()));
  }, [schemaSearch, objs]);

  return (
    <Box className="p-2">
      <button
        type="button"
        className="flex cursor-pointer items-center gap-x-2 text-left text-lg"
        onClick={() => setOpen((old) => !old)}
      >
        {open ? <IoCaretDown /> : <IoCaretForward />}
        Task Summary by Schema
      </button>
      {open && (
        <div className="relative mt-1">
          {setSchemaSearch && (
            <input
              className="input-main border-main grow border px-2"
              placeholder="Search..."
              type="text"
              value={schemaSearch}
              onChange={(e) => setSchemaSearch(e.target.value)}
            />
          )}
          {isLoading && <LoadingFitParent>Loading Schema Summary</LoadingFitParent>}
          <div className="max-h-80 w-min overflow-auto">
            <Table<SchemaTasks>
              data={searchedObjs}
              columns={taskSchemaColumns}
              getTRClass={(row) => {
                if (row.task_schema === schema) {
                  return basicTableRowSelected + " cursor-pointer";
                }
                return basicTableTR + " cursor-pointer";
              }}
              onTRClick={
                typeof setSchema === "function"
                  ? (row) => {
                      if (row.task_schema !== schema) {
                        setSchema(row.task_schema || "");
                      } else {
                        setSchema("");
                      }
                    }
                  : undefined
              }
            />
          </div>
        </div>
      )}
      {error && <ErrorMessage error={error} message="Error Retrieving Schema Summary" />}
    </Box>
  );
}
