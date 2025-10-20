import { FilterOptionEntry, CommonFilterProps } from "@/types/filterTypes";
import { useEffect, useState } from "react";
import { IoCheckmark, IoClose } from "react-icons/io5";
import Dropdown from "../basic/Dropdown";
import { OpereratorsCompare } from "@/types/dataApi";

const operators: FilterOptionEntry[] = [
  { value: "", label: "=" },
  { value: ">" },
  { value: ">=" },
  { value: "<" },
  { value: "<=" },
  { value: "!", label: "!=" },
];

export default function FilterNumber({
  filter,
  onSelected,
  onRemoved,
  selectedValues,
}: CommonFilterProps) {
  const activeValue = selectedValues[filter?.path]?.[0]?.value || "";
  const activeOp =
    (selectedValues[filter?.path] as Array<{ operator: string }>)?.[0]?.operator ||
    filter?.defaultOperator ||
    "";
  const [op, setOp] = useState<string>(activeOp);
  const [value, setValue] = useState<string>(activeValue);

  // reset if active value changes (such as from a clear filters)
  useEffect(() => {
    setValue(activeValue);
  }, [activeValue]);

  const handleApply = () => {
    if (value && typeof onSelected === "function") {
      onSelected(filter.path, { value: value, operator: op as OpereratorsCompare });
    } else if (!value && typeof onRemoved === "function") {
      onRemoved(filter.path);
    }
  };

  if (!filter) {
    return undefined;
  }
  return (
    <div className="mb-1">
      <div className="text-sm">{filter.label}</div>
      <div className="flex w-full gap-x-2">
        <div className={(filter.changeOperator ? "w-14" : "w-12") + " shrink-0"}>
          {filter.changeOperator ? (
            <Dropdown fullWidth options={operators} value={op} onSelect={setOp} compact center />
          ) : (
            <div className="w-full border border-zinc-600 bg-white px-2 text-center dark:bg-neutral-950 dark:text-zinc-200">
              {filter.defaultOperator || "="}
            </div>
          )}
        </div>
        <input
          className="input-main grow px-2"
          type="number"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
          }}
        />
        <button
          type="button"
          disabled={!value || (activeValue === value && activeOp === op)}
          className="btn-main shrink-0 rounded px-1"
          onClick={handleApply}
        >
          <IoCheckmark />
        </button>
        <button
          type="button"
          disabled={!value}
          className="btn-main shrink-0 rounded px-1"
          onClick={() => {
            setValue("");
            if (typeof onRemoved === "function") {
              onRemoved(filter.path);
            }
          }}
        >
          <IoClose />
        </button>
      </div>
    </div>
  );
}
