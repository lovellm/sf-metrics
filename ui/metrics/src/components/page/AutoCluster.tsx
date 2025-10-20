import useAppState from "@/context/useAppState";
import FilterPanel from "../filters/FilterPanel";
import Box from "../basic/Box";
import {
  basicTable,
  basicTableCell,
  basicTableHeader,
  basicTableTR,
  LocalStorageKeys,
} from "@/constants";
import { useCallback, useMemo, useState } from "react";
import { SelectedValues } from "@/types/filterTypes";
import { materializedViewFilters } from "../filters/filterConfig";
import { defaultCache } from "@/data/dataCache";
import ErrorMessage from "../basic/ErrorMessage";
import LoadingFitParent from "../basic/LoadingFitParent";
import {
  bytesToGbString,
  formatCreditCost,
  formatCreditCostDefault,
  formatInteger,
  formatMillions,
} from "@/utils/formatters";
import TableLocalSort from "../table/TableLocalSort";
import { SortableTableColumn } from "../table/SortableHeader";
import { getAllPeriods, PeriodType } from "@/utils/dates";
import { useQuery } from "@/hooks/useApiData";
import parseQueryResponse from "@/utils/parseQueryResponse";
import HttpRequest from "@/data/HttpRequest";
import aggregateByDate from "@/utils/aggregateByDate";
import Dropdown, { DropdownOption } from "../basic/Dropdown";
import ChartCategoryStack from "../charts/ChartCategoryStack";
import { alphaSorter, basicSorter } from "@/utils/sorters";
import { CategoryData, minAndMax } from "@/utils/chartUtils";
import {
  ACDetailData,
  ACTrendData,
  specForACDetail,
  specForACTrend,
} from "@/specs/autoClusterSpecs";

const acColumns: SortableTableColumn<ACDetailData>[] = [
  {
    accessor: "database_name",
    Header: "Database",
    width: 140,
    sortable: true,
  },
  {
    accessor: "schema_name",
    Header: "Schema",
    width: 140,
    sortable: true,
  },
  {
    accessor: "table_name",
    Header: "View",
    width: 140,
    sortable: true,
  },
  {
    accessor: "credits_used",
    Header: "Credit Cost",
    width: 120,
    format: formatCreditCostDefault,
    sortable: true,
  },
  {
    accessor: "avg_credits_used",
    Header: "Avg Credit Cost",
    width: 120,
    format: formatCreditCostDefault,
    sortable: true,
  },
  {
    accessor: "count",
    Header: "Times Refreshed",
    width: 120,
    format: formatInteger,
    sortable: true,
  },
  {
    accessor: "num_bytes_reclustered",
    Header: "Avg GB Reclustered",
    width: 120,
    format: bytesToGbString,
    sortable: true,
  },
  {
    accessor: "num_rows_reclustered",
    Header: "Avg Rows Reclustered",
    width: 120,
    format: formatInteger,
    sortable: true,
  },
];

const periodTypeOptions: DropdownOption[] = [
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "day", label: "Day" },
];

const request = new HttpRequest({ timeout: 90000 });

