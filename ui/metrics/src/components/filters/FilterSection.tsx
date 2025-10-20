import { useState } from "react";
import { IoCaretDown, IoCaretUp } from "react-icons/io5";
import {
  FilterSectionConfig,
  HandleRemoveOption,
  HandleSelectedOption,
  SelectedValues,
} from "@/types/filterTypes";
import FilterBulk from "./FilterBulk";
import FilterDropdown from "./FilterDropdown";
import FilterDate from "./FilterDate";
import FilterNumber from "./FilterNumber";
import FilterDuration from "./FilterDuration";
import FilterToggle from "./FilterToggle";
import FilterTimestamp from "./FilterTimestamp";
import FilterText from "./FilterText";

interface FilterSectionProps {
  /** a number that when changed will completely reset a filter component state */
  clearTime?: number;
  section: FilterSectionConfig;
  onSelected: HandleSelectedOption;
  onRemoved: HandleRemoveOption;
  selectedValues: SelectedValues;
}
export default function FilterSection({
  section,
  onSelected,
  onRemoved,
  selectedValues,
  clearTime,
}: FilterSectionProps) {
  const [open, setOpen] = useState<boolean>(!section?.startCollapsed);

  if (!section) {
    return undefined;
  }
  const showLabel = !!section.label && section.showLabel === true;

  return (
    <div className={showLabel ? "border-t border-zinc-400 last:border-b dark:border-zinc-800" : ""}>
      {showLabel && (
        <button
          type="button"
          className="flex w-full items-center justify-between px-2 py-1 text-sm font-bold text-fuchsia-700 hover:bg-fuchsia-600 hover:text-white dark:text-fuchsia-400"
          onClick={() => {
            setOpen(!open);
          }}
        >
          <span>{section.label}</span>
          {open ? <IoCaretUp /> : <IoCaretDown />}
        </button>
      )}
      {open && (
        <div className={showLabel ? "px-2 pb-2" : ""}>
          {section.filters.map((filter) => {
            if (!filter) {
              return undefined;
            }
            switch (filter.type) {
              case "dropdown":
              case "dropdownbulk":
                return (
                  <FilterDropdown
                    key={filter.label + (clearTime || 0)}
                    filter={filter}
                    onRemoved={onRemoved}
                    onSelected={onSelected}
                    selectedValues={selectedValues}
                  />
                );
              case "text":
                return (
                  <FilterText
                    key={filter.label + (clearTime || 0)}
                    filter={filter}
                    onRemoved={onRemoved}
                    onSelected={onSelected}
                    selectedValues={selectedValues}
                  />
                );
              case "bulk":
                return (
                  <FilterBulk
                    key={filter.label + (clearTime || 0)}
                    filter={filter}
                    onRemoved={onRemoved}
                    onSelected={onSelected}
                    selectedValues={selectedValues}
                  />
                );
              case "date":
                return (
                  <FilterDate
                    key={filter.label}
                    filter={filter}
                    onRemoved={onRemoved}
                    onSelected={onSelected}
                    selectedValues={selectedValues}
                  />
                );
              case "number":
                return (
                  <FilterNumber
                    key={filter.label}
                    filter={filter}
                    onRemoved={onRemoved}
                    onSelected={onSelected}
                    selectedValues={selectedValues}
                  />
                );
              case "duration":
                return (
                  <FilterDuration
                    key={filter.label}
                    filter={filter}
                    onRemoved={onRemoved}
                    onSelected={onSelected}
                    selectedValues={selectedValues}
                  />
                );
              case "toggle":
                return (
                  <FilterToggle
                    key={filter.label}
                    filter={filter}
                    onRemoved={onRemoved}
                    onSelected={onSelected}
                    selectedValues={selectedValues}
                  />
                );
              case "timestamp": {
                return (
                  <FilterTimestamp
                    key={filter.label}
                    filter={filter}
                    onRemoved={onRemoved}
                    onSelected={onSelected}
                    selectedValues={selectedValues}
                  />
                );
              }
            }
            return (
              <div key={filter.label}>
                {filter.label}: Not Implemented Type: {filter.type}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
