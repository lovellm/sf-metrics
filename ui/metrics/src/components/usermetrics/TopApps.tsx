import { useMemo } from "react";
import { SelectedValues } from "@/types/filterTypes";
import Box from "../basic/Box";
import LoadingFitParent from "../basic/LoadingFitParent";
import ErrorMessage from "../basic/ErrorMessage";
import { asString, div0, formatCreditCostDefault, formatInteger } from "@/utils/formatters";
import { TableColumn } from "@/components/table/TableTypes";
import Table from "../table/Table";
import { basicTableTR } from "@/constants";
import { alphaSorter } from "@/utils/sorters";
import InlineStackedBar from "../charts/InlineStackedBar";
import { descending } from "d3-array";
import { DataTopApps, topApps } from "@/specs/userSpecs";
import parseQueryResponse from "@/utils/parseQueryResponse";
import { useQuery } from "@/hooks/useApiData";
import { defaultCache } from "@/data/dataCache";

interface TopAppsProps {
  userId?: string;
  filters?: SelectedValues;
}

type DataTopAppsPivoted = {
  warehouse_credits: Record<string, number>;
  warehouse_perc: Record<string, number>;
  warehouse_list: string[];
  warehouse_count: Record<string, number>;
  warehouse_count_perc: Record<string, number>;
  application: string;
  query_credits_used: number;
  count: number;
};

const cols: TableColumn<DataTopAppsPivoted>[] = [
  {
    accessor: "application",
    Header: "Application",
    width: 200,
    format: (a: unknown) => asString(a) || "Unknown",
  },
  {
    accessor: "wh_chart",
    Header: "Cost by Warehouse",
    width: 300,
    fixedSize: true,
    cellClass: "py-0 px-2 border table-row-border whitespace-nowrap text-sm",
    Cell: (row) => {
      return (
        <InlineStackedBar
          percentages={row.warehouse_perc}
          values={row.warehouse_credits}
          bars={row.warehouse_list}
          width={282}
          height={24}
          formatValue={formatCreditCostDefault}
        />
      );
    },
  },
  {
    accessor: "wh_count",
    Header: "Queries by Warehouse",
    width: 200,
    fixedSize: true,
    cellClass: "py-0 px-2 border table-row-border whitespace-nowrap text-sm",
    Cell: (row) => {
      return (
        <InlineStackedBar
          percentages={row.warehouse_count_perc}
          values={row.warehouse_count}
          bars={row.warehouse_list}
          width={182}
          height={24}
          formatValue={formatInteger}
        />
      );
    },
  },
  {
    accessor: "query_credits_used",
    Header: "Total Cost",
    width: 100,
    format: formatCreditCostDefault,
  },
  {
    accessor: "count",
    Header: "Queries",
    width: 100,
    format: formatInteger,
  },
];

export default function TopApps({ userId, filters }: TopAppsProps) {
  const query = useMemo(() => {
    return topApps({ userId, selectedValues: filters, limit: 1000 });
  }, [userId, filters]);

  const { data, isLoading, error } = useQuery(query, { dataCache: defaultCache, skip: !query });
  const objs = useMemo(() => {
    const objs = parseQueryResponse<DataTopApps>(data, query.columns);
    return objs;
  }, [data, query]);

  const pivotedData = useMemo<DataTopAppsPivoted[]>(() => {
    if (!objs || !objs.length) {
      return [];
    }
    const aggs: Record<string, DataTopAppsPivoted> = {};
    const warehouseTotals: Record<string, number> = {};
    let maxCredits = 0;
    let maxCount = 0;
    objs.forEach((obj) => {
      const key = obj.application || "";
      const wh = obj.warehouse_name || "";
      let agg = aggs[key];
      if (!agg) {
        agg = aggs[key] = {
          application: key,
          count: 0,
          query_credits_used: 0,
          warehouse_credits: {},
          warehouse_perc: {},
          warehouse_list: [],
          warehouse_count: {},
          warehouse_count_perc: {},
        };
      }
      agg.count += obj.count || 0;
      agg.query_credits_used += obj.query_credits_used || 0;
      if (!agg.warehouse_credits[wh]) {
        agg.warehouse_credits[wh] = obj.query_credits_used || 0;
      } else {
        agg.warehouse_credits[wh] += obj.query_credits_used || 0;
      }
      if (!agg.warehouse_count[wh]) {
        agg.warehouse_count[wh] = obj.count || 0;
      } else {
        agg.warehouse_count[wh] += obj.count || 0;
      }
      if (warehouseTotals[wh]) {
        warehouseTotals[wh] += obj.query_credits_used || 0;
      } else {
        warehouseTotals[wh] = obj.query_credits_used || 0;
      }
      if (agg.query_credits_used > maxCredits) {
        maxCredits = agg.query_credits_used;
      }
      if (agg.count > maxCount) {
        maxCount = agg.count;
      }
    });

    // get the sorted list of warehouses by cost
    const warehouseList = Object.entries(warehouseTotals)
      .sort((a, b) => descending(a[1], b[1]))
      .map((o) => o[0]);
    // get the values from the aggregated object
    const values = Object.values(aggs);
    // add the percents and warehouse list to each row
    values.forEach((obj) => {
      Object.entries(obj.warehouse_credits).forEach(([wid, credits]) => {
        obj.warehouse_perc[wid] = div0(credits, maxCredits);
      });
      Object.entries(obj.warehouse_count).forEach(([wid, count]) => {
        obj.warehouse_count_perc[wid] = div0(count, maxCount);
      });
      obj.warehouse_list = warehouseList;
    });
    return values.sort(alphaSorter("query_credits_used", true));
  }, [objs]);

  return (
    <Box className="p-2">
      <div className="text-center">Top Applications</div>
      <div className="relative mt-1 min-h-20">
        {isLoading && <LoadingFitParent />}
        {!objs.length && <div>No Matching Data</div>}
        {objs.length > 0 && (
          <div>
            <div className="max-h-80 w-min overflow-auto">
              <Table<DataTopAppsPivoted>
                data={pivotedData}
                columns={cols}
                getTRClass={basicTableTR}
              />
            </div>
          </div>
        )}
      </div>

      {error && <ErrorMessage error={error} message="Unable to Load Data" />}
    </Box>
  );
}
