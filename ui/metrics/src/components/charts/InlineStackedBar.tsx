import { memo, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Box from "../basic/Box";
import { bgColors, fillColors } from "@/constants";

const emptyData: Record<string, number> = {};
const emptyBars: string[] = [];
type InlineStackedBarProps = {
  width?: number;
  height?: number;
  /** object contains percentages for the chart */
  percentages?: Record<string, number>;
  /** object contain values to display in hover */
  values?: Record<string, number>;
  /** keys to data, sorted as they should be displayed */
  bars?: string[];
  formatValue?: (x: number) => string;
};
interface RectInfo {
  x: number;
  width: number;
  className: string;
  id: string;
}
type ShowHover = [number, number];
const hoverTd = "px-2 py-1 whitespace-nowrap text-sm";

function InlineStackedBar_base({
  width = 100,
  height = 20,
  values = emptyData,
  percentages = emptyData,
  bars = emptyBars,
  formatValue,
}: InlineStackedBarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<ShowHover | undefined>(undefined);

  const rects = useMemo(() => {
    const rects: RectInfo[] = [];
    let runningX = 0;
    bars.forEach((bar, i) => {
      const perc = percentages[bar];
      if (perc) {
        rects.push({
          id: bar,
          x: runningX,
          width: width * perc,
          className: fillColors[i % fillColors.length],
        });
        runningX += width * perc;
      }
    });
    return rects;
  }, [width, percentages, bars]);

  return (
    <div className="relative" ref={ref}>
      <svg
        viewBox={"0 0 " + width + " " + height}
        style={{ width: width, height: height }}
        className="bg-neutral-200 dark:bg-black"
        onPointerOver={() => {
          const dims = ref.current?.getBoundingClientRect();
          setHover(dims ? [dims.y + height + 6, dims.left] : undefined);
        }}
        onPointerLeave={() => {
          setHover(undefined);
        }}
      >
        {rects.map((r) => (
          <rect
            key={r.id}
            y={height * 0.2}
            height={height * 0.6}
            x={r.x}
            width={r.width}
            className={r.className}
          />
        ))}
      </svg>
      {hover &&
        createPortal(
          <Box
            className="pointer-events-none fixed p-2"
            style={{
              top: hover[0],
              left: hover[1],
            }}
          >
            <table>
              <tbody>
                {bars.map((bar, i) => {
                  const value = values[bar];
                  if (value) {
                    return (
                      <tr key={bar}>
                        <td className={hoverTd}>
                          <div className={"h-4 w-4 " + bgColors[i % bgColors.length]}>&nbsp;</div>
                        </td>
                        <td className={hoverTd}>{bar}</td>
                        <td>{typeof formatValue === "function" ? formatValue(value) : value}</td>
                      </tr>
                    );
                  } else {
                    return null;
                  }
                })}
              </tbody>
            </table>
          </Box>,
          document.body,
        )}
    </div>
  );
}

const InlineStackedBar = memo(InlineStackedBar_base);
export default InlineStackedBar;
