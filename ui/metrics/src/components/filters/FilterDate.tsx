import { useEffect, useState } from "react";
import { CommonFilterProps } from "@/types/filterTypes";
import { getEndFilterPath } from "@/utils/filterUtils";

/** date filter input. ignores server side config. adds a fake filterPath entry to selectedValues for the end value */
export default function FilterDate({
  filter,
  onRemoved,
  onSelected,
  selectedValues,
}: CommonFilterProps) {
  const filterPath = filter?.path || "";
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const existingStart = selectedValues?.[filterPath]?.[0]?.value || "";
  const existingEnd = selectedValues?.[getEndFilterPath(filterPath)]?.[0]?.value || "";
  // if given values change, update local values (such as reset or loaded bookmark)
  useEffect(() => {
    setStartDate(existingStart);
    setEndDate(existingEnd);
  }, [existingStart, existingEnd]);

  if (!filter) {
    return undefined;
  }

  return (
    <div className="mb-1">
      {filter.label && <div className="text-sm">{filter.label}</div>}
      <div className="border-main flex flex-wrap justify-between gap-y-1 rounded border p-2 dark:bg-black">
        <div className="flex flex-row items-center">
          <input
            type="date"
            className={
              "input-main border-main w-36 cursor-text resize-none rounded border px-1 pt-1 " +
              (!startDate ? "text-zinc-400 dark:text-zinc-600" : "")
            }
            value={startDate}
            onChange={(e) => {
              const next = e.target.value;
              setStartDate(next);
              if (next) {
                onSelected(filterPath, { value: next, operator: ">=" }, true);
              } else {
                onRemoved(filterPath, undefined);
              }
            }}
          />
        </div>
        <div className="flex flex-row items-center">
          <input
            type="date"
            className={
              "input-main border-main w-36 cursor-text resize-none rounded border px-1 pt-1 " +
              (!endDate ? "text-zinc-400 dark:text-zinc-600" : "")
            }
            value={endDate}
            onChange={(e) => {
              const next = e.target.value;
              setEndDate(next);
              if (next) {
                onSelected(getEndFilterPath(filterPath), { value: next, operator: "<=" }, true);
              } else {
                onRemoved(getEndFilterPath(filterPath), undefined);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
