import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Box from "../basic/Box";
import { bytesToGbString, formatStorageCost } from "@/utils/formatters";
import { sizeBreakdownBGs, sizeBreakdownFills } from "@/constants";

export interface DbSizeBuckets {
  active_bytes?: number;
  time_travel_bytes?: number;
  failsafe_bytes?: number;
  retained_for_clone_bytes?: number;
  total_bytes?: number;
}
export interface DbSizePercs {
  active_perc?: number;
  time_travel_perc?: number;
  failsafe_perc?: number;
  retain_for_clone_perc?: number;
}

const emptyData: DbSizePercs & DbSizeBuckets = {};
type StorageBreakdownProps = {
  width?: number;
  height?: number;
  data?: DbSizePercs & DbSizeBuckets;
};
type BreakdownType = "active" | "timetravel" | "failsafe" | "clone";
interface RectInfo {
  x: number;
  width: number;
  className: string;
  id: BreakdownType;
}
type ShowHover = [number, number];
const hoverTd = "px-2 py-1 whitespace-nowrap text-sm";

export default function StorageBreakdown({
  width = 100,
  height = 20,
  data = emptyData,
}: StorageBreakdownProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<ShowHover | undefined>(undefined);
  const rects = useMemo(() => {
    const rects: RectInfo[] = [];
    let runningX = 0;
    if (data.active_perc && data.active_perc > 0) {
      rects.push({
        id: "active",
        x: runningX,
        width: width * data.active_perc,
        className: sizeBreakdownFills.active,
      });
      runningX += width * data.active_perc;
    }
    if (data.time_travel_perc && data.time_travel_perc > 0) {
      rects.push({
        id: "timetravel",
        x: runningX,
        width: width * data.time_travel_perc,
        className: sizeBreakdownFills.timetravel,
      });
      runningX += width * data.time_travel_perc;
    }
    if (data.failsafe_perc && data.failsafe_perc > 0) {
      rects.push({
        id: "failsafe",
        x: runningX,
        width: width * data.failsafe_perc,
        className: sizeBreakdownFills.failsafe,
      });
      runningX += width * data.failsafe_perc;
    }
    if (data.retain_for_clone_perc && data.retain_for_clone_perc > 0) {
      rects.push({
        id: "clone",
        x: runningX,
        width: width * data.retain_for_clone_perc,
        className: sizeBreakdownFills.clone,
      });
      runningX += width * data.retain_for_clone_perc;
    }
    return rects;
  }, [width, data]);

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
                <tr>
                  <td className={hoverTd}>
                    <div className={"h-4 w-4 " + sizeBreakdownBGs.active}>&nbsp;</div>
                  </td>
                  <td className={hoverTd}>Active</td>
                  <td className={hoverTd}>{bytesToGbString(data.active_bytes || 0)} GB</td>
                  <td className={hoverTd}>{formatStorageCost(data.active_bytes || 0)}</td>
                </tr>
                <tr>
                  <td className={hoverTd}>
                    <div className={"h-4 w-4 " + sizeBreakdownBGs.timetravel}>&nbsp;</div>
                  </td>
                  <td className={hoverTd}>Time Travel</td>
                  <td className={hoverTd}>{bytesToGbString(data.time_travel_bytes || 0)} GB</td>
                  <td className={hoverTd}>{formatStorageCost(data.time_travel_bytes || 0)}</td>
                </tr>
                <tr>
                  <td className={hoverTd}>
                    <div className={"h-4 w-4 " + sizeBreakdownBGs.failsafe}>&nbsp;</div>
                  </td>
                  <td className={hoverTd}>Failsafe</td>
                  <td className={hoverTd}>{bytesToGbString(data.failsafe_bytes || 0)} GB</td>
                  <td className={hoverTd}>{formatStorageCost(data.failsafe_bytes || 0)}</td>
                </tr>
                <tr>
                  <td className={hoverTd}>
                    <div className={"h-4 w-4 " + sizeBreakdownBGs.clone}>&nbsp;</div>
                  </td>
                  <td className={hoverTd}>Clones</td>
                  <td className={hoverTd}>
                    {bytesToGbString(data.retained_for_clone_bytes || 0)} GB
                  </td>
                  <td className={hoverTd}>
                    {formatStorageCost(data.retained_for_clone_bytes || 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </Box>,
          document.body,
        )}
    </div>
  );
}
