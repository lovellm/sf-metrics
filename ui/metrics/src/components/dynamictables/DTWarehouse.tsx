import { useMemo, useState } from "react";
import Box from "../basic/Box";
import { SelectedValues } from "@/types/filterTypes";
import { defaultCache } from "@/data/dataCache";
import LoadingFitParent from "../basic/LoadingFitParent";
import ErrorMessage from "../basic/ErrorMessage";
import { CategoryData, minAndMax } from "@/utils/chartUtils";
import { getAllPeriods, PeriodType } from "@/utils/dates";
import ChartCategoryStack from "../charts/ChartCategoryStack";
import { alphaSorter, basicSorter } from "@/utils/sorters";
import { formatCreditCost, formatCreditCostK } from "@/utils/formatters";
import { basicTable, basicTableHeader, basicTableTR, basicTableCell } from "@/constants";
import Dropdown, { DropdownOption } from "../basic/Dropdown";
import {
  DynamicTablesWarehouseData,
  specForDynamicTablesWarehouse,
} from "@/specs/dynamicTableSpecs";
import { useQuery } from "@/hooks/useApiData";
import parseQueryResponse from "@/utils/parseQueryResponse";
import aggregateByDate from "@/utils/aggregateByDate";

interface DTWarehouseProps {
  filters?: SelectedValues;
  db?: string;
  schema?: string;
}

const periodTypeOptions: DropdownOption[] = [
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "day", label: "Day" },
];

export default function DTkWarehouse({ filters, db, schema }: DTWarehouseProps) {
  const [periodType, setPeriodType] = useState<PeriodType>(PeriodType.week);
  const spec = useMemo(() => {
    return specForDynamicTablesWarehouse({ selectedValues: filters, db, schema });
  }, [filters, db, schema]);
  const { data, isLoading, error } = useQuery(spec, {
    dataCache: defaultCache,
    skip: !filters,
  });
  const objs = useMemo(() => {
    const objs = parseQueryResponse<DynamicTablesWarehouseData>(data, spec?.columns);
    const agg = aggregateByDate<DynamicTablesWarehouseData>(
      objs,
      "logdate",
      periodType,
      spec.columns,
    );
    return agg;
  }, [data, spec, periodType]);

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
      <div className="text-lg">Dynamic Tables Warehouse Trend</div>
      <div className="relative mt-1 min-h-20">
        {isLoading && <LoadingFitParent>Loading Warehouse Trend</LoadingFitParent>}
        {objs.length > 0 && (
          <ChartCategoryStack
            data={objs}
            categoryField="logdate"
            y1Field="query_credits_used"
            y1Label="Cost in Dollars"
            y1Format={formatCreditCostK}
            y2Field="credits_used_cloud_services"
            y2Format={formatCreditCostK}
            y2Label="Cloud Services Cost"
            stackField="warehouse_name"
            categoryList={allDates}
            categorySorter={basicSorter}
            hoverContent={TrendHoverContent}
            legendLimit={6}
          />
        )}
      </div>
      <div className="mt-2">
        <div className="flex items-center gap-x-2">
          Show By
          <Dropdown value={periodType} onSelect={setPeriodType} options={periodTypeOptions} />
        </div>
      </div>
      {error && <ErrorMessage error={error} message="Error Retrieving DB Summary" />}
    </Box>
  );
}

const TrendHoverContent = (category: string, data?: CategoryData) => {
  let total1 = 0;
  let total2 = 0;
  return (
    <Box className="p-2">
      <div className="mb-1 font-bold">{category}</div>
      <div className="text-xs">Only showing more than $1</div>
      {data?.length ? (
        <table className={basicTable}>
          <thead>
            <tr>
              <td className={basicTableHeader}>Warehouse</td>
              <td className={basicTableHeader}>Cost</td>
              <td className={basicTableHeader}>Cloud Services</td>
            </tr>
          </thead>
          <tbody>
            {data?.sort(alphaSorter("query_credits_used", true)).map((row, i) => {
              const typed = row as DynamicTablesWarehouseData;
              total1 += typed.query_credits_used || 0;
              total2 += typed.credits_used_cloud_services || 0;
              if ((typed.query_credits_used || 0) < 0.33) {
                return undefined;
              }
              return (
                <tr className={basicTableTR} key={i}>
                  <td className={basicTableCell}>{typed.warehouse_name}</td>
                  <td className={basicTableCell}>{formatCreditCost(typed.query_credits_used)}</td>
                  <td className={basicTableCell}>
                    {formatCreditCost(typed.credits_used_cloud_services)}
                  </td>
                </tr>
              );
            })}
            {data.length > 1 && (
              <tr className={basicTableTR}>
                <td className={basicTableCell + " font-bold"}>Total</td>
                <td className={basicTableCell + " font-bold"}>{formatCreditCost(total1)}</td>
                <td className={basicTableCell + " font-bold"}>{formatCreditCost(total2)}</td>
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
