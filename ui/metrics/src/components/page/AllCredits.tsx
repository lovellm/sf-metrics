import { useCallback, useMemo, useState } from "react";
import { Box, Dropdown, DropdownOption } from "@spcs-apps/page-parts";
import {
  ErrorMessage,
  LoadingFitParent,
  alphaSorter,
  basicSorter,
  parseQueryResponse,
  HttpRequest,
} from "@spcs-apps/data-utils";
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
  COST_PER_CREDIT,
  formatCreditCost,
  formatCreditCostAbs,
  formatCreditCostDefault,
  formatCreditCostK,
} from "@/utils/formatters";
import { getAllPeriods, getDateStringForUnknown, PeriodType } from "@/utils/dates";
import { useQuery } from "@spcs-apps/data-utils";
import { AllCreditsData, specForAllCredits } from "@/specs/allCreditSpecs";
import aggregateByDate from "@/utils/aggregateByDate";
import { CategoryData, minAndMax } from "@/utils/chartUtils";
import ChartCategoryStack from "../charts/ChartCategoryStack";
import { allCreditsFilters } from "../filters/filterConfig";
import FilterPanel from "../filters/FilterPanel";
import TableLocalSort from "../table/TableLocalSort";
import { SortableTableColumn } from "../table/SortableHeader";

const allCreditColumns: SortableTableColumn<AllCreditsData>[] = [
  {
    accessor: "usage_date",
    Header: "Date",
    width: 100,
    sortable: true,
    format: getDateStringForUnknown,
  },
  {
    accessor: "service_type",
    Header: "Service Type",
    width: 140,
    sortable: true,
  },
  {
    accessor: "credits_billed",
    Header: "Total Billed",
    width: 120,
    format: formatCreditCostDefault,
    sortable: true,
  },
  {
    accessor: "credits_used_compute",
    Header: "Compute Credit Cost",
    width: 120,
    format: formatCreditCostDefault,
    sortable: true,
  },
  {
    accessor: "cloud_services_billed",
    Header: "Cloud Services Billed (After Adjustment)",
    width: 140,
    format: formatCreditCostDefault,
    sortable: true,
  },
  {
    accessor: "credits_used_cloud_services",
    Header: "Cloud Services Before Adjustment",
    width: 140,
    format: formatCreditCostDefault,
    sortable: true,
  },
  {
    accessor: "credits_adjustment_cloud_services",
    Header: "Cloud Services Adjustment (10% Compute)",
    width: 140,
    format: formatCreditCostAbs,
    sortable: true,
  },
];

const periodTypeOptions: DropdownOption[] = [
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "day", label: "Day" },
];

const request = new HttpRequest({ timeout: 90000 });

export default function AllCredits() {
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
    return specForAllCredits(filters);
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
    const objs = parseQueryResponse<AllCreditsData>(data, query.columns);
    objs.forEach((obj) => {
      obj.cloud_services_billed =
        (obj.credits_used_cloud_services || 0) -
        Math.abs(obj.credits_adjustment_cloud_services || 0);
    });
    let agg = aggregateByDate<AllCreditsData>(objs, "usage_date", periodType, query.columns);
    const billedCloudServices: AllCreditsData[] = [];
    agg.forEach((row) => {
      if (row.service_type === "WAREHOUSE_METERING") {
        billedCloudServices.push({
          usage_date: row.usage_date,
          service_type: "BILLED_CLOUD_SERVICES",
          credits_billed:
            (row.credits_used_cloud_services || 0) -
            Math.abs(row.credits_adjustment_cloud_services || 0),
        });
        if (row.credits_billed && row.cloud_services_billed) {
          row.credits_billed -= row.cloud_services_billed;
        }
      }
    });
    agg = agg.concat(billedCloudServices);
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
            config={allCreditsFilters}
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
          <div className="list pl-2">
            <ul>
              <li>The query for this data is slow. Please be patient.</li>
              <li>Using ${COST_PER_CREDIT.cost} per credit for costs.</li>
              <li>
                This page only includes things billed in credits. Things billed in dollars, such as
                Storage, are not included.
              </li>
            </ul>
          </div>
        </Box>
        {/* Trend Chart */}
        <Box className="p-2">
          <div className="flex items-center gap-x-2 text-left text-lg">
            All Credits Billed Over Time
          </div>
          <div className="relative mt-1 min-h-20">
            {isLoading && <LoadingFitParent>Loading Data</LoadingFitParent>}
            {agg?.length ? (
              <ChartCategoryStack
                data={agg}
                categoryField="usage_date"
                y1Field="credits_billed"
                y1Label="Cost in Dollars"
                y1Format={formatCreditCostK}
                stackField="service_type"
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
        {/* Credits Table */}
        <Box className="p-2">
          <div className="flex items-center gap-x-2 text-left text-lg">All Credits Table</div>
          <div className="relative mt-1 min-h-20">
            {isLoading && <LoadingFitParent>Loading Data</LoadingFitParent>}
            <div className="max-h-80 overflow-auto">
              <TableLocalSort<AllCreditsData>
                data={objs}
                columns={allCreditColumns}
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
              <td className={basicTableHeader}>Service Type</td>
              <td className={basicTableHeader}>Cost</td>
            </tr>
          </thead>
          <tbody>
            {data?.sort(alphaSorter("credits_billed", true)).map((row, i) => {
              const typed = row as AllCreditsData;
              total += typed.credits_billed || 0;
              if ((typed.credits_billed || 0) < 1) {
                return undefined;
              }
              return (
                <tr className={basicTableTR} key={i}>
                  <td className={basicTableCell}>{typed.service_type}</td>
                  <td className={basicTableCell}>{formatCreditCost(typed.credits_billed)}</td>
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
      <div className="py-1 text-sm">Only showing services with at least 1 credit</div>
    </Box>
  );
};
