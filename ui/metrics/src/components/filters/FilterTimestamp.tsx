import { CommonFilterProps, FilterOptionEntry } from "@/types/filterTypes";
import { useEffect, useState } from "react";
import Dropdown from "../basic/Dropdown";
import { OpereratorsCompare } from "@/types/dataApi";

interface FilterTimestampProps extends CommonFilterProps {
  operator?: OpereratorsCompare;
}

const defaultOperator = ">=";
const operators: FilterOptionEntry[] = [
  { value: ">" },
  { value: ">=" },
  { value: "<" },
  { value: "<=" },
];

/** date filter input. ignores server side config. adds a fake filterPath entry to selectedValues for the end value */
export default function FilterTimestamp({
  filter,
  onRemoved,
  onSelected,
  selectedValues,
  operator,
}: FilterTimestampProps) {
  const activeValue = selectedValues[filter?.path]?.[0]?.value || "";
  const filterPath = filter?.path || "";
  const [startDate, setStartDate] = useState<string>(activeValue);
  const activeOp =
    (selectedValues[filter?.path] as Array<{ operator: string }>)?.[0]?.operator ||
    filter?.defaultOperator ||
    defaultOperator;
  const [op, setOp] = useState<string>(activeOp);

  const existingStart = selectedValues?.[filterPath]?.[0]?.value || "";
  // if given values change, update local values (such as reset or loaded bookmark)
  useEffect(() => {
    setStartDate(existingStart);
  }, [existingStart]);

  if (!filter) {
    return undefined;
  }

  return (
    <div className="mb-1">
      {filter.label && <div className="text-sm">{filter.label}</div>}
      <div className="border-main flex flex-wrap justify-between gap-y-1 rounded border py-1 pr-1 dark:bg-black">
        <div className="flex flex-row items-center">
          <div className="px-1">
            {filter.changeOperator ? (
              <Dropdown fullWidth options={operators} value={op} onSelect={setOp} compact center />
            ) : (
              <div className="w-full text-center dark:text-zinc-200">
                {filter.defaultOperator || defaultOperator}
              </div>
            )}
          </div>
          <input
            type="datetime-local"
            className={
              "input-main w-48 cursor-text resize-none rounded px-1 pt-1 " +
              (!startDate ? "text-zinc-400 dark:text-zinc-600" : "")
            }
            value={startDate}
            onChange={(e) => {
              const next = e.target.value;
              setStartDate(next);
              if (next) {
                onSelected(filterPath, { value: next, operator: operator || ">=" }, true);
              } else {
                onRemoved(filterPath, undefined);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
