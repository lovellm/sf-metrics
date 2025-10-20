import { CommonFilterProps } from "@/types/filterTypes";
import Toggle from "../basic/Toggle";

export default function FilterToggle({
  filter,
  onSelected,
  onRemoved,
  selectedValues,
}: CommonFilterProps) {
  const value = selectedValues?.[filter.path]?.[0]?.value;

  const handleToggle = (next: boolean) => {
    if (next && typeof onSelected === "function") {
      onSelected(filter.path, { value: "TRUE" }, true);
    } else if (!next && typeof onRemoved === "function") {
      onRemoved(filter.path);
    }
  };

  if (!filter) {
    return undefined;
  }
  return (
    <div className="my-2">
      <label className="flex flex-wrap items-center gap-x-2 text-sm">
        {filter.label}
        <Toggle checked={!!value} onToggle={handleToggle} dimInactive />
      </label>
      {filter.info && <div className="text-sm italic">{filter.info}</div>}
    </div>
  );
}
