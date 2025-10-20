export interface HoverPosition {
  x: number;
  xOffset?: number;
  y: number;
  chartWidth: number;
  rect?: DOMRect;
}
interface HoverBoxProps {
  children?: React.ReactNode;
  position: HoverPosition;
}
/** renders the hover content for the scatter chart */
export default function HoverBox({ position, children }: HoverBoxProps): React.ReactNode {
  // determine positions
  const offsetLeft = position.rect?.left || 0;
  const offsetTop = position.rect?.top || 0;
  const offsetRight = document.body.clientWidth - (position.rect?.right || 0);
  const left =
    position.x <= position.chartWidth / 2
      ? offsetLeft + position.x + (position.xOffset || 0)
      : undefined;
  const right =
    position.x > position.chartWidth / 2
      ? offsetRight + position.chartWidth - position.x + (position.xOffset || 0)
      : undefined;
  return (
    <div
      className="pointer-events-none fixed"
      style={{
        top: offsetTop + position.y,
        left: left,
        right: right,
        maxWidth: position.chartWidth ? position.chartWidth * 0.45 : undefined,
      }}
    >
      {children}
    </div>
  );
}
