import { useCallback, useMemo } from "react";
import {
  alphaSorter,
  basicSorter,
  ErrorMessage,
  LoadingFitParent,
  parseQueryResponse,
} from "@spcs-apps/data-utils";
import { Box, Dropdown } from "@spcs-apps/page-parts";
import useAppState from "@/context/useAppState";
import {
  basicTable,
  basicTableCell,
  basicTableHeader,
  basicTableTR,
  LocalStorageKeys,
} from "@/constants";
import { SelectedValues } from "@/types/filterTypes";
import { defaultCache } from "@/data/dataCache";
import {
  formatCreditCost,
  formatCreditCostDefault,
  formatInteger,
  formatMillions,
} from "@/utils/formatters";
import { useQuery } from "@spcs-apps/data-utils";
import FilterPanel from "../filters/FilterPanel";
import { cortexCodeFilterPanel } from "../filters/filterConfig";
import TableLocalSort from "../table/TableLocalSort";
import { SortableTableColumn } from "../table/SortableHeader";
import {
  CortexCodeTrendData,
  CortexCodeUserData,
  specForCortexCodeTrend,
  specForCortexCodeUser,
} from "@/specs/cortexCode";
import ChartCategoryStack from "../charts/ChartCategoryStack";
import { CategoryData, minAndMax } from "@/utils/chartUtils";
import { getAllPeriods, getDateStringForUnknown } from "@/utils/dates";
import { TaskWarehouseData } from "@/specs/taskSpecs";
import aggregateByDate from "@/utils/aggregateByDate";
import usePeriodTypes from "@/hooks/usePeriodTypes";

const userColumns: SortableTableColumn<CortexCodeUserData>[] = [
  {
    accessor: "user_name",
    Header: "User Id",
    width: 100,
    sortable: true,
  },
  {
    accessor: "display_name",
    Header: "User",
    width: 150,
    sortable: true,
  },
  {
    accessor: "token_credits",
    Header: "Total Cost",
    width: 120,
    format: formatCreditCostDefault,
    sortable: true,
  },
  {
    accessor: "cli_token_credits",
    Header: "CLI Cost",
    width: 120,
    format: formatCreditCostDefault,
    sortable: true,
  },
  {
    accessor: "snowsight_token_credits",
    Header: "Snowsight Cost",
    width: 120,
    format: formatCreditCostDefault,
    sortable: true,
  },
  {
    accessor: "tokens",
    Header: "Total Tokens",
    width: 120,
    format: formatInteger,
    sortable: true,
  },
];