export default function AutoCluster() {
  const [{ isFiltersOpen, filters }, dispatch] = useAppState();
  const [periodType, setPeriodType] = useState<PeriodType>(PeriodType.week);

  /** dispatch setFilters action wrapped in a callback */
  const applyFilters = useCallback(
    (nextFilters?: SelectedValues) => {
      dispatch({ type: "setFilters", payload: nextFilters });
    },
    [dispatch],
  );

  const detailQuery = useMemo(() => {
    return specForACDetail(filters);
  }, [filters]);
  const {
    data: detailData,
    isLoading: detailIsLoading,
    error: detailError,
  } = useQuery(detailQuery, {
    dataCache: defaultCache,
    skip: !filters,
    httpRequest: request,
  });
  const detailObjs = useMemo(() => {
    const objs = parseQueryResponse<ACDetailData>(detailData, detailQuery.columns);
    return objs;
  }, [detailData, detailQuery]);

  const trendQuery = useMemo(() => {
    return specForACTrend(filters);
  }, [filters]);
  const {
    data: trendData,
    isLoading: trendIsLoading,
    error: trendError,
  } = useQuery(trendQuery, {
    dataCache: defaultCache,
    skip: !filters,
    httpRequest: request,
  });
  const trendObjs = useMemo(() => {
    const objs = parseQueryResponse<ACTrendData>(trendData, trendQuery.columns);
    const agg = aggregateByDate<ACTrendData>(objs, "logdate", periodType, trendQuery.columns);
    return agg;
  }, [trendData, trendQuery, periodType]);

  /** all dates for the selected period type between first and last in the data */
  const allDates = useMemo<string[] | undefined>(() => {
    if (!trendObjs) {
      return undefined;
    }
    const [min, max] = minAndMax<string>("logdate", trendObjs);
    return getAllPeriods(periodType, min, max);
  }, [trendObjs, periodType]);

  return (
    <div className="grid grid-cols-12 gap-3 p-2">
      {/* Filters */}
      <div
        className={
          isFiltersOpen
            ? "col-span-12 md:col-span-4 lg:col-span-3 xl:col-span-3"
            : "col-span-12 sm:col-span-1 sm:w-12"
        }
      >
        <Box className="sticky top-0">
          <FilterPanel
            config={materializedViewFilters}
            localStorageKey={LocalStorageKeys.filters}
            onApply={applyFilters}
          />
          {isFiltersOpen && (
            <div className="mb-2 px-2 text-sm">
              If no query date is selected, it will default to the start of previous month
            </div>
          )}
        </Box>
      </div>
      {/* Main Area */}
      <div
        className={
          "flex flex-col gap-y-2 " +
          (isFiltersOpen
            ? "col-span-12 md:col-span-8 lg:col-span-9 xl:col-span-9"
            : "col-span-12 sm:col-span-11 lg:-ml-8 xl:-ml-16")
        }
      >
        {/* Comment Text */}
        <Box className="p-2">
          <div className="pl-2">The query for this data is slow. Please be patient.</div>
        </Box>
        {/* Trend Chart */}
        <Box className="p-2">
          <div className="flex items-center gap-x-2 text-left text-lg">
            Automatic Clustering Cost Trend
          </div>
          <div className="relative mt-1 min-h-20">
            {trendIsLoading && <LoadingFitParent>Loading Data</LoadingFitParent>}
            {trendObjs?.length ? (
              <ChartCategoryStack
                data={trendObjs}
                categoryField="logdate"
                y1Field="credits_used"
                y1Label="Cost in Dollars"
                y1Format={formatCreditCost}
                stackField="database_name"
                categoryList={allDates}
                categorySorter={basicSorter}
                legendLimit={3}
                hoverContent={HoverContent}
              />
            ) : (
              <div>No data for current filters</div>
            )}
            <div className="mt-2">
              <div className="flex items-center gap-x-2">
                Show By
                <Dropdown value={periodType} onSelect={setPeriodType} options={periodTypeOptions} />
              </div>
            </div>
          </div>
        </Box>
        {/* Details Table */}
        <Box className="p-2">
          <div className="flex items-center gap-x-2 text-left text-lg">
            Automatic Clustering Cost by Table
          </div>
          <div className="relative mt-1 min-h-20">
            {detailIsLoading && <LoadingFitParent>Loading Data</LoadingFitParent>}
            <div className="max-h-80 overflow-auto">
              <TableLocalSort<ACDetailData>
                data={detailObjs}
                columns={acColumns}
                pageSize={30}
                multiSort
                fullWidth
              />
            </div>
          </div>
        </Box>
      </div>
      {trendError && <ErrorMessage error={trendError} message="Error Retrieving Trend Data" />}
      {detailError && <ErrorMessage error={detailError} message="Error Retrieving Detail Table" />}
    </div>
  );
}

const HoverContent = (category: string, data?: CategoryData) => {
  let total = 0;
  let total2 = 0;
  let total3 = 0;
  return (
    <Box className="p-2">
      <div className="mb-1 font-bold">{category}</div>
      {data?.length ? (
        <table className={basicTable}>
          <thead>
            <tr>
              <td className={basicTableHeader}>Database</td>
              <td className={basicTableHeader}>Cost</td>
              <td className={basicTableHeader}>GB</td>
              <td className={basicTableHeader}>Million Rows</td>
            </tr>
          </thead>
          <tbody>
            {data?.sort(alphaSorter("credits_used", true)).map((row, i) => {
              const typed = row as ACTrendData;
              total += typed.credits_used || 0;
              total2 += typed.num_bytes_reclustered || 0;
              total3 += typed.num_rows_reclustered || 0;
              return (
                <tr className={basicTableTR} key={i}>
                  <td className={basicTableCell}>{typed.database_name}</td>
                  <td className={basicTableCell}>{formatCreditCost(typed.credits_used)}</td>
                  <td className={basicTableCell}>{bytesToGbString(typed.num_bytes_reclustered)}</td>
                  <td className={basicTableCell}>{formatMillions(typed.num_rows_reclustered)}</td>
                </tr>
              );
            })}
            {data.length > 1 && (
              <tr className={basicTableTR}>
                <td className={basicTableCell + " font-bold"}>Total</td>
                <td className={basicTableCell + " font-bold"}>{formatCreditCost(total)}</td>
                <td className={basicTableCell + " font-bold"}>{bytesToGbString(total2)}</td>
                <td className={basicTableCell + " font-bold"}>{formatMillions(total3)}</td>
              </tr>
            )}
          </tbody>
        </table>
      ) : (
        <div>No Data</div>
      )}
    </Box>
  );
};
