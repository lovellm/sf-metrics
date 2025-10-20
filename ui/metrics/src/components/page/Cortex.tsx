import useAppState from "@/context/useAppState";
import FilterPanel from "../filters/FilterPanel";
import Box from "../basic/Box";
import { LocalStorageKeys } from "@/constants";
import { useCallback, useMemo } from "react";
import { SelectedValues } from "@/types/filterTypes";
import { aiFilterPanel } from "../filters/filterConfig";
import {
  CortexSearchService,
  CortexTotals,
  specForCortexSearch,
  specForCortexTotals,
} from "@/specs/cortexSpecs";
import { defaultCache } from "@/data/dataCache";
import ErrorMessage from "../basic/ErrorMessage";
import LoadingFitParent from "../basic/LoadingFitParent";
import { formatCreditCostDefault, formatInteger } from "@/utils/formatters";
import TableLocalSort from "../table/TableLocalSort";
import { SortableTableColumn } from "../table/SortableHeader";
import { getDateStringForUnknown } from "@/utils/dates";
import { useQuery } from "@/hooks/useApiData";
import parseQueryResponse from "@/utils/parseQueryResponse";

const summaryColumns: SortableTableColumn<CortexTotals>[] = [
  { accessor: "function_name", Header: "Function", width: 120, sortable: true },
  {
    accessor: "model_name",
    Header: "Model",
    width: 220,
    sortable: true,
  },
  {
    accessor: "credits",
    Header: "Credit Cost",
    width: 140,
    format: formatCreditCostDefault,
    sortable: true,
  },
  {
    accessor: "tokens",
    Header: "Total Tokens",
    width: 140,
    format: formatInteger,
    sortable: true,
  },
  {
    accessor: "first_date",
    Header: "First Used",
    width: 120,
    format: getDateStringForUnknown,
  },
  {
    accessor: "last_date",
    Header: "Last Used",
    width: 120,
    format: getDateStringForUnknown,
  },
];

const searchColumns: SortableTableColumn<CortexSearchService>[] = [
  {
    accessor: "database_name",
    Header: "DB",
    width: 100,
    sortable: true,
  },
  {
    accessor: "schema_name",
    Header: "Schema",
    width: 110,
    sortable: true,
  },
  {
    accessor: "service_name",
    Header: "Service Name",
    width: 160,
    sortable: true,
  },
  {
    accessor: "consumption_type",
    Header: "Consumption Type",
    width: 160,
    sortable: true,
  },
  {
    accessor: "model_name",
    Header: "Model",
    width: 220,
    sortable: true,
  },
  {
    accessor: "credits",
    Header: "Credit Cost",
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

export default function Cortex() {
  const [{ isFiltersOpen, filters }, dispatch] = useAppState();

  /** dispatch setFilters action wrapped in a callback */
  const applyFilters = useCallback(
    (nextFilters?: SelectedValues) => {
      dispatch({ type: "setFilters", payload: nextFilters });
    },
    [dispatch],
  );

  const summaryQuery = useMemo(() => {
    return specForCortexTotals(filters);
  }, [filters]);
  const {
    data: summaryData,
    isLoading: summaryIsLoading,
    error: summaryError,
  } = useQuery(summaryQuery, {
    dataCache: defaultCache,
    skip: !filters,
  });
  const objs = useMemo(() => {
    const objs = parseQueryResponse<CortexTotals>(summaryData, summaryQuery.columns);
    return objs;
  }, [summaryData, summaryQuery]);

  const searchQuery = useMemo(() => {
    return specForCortexSearch(filters);
  }, [filters]);
  const {
    data: searchData,
    isLoading: searchIsLoading,
    error: searchError,
  } = useQuery(searchQuery, {
    dataCache: defaultCache,
    skip: !filters,
  });
  const searchObjs = useMemo(() => {
    const objs = parseQueryResponse<CortexTotals>(searchData, searchQuery.columns);
    return objs;
  }, [searchData, searchQuery]);

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
            config={aiFilterPanel}
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
        <Box className="p-2">
          <div className="flex items-center gap-x-2 text-left text-lg">
            Cortex Summary by Model and Function
          </div>
          <div className="relative mt-1 min-h-20">
            {summaryIsLoading && <LoadingFitParent>Loading Summary</LoadingFitParent>}
            <TableLocalSort<CortexTotals> data={objs} columns={summaryColumns} fullWidth />
          </div>
        </Box>
        <Box className="p-2">
          <div className="flex items-center gap-x-2 text-left text-lg">Cortex Search Summary</div>
          <div className="relative mt-1 min-h-20">
            {searchIsLoading && <LoadingFitParent>Loading Search Summary</LoadingFitParent>}
            <TableLocalSort<CortexSearchService>
              data={searchObjs}
              columns={searchColumns}
              pageSize={30}
              multiSort
              fullWidth
            />
          </div>
        </Box>
      </div>
      {summaryError && <ErrorMessage error={summaryError} message="Error Retrieving Totals" />}
      {searchError && (
        <ErrorMessage error={searchError} message="Error Retrieving Search Summary" />
      )}
    </div>
  );
}
