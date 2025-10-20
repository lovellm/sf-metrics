import { FilterOptionEntry, HandleRemoveOption } from "@/types/filterTypes";
import { useMemo } from "react";
import { IoClose } from "react-icons/io5";

interface FilterItemSelectedProps {
  path: string;
  value: FilterOptionEntry;
  onRemoved?: HandleRemoveOption;
}
export default function FilterItemSelected({ path, value, onRemoved }: FilterItemSelectedProps) {
  const text = useMemo<string>(() => {
    if (!value?.value) {
      return "";
    }
    if (value.label) {
      return value.label;
    }
    return "" + value.value;
  }, [value]);

  return (
    <div className="mx-1 mb-1 inline-block rounded bg-fuchsia-600 pl-1 text-sm text-zinc-200">
      <div className="flex items-center">
        {text}
        <button
          type="button"
          className="ml-1 rounded p-1 text-lg font-bold hover:bg-purple-600"
          onClick={(e) => {
            e.stopPropagation();
            if (typeof onRemoved === "function") {
              onRemoved(path, value.value);
            }
          }}
        >
          <IoClose />
        </button>
      </div>
    </div>
  );
}
