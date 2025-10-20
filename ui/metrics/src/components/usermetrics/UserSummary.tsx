import { useMemo, useState } from "react";
import { IoCaretDown, IoCaretForward } from "react-icons/io5";
import { SelectedValues } from "@/types/filterTypes";
import Box from "../basic/Box";
import LoadingFitParent from "../basic/LoadingFitParent";
import ErrorMessage from "../basic/ErrorMessage";
import {
  format0Dec,
  formatCreditCost,
  formatCreditCostDefault,
  formatInteger,
} from "@/utils/formatters";
import { TableColumn } from "@/components/table/TableTypes";
import Table from "../table/Table";
import { basicTableTR } from "@/constants";
import PageSelector from "../table/PageSelector";
import { DataTopUsers, topUsers } from "@/specs/userSpecs";
import { useQuery } from "@/hooks/useApiData";
import parseQueryResponse from "@/utils/parseQueryResponse";
import { defaultCache } from "@/data/dataCache";

interface UserSummaryProps {
  userId?: string;
  filters?: SelectedValues;
}

const userColumns: TableColumn<DataTopUsers>[] = [
  { accessor: "user_name", Header: "User ID", width: 200 },
  { accessor: "full_name", Header: "User Name", width: 200 },
  {
    accessor: "total_cost",
    Header: "Total Cost",
    width: 120,
    Cell: (row) => formatCreditCostDefault(totalCost(row)),
  },
  {
    accessor: "query_credits_used",
    Header: "Credits Cost",
    width: 120,
    format: formatCreditCostDefault,
  },
  {
    accessor: "credits_attributed_compute",
    Header: "Attributed Cost",
    width: 120,
    format: formatCreditCostDefault,
  },
  {
    accessor: "credits_used_cloud_services",
    Header: "Cloud Service",
    width: 120,
    format: formatCreditCostDefault,
  },
  {
    accessor: "credits_used_query_acceleration",
    Header: "Query Acceleration",
    width: 120,
    format: formatCreditCostDefault,
  },

  {
    accessor: "count",
    Header: "Queries",
    width: 120,
    format: formatInteger,
  },
];

const totalCost = (row: DataTopUsers): number => {
  const query = Math.max(row.query_credits_used || 0, row.credits_attributed_compute || 0);
  const cloud = row.credits_used_cloud_services || 0;
  let cloudAdjust = cloud - query * 0.1;
  if (cloudAdjust < 0) {
    cloudAdjust = 0;
  }
  return query + cloudAdjust + (row.credits_used_query_acceleration || 0);
};

const PAGE_SIZE = 20;

export default function UserSummary({ userId, filters }: UserSummaryProps) {
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);

  const query = useMemo(() => {
    return topUsers({
      userId: userId,
      selectedValues: filters,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    });
  }, [filters, page, userId]);

  const { data, isLoading, error } = useQuery(query, { dataCache: defaultCache, skip: !query });

  const objs = useMemo(() => {
    const objs = parseQueryResponse<DataTopUsers>(data, query?.columns);
    return objs;
  }, [data, query]);

  return (
    <Box className="p-2">
      <div className="text-center">User Summary</div>
      <div className="relative mt-1 min-h-16">
        {isLoading && <LoadingFitParent />}
        {!objs.length && <div>No Data</div>}
        {/* Display if only a single record */}
        {objs.length === 1 && (
          <div className="flex flex-row flex-wrap items-center justify-center gap-x-4">
            <div className="flex flex-col items-center">
              <div>User ID</div>
              <div className="text-xl">{objs[0].user_name}</div>
            </div>
            <div className="flex flex-col items-center">
              <div>User Name</div>
              <div className="text-xl">{objs[0].full_name}</div>
            </div>
            <div className="flex flex-col items-center">
              <div>Credit Cost</div>
              <div className="text-xl">{formatCreditCost(objs[0].query_credits_used)}</div>
            </div>
            <div className="flex flex-col items-center">
              <div>Attributed Cost</div>
              <div className="text-xl">{formatCreditCost(objs[0].credits_attributed_compute)}</div>
            </div>
            <div className="flex flex-col items-center">
              <div>Cloud Services</div>
              <div className="text-xl">{formatCreditCost(objs[0].credits_used_cloud_services)}</div>
            </div>
            <div className="flex flex-col items-center">
              <div>Query Acceleration</div>
              <div className="text-xl">
                {formatCreditCost(objs[0].credits_used_query_acceleration)}
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div>Total Cost</div>
              <div className="text-xl">{formatCreditCost(totalCost(objs[0]))}</div>
            </div>
            <div className="flex flex-col items-center">
              <div>Queries</div>
              <div className="text-xl">{format0Dec(objs[0].count || 0)}</div>
            </div>
          </div>
        )}
        {/* Display if multiple records */}
        {objs.length > 1 && (
          <div>
            <div className="max-h-80 overflow-auto">
              <Table<DataTopUsers>
                data={objs}
                columns={userColumns}
                fullWidth
                getTRClass={basicTableTR}
              />
            </div>
            {(objs.length === PAGE_SIZE || page > 0) && (
              <PageSelector page={page} pageSize={PAGE_SIZE} onPageChange={setPage} />
            )}
          </div>
        )}
        {/* Help Info */}
        <div className="mt-1">
          <button
            type="button"
            onClick={() => {
              setShowHelp((old) => !old);
            }}
            className="flex cursor-pointer items-center gap-x-2 text-sm"
          >
            {showHelp ? <IoCaretDown /> : <IoCaretForward />} What do these numbers mean?
          </button>
          {showHelp && (
            <div className="list pl-2">
              <ul>
                <li>
                  <b>Credit Cost</b> is the actual cost of the warehouse during an hour proportioned
                  out to all queries that used it during that hour based on their percent of total
                  execution time on it.
                  <ul>
                    <li>
                      In the aggregate, there is about a 3% gap from actual cost due to timing and
                      period boundaries.
                    </li>
                    <li>If not otherwise stated, all other costs on this page are this value.</li>
                  </ul>
                </li>
                <li>
                  <b>Attributed Cost</b> is Snowflake's calculated metric of cost that ignores idle
                  time and minimum warehouse charges.
                  <ul>
                    <li>It will usually be smaller than Credit Cost, with some exceptions.</li>
                    <li>
                      In the aggregate, there is up to a 75% gap from actual cost due to ignoring
                      idle time and minimum charges.
                    </li>
                  </ul>
                </li>
                <li>
                  <b>Cloud Services</b> is cost accrued by a query but not directly attributed to
                  the warehouse.
                  <ul>
                    <li>
                      It can be things such as metadata queries, cached results, and other services.
                    </li>
                    <li>
                      We are only charged for Cloud Services if it exceeds 10% of the actual
                      warehouse cost (at the aggregated account level).
                    </li>
                  </ul>
                </li>
                <li>
                  <b>Query Acceleration</b> means the warehouse decided to ramp up additional
                  compute power to serve a query.
                  <ul>
                    <li>Most warehouses do not have it enabled.</li>
                    <li>
                      If it is enabled on a warehouse, it is automatic, and could be a large
                      multiplier of the base cost.
                    </li>
                  </ul>
                </li>
                <li>
                  <b>Total Cost</b> is the compute cost (larger of Credit Cost or Attributed Cost) +
                  Query Accleration + the portion of Cloud Services greater than the 10% of compute
                  cost.
                </li>
                <li>
                  <b>Not Included:</b> costs for specific features that charge in addition to
                  Warehousess, such as AI, are not included.
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
      {error && <ErrorMessage error={error} message="Unable to Loading Data" />}
    </Box>
  );
}
