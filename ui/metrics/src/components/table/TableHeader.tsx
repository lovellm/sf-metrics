import React, { useState, useRef, useCallback, CSSProperties } from "react";
import { ExtraHeader, TableColumn } from "./TableTypes";
import { basicTableHeader } from "../../constants";

export type TableHeaderProps<T> = {
  /** The TableColumn this header represents. Must be reference stable or strange stuff will happen. */
  column: TableColumn<T> | ExtraHeader;
  /** The currently highlighted accessor */
  highlightColumn?: string;
  /** Callback to set the highlighted accessor to this one */
  onHighlightColumn?: React.Dispatch<string>;
  /** Callback after a resize happens. Must be reference stable or strange stuff will happen. */
  onResizeFinished?: () => void;
  /** if true, ignore resize */
  noResize?: boolean;
};

interface DragInfo {
  currentWidth: number;
  lastX: number;
  startX?: number;
  startWidth?: number;
}

export const DEFAULT_WIDTH = 130;
const MIN_COLUMN_WIDTH = 30;

export default function TableHeader<T>(props: TableHeaderProps<T>) {
  const { column, highlightColumn, onHighlightColumn, onResizeFinished } = props;
  const [columnWidth, setColumnWidth] = useState(
    column._resizeWidth || column.width || DEFAULT_WIDTH,
  );
  // false if never dragged, true while dragging, Date of drag end after drag
  const [isDragging, setIsDragging] = useState<boolean | Date>(false);
  const dragRef = useRef({});
  const dragInfo = dragRef.current as DragInfo;
  dragInfo.currentWidth = columnWidth;

  /** Prevents scrolling on touch move when resizing a column */
  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
  }, []);

  /** Handles a pointer move to drag a handle */
  const handleDrag = useCallback(
    (e: PointerEvent) => {
      // Prevent Default to stop text highlighting
      e.preventDefault();
      e.stopPropagation();

      const move = e.clientX - dragInfo.lastX; // Movement relative to prior x
      dragInfo.lastX = e.clientX;
      const newWidth = dragInfo.currentWidth + move;
      if (newWidth <= MIN_COLUMN_WIDTH) {
        setColumnWidth(MIN_COLUMN_WIDTH);
      } else {
        setColumnWidth(newWidth);
      }
      column._resizeWidth = newWidth;
    },
    [dragInfo, column],
  );

  /** Handles a pointer up to end a drag */
  const handleDragEnd = useCallback(() => {
    // Track when the drag end to avoid conflicting with onClick events
    setIsDragging(new Date());
    window.document.removeEventListener("touchmove", handleTouchMove);
    window.document.removeEventListener("pointerup", handleDragEnd);
    window.document.removeEventListener("pointermove", handleDrag);
    if (typeof onResizeFinished === "function") {
      onResizeFinished();
    }
  }, [handleDrag, handleTouchMove, onResizeFinished]);

  /** Handles a pointer down to initiate a potential drag event */
  const handleDragStart = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Ignore clicks other than left click
      if (typeof e.button === "number" && e.button !== 0) {
        return;
      }
      e.preventDefault();
      dragInfo.startX = e.clientX;
      dragInfo.lastX = e.clientX;
      dragInfo.startWidth = dragInfo.currentWidth;
      setIsDragging(true);
      window.document.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.document.addEventListener("pointerup", handleDragEnd);
      window.document.addEventListener("pointermove", handleDrag);
    },
    [dragInfo, handleDragEnd, handleDrag, handleTouchMove],
  );

  // extra headers will have width dynamically set, not in state, so override state with prop width
  const finalWidth = props.noResize ? column.width || DEFAULT_WIDTH : columnWidth;

  // add style attributes
  const style: CSSProperties = {
    position: "relative",
    width: finalWidth + "px",
    minWidth: MIN_COLUMN_WIDTH,
    maxWidth: finalWidth + "px",
    left: column.fixed === "left" ? column._fixedLeft : undefined,
    right: column.fixed === "right" ? column._fixedRight : undefined,
    overflow: "hidden",
    textOverflow: "ellipsis",
  };
  if (column.fixed) {
    style.position = "sticky";
    style.zIndex = 5;
    style.boxSizing = "border-box";
  }
  if (column.align) {
    style.textAlign = column.align;
  }

  // add class name
  let className: string = column.headerClass || basicTableHeader;
  if (column.accessor === highlightColumn) {
    if (className) {
      className += " highlight";
    } else {
      className = "highlight";
    }
  }

  let headerValue: React.ReactNode = column.accessor;
  if (typeof column.Header === "function") {
    headerValue = column.Header();
  } else if ("Header" in column) {
    headerValue = column.Header;
  }

  return (
    <th
      id={`${column.key || column.accessor}Header`}
      style={style}
      colSpan={column.colSpan && column.colSpan > 0 ? column.colSpan : undefined}
      className={`${className}`}
      onClick={() => {
        let shouldClick = true;
        // Dragging is a date means we ended a drag on this column.
        // If is was <200ms ago, don't click, as it may be due to pointer up being over header instead of resize handle
        if (isDragging instanceof Date) {
          if (new Date().valueOf() - isDragging.valueOf() < 200) {
            shouldClick = false;
          }
        }
        if (column.accessor && shouldClick && typeof onHighlightColumn === "function") {
          onHighlightColumn(column.accessor);
        }
      }}
    >
      <div>{headerValue}</div>
      {!props.noResize && !column.fixedSize && (
        <div
          style={{
            position: "absolute",
            cursor: "col-resize",
            width: "7px",
            right: 0,
            top: 0,
            zIndex: 5,
            height: "100%",
            backgroundColor: isDragging === true ? "bg-slate-500" : undefined,
          }}
          className={"hover:bg-slate-500 " + (isDragging === true ? "bg-slate-500" : "")}
          onPointerDown={handleDragStart}
        />
      )}
    </th>
  );
}
