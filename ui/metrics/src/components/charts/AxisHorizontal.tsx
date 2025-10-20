interface AxisHorizontalProps<T> {
  padLeft?: number;
  padTop?: number;
  drawWidth: number;
  drawHeight: number;
  tickSize?: number;
  labelEveryX?: number;
  tickFormatter?: (value: T) => string;
  /** array of all ticks that should be drawn */
  ticks?: Array<T>;
  /** function that when given a tick value returns the x cooridnate for that value */
  scaleTick?: (value: T) => number;
}

const DEFAULT_TICK_SIZE = 6;
const DEFAULT_PAD_LEFT = 0;
const DEFAULT_PAD_TOP = 0;

export default function AxisHorizontal<T>({
  padLeft = DEFAULT_PAD_LEFT,
  padTop = DEFAULT_PAD_TOP,
  drawWidth,
  drawHeight,
  ticks,
  scaleTick,
  tickSize = DEFAULT_TICK_SIZE,
  labelEveryX = 1,
  tickFormatter,
}: AxisHorizontalProps<T>) {
  return (
    <g transform={`translate(${padLeft},${drawHeight + padTop})`} className="text-xs">
      <path
        d={`M0,${tickSize}V0H${drawWidth}V${tickSize}`}
        className="stroke-text fill-none stroke-1"
      />
      {typeof scaleTick === "function" &&
        ticks?.map((category, i) => {
          const x = scaleTick(category);
          const label =
            typeof tickFormatter === "function" ? tickFormatter(category) : "" + category;
          return (
            <g key={"x-tick-" + i} transform={`translate(${x},0)`} textAnchor="middle">
              <line className="stroke-text fill-none stroke-1" x1={0} x2={0} y1={0} y2={tickSize} />
              <text x={0} y={tickSize * 1.5} dy="0.71em" className="fill-text">
                {i % labelEveryX === 0 ? label : ""}
              </text>
            </g>
          );
        })}
    </g>
  );
}
