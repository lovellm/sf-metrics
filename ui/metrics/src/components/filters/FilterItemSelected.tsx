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
    <div className="bg-accent text-lightGray mx-1 mb-1 inline-block rounded pl-1 text-sm">
      <div className="flex items-center">
        {text}
        <button
          type="button"
          className="hover:bg-accent-medium hover:text-accent-link ml-1 rounded p-1 text-lg font-bold"
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
