import { useMemo, useState, memo } from "react";
import { createPortal } from "react-dom";
import { scaleLinear, scaleOrdinal } from "d3-scale";
import { sum, groupSort } from "d3-array";
import { line } from "d3-shape";
import { useResizeDetector } from "react-resize-detector";
import HoverBox, { HoverPosition } from "./HoverBox";
import AxisHorizontal from "./AxisHorizontal";
import AxisVertical from "./AxisVertical";
import { CategoryData, makeGetNumber, makeGetString, ShapeClassInfo } from "@/utils/chartUtils";
import { bgColors, fillColors, strokeColors } from "@/constants";

interface ChartCategoryStackProps {
  data?: CategoryData;
  width?: number;
  height?: number;
  hoverContent?: (category: string, data?: CategoryData) => React.ReactNode;
  /** if given, formats xAxis labels with this function */
  categoryFormatter?: (category: string) => string;
  /** if given, sorts the categories using this function */
  categorySorter?: (a: string, b: string) => number;
  categoryField: string;
  stackField?: string;
  /** field in data for the y1 axis. will be bars */
  y1Field: string;
  y1Label?: string;
  y1Format?: (x: unknown) => string;
  /** field in data for the y2 axis. will be lines */
  y2Field?: string;
  y2Label?: string;
  y2Format?: (x: unknown) => string;
  /** if provided, category axis will be union of this and what is in the data.
   * useful if data may have gaps (such as with dates) and still want to display them.
   * should be memoized to improve performance
   */
  categoryList?: string[];
  legendLimit?: number;
}
interface HoverData {
  category: string;
  data?: CategoryData;
  stackClasses?: StackClasses;
}
interface GroupedCategoryData {
  stacks: Record<string, CategoryData>;
  rows: CategoryData;
}
type StackClasses = Record<string, ShapeClassInfo>;
type LinePoint = { categoryId: string; value: number };
/** first key is the stack id. array contains values for all categories for that stack */
type StackLineData = Record<
  string,
  {
    points: LinePoint[];
    line: string;
  }
>;

const minHeight = 100;
const tickSize = 6;
const padTop = 10;
const padXWithAxis = 70;
const padBottom = 25;

