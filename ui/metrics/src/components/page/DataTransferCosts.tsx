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
import { bytesToGbString, bytesToTb, formatDollars, formatTo2Dec } from "@/utils/formatters";
import { useQuery } from "@spcs-apps/data-utils";
import FilterPanel from "../filters/FilterPanel";
import { dataTransferFilters } from "../filters/filterConfig";
import TableLocalSort from "../table/TableLocalSort";
import { SortableTableColumn } from "../table/SortableHeader";
import { DataTransferData, specForDataTransfer } from "@/specs/dataTransferSpecs";
import { getAllPeriods, getDateStringForUnknown } from "@/utils/dates";
import aggregateByDate from "@/utils/aggregateByDate";
import { CategoryData, minAndMax } from "@/utils/chartUtils";
import ChartCategoryStack from "../charts/ChartCategoryStack";
import usePeriodTypes from "@/hooks/usePeriodTypes";

const columns: SortableTableColumn<DataTransferData>[] = [
  {
    accessor: "logdate",
    Header: "Date",
    width: 100,
    format: getDateStringForUnknown,
    sortable: true,
  },
  {
    accessor: "source_cloud",
    Header: "Source Cloud",
    width: 150,
  },
  {
    accessor: "source_region",
    Header: "Source Region",
    width: 120,
  },
  {
    accessor: "target_cloud",
    Header: "Target Cloud",
    width: 120,
  },
  {
    accessor: "target_region",
    Header: "Target Region",
    width: 120,
  },
  {
    accessor: "bytes_transferred",
    Header: "GB Transferred",
    width: 120,
    align: "right",
    format: bytesToGbString,
    sortable: true,
  },
  {
    accessor: "transfer_cost",
    Header: "Transfer Cost (Dollars)",
    align: "right",
    Cell: (row: DataTransferData) => {
      return "$" + formatTo2Dec(bytesToTb(row.bytes_transferred) * (row.cost_per_tb || 0));
    },
    width: 120,
  },
];

export default function DataTransferCosts() {
  const [{ isFiltersOpen, filters }, dispatch] = useAppState();
  const { periodType, periodTypeOptions, setPeriodType } = usePeriodTypes();

  /** dispatch setFilters action wrapped in a callback */
  const applyFilters = useCallback(
    (nextFilters?: SelectedValues) => {
      dispatch({ type: "setFilters", payload: nextFilters });
    },
    [dispatch],
  );

  // query for data
  const query = useMemo(() => {
    return specForDataTransfer(filters);
  }, [filters]);
  const { data, isLoading, error } = useQuery(query, {
    dataCache: defaultCache,
    skip: !filters,
  });
  const objs = useMemo(() => {
    const objs = parseQueryResponse<DataTransferData>(data, query.columns);
    return objs;
  }, [data, query]);

  /** aggregated objs based on the period selection */
  const aggObjs = useMemo(() => {
    const agg = aggregateByDate<DataTransferData>(objs, "logdate", periodType, query?.columns);
    // add a unique thing to stack by
    agg.forEach((o) => {
      o.target = (o.target_cloud || "") + "_" + (o.target_region || "");
      const tb = bytesToTb(o.bytes_transferred);
      o.cost = tb * (o.cost_per_tb || 0);
    });
    return agg;
  }, [objs, query, periodType]);
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
            config={dataTransferFilters}
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
          <div className="flex items-center gap-x-2 text-left text-lg">Data Transfer Trend</div>
          <div className="relative mt-1 min-h-20 max-h-96 overflow-auto">
            {isLoading && <LoadingFitParent>Loading Data</LoadingFitParent>}
            <ChartCategoryStack
              data={aggObjs}
              categoryField="logdate"
              y1Field="cost"
              y1Label="Cost"
              y1Format={formatDollars}
              y2Field="bytes_transferred"
              y2Label="GB Transferred"
              y2Format={bytesToGbString}
              stackField="target"
              categoryList={allDates}
              categorySorter={basicSorter}
              categoryFormatter={getDateStringForUnknown}
              legendLimit={5}
              hoverContent={HoverContent}
            />
            <div className="mt-2">
              <div className="flex items-center gap-x-2">
                Show By
                <Dropdown value={periodType} onSelect={setPeriodType} options={periodTypeOptions} />
              </div>
            </div>
          </div>
        </Box>
        <Box className="p-2">
          <div className="flex items-center gap-x-2 text-left text-lg">Data Transfer Costs</div>
          <div className="relative mt-1 min-h-20 overflow-auto">
            {isLoading && <LoadingFitParent>Loading Data</LoadingFitParent>}
            <TableLocalSort<DataTransferData>
              data={objs}
              columns={columns}
              pageSize={30}
              multiSort
              fullWidth
            />
          </div>
          {error && <ErrorMessage error={error} message="Error Retrieving Data" />}
        </Box>
      </div>
    </div>
  );
}

const HoverContent = (category: string, data?: CategoryData) => {
  let totalGb = 0;
  let totalCost = 0;
  return (
    <Box className="p-2">
      <div className="mb-1 font-bold">{getDateStringForUnknown(category)}</div>
      {data?.length ? (
        <table className={basicTable}>
          <thead>
            <tr>
              <td className={basicTableHeader}>Target Cloud</td>
              <td className={basicTableHeader}>Target Region</td>
              <td className={basicTableHeader}>Cost (Dollars)</td>
              <td className={basicTableHeader}>GB Transferred</td>
            </tr>
          </thead>
          <tbody>
            {data?.sort(alphaSorter("token_credits", true)).map((row, i) => {
              const typed = row as DataTransferData;
              totalGb += typed.bytes_transferred || 0;
              totalCost += (typed.cost as number) || 0;
              if (typed.bytes_transferred === undefined || typed.bytes_transferred < 1073741824) {
                return undefined;
              }
              return (
                <tr className={basicTableTR} key={i}>
                  <td className={basicTableCell}>{typed.target_cloud}</td>
                  <td className={basicTableCell}>{typed.target_region}</td>
                  <td className={basicTableCell}>{formatDollars(typed.cost)}</td>
                  <td className={basicTableCell}>{bytesToGbString(typed.bytes_transferred)}</td>
                </tr>
              );
            })}
            {data.length > 1 && (
              <tr className={basicTableTR}>
                <td className={basicTableCell + " font-bold"}>Total</td>
                <td className={basicTableCell + " font-bold"}></td>
                <td className={basicTableCell + " font-bold"}>{formatDollars(totalCost)}</td>
                <td className={basicTableCell + " font-bold"}>{bytesToGbString(totalGb)}</td>
              </tr>
            )}
          </tbody>
        </table>
      ) : (
        <div>No Data</div>
      )}
      <div className="text-xs">Only showing rows with at least 1GB</div>
    </Box>
  );
};
