import { TbCaretDownFilled, TbCaretUpDownFilled, TbCaretUpFilled } from "react-icons/tb";
import {
  CellTextAlignment,
  nextDirection,
  SortDirection,
  SortEntry,
  TableColumn,
} from "./TableTypes";

export interface SortableHeaderProps {
  children?: React.ReactNode;
  align?: CellTextAlignment;
  accessor: string;
  currentSort?: SortEntry[];
  onSort?: (accessor: string, nextDir?: SortDirection) => void;
}

export interface SortableTableColumn<T> extends TableColumn<T> {
  sortable?: boolean;
}

export default function SortableHeader({
  accessor,
  children,
  currentSort,
  onSort,
  align,
}: SortableHeaderProps) {
  const currentDir = currentSort?.find((s) => s.accessor === accessor)?.direction;
  let textAlign = "grow";
  if (align === "right") {
    textAlign += " text-right";
  } else if (align === "center") {
    textAlign += " text-center";
  } else {
    textAlign += " text-left";
  }
  return (
    <button
      type="button"
      className="flex w-full items-center select-none"
      onClick={() => {
        if (typeof onSort === "function") {
          const nextDir = nextDirection(currentDir);
          onSort(accessor, nextDir);
        }
      }}
    >
      <span className="flex-shrink-0">
        {currentDir === 1 && <TbCaretUpFilled />}
        {currentDir === -1 && <TbCaretDownFilled />}
        {currentDir === undefined && <TbCaretUpDownFilled />}
      </span>
      <div className={textAlign}>{children}</div>
    </button>
  );
}