export default function CortexCode() {
  const [{ isFiltersOpen, filters }, dispatch] = useAppState();
  const { periodType, periodTypeOptions, setPeriodType } = usePeriodTypes();

  /** dispatch setFilters action wrapped in a callback */
  const applyFilters = useCallback(
    (nextFilters?: SelectedValues) => {
      dispatch({ type: "setFilters", payload: nextFilters });
    },
    [dispatch],
  );

  // Trend Data
  const trendQuery = useMemo(() => {
    return specForCortexCodeTrend(filters);
  }, [filters]);
  const {
    data: trendData,
    isLoading: trendIsLoading,
    error: trendError,
  } = useQuery(trendQuery, {
    dataCache: defaultCache,
    skip: !filters,
  });
  const trendObjs = useMemo(() => {
    const objs = parseQueryResponse<CortexCodeTrendData>(trendData, trendQuery.columns);
    return objs;
  }, [trendData, trendQuery]);

  // User Summary
  const userQuery = useMemo(() => {
    return specForCortexCodeUser(filters);
  }, [filters]);
  const {
    data: userData,
    isLoading: userIsLoading,
    error: userError,
  } = useQuery(userQuery, {
    dataCache: defaultCache,
    skip: !filters,
  });
  const userObjs = useMemo(() => {
    const objs = parseQueryResponse<CortexCodeUserData>(userData, userQuery.columns);
    return objs;
  }, [userData, userQuery]);

  /** aggregated trendObjs based on the period selection */
  const aggObjs = useMemo(() => {
    const agg = aggregateByDate<TaskWarehouseData>(
      trendObjs,
      "logdate",
      periodType,
      trendQuery?.columns,
    );
    return agg;
  }, [trendObjs, trendQuery, periodType]);
  /** all dates for the selected period type between first and last in the data */
  const allDates = useMemo<string[] | undefined>(() => {
    if (!aggObjs) {
      return undefined;
    }
    const [min, max] = minAndMax<string>("logdate", aggObjs);
    return getAllPeriods(periodType, min, max);
  }, [aggObjs, periodType]);

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
            config={cortexCodeFilterPanel}
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
          <div className="flex items-center gap-x-2 text-left text-lg">Cortex Code Cost Trend</div>
          <div className="relative mt-1 min-h-20 max-h-96 overflow-auto">
            {trendIsLoading && <LoadingFitParent>Loading Trend Data</LoadingFitParent>}
            <ChartCategoryStack
              data={aggObjs}
              categoryField="logdate"
              y1Field="token_credits"
              y1Label="Cost in Dollars"
              y1Format={formatCreditCost}
              y2Field="tokens"
              y2Label="Tokens (Millions)"
              y2Format={formatMillions}
              stackField="method"
              categoryList={allDates}
              categorySorter={basicSorter}
              categoryFormatter={getDateStringForUnknown}
              legendLimit={2}
              hoverContent={HoverContent}
            />
            <div className="mt-2">
              <div className="flex items-center gap-x-2">
                Show By
                <Dropdown value={periodType} onSelect={setPeriodType} options={periodTypeOptions} />
              </div>
            </div>
          </div>
          {trendError && <ErrorMessage error={trendError} message="Error Retrieving Trend Data" />}
        </Box>
        {/* By User */}
        <Box className="p-2">
          <div className="flex items-center gap-x-2 text-left text-lg">
            Cortex Code Cost by User
          </div>
          <div className="relative mt-1 min-h-20 max-h-96 overflow-auto">
            {userIsLoading && <LoadingFitParent>Loading User Summary</LoadingFitParent>}
            <TableLocalSort<CortexCodeUserData>
              data={userObjs}
              columns={userColumns}
              pageSize={30}
              multiSort
              fullWidth
            />
          </div>
          {userError && <ErrorMessage error={userError} message="Error Retrieving User Summary" />}
        </Box>
      </div>
    </div>
  );
}

const HoverContent = (category: string, data?: CategoryData) => {
  let totalCredits = 0;
  let totalTokens = 0;
  return (
    <Box className="p-2">
      <div className="mb-1 font-bold">{getDateStringForUnknown(category)}</div>
      {data?.length ? (
        <table className={basicTable}>
          <thead>
            <tr>
              <td className={basicTableHeader}>Method of Use</td>
              <td className={basicTableHeader}>Cost (Dollars)</td>
              <td className={basicTableHeader}>Tokens (Millions)</td>
            </tr>
          </thead>
          <tbody>
            {data?.sort(alphaSorter("token_credits", true)).map((row, i) => {
              const typed = row as CortexCodeTrendData;
              totalCredits += typed.token_credits || 0;
              totalTokens += typed.tokens || 0;
              return (
                <tr className={basicTableTR} key={i}>
                  <td className={basicTableCell}>{typed.method}</td>
                  <td className={basicTableCell}>{formatCreditCost(typed.token_credits)}</td>
                  <td className={basicTableCell}>{formatMillions(typed.tokens)}</td>
                </tr>
              );
            })}
            {data.length > 0 && (
              <tr className={basicTableTR}>
                <td className={basicTableCell + " font-bold"}>Total</td>
                <td className={basicTableCell + " font-bold"}>{formatCreditCost(totalCredits)}</td>
                <td className={basicTableCell + " font-bold"}>{formatMillions(totalTokens)}</td>
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
