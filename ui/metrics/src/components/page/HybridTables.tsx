import useAppState from "@/context/useAppState";
import FilterPanel from "../filters/FilterPanel";
import Box from "../basic/Box";
import { LocalStorageKeys } from "@/constants";
import { useCallback, useMemo, useState } from "react";
import { SelectedValues } from "@/types/filterTypes";
import { hybridTableFilters } from "../filters/filterConfig";
import { defaultCache } from "@/data/dataCache";
import ErrorMessage from "../basic/ErrorMessage";
import LoadingFitParent from "../basic/LoadingFitParent";
import {
  bytesToGb,
  bytesToGbString,
  format2Dec,
  formatCreditCost,
  formatCreditCostK,
  formatInteger,
} from "@/utils/formatters";
import TableLocalSort from "../table/TableLocalSort";
import { SortableTableColumn } from "../table/SortableHeader";
import { useQuery } from "@/hooks/useApiData";
import parseQueryResponse from "@/utils/parseQueryResponse";
import {
  HybridTableStorage,
  HybridTableUsage,
  specForHybridTableStorage,
  specForHybridTableUsage,
} from "@/specs/hybridTableSpecs";
import getData from "@/data/getData";
import { DataResult } from "@/types/dataApi";
import { getAllPeriods, PeriodType } from "@/utils/dates";
import Dropdown, { DropdownOption } from "../basic/Dropdown";
import { CategoryData, minAndMax } from "@/utils/chartUtils";
import ChartCategoryStack from "../charts/ChartCategoryStack";
import { basicSorter } from "@/utils/sorters";
import aggregateByDate from "@/utils/aggregateByDate";
import { getApiUrlForEndpoint } from "@/data/apiConstants";
import HttpRequest from "@/data/HttpRequest";

const storageCost = (x: unknown) => {
  return "$" + format2Dec(bytesToGb(x) * 0.34);
};

const hybridTableColumns: SortableTableColumn<HybridTableStorage>[] = [
  {
    accessor: "database_name",
    Header: "DB",
    width: 130,
    sortable: true,
  },
  {
    accessor: "schema_name",
    Header: "Schema",
    width: 130,
    sortable: true,
  },
  {
    accessor: "name",
    Header: "Table Name",
    width: 160,
    sortable: true,
  },
  {
    accessor: "row_count",
    Header: "Row Count",
    width: 160,
    format: formatInteger,
    sortable: true,
  },
  {
    accessor: "bytes",
    Header: "GB",
    width: 160,
    format: bytesToGbString,
    sortable: true,
  },
  {
    key: "cost",
    accessor: "bytes",
    Header: "Cost (Dollars)",
    width: 160,
    format: storageCost,
    sortable: true,
  },
];

const periodTypeOptions: DropdownOption[] = [
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "day", label: "Day" },
];

const request = new HttpRequest({ timeout: 90000 });

