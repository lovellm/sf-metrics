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
import { SchemaDynamicTables, specForDynamicTablesSchema } from "@/specs/dynamicTableSpecs";
import parseQueryResponse from "@/utils/parseQueryResponse";
import { useQuery } from "@/hooks/useApiData";

interface DTSchemaSummaryProps {
  filters?: SelectedValues;
  db?: string;
  schema?: string;
  setSchema?: (next: string) => void;
  schemaSearch?: string;
  setSchemaSearch?: (next: string) => void;
}

const dtSchemaColumns: TableColumn<SchemaDynamicTables>[] = [
  { accessor: "database_name", Header: "DB", width: 110 },
  { accessor: "schema_name", Header: "Schema", width: 110 },
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
    cellClass: (row: SchemaDynamicTables) =>
      basicTableCell +
      ((row.query_credits_used || 0) * 0.1 > (row.credits_used_cloud_services || 0)
        ? " line-through"
        : ""),
  },
  {
    accessor: "table_count",
    Header: "Table Count",
    width: 90,
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
    Cell: (row: SchemaDynamicTables) => formatPercent2(div0(row.events_no_data, row.count)),
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

export default function DTSchemaSummary({
  filters,
  db,
  schema,
  setSchema,
  schemaSearch,
  setSchemaSearch,
}: DTSchemaSummaryProps) {
  const [open, setOpen] = useState<boolean>(true);

  const query = useMemo(() => {
    return specForDynamicTablesSchema({ selectedValues: filters, db });
  }, [filters, db]);
  const { data, isLoading, error } = useQuery(query, {
    dataCache: defaultCache,
    skip: !filters,
  });
  const objs = useMemo(() => {
    const objs = parseQueryResponse<SchemaDynamicTables>(data, query.columns);
    return objs;
  }, [data, query]);
  // Search the objects
  const searchedObjs = useMemo(() => {
    if (!objs || !schemaSearch) {
      return objs;
    }
    return objs.filter((o) => o.schema_name?.toUpperCase().includes(schemaSearch?.toUpperCase()));
  }, [schemaSearch, objs]);

  return (
    <Box className="p-2">
      <button
        type="button"
        className="flex cursor-pointer items-center gap-x-2 text-left text-lg"
        onClick={() => setOpen((old) => !old)}
      >
        {open ? <IoCaretDown /> : <IoCaretForward />}
        Dynamic Tables Summary by Schema
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
          <div className="max-h-80 overflow-auto">
            <Table<SchemaDynamicTables>
              data={searchedObjs}
              columns={dtSchemaColumns}
              fullWidth
              getTRClass={(row) => {
                if (row.schema_name === schema) {
                  return basicTableRowSelected + " cursor-pointer";
                }
                return basicTableTR + " cursor-pointer";
              }}
              onTRClick={
                typeof setSchema === "function"
                  ? (row) => {
                      if (row.schema_name !== schema) {
                        setSchema(row.schema_name || "");
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
