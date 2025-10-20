import {
  FilterConfig,
  HandleRemoveOption,
  HandleSelectedOption,
  SelectedValues,
} from "@/types/filterTypes";
import Box from "../basic/Box";
import { useMemo, useState } from "react";
import { createHandleRemoveOption, createHandleSelectOption } from "@/utils/filterUtils";
import FilterDropdown from "../filters/FilterDropdown";
import { filterConfigs } from "../filters/filterConfig";
import FilterTimestamp from "../filters/FilterTimestamp";
import FilterDuration from "../filters/FilterDuration";
import {
  getDateFromString,
  getDateTimeLabel,
  getDateTimeLabelS,
  getDayForDaysAgo,
  getLocalISOForString,
} from "@/utils/dates";
import warehouseScale, {
  DATA_LIMIT,
  getWarehouseFilters,
  WarehouseScaleData,
} from "@/specs/warehouseScale";
import { defaultCache } from "@/data/dataCache";
import LoadingFitParent from "../basic/LoadingFitParent";
import ErrorMessage from "../basic/ErrorMessage";
import TimeBar from "../charts/TimeBar";
import { format1Dec, formatInteger, formatPercent0 } from "@/utils/formatters";
import { makeGetString, makeGetNumber } from "@/utils/chartUtils";
import { alphaSorter } from "@/utils/sorters";
import { useQuery } from "@/hooks/useApiData";
import parseQueryResponse from "@/utils/parseQueryResponse";
import { Filter } from "@/types/dataApi";

const warehouseFilter = { ...filterConfigs.warehouseName };
warehouseFilter.required = true;
const timestampFilter: FilterConfig = {
  label: "Starting Timestamp",
  path: "timestamp",
  type: "date",
  defaultOperator: ">=",
  required: true,
};
const durationFilter: FilterConfig = {
  label: "Duration",
  path: "duration",
  type: "duration",
  required: true,
  maxValue: 1000 * 60 * 60 * 24 * 4,
};
const daysAgo2 = getDayForDaysAgo(2);
const days2InMs = 1000 * 60 * 60 * 48;
const defaultFilters: SelectedValues = {
  timestamp: [
    {
      value: getLocalISOForString(daysAgo2.toISOString().substring(0, 10) + "T00:00"),
      operator: ">=",
    },
  ],
  duration: [{ value: "" + days2InMs }],
};

interface ScaleBucket {
  start?: Date;
  end?: Date;
  value: number;
  duration: number;
}
interface DurationSummary {
  duration: number;
  count: number;
  percent?: number;
  scaledDuration?: number;
  instanceCount: string | number;
}
interface InstanceSummary extends DurationSummary {
  buckets: Record<number, DurationSummary>;
}

const getDate = makeGetString("timestamp");
const getInstances = makeGetNumber("cluster_count");

