import { useMemo, useState } from "react";
import { Link } from "react-router";
import { defaultCache } from "@/data/dataCache";
import HttpRequest from "@/data/HttpRequest";
import { useQuery } from "@/hooks/useApiData";
import { querySession, SessionData } from "@/specs/sessionSpecs";
import parseQueryResponse from "@/utils/parseQueryResponse";
import { SortableTableColumn } from "../table/SortableHeader";
import Box from "../basic/Box";
import ErrorMessage from "../basic/ErrorMessage";
import TableLocalSort from "../table/TableLocalSort";
import LoadingFitParent from "../basic/LoadingFitParent";
import PageSelector from "../table/PageSelector";
import { getDaysAgo14 } from "@/utils/dates";
import {
  bytesToGbString,
  formatCreditCostDefault,
  formatInteger,
  formatMs,
} from "@/utils/formatters";
import { getQueryProfileUrl } from "@/constants";

interface SessionDetailsProps {
  sessionId?: string;
  expanded?: boolean;
}

const daysAgo14 = getDaysAgo14();

const sessionColumns: SortableTableColumn<SessionData>[] = [
  {
    accessor: "start_time",
    Header: "Start Time",
    width: 160,
    sortable: true,
  },

  {
    accessor: "query_type",
    Header: "Query Type",
    width: 100,
    sortable: true,
  },
  {
    accessor: "query_id",
    Header: "Query Id",
    width: 180,
    sortable: true,
    Cell: (row) =>
      (row.start_time || "") >= daysAgo14 ? (
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
    width: 120,
    sortable: true,
  },
  {
    accessor: "cluster_number",
    Header: "Used WH",
    width: 80,
    sortable: true,
    Cell: (row) => (row.cluster_number ? "Yes" : "No"),
  },
  {
    accessor: "execution_status",
    Header: "Status",
    width: 100,
    sortable: true,
  },
  {
    accessor: "total_elapsed_time",
    Header: "Total Time",
    width: 140,
    sortable: true,
    format: formatMs,
  },
  {
    accessor: "query_credits_used",
    Header: "Query Credits",
    width: 140,
    sortable: true,
    format: formatCreditCostDefault,
  },
  {
    accessor: "credits_used_cloud_services",
    Header: "Cloud Services",
    width: 140,
    sortable: true,
    format: formatCreditCostDefault,
  },
  {
    accessor: "compilation_time",
    Header: "Compile Time",
    width: 140,
    sortable: true,
    format: formatMs,
  },
  {
    accessor: "execution_time",
    Header: "Execution Time",
    width: 140,
    sortable: true,
    format: formatMs,
  },
  {
    accessor: "queued_overload_time",
    Header: "Queued Time",
    width: 140,
    sortable: true,
    format: formatMs,
  },
  {
    accessor: "bytes_scanned",
    Header: "GB Scanned",
    width: 140,
    sortable: true,
    format: bytesToGbString,
  },
  {
    accessor: "bytes_written",
    Header: "Bytes Written",
    width: 140,
    sortable: true,
    format: formatInteger,
  },
  {
    accessor: "bytes_written_to_result",
    Header: "Result Bytes",
    width: 140,
    sortable: true,
    format: formatInteger,
  },
  {
    accessor: "rows_written_to_result",
    Header: "Result Rows",
    width: 140,
    sortable: true,
    format: formatInteger,
  },
  {
    accessor: "rows_inserted",
    Header: "Rows Inserted",
    width: 140,
    sortable: true,
    format: formatInteger,
  },
  {
    accessor: "rows_updated",
    Header: "Rows Updated",
    width: 140,
    sortable: true,
    format: formatInteger,
  },
  {
    accessor: "rows_deleted",
    Header: "Rows Deleted",
    width: 140,
    sortable: true,
    format: formatInteger,
  },
  {
    accessor: "partitions_scanned",
    Header: "Partitions Scanned",
    width: 140,
    sortable: true,
    format: formatInteger,
  },
  {
    accessor: "partitions_total",
    Header: "Partitions Total",
    width: 140,
    sortable: true,
    format: formatInteger,
  },
  {
    accessor: "bytes_spilled_to_local_storage",
    Header: "GB Spilled Local",
    width: 140,
    sortable: true,
    format: bytesToGbString,
  },
  {
    accessor: "bytes_spilled_to_remote_storage",
    Header: "GB Spilled Remote",
    width: 140,
    sortable: true,
    format: bytesToGbString,
  },
  {
    accessor: "bytes_sent_over_the_network",
    Header: "GB Over Network",
    width: 140,
    sortable: true,
    format: bytesToGbString,
  },
  {
    accessor: "role_name",
    Header: "Role",
    width: 140,
    sortable: true,
  },
  {
    accessor: "query_tag",
    Header: "Query Tag",
    width: 180,
    sortable: true,
  },
  {
    accessor: "error_code",
    Header: "Error Code",
    width: 100,
    sortable: true,
  },
  {
    accessor: "error_message",
    Header: "Error Message",
    width: 180,
    sortable: true,
  },
];

const PAGE_SIZE = 60;
const LIMIT = 2000;
const request = new HttpRequest({ timeout: 30000 });

export default function SessionDetails({ sessionId, expanded }: SessionDetailsProps) {
  const [page, setPage] = useState<number>(0);

  const query = useMemo(() => {
    return querySession(sessionId, LIMIT);
  }, [sessionId]);
  const {
    data: data,
    isLoading: isLoading,
    error: error,
  } = useQuery(query, {
    dataCache: defaultCache,
    skip: !sessionId,
    httpRequest: request,
  });
  const objs = useMemo(() => {
    const objs = parseQueryResponse<SessionData>(data, query.columns);
    return objs;
  }, [data, query]);

  const pagedObjs = useMemo(() => {
    if (!objs) {
      return [] as SessionData[];
    }
    const start = PAGE_SIZE * page;
    const end = start + PAGE_SIZE;
    return objs.slice(start, end);
  }, [objs, page]);

  return (
    <div className="grid grid-cols-1 p-2">
      {/* Main Area */}
      <div className="flex flex-col gap-y-2">
        {/* Credits Table */}
        <Box className="p-2">
          <div className="flex items-center gap-x-2 text-left text-lg">
            Session Details for {sessionId || "No Session Id"}
          </div>
          {!sessionId && <div className="font-xl">No Session Id Provided</div>}
          <div className="relative mt-1 min-h-20">
            {isLoading && <LoadingFitParent>Loading Data</LoadingFitParent>}
            <div className={`${expanded ? "max-h-[600px]" : "max-h-80"} overflow-auto`}>
              <TableLocalSort<SessionData>
                data={pagedObjs}
                columns={sessionColumns}
                multiSort
                fullWidth
              />
            </div>
            {(objs.length >= PAGE_SIZE || page > 0) && (
              <PageSelector
                align="left"
                page={page}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
                length={objs.length}
              />
            )}
          </div>
        </Box>
        {/* Comment Text */}
        <Box className="p-2">
          <div className="pl-2">
            <ul>
              <li>Sessions more than 3 months old will not be displayed.</li>
              <li>At most, {LIMIT} records for the session will be displayed.</li>
              <li>Default sort puts oldest query first</li>
              {sessionId && !expanded && (
                <li>
                  <Link
                    to={"/session/" + sessionId}
                    className="a-main"
                    target="_blank"
                    rel="noopener"
                  >
                    Open in New Tab
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </Box>
      </div>
      {error && <ErrorMessage error={error} message="Error Retrieving Session Details" />}
    </div>
  );
}
