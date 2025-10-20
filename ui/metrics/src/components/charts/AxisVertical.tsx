interface AxisVerticalProps<T> {
  offsetLeft: number;
  axisWidth?: number;
  padTop?: number;
  drawWidth: number;
  drawHeight: number;
  tickSize?: number;
  tickFormatter?: (value: T) => string;
  /** array of all ticks that should be drawn */
  ticks?: Array<T>;
  /** function that when given a tick value returns the x cooridnate for that value */
  scaleTick?: (value: T) => number;
  label?: string;
  side?: "left" | "right";
}

const DEFAULT_TICK_SIZE = 6;
const DEFAULT_PAD_LEFT = 0;
const DEFAULT_PAD_TOP = 0;

export default function AxisVertical<T>({
  offsetLeft,
  axisWidth = DEFAULT_PAD_LEFT,
  padTop = DEFAULT_PAD_TOP,
  drawHeight,
  ticks,
  scaleTick,
  tickSize = DEFAULT_TICK_SIZE,
  tickFormatter,
  label,
  side = "left",
}: AxisVerticalProps<T>) {
  const sign = side === "left" ? -1 : 1;
  const labelOffset = side === "left" ? 14 : -4;
  return (
    <g transform={`translate(${offsetLeft},${padTop})`} className="text-xs">
      <path
        d={`M${sign * tickSize},0H${0}V${drawHeight}H${sign * tickSize}`}
        className="stroke-text fill-none stroke-1"
      />
      {typeof scaleTick === "function" &&
        ticks?.map((tick, i) => {
          const tickLabel =
            typeof tickFormatter === "function" ? tickFormatter(tick) : (tick as string);
          return (
            <g
              key={"y-tick-" + i}
              transform={`translate(0,${scaleTick(tick)})`}
              textAnchor={side === "left" ? "end" : "start"}
            >
              <line
                className="stroke-text fill-none stroke-1"
                x1={sign * tickSize}
                x2={0}
                y1={0}
                y2={0}
              />
              <text x={tickSize * sign * 1.5} dy="0.32em" className="fill-text">
                {tickLabel}
              </text>
            </g>
          );
        })}
      {label && (
        <text
          x={sign * axisWidth + labelOffset}
          y={drawHeight * 0.75}
          transform={`rotate(-90, ${sign * axisWidth + labelOffset * 0.8}, ${drawHeight * 0.75})`}
          className="fill-text"
        >
          {label || ""}
        </text>
      )}
    </g>
  );
}
