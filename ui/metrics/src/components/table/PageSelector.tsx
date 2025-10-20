import { useCallback, useMemo } from "react";
import { IoPlayBack, IoPlayForward, IoPlaySkipBack, IoPlaySkipForward } from "react-icons/io5";

interface PageSelectorProps {
  /** 0-indexed page number */
  page?: number;
  /** size of each page */
  pageSize?: number;
  /** length of dataset to be paged */
  length?: number;
  /** options for changing page size */
  sizeOptions?: number[];
  /** callback when page is changed */
  onPageChange?: (nextPage: number) => void;
  /** callback when page size is changed */
  onSizeChange?: (nextSize: number) => void;
  /** where to align. default center */
  align?: "left" | "right" | "center";
  disabled?: boolean;
}
const defaultPageSize = 30;
const buttonClass =
  "cursor-pointer hover:bg-fuchsia-500 dark:hover:bg-fuchsia-500 text-default px-2 py-1 bg-zinc-400 dark:bg-zinc-600 disabled:cursor-not-allowed";

export default function PageSelector({
  page,
  pageSize,
  length,
  onPageChange,
  align,
  sizeOptions,
  onSizeChange,
  disabled,
}: PageSelectorProps) {
  const currentPage = page || 0;
  const currentSize = pageSize || defaultPageSize;
  const maxPage = length ? Math.ceil(length / currentSize) - 1 : undefined;

  const isFirst = currentPage <= 0;
  const isLast = maxPage !== undefined && currentPage >= maxPage;

  let className = "";
  let isCenter = false;
  if (align === "left") {
    className += " justify-start";
  } else if (align === "right") {
    className += " justify-end";
  } else {
    className += " justify-between";
    isCenter = true;
  }

  /** callback to set the page */
  const setPage = useCallback(
    (next: number) => {
      if (typeof onPageChange === "function") {
        if (next <= 0) {
          onPageChange(0);
        } else if (maxPage !== undefined && next >= maxPage) {
          onPageChange(maxPage);
        } else {
          onPageChange(next);
        }
      }
    },
    [maxPage, onPageChange],
  );

  /** options for page size, or undefined */
  const pageSizeOptions = useMemo(() => {
    if (!sizeOptions || !sizeOptions.length) {
      return undefined;
    }
    return sizeOptions.map((n) => ({ value: n, label: n + " per page" }));
  }, [sizeOptions]);

  return (
    <div className={className + " flex items-stretch text-sm"}>
      <div className="flex items-center text-lg">
        <button
          type="button"
          disabled={isFirst || disabled}
          title="First Page"
          className={buttonClass}
          onClick={() => {
            setPage(0);
          }}
        >
          <IoPlaySkipBack />
        </button>
        <button
          type="button"
          disabled={isFirst || disabled}
          title="Previous Page"
          className={buttonClass}
          onClick={() => {
            setPage(currentPage - 1);
          }}
        >
          <IoPlayBack />
        </button>
      </div>
      <div
        className={
          "flex items-center justify-center border border-zinc-400 px-4 dark:border-zinc-600" +
          (isCenter ? " flex-grow" : "")
        }
      >
        <span>Page {currentPage + 1}</span>
        {maxPage !== undefined && <span>&nbsp;/&nbsp;{maxPage + 1}</span>}
        {pageSizeOptions && (
          <select
            className="border-main ml-4 rounded border"
            value={"" + pageSize}
            onChange={(e) => {
              if (typeof onSizeChange === "function") {
                onSizeChange(+e.target.value);
              }
            }}
          >
            {pageSizeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="flex items-center text-lg">
        <button
          type="button"
          disabled={isLast || disabled}
          title="Next Page"
          className={buttonClass}
          onClick={() => {
            setPage(currentPage + 1);
          }}
        >
          <IoPlayForward />
        </button>
        <button
          type="button"
          disabled={isLast || maxPage === undefined || disabled}
          title="LastPage"
          className={buttonClass}
          onClick={() => {
            if (maxPage !== undefined) {
              setPage(maxPage);
            }
          }}
        >
          <IoPlaySkipForward />
        </button>
      </div>
    </div>
  );
}
