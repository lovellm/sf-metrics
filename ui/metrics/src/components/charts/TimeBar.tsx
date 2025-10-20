import { memo, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useResizeDetector } from "react-resize-detector";
import { scaleLinear, scaleTime } from "d3-scale";
import HoverBox, { HoverPosition } from "./HoverBox";
import AxisVertical from "./AxisVertical";
import Box from "../basic/Box";
import { GenericDataRecord, makeGetNumber, makeGetString } from "@/utils/chartUtils";
import { getDateFromString, getDateTimeLabelS } from "@/utils/dates";
import AxisHorizontal from "./AxisHorizontal";

interface TimeBarProps<T> {
  data?: T[];
  width?: number;
  height?: number;
  hoverContent?: (data?: GenericDataRecord) => React.ReactNode;
  /** if given, formats xAxis labels with this function */
  dateFormatter?: (category: Date) => string;
  dateField: string;
  yField: string;
  yLabel?: string;
  yFormat?: (x: unknown) => string;
}

type TimeBarData<T> = {
  date?: Date;
  value?: number;
  priorDate?: Date;
  priorValue?: number;
  data: T;
};

const minHeight = 100;
const tickSize = 6;
const padTop = 10;
const padLeft = 50;
const padRight = 10;
const padBottom = 25;
const hoverTd = "px-2 py-1 whitespace-nowrap text-sm";

function TimeBar_base<T extends GenericDataRecord>({
  data,
  width,
  height = 200,
  dateField,
  dateFormatter,
  yField,
  yFormat,
  yLabel,
}: TimeBarProps<T>) {
  const { width: divWidth, ref } = useResizeDetector();
  const [hoverPosition, setHoverPosition] = useState<HoverPosition | undefined>(undefined);
  const [hoverData, setHoverData] = useState<TimeBarData<T> | undefined>(undefined);

  const chartHeight = height > minHeight ? height : minHeight;
  const chartWidth = width || divWidth || minHeight;

  const chartData = useMemo(() => {
    const drawWidth = chartWidth - padLeft - padRight;
    const drawHeight = chartHeight - padTop - padBottom;

    const getCategory = makeGetString(dateField);
    const getY = makeGetNumber(yField);
    let maxValue = 0;
    let minDate: number | undefined = undefined;
    let maxDate: number | undefined = undefined;
    let previousDate: Date | undefined = undefined;
    let previousValue: number | undefined = undefined;
    const timeData = data?.map<TimeBarData<T>>((row) => {
      // get value and track max as needed
      const val = getY(row);
      if (val > maxValue) {
        maxValue = val;
      }
      // get date
      const cat = getCategory(row);
      const date = getDateFromString(cat);
      if (date) {
        if (minDate === undefined || date.valueOf() < minDate) {
          minDate = date.valueOf();
        }
        if (maxDate === undefined || date.valueOf() > maxDate) {
          maxDate = date.valueOf();
        }
      }

      const rowData = {
        date: date,
        value: val,
        data: row,
        priorDate: previousDate,
        priorValue: previousValue,
      };
      previousDate = date;
      previousValue = val;
      return rowData;
    });

    const scaleX = scaleTime([new Date(minDate || 0), new Date(maxDate || 0)], [0, drawWidth]);
    const ticksX = scaleX.ticks(drawWidth / 200);

    const scaleY = scaleLinear([0, maxValue], [drawHeight, 0]);
    const numTicks = Math.ceil(drawHeight / 50);
    const ticksY = scaleY.ticks(numTicks).filter((tick) => Number.isInteger(tick));

    return {
      drawWidth,
      drawHeight,
      scaleY,
      ticksY,
      timeData,
      scaleX,
      ticksX,
    };
  }, [chartWidth, chartHeight, dateField, yField, data]);

  return (
    <div className="relative" ref={ref} style={{ minHeight: chartHeight }}>
      <svg
        viewBox={"0 0 " + chartWidth + " " + chartHeight}
        style={{ width: chartWidth, height: chartHeight }}
      >
        {/* Main Chart Area */}
        <g key="mainchart" transform={`translate(${padLeft},${padTop})`}>
          {chartData.timeData?.map((bar, i) => {
            if (!bar.priorDate || !bar.date) {
              return undefined;
            }
            const x = chartData.scaleX(bar.priorDate);
            const x2 = chartData.scaleX(bar.date);
            const value = bar.priorValue;
            const y = chartData.scaleY(value || 0);
            if (!value) {
              return undefined;
            }
            return (
              <rect
                y={y}
                height={chartData.drawHeight - y}
                x={x}
                width={x2 - x}
                key={i}
                className="fill-purple-800 stroke-0 dark:fill-orange-200"
                onPointerOver={() => {
                  const dims = (ref.current as HTMLElement)?.getBoundingClientRect();
                  setHoverPosition({
                    x: x2,
                    xOffset: padLeft + 10,
                    chartWidth: chartWidth,
                    y: 0,
                    rect: dims,
                  });
                  setHoverData(bar);
                }}
                onPointerLeave={() => {
                  setHoverPosition(undefined);
                  setHoverData(undefined);
                }}
              />
            );
          })}
        </g>
        {/* X-Axis */}
        <AxisHorizontal<Date>
          drawHeight={chartData.drawHeight}
          drawWidth={chartData.drawWidth}
          padLeft={padLeft}
          padTop={padTop}
          labelEveryX={1}
          scaleTick={chartData.scaleX}
          tickFormatter={dateFormatter}
          tickSize={tickSize}
          ticks={chartData.ticksX}
        />
        {/* Y-Axis */}
        <AxisVertical<number>
          side="left"
          offsetLeft={padLeft}
          axisWidth={padLeft}
          padTop={padTop}
          drawHeight={chartData.drawHeight}
          drawWidth={chartData.drawWidth}
          tickSize={tickSize}
          scaleTick={chartData.scaleY}
          ticks={chartData.ticksY}
          label={yLabel}
          tickFormatter={yFormat}
        />
      </svg>
      {hoverPosition &&
        createPortal(
          <HoverBox position={hoverPosition}>
            <Box className="p-2">
              <table>
                <tbody>
                  <tr>
                    <td className={hoverTd}>Start</td>
                    <td className={hoverTd}>{getDateTimeLabelS(hoverData?.priorDate)}</td>
                  </tr>
                  <tr>
                    <td className={hoverTd}>End</td>
                    <td className={hoverTd}>{getDateTimeLabelS(hoverData?.date)}</td>
                  </tr>
                  <tr>
                    <td className={hoverTd}>{yLabel || "Value"}</td>
                    <td className={hoverTd}>{hoverData?.priorValue}</td>
                  </tr>
                </tbody>
              </table>
            </Box>
          </HoverBox>,
          document.body,
        )}
    </div>
  );
}

const TimeBar = memo(TimeBar_base);
export default TimeBar;
