import { formatCreditCost, formatInteger } from "@/utils/formatters";
import Box from "../basic/Box";
import Dropdown, { DropdownOption } from "../basic/Dropdown";
import LoadingFitParent from "../basic/LoadingFitParent";
import ChartCategoryStack from "../charts/ChartCategoryStack";
import { useMemo, useState } from "react";
import { getAllPeriods, PeriodType } from "@/utils/dates";
import { alphaSorter, basicSorter } from "@/utils/sorters";
import { basicTable, basicTableHeader, basicTableTR, basicTableCell } from "@/constants";
import { CategoryData, minAndMax } from "@/utils/chartUtils";
import { SelectedValues } from "@/types/filterTypes";
import ErrorMessage from "../basic/ErrorMessage";
import { defaultCache } from "@/data/dataCache";
import { warehouseTrend, DataWarehouseTrend } from "@/specs/userSpecs";
import aggregateByDate from "@/utils/aggregateByDate";
import parseQueryResponse from "@/utils/parseQueryResponse";
import { useQuery } from "@/hooks/useApiData";

const periodTypeOptions: DropdownOption[] = [
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "day", label: "Day" },
];

interface WarehouseTrendProps {
  userId?: string;
  filters?: SelectedValues;
}

export default function WarehouseTrend({ userId, filters }: WarehouseTrendProps) {
  const [periodType, setPeriodType] = useState<PeriodType>(PeriodType.week);

  const query = useMemo(() => {
    return warehouseTrend({ userId, selectedValues: filters });
  }, [userId, filters]);

  const { data, isLoading, error } = useQuery(query, { dataCache: defaultCache, skip: !query });
  const objs = useMemo(() => {
    const objs = parseQueryResponse<DataWarehouseTrend>(data, query.columns);
    if (!periodType) {
      return objs;
    }

    const agg = aggregateByDate<DataWarehouseTrend>(objs, "logdate", periodType, query.columns);
    return agg;
  }, [data, query, periodType]);

  /** all dates for the selected period type between first and last in the data */
  const allDates = useMemo<string[] | undefined>(() => {
    if (!objs) {
      return undefined;
    }
    const [min, max] = minAndMax<string>("logdate", objs);
    return getAllPeriods(periodType, min, max);
  }, [objs, periodType]);

  return (
    <Box className="p-2">
      <div className="text-center">Cost by Warehouse Over Time</div>
      <div className="relative">
        {isLoading && <LoadingFitParent />}
        {objs?.length ? (
          <ChartCategoryStack
            data={objs}
            categoryField="logdate"
            y1Field="query_credits_used"
            y1Label="Cost in Dollars"
            y1Format={formatCreditCost}
            y2Field="count"
            y2Label="Count of Queries"
            stackField="warehouse_name"
            categoryList={allDates}
            categorySorter={basicSorter}
            hoverContent={TrendHoverContent}
          />
        ) : (
          <div>No data for current filters</div>
        )}
      </div>
      <div className="mt-2">
        <div className="flex items-center gap-x-2">
          Show By
          <Dropdown value={periodType} onSelect={setPeriodType} options={periodTypeOptions} />
        </div>
      </div>
      {error && <ErrorMessage error={error} message="Unable to Loading Data" />}
    </Box>
  );
}

const TrendHoverContent = (category: string, data?: CategoryData) => {
  let total1 = 0;
  let total2 = 0;
  return (
    <Box className="p-2">
      <div className="mb-1 font-bold">{category}</div>
      {data?.length ? (
        <table className={basicTable}>
          <thead>
            <tr>
              <td className={basicTableHeader}>Warehouse</td>
              <td className={basicTableHeader}>Cost</td>
              <td className={basicTableHeader}>Queries</td>
            </tr>
          </thead>
          <tbody>
            {data?.sort(alphaSorter("query_credits_used", true)).map((row, i) => {
              const typed = row as DataWarehouseTrend;
              total1 += typed.query_credits_used || 0;
              total2 += typed.count || 0;
              return (
                <tr className={basicTableTR} key={i}>
                  <td className={basicTableCell}>{typed.warehouse_name}</td>
                  <td className={basicTableCell}>{formatCreditCost(typed.query_credits_used)}</td>
                  <td className={basicTableCell}>{formatInteger(typed.count)}</td>
                </tr>
              );
            })}
            {data.length > 1 && (
              <tr className={basicTableTR}>
                <td className={basicTableCell + " font-bold"}>Total</td>
                <td className={basicTableCell + " font-bold"}>{formatCreditCost(total1)}</td>
                <td className={basicTableCell + " font-bold"}>{formatInteger(total2)}</td>
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