export default function HybridTables() {
  const [{ isFiltersOpen, filters }, dispatch] = useAppState();
  const [periodType, setPeriodType] = useState<PeriodType>(PeriodType.week);
  const [storageObjs, setStorageObjs] = useState<HybridTableStorage[]>([]);
  const [storageIsLoading, setStorageIsLoading] = useState(false);
  const [storageError, setStorageError] = useState<Error | undefined>(undefined);

  /** dispatch setFilters action wrapped in a callback */
  const applyFilters = useCallback(
    (nextFilters?: SelectedValues) => {
      dispatch({ type: "setFilters", payload: nextFilters });
    },
    [dispatch],
  );

  const usageHistoryQuery = useMemo(() => {
    return specForHybridTableUsage(filters);
  }, [filters]);
  const {
    data: usageData,
    isLoading: usageIsLoading,
    error: usageError,
  } = useQuery(usageHistoryQuery, {
    dataCache: defaultCache,
    skip: !filters,
  });
  const usageObjs = useMemo(() => {
    const objs = parseQueryResponse<HybridTableUsage>(usageData, usageHistoryQuery.columns);
    const agg = aggregateByDate<HybridTableUsage>(
      objs,
      "logdate",
      periodType,
      usageHistoryQuery.columns,
    );
    return agg;
  }, [usageData, usageHistoryQuery, periodType]);

  /** all dates for the selected period type between first and last in the data */
  const allDates = useMemo<string[] | undefined>(() => {
    if (!usageObjs) {
      return undefined;
    }
    const [min, max] = minAndMax<string>("logdate", usageObjs);
    return getAllPeriods(periodType, min, max);
  }, [usageObjs, periodType]);
  const totalConsumption = useMemo(() => {
    return usageObjs ? usageObjs.reduce((total, row) => total + (row.credits_used || 0), 0) : 0;
  }, [usageObjs]);

  /** get storage data when the button is clicked */
  const getStorageData = async () => {
    if (storageIsLoading) {
      return;
    }
    setStorageIsLoading(true);
    const storageQuery = specForHybridTableStorage({});
    const storageData = await getData<DataResult>(getApiUrlForEndpoint("query"), request, {
      postData: storageQuery,
      skip: !filters,
      dataCache: defaultCache,
    });
    const objs = parseQueryResponse<HybridTableStorage>(storageData, storageQuery.columns);
    setStorageObjs(objs);
    setStorageIsLoading(false);
  };

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
            config={hybridTableFilters}
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
        {/* Consumption Cost */}
        <Box className="p-2">
          <div className="flex items-center gap-x-4 text-left text-lg">
            Consumption Credits Over Time
            <div className="font-bold">Total: {formatCreditCost(totalConsumption)}</div>
          </div>
          <div className="relative mt-1 min-h-20">
            {usageIsLoading && <LoadingFitParent>Loading Consumption Credits</LoadingFitParent>}
            {usageObjs.length > 0 && (
              <ChartCategoryStack
                data={usageObjs}
                categoryField="logdate"
                y1Field="credits_used"
                y1Label="Cost in Dollars"
                y1Format={formatCreditCostK}
                // stackField="warehouse_name"
                categoryList={allDates}
                categorySorter={basicSorter}
                hoverContent={UsageTrendHover}
                legendLimit={0}
              />
            )}
          </div>
          <div className="mt-2">
            <div className="flex items-center gap-x-2">
              Show By
              <Dropdown value={periodType} onSelect={setPeriodType} options={periodTypeOptions} />
            </div>
          </div>
        </Box>
        {/* Storage Cost */}
        <Box className="p-2">
          <div className="flex items-center gap-x-2 text-left text-lg">Storage Cost by Table</div>
          <div className="relative mt-1 min-h-20">
            <div className="my-2 flex flex-row items-center gap-x-2">
              <button
                className="btn-main rounded-full px-2 py-1 font-bold"
                type="button"
                disabled={storageIsLoading}
                onClick={() => {
                  getStorageData().catch((e) => {
                    setStorageIsLoading(false);
                    setStorageError(e as Error);
                  });
                }}
              >
                Load Data
              </button>
              <div>
                This data will not load until you click the button. It can take a while, be patient.
              </div>
            </div>
            {storageIsLoading && <LoadingFitParent>Loading Storage Cost</LoadingFitParent>}
            <div className="max-h-80 overflow-auto">
              <TableLocalSort<HybridTableStorage>
                data={storageObjs}
                columns={hybridTableColumns}
                pageSize={30}
                multiSort
                fullWidth
              />
            </div>
          </div>
        </Box>
      </div>
      {usageError && <ErrorMessage error={usageError} message="Error Retrieving Totals" />}
      {storageError && (
        <ErrorMessage
          error={storageError}
          message="Error Retrieving Search Summary"
          onClose={() => setStorageError(undefined)}
        />
      )}
    </div>
  );
}

const UsageTrendHover = (category: string, data?: CategoryData) => {
  return (
    <Box className="p-2">
      <div className="mb-1 font-bold">{category}</div>
      {data?.length ? (
        <div>
          {data?.map((row) => {
            const typed = row as HybridTableUsage;
            return formatCreditCost(typed.credits_used);
          })}
        </div>
      ) : (
        <div>No Data</div>
      )}
    </Box>
  );
};
