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
import { computePoolFilters } from "../filters/filterConfig";
import { defaultCache } from "@/data/dataCache";
import ErrorMessage from "../basic/ErrorMessage";
import LoadingFitParent from "../basic/LoadingFitParent";
import { formatCreditCost, formatCreditCostDefault } from "@/utils/formatters";
import TableLocalSort from "../table/TableLocalSort";
import { SortableTableColumn } from "../table/SortableHeader";
import { getAllPeriods, getDateStringForUnknown, PeriodType } from "@/utils/dates";
import { useQuery } from "@/hooks/useApiData";
import parseQueryResponse from "@/utils/parseQueryResponse";
import HttpRequest from "@/data/HttpRequest";
import aggregateByDate from "@/utils/aggregateByDate";
import Dropdown, { DropdownOption } from "../basic/Dropdown";
import ChartCategoryStack from "../charts/ChartCategoryStack";
import { alphaSorter, basicSorter } from "@/utils/sorters";
import { CategoryData, minAndMax } from "@/utils/chartUtils";
import { ComputePoolData, specForComputePool } from "@/specs/computePoolSpecs";

const computePoolColumns: SortableTableColumn<ComputePoolData>[] = [
  {
    accessor: "logdate",
    Header: "Date",
    width: 100,
    sortable: true,
    format: getDateStringForUnknown,
  },
  {
    accessor: "compute_pool_name",
    Header: "Compute Pool",
    width: 140,
    sortable: true,
  },
  {
    accessor: "credits_used",
    Header: "Cost",
    width: 140,
    format: formatCreditCostDefault,
    sortable: true,
  },
];

const periodTypeOptions: DropdownOption[] = [
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "day", label: "Day" },
];

const request = new HttpRequest({ timeout: 90000 });

export default function ComputePools() {
  const [{ isFiltersOpen, filters }, dispatch] = useAppState();
  const [periodType, setPeriodType] = useState<PeriodType>(PeriodType.week);

  /** dispatch setFilters action wrapped in a callback */
  const applyFilters = useCallback(
    (nextFilters?: SelectedValues) => {
      dispatch({ type: "setFilters", payload: nextFilters });
    },
    [dispatch],
  );

  const query = useMemo(() => {
    return specForComputePool(filters);
  }, [filters]);
  const {
    data: data,
    isLoading: isLoading,
    error: error,
  } = useQuery(query, {
    dataCache: defaultCache,
    skip: !filters,
    httpRequest: request,
  });
  const { objs, agg } = useMemo(() => {
    const objs = parseQueryResponse<ComputePoolData>(data, query.columns);
    const agg = aggregateByDate<ComputePoolData>(objs, "logdate", periodType, query.columns);
    return { objs, agg };
  }, [data, query, periodType]);

  /** all dates for the selected period type between first and last in the data */
  const allDates = useMemo<string[] | undefined>(() => {
    if (!agg) {
      return undefined;
    }
    const [min, max] = minAndMax<string>("logdate", agg);
    return getAllPeriods(periodType, min, max);
  }, [agg, periodType]);

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
            config={computePoolFilters}
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
        {/* Trend Chart */}
        <Box className="p-2">
          <div className="flex items-center gap-x-2 text-left text-lg">
            Compute Pool Cost Over Time
          </div>
          <div className="relative mt-1 min-h-20">
            {isLoading && <LoadingFitParent>Loading Data</LoadingFitParent>}
            {agg?.length ? (
              <ChartCategoryStack
                data={agg}
                categoryField="logdate"
                y1Field="credits_used"
                y1Label="Cost in Dollars"
                y1Format={formatCreditCost}
                stackField="compute_pool_name"
                categoryList={allDates}
                categorySorter={basicSorter}
                legendLimit={6}
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
        {/* Table */}
        <Box className="p-2">
          <div className="flex items-center gap-x-2 text-left text-lg">Compute Pool Table</div>
          <div className="relative mt-1 min-h-20">
            {isLoading && <LoadingFitParent>Loading Data</LoadingFitParent>}
            <div className="max-h-80 overflow-auto">
              <TableLocalSort<ComputePoolData>
                data={objs}
                columns={computePoolColumns}
                pageSize={30}
                multiSort
                fullWidth
              />
            </div>
          </div>
        </Box>
      </div>
      {error && <ErrorMessage error={error} message="Error Retrieving Totals" />}
    </div>
  );
}

const HoverContent = (category: string, data?: CategoryData) => {
  let total = 0;
  return (
    <Box className="p-2">
      <div className="mb-1 font-bold">{category}</div>
      {data?.length ? (
        <table className={basicTable}>
          <thead>
            <tr>
              <td className={basicTableHeader}>Compute Pool</td>
              <td className={basicTableHeader}>Cost</td>
            </tr>
          </thead>
          <tbody>
            {data?.sort(alphaSorter("credits_used", true)).map((row, i) => {
              const typed = row as ComputePoolData;
              total += typed.credits_used || 0;
              return (
                <tr className={basicTableTR} key={i}>
                  <td className={basicTableCell}>{typed.compute_pool_name}</td>
                  <td className={basicTableCell}>{formatCreditCost(typed.credits_used)}</td>
                </tr>
              );
            })}
            {data.length > 1 && (
              <tr className={basicTableTR}>
                <td className={basicTableCell + " font-bold"}>Total</td>
                <td className={basicTableCell + " font-bold"}>{formatCreditCost(total)}</td>
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