export default function WarehouseScaling() {
  const [filters, setFilters] = useState<SelectedValues>(defaultFilters);
  const [apiFilters, setApiFilters] = useState<Filter[] | undefined>(undefined);
  const [needsApply, setNeedsApply] = useState<boolean>(false);

  /** add value to the selectedOptions for path */
  const handleSelectOption = useMemo<HandleSelectedOption>(
    () => createHandleSelectOption(setFilters, undefined, setNeedsApply),
    [],
  );

  /** remove value from the selectedOptions for path */
  const handleRemoveOption = useMemo<HandleRemoveOption>(
    () => createHandleRemoveOption(setFilters, setNeedsApply),
    [],
  );

  // determine if able to query based on the current filters
  const canQuery = useMemo(() => {
    if (!filters) {
      return false;
    }
    if (!filters.warehouseName?.length) {
      return false;
    }
    if (!filters.timestamp?.length) {
      return false;
    }
    return true;
  }, [filters]);

  // make the spec, get the data, parse the response
  const query = useMemo(() => {
    return warehouseScale(apiFilters);
  }, [apiFilters]);
  const { data, error, isLoading } = useQuery(query, {
    dataCache: defaultCache,
    skip: !query,
  });
  const objs = useMemo(() => {
    const objs = parseQueryResponse<WarehouseScaleData>(data, query?.columns);
    return objs;
  }, [data, query]);

  // process the data to get some interesting remarks for it
  const summary = useMemo(() => {
    let first: Date | undefined = undefined;
    let last: Date | undefined = undefined;
    const infoByInstances: Record<number, InstanceSummary> = {};
    let previousDate: Date | undefined = undefined;
    let previousValue = 0;

    const buckets = objs?.map<ScaleBucket>((row) => {
      const date = getDateFromString(getDate(row));
      date?.setMilliseconds(0);
      const value = getInstances(row);
      let duration = 0;

      // track min/max
      if (date) {
        if (first === undefined || date < first) {
          first = date;
        }
        if (last === undefined || date > last) {
          last = date;
        }
      }

      if (previousDate && date) {
        duration = date.valueOf() - previousDate.valueOf();
      }
      // bucketize the record
      const bucket: ScaleBucket = {
        start: previousDate,
        end: date,
        value: previousValue,
        duration: duration,
      };

      // summarize some stuff
      if (!(previousValue in infoByInstances)) {
        infoByInstances[previousValue] = {
          count: 0,
          duration: 0,
          buckets: {},
          instanceCount: previousValue,
        };
      }
      infoByInstances[previousValue].count += 1;
      infoByInstances[previousValue].duration += duration;

      // summarize bucketed duration
      if (duration) {
        const minuteBucket = getMinuteBucket(duration);
        if (!(minuteBucket in infoByInstances[previousValue].buckets)) {
          infoByInstances[previousValue].buckets[minuteBucket] = {
            duration: 0,
            count: 0,
            instanceCount: previousValue,
          };
        }
        infoByInstances[previousValue].buckets[minuteBucket].count += 1;
        infoByInstances[previousValue].buckets[minuteBucket].duration += duration;
      }

      previousValue = value;
      previousDate = date;
      return bucket;
    });

    let totalUptime = 0;
    let scaledUptime = 0;
    const totalDuration = first && last ? (last as Date).valueOf() - (first as Date).valueOf() : 0;
    if (totalDuration) {
      Object.entries(infoByInstances).forEach(([instanceCount, info]) => {
        info.percent = info.duration / totalDuration;
        info.scaledDuration = (+instanceCount || 1) * info.duration;
        if (+instanceCount > 0) {
          totalUptime += info.duration;
          scaledUptime += info.scaledDuration;
        }
      });
    }

    const instancesArray = Object.values(infoByInstances).sort(alphaSorter("instanceCount"));

    const summary = {
      buckets,
      infoByInstances,
      instancesArray,
      totalDuration: totalDuration,
      totalUptime,
      scaledUptime,
      percentUptime: totalDuration ? totalUptime / totalDuration : 0,
      first,
      last,
    };

    return summary;
  }, [objs]);

  return (
    <div className="p-2">
      <div className="flex gap-3">
        {/* Filters */}
        <Box className="w-72 shrink-0 grow-0 p-2">
          <FilterDropdown
            filter={warehouseFilter}
            onSelected={handleSelectOption}
            onRemoved={handleRemoveOption}
            selectedValues={filters}
            single
          />
          <FilterTimestamp
            filter={timestampFilter}
            onRemoved={handleRemoveOption}
            onSelected={handleSelectOption}
            selectedValues={filters}
            operator=">="
          />
          <FilterDuration
            filter={durationFilter}
            onRemoved={handleRemoveOption}
            onSelected={handleSelectOption}
            selectedValues={filters}
          />
          <div className="mt-4 flex flex-row-reverse px-2">
            <button
              type="button"
              disabled={isLoading || !canQuery || !needsApply}
              className={
                "btn-main rounded-full px-2 py-1 font-bold " +
                (canQuery && needsApply ? " animate-subtle-ping" : "") +
                (canQuery ? " cursor-pointer" : " cursor-disabled")
              }
              onClick={() => {
                setNeedsApply(false);
                const apiFilters = getWarehouseFilters(filters);
                setApiFilters(apiFilters);
              }}
            >
              View Data
            </button>
          </div>
        </Box>
        <Box className="relative shrink grow p-2">
          <div className="mb-2 text-center font-bold">Warehouse Scaling</div>
          {/* Directions */}
          {!apiFilters?.length && (
            <div className="list">
              <ul>
                <li>You must select a warehouse.</li>
                <li>The starting time defaults to midnight 2 days ago.</li>
                <li>The duration defaults to 48 hours. You can select a maximum of 4 days.</li>
                <li>There will be a several hour delay before recent times appear.</li>
              </ul>
            </div>
          )}
          {apiFilters?.length && !objs?.length && <div>No Data</div>}
          {data?.data?.length === DATA_LIMIT && (
            <div>
              Maximum records reached, you are probably looking at partial data. Adjust your
              filters.
            </div>
          )}
          {/* Summary Header */}
          {objs?.length > 0 && (
            <div className="flex flex-row flex-wrap items-center justify-center gap-x-4">
              <div className="flex flex-col items-center">
                <div className="font-bold">Percent Running</div>
                <div className="text-xl">{formatPercent0(summary.percentUptime)}</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="font-bold">Billable Hours</div>
                <div className="text-xl">
                  {format1Dec(summary.scaledUptime / 3600000)}{" "}
                  <span className="text-base">Billable for </span>
                  {format1Dec(summary.totalUptime / 3600000)}{" "}
                  <span className="text-base">Active Hours</span>
                </div>
              </div>
            </div>
          )}
          {/* Chart */}
          {objs?.length > 0 && (
            <TimeBar
              data={objs}
              yField="cluster_count"
              dateField="timestamp"
              dateFormatter={getDateTimeLabel}
              yLabel="Instances"
              yFormat={formatInteger}
            />
          )}
          {objs?.length > 0 && (
            <div className="flex flex-row flex-wrap items-center justify-between gap-x-4 text-sm">
              <div className="flex flex-col items-center">
                <div>Chart Starts</div>
                <div>{getDateTimeLabelS(summary.first)}</div>
              </div>
              <div className="flex flex-col items-center">
                <div>Chart Ends</div>
                <div>{getDateTimeLabelS(summary.last)}</div>
              </div>
            </div>
          )}
          {objs?.length > 0 && summary.instancesArray?.length > 0 && (
            <div>
              <div className="text-center font-bold">Percent Time by Instance Count</div>
              <div className="flex flex-row flex-wrap items-center justify-center gap-x-4 text-lg">
                {summary.instancesArray.map((info) => (
                  <div key={info.instanceCount}>
                    <span>{info.instanceCount}: </span>
                    <span>{formatPercent0(info.percent || 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="mt-4 text-sm">
            All times are local time for your time zone.
            <div className="list">
              <ul>
                <li>Chart data requires a change in instance count to recognize anything.</li>
                <li>
                  Therefore, if a warehouse remains in the same instance count for a long period of
                  time at the beginning or end of the selected period, that block of activity will
                  not show up.
                </li>
                <li>
                  Taking this into account, the listed Billable Hours * Credits per Hour for the
                  warehouse is very close to the real billed credits during that period.
                </li>
              </ul>
            </div>
            <table>
              <thead>
                <tr>
                  <th className="px-2 text-left">Credits Per Hour</th>
                  <th className="px-2 text-center">XSmall</th>
                  <th className="px-2 text-center">Small</th>
                  <th className="px-2 text-center">Medium</th>
                  <th className="px-2 text-center">Large</th>
                  <th className="px-2 text-center">XLarge</th>
                  <th className="px-2 text-center">XXLarge</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th className="px-2 text-left">Standard Gen1</th>
                  <td className="px-2 text-center">1</td>
                  <td className="px-2 text-center">2</td>
                  <td className="px-2 text-center">4</td>
                  <td className="px-2 text-center">8</td>
                  <td className="px-2 text-center">16</td>
                  <td className="px-2 text-center">32</td>
                </tr>
                <tr>
                  <th className="px-2 text-left">Standard Gen2</th>
                  <td className="px-2 text-center">1.35</td>
                  <td className="px-2 text-center">2.7</td>
                  <td className="px-2 text-center">5.4</td>
                  <td className="px-2 text-center">10.8</td>
                  <td className="px-2 text-center">21.6</td>
                  <td className="px-2 text-center">43.2</td>
                </tr>
                <tr>
                  <th className="px-2 text-left">Memory 16x</th>
                  <td className="px-2 text-center">-</td>
                  <td className="px-2 text-center">-</td>
                  <td className="px-2 text-center">6</td>
                  <td className="px-2 text-center">12</td>
                  <td className="px-2 text-center">24</td>
                  <td className="px-2 text-center">48</td>
                </tr>
              </tbody>
            </table>
          </div>
          {isLoading && <LoadingFitParent>Loading Data...</LoadingFitParent>}
          {error && <ErrorMessage error={error} message="Error Loading Data" />}
        </Box>
      </div>
    </div>
  );
}

/** returns a minute bucket for the given ms */
const getMinuteBucket = (ms: number) => {
  if (!ms) {
    return 0;
  }
  if (ms < 60000) {
    return 1;
  }
  if (ms < 300000) {
    return 5;
  }
  if (ms < 900000) {
    return 15;
  }
  if (ms < 1800000) {
    return 30;
  }
  if (ms < 3600000) {
    return 60;
  }
  // anything bigger than 1 hour
  return 100;
};
