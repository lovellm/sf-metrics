import { useMemo, useState } from "react";
import { SelectedValues } from "@/types/filterTypes";
import Box from "../basic/Box";
import LoadingFitParent from "../basic/LoadingFitParent";
import ErrorMessage from "../basic/ErrorMessage";
import {
  bytesToGbString,
  div0,
  formatCreditCostDefault,
  formatMs,
  formatPercent0,
} from "@/utils/formatters";
import { TableColumn } from "@/components/table/TableTypes";
import Table from "../table/Table";
import { basicTableTR, getQueryProfileUrl } from "@/constants";
import PageSelector from "../table/PageSelector";
import { IoCaretDown, IoCaretForward } from "react-icons/io5";
import { getDaysAgo14 } from "@/utils/dates";
import { DataTopQueries, topQueries } from "@/specs/userSpecs";
import { useQuery } from "@/hooks/useApiData";
import { defaultCache } from "@/data/dataCache";
import parseQueryResponse from "@/utils/parseQueryResponse";
import HttpRequest from "@/data/HttpRequest";

interface TopQueriesProps {
  userId?: string;
  filters?: SelectedValues;
}

const daysAgo14 = getDaysAgo14();
const request = new HttpRequest({ timeout: 90000 });

const cols: TableColumn<DataTopQueries>[] = [
  {
    accessor: "user_name",
    Header: "User Id",
    width: 80,
  },
  {
    accessor: "full_name",
    Header: "User Name",
    width: 120,
  },
  {
    accessor: "query_type",
    Header: "Query Type",
    width: 80,
  },
  {
    accessor: "query_text",
    Header: "SQL",
    width: 180,
    Cell: (row) =>
      /*row.query_type === "SELECT" && */ (row.start_time || "") >= daysAgo14 ? (
        <a href={getQueryProfileUrl(row.query_id || "")} target="_blank" className="a-main">
          {row.query_text}
        </a>
      ) : (
        row.query_text
      ),
  },
  {
    accessor: "warehouse_name",
    Header: "Warehouse",
    width: 110,
  },
  {
    accessor: "start_time",
    Header: "Start Time",
    width: 140,
  },
  {
    accessor: "total_elapsed_time",
    Header: "Duration",
    width: 100,
    format: formatMs,
  },
  {
    accessor: "execution_status",
    Header: "Status",
    width: 80,
  },
  {
    accessor: "query_credits_used",
    Header: "Credit Cost",
    width: 80,
    format: formatCreditCostDefault,
  },
  {
    accessor: "credits_used_query_acceleration",
    Header: "Query Acceleration",
    width: 100,
    format: formatCreditCostDefault,
  },
  {
    accessor: "bytes_scanned",
    Header: "GB Scanned",
    width: 100,
    format: bytesToGbString,
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
    accessor: "bytes_spilled_to_local_storage",
    Header: "GB Spilled",
    format: bytesToGbString,
    width: 80,
  },
  {
    accessor: "application",
    Header: "Application",
    width: 140,
  },
  {
    accessor: "query_tag",
    Header: "Query Tag",
    width: 140,
  },
];

const PAGE_SIZE = 20;

export default function TopQueries({ userId, filters }: TopQueriesProps) {
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);

  const query = useMemo(() => {
    return topQueries({
      userId,
      selectedValues: filters,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    });
  }, [userId, filters, page]);

  const { data, isLoading, error } = useQuery(query, {
    dataCache: defaultCache,
    skip: !query,
    httpRequest: request,
  });
  const objs = useMemo(() => {
    const objs = parseQueryResponse<DataTopQueries>(data, query?.columns);
    return objs;
  }, [data, query]);

  return (
    <Box className="p-2">
      <div className="text-center">Most Expensive Queries</div>
      <div className="relative mt-1 min-h-20">
        {isLoading && <LoadingFitParent />}
        {!objs.length && (
          <div>
            No Matching Data
            <div className="text-sm">
              This could also mean no queries with individual cost above the minimum.
            </div>
          </div>
        )}
        {objs.length > 0 && (
          <div>
            <div className="max-h-80 overflow-auto">
              <Table<DataTopQueries>
                data={objs}
                columns={cols}
                fullWidth
                getTRClass={basicTableTR}
              />
            </div>
            {(objs.length === PAGE_SIZE || page > 0) && (
              <PageSelector page={page} pageSize={PAGE_SIZE} onPageChange={setPage} />
            )}
          </div>
        )}
      </div>
      {/* Help Info */}
      <div className="mt-2">
        <button
          type="button"
          onClick={() => {
            setShowHelp((old) => !old);
          }}
          className="flex cursor-pointer items-center gap-x-2 text-sm"
        >
          {showHelp ? <IoCaretDown /> : <IoCaretForward />} What do these columns mean?
        </button>
        {showHelp && (
          <div className="list pl-2">
            <ul>
              <li>
                <b>GB Scanned</b> is the total GB of data read in order to fulfill the request. In
                general, a higher number is bad.
              </li>
              <li>
                <b>Partitions</b> are how Snowflake stores data. You want the % number to be low,
                especially if the total number is large. A large percent of a large total will
                result in a slow query, and can be caused by the following.
                <ul>
                  <li>You are not filtering the data, reading all of it.</li>
                  <li>
                    Pruning was not able to happen, possibly due to filtering on calculated values
                    rather than the column itself.
                  </li>
                  <li>
                    The partitions are not naturally clustered based on how they are used. Data
                    Engineering should review the load process.
                  </li>
                </ul>
              </li>
              <li>
                <b>GB Spilled</b> is the total GB that needed to be written to disk to to memory
                limitations. A small number is usually fine. A very large number generally means you
                have a poorly written query. Things that can cause spilling include large
                CTE/Subqueries, sorting giant result sets, complex joins without sufficient filters.
              </li>
              <li>
                Stored Procedures will have 1 query for calling the procedure itself plus additional
                queries for each query run inside the procedure.
                <ul>
                  <li>The total cost of the procedure is the SUM of all the queries run in it.</li>
                  <li>
                    This means if you see a CALL and then a SELECT for the procedure right below it,
                    the real cost of the procedure is the SUM of the those values, not just the
                    CALL.
                  </li>
                  <li>
                    In other words, the cost will be at least 2X the cost of the CALL query,
                    assuming it runs a single query.
                  </li>
                </ul>
              </li>
              <li>
                SQL column will link to query details and profiler for queries within the last 14
                days.
              </li>
              <li>Queries must have a minimum cost of 0.03 credits to appear in this table.</li>
            </ul>
          </div>
        )}
      </div>
      {error && <ErrorMessage error={error} message="Unable to Load Data" />}
    </Box>
  );
}