function ChartCategoryStack_base({
  data,
  categoryField,
  width,
  height = 200,
  hoverContent,
  categoryFormatter,
  categoryList,
  categorySorter,
  y1Label,
  y1Field,
  y1Format,
  y2Label,
  y2Field,
  y2Format,
  stackField,
  legendLimit,
}: ChartCategoryStackProps) {
  const { width: divWidth, ref } = useResizeDetector();
  const [hoverPosition, setHoverPosition] = useState<HoverPosition | undefined>(undefined);
  const [hoverData, setHoverData] = useState<HoverData | undefined>(undefined);

  const chartHeight = height > minHeight ? height : minHeight;
  const chartWidth = width || divWidth || minHeight;

  const chartData = useMemo(() => {
    const drawWidth = chartWidth - padXWithAxis - padXWithAxis;
    const drawHeight = chartHeight - padTop - padBottom;

    const getCategory = makeGetString(categoryField);
    const getY1 = makeGetNumber(y1Field);
    const getY2 = makeGetNumber(y2Field);

    // initialize the categories
    const categoryMap = new Map<string, GroupedCategoryData>();
    if (categoryList) {
      categoryList.forEach((c) => {
        categoryMap.set(c, {
          rows: [],
          stacks: {},
        });
      });
    }

    // group the data in to categories
    data?.forEach((row) => {
      const category = getCategory(row);
      if (category) {
        if (!categoryMap.has(category)) {
          categoryMap.set(category, {
            rows: [],
            stacks: {},
          });
        }
        const categoryData = categoryMap.get(category);
        if (categoryData) {
          categoryData.rows.push(row);
          const stack = (row[stackField || ""] as string) || "";
          if (!(stack in categoryData.stacks)) {
            categoryData.stacks[stack] = [];
          }
          categoryData.stacks[stack].push(row);
        }
      }
    });

    /** stack values sorted from biggest to smallest */
    const sortedStacks = data
      ? groupSort(
          data,
          (group) => -sum(group, (item) => +(item[y1Field] as number) || 0),
          (d) => (d[stackField || ""] as string) || "",
        )
      : [];

    // determine color classes for each stack
    const stackClasses: StackClasses = {};
    sortedStacks.forEach((stackId, i) => {
      stackClasses[stackId] = {
        fill: fillColors[i % fillColors.length],
        stroke: strokeColors[i % strokeColors.length],
        bg: bgColors[i % bgColors.length],
      };
    });

    // get the min and max of each value
    let minY1: undefined | number = 0;
    let minY2: undefined | number = 0;
    let maxY1: undefined | number = 0;
    let maxY2: undefined | number = 0;
    [...categoryMap.values()].forEach((categoryData) => {
      const rows = categoryData.rows;
      let valueY1 = 0;
      let valueY2 = 0;
      rows.forEach((row) => {
        const rowY1 = getY1(row) || 0;
        valueY1 += rowY1;
        if (y2Field) {
          const rowY2 = getY2(row) || 0;
          valueY2 = Math.max(valueY2, rowY2);
        }
      });
      if (minY1 === undefined || valueY1 < minY1) {
        minY1 = valueY1;
      }
      if (minY2 === undefined || valueY2 < minY2) {
        minY2 = valueY2;
      }
      if (maxY1 === undefined || valueY1 > maxY1) {
        maxY1 = valueY1;
      }
      if (maxY2 === undefined || valueY2 > maxY2) {
        maxY2 = valueY2;
      }
    });

    // determine scales and ticks
    const scaleY1 = scaleLinear([minY1, maxY1], [drawHeight, 0]);
    const scaleY2 = scaleLinear([minY2, maxY2], [drawHeight, 0]);
    const numTicks = Math.ceil(drawHeight / 50);
    const ticksY1 = scaleY1.ticks(numTicks);
    const ticksY2 = scaleY2.ticks(numTicks);

    // determine categories
    const allCategories = [...categoryMap.keys()];
    if (typeof categorySorter === "function") {
      allCategories.sort(categorySorter);
    }
    let categoryWidth = drawWidth / allCategories.length;
    if (categoryWidth < 0) {
      categoryWidth = 0;
    }
    const categoryRange: number[] = [];
    allCategories.forEach((_, i) => {
      categoryRange.push(categoryWidth * i + categoryWidth / 2);
    });
    const scaleCategory = scaleOrdinal(allCategories, categoryRange);

    // make lines if needed
    const lineData: StackLineData = {};
    if (y2Field) {
      // allCategories is already sorted, so using it should mean we do not need to sort again
      allCategories.forEach((categoryId) => {
        const stacks = categoryMap.get(categoryId)?.stacks || {};
        Object.entries(stacks).forEach(([stackId, stackData]) => {
          if (!(stackId in lineData)) {
            lineData[stackId] = { points: [], line: "" };
          }
          // if multiple records exist for the same stackId/category combiniation, only first is used
          const value = getY2(stackData?.[0]);
          if (!isNaN(value)) {
            lineData[stackId].points.push({
              categoryId: categoryId,
              value: getY2(stackData?.[0] || undefined),
            });
          }
        });
      });
      Object.values(lineData).forEach((d) => {
        // skip stacks with insufficient data for a line
        if (!d || d.points.length < 2) {
          return;
        }
        const l = line<LinePoint>()
          .x((obj) => scaleCategory(obj.categoryId))
          .y((obj) => scaleY2(obj.value));

        d.line = l(d.points) || "";
      });
    }

    return {
      drawWidth,
      drawHeight,
      scaleY1,
      scaleY2,
      ticksY1,
      ticksY2,
      scaleCategory,
      categoryWidth,
      categoryLabelX: Math.ceil(allCategories.length / (drawWidth / 100)),
      allCategories,
      categoryMap,
      sortedStacks,
      stackClasses,
      lineData,
    };
  }, [
    data,
    categoryField,
    chartHeight,
    chartWidth,
    categoryList,
    categorySorter,
    y1Field,
    y2Field,
    stackField,
  ]);

  if (!data) {
    return undefined;
  }

  const getY1 = makeGetNumber(y1Field);

  return (
    <div className="relative" ref={ref} style={{ minHeight: chartHeight }}>
      <svg
        viewBox={"0 0 " + chartWidth + " " + chartHeight}
        style={{ width: chartWidth, height: chartHeight }}
      >
        {/* Main Chart Area */}
        <g key="mainchart" transform={`translate(${padXWithAxis},${padTop})`}>
          {[...chartData.categoryMap.entries()].map(([cat, categoryData], barI) => {
            const isActive = hoverData?.data === categoryData.rows;
            const bgColor =
              barI % 2 === 0
                ? "fill-neutral-300/30 dark:fill-neutral-700/30"
                : "fill-neutral-100/30 dark:fill-neutral-900/30";
            let runningBar = 0;
            let runningHeight = 0;
            return (
              <g
                key={cat}
                transform={`translate(${chartData.scaleCategory(cat) - chartData.categoryWidth / 2},0)`}
                onPointerOver={() => {
                  const dims = (ref.current as HTMLElement)?.getBoundingClientRect();
                  setHoverPosition({
                    x: chartData.scaleCategory(cat) + padXWithAxis,
                    xOffset: chartData.categoryWidth > 100 ? 50 : 0.75 * chartData.categoryWidth,
                    chartWidth: chartWidth,
                    y: 0,
                    rect: dims,
                  });
                  setHoverData({
                    category: cat,
                    data: categoryData.rows,
                    stackClasses: chartData.stackClasses,
                  });
                }}
                onPointerLeave={() => {
                  setHoverPosition(undefined);
                  setHoverData(undefined);
                }}
              >
                {/* Background Rect */}
                <rect
                  x={0}
                  width={chartData.categoryWidth}
                  y={0}
                  height={chartData.drawHeight}
                  className={
                    (isActive ? "fill-neutral-400/30 dark:fill-neutral-600/30" : bgColor) +
                    " stroke-none"
                  }
                />
                {/* Data Rects */}
                {chartData.sortedStacks.map((stackId, stackI) => {
                  const stackData = categoryData.stacks[stackId];
                  if (!stackData || stackData.length < 1) {
                    return undefined;
                  }
                  return stackData.map((stackDataRecord) => {
                    const barValue = getY1(stackDataRecord);
                    const y = chartData.scaleY1(runningBar + barValue);
                    let height = chartData.drawHeight - y;
                    runningBar += barValue;
                    if (runningHeight) {
                      height -= runningHeight;
                    }
                    runningHeight += height;
                    if (height <= 0) {
                      return undefined;
                    }
                    return (
                      <rect
                        key={stackI}
                        className={chartData.stackClasses[stackId]?.fill}
                        x={chartData.categoryWidth * 0.1}
                        width={chartData.categoryWidth * 0.8}
                        y={y}
                        height={height}
                      />
                    );
                  });
                })}
              </g>
            );
          })}
          {/* Lines */}
          {y2Field && (
            <g className="pointer-events-none">
              {Object.entries(chartData.lineData).map(([stackId, d]) => {
                if (!d.line) {
                  return undefined;
                }
                return (
                  <g key={stackId}>
                    <path
                      d={d.line}
                      className={"fill-none stroke-neutral-200 stroke-3 dark:stroke-neutral-800"}
                    />
                    <path
                      d={d.line}
                      className={
                        "fill-none stroke-2 " + (chartData.stackClasses[stackId]?.stroke || "")
                      }
                    />
                  </g>
                );
              })}
            </g>
          )}
        </g>
        {/* X-Axis */}
        <AxisHorizontal<string>
          drawHeight={chartData.drawHeight}
          drawWidth={chartData.drawWidth}
          padLeft={padXWithAxis}
          padTop={padTop}
          labelEveryX={chartData.categoryLabelX}
          scaleTick={chartData.scaleCategory}
          tickFormatter={categoryFormatter}
          tickSize={tickSize}
          ticks={chartData.allCategories}
        />
        {/* Y-Axis 1 */}
        <AxisVertical<number>
          side="left"
          offsetLeft={padXWithAxis}
          axisWidth={padXWithAxis}
          padTop={padTop}
          drawHeight={chartData.drawHeight}
          drawWidth={chartData.drawWidth}
          tickSize={tickSize}
          scaleTick={chartData.scaleY1}
          ticks={chartData.ticksY1}
          label={y1Label}
          tickFormatter={y1Format}
        />
        {/* Y-Axis 2 */}
        {y2Field && (
          <AxisVertical<number>
            side="right"
            offsetLeft={padXWithAxis + chartData.drawWidth}
            axisWidth={padXWithAxis}
            padTop={padTop}
            drawHeight={chartData.drawHeight}
            drawWidth={chartData.drawWidth}
            tickSize={tickSize}
            scaleTick={chartData.scaleY2}
            ticks={chartData.ticksY2}
            label={y2Label}
            tickFormatter={y2Format}
          />
        )}
      </svg>
      {hoverPosition &&
        hoverContent &&
        createPortal(
          <HoverBox position={hoverPosition}>
            {hoverContent(hoverData?.category || "", hoverData?.data)}
          </HoverBox>,
          document.body,
        )}
      {/* Legend */}
      {(legendLimit === undefined || legendLimit > 0) && (
        <div className="my-2 flex flex-wrap justify-center gap-x-4 gap-y-2">
          {chartData.sortedStacks.slice(0, legendLimit || undefined).map((stackId) => {
            const bg = chartData.stackClasses[stackId]?.bg;
            return (
              <div key={stackId} className="flex items-center gap-x-2">
                <div className={"h-4 w-4 " + bg}>&nbsp;</div>
                <div>{stackId}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const ChartCategoryStack = memo(ChartCategoryStack_base);
export default ChartCategoryStack;
