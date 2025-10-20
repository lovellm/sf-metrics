import { useEffect, useMemo, useRef, useState } from "react";
import { LuPanelLeftClose, LuPanelLeftOpen } from "react-icons/lu";
import useAppState from "@/context/useAppState";
import {
  FilterPanelConfig,
  SelectedValues,
  HandleSelectedOption,
  HandleRemoveOption,
} from "@/types/filterTypes";
import FilterSection from "./FilterSection";
import { createHandleRemoveOption, createHandleSelectOption } from "@/utils/filterUtils";

export interface FilterPanelProps {
  config?: FilterPanelConfig;
  localStorageKey?: string;
  onApply?: (filters: SelectedValues) => void;
}

const createOptionsFromLocalStorage = (key?: string): (() => SelectedValues) => {
  return () => {
    if (!key) {
      return {};
    }
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved) as unknown;
        if (parsed) {
          return parsed as SelectedValues;
        }
      }
    } catch (e) {
      console.error("error loading selected filter options from local storage", e);
    }
    return {};
  };
};

export default function FilterPanel({ config, localStorageKey, onApply }: FilterPanelProps) {
  const [{ isFiltersOpen }, dispatch] = useAppState();
  const [needsApply, setNeedsApply] = useState<boolean>(false);
  /** function to generate default selected options from a saved localStorage string */
  const optionsFromLocalStorage = useMemo(() => {
    return createOptionsFromLocalStorage(localStorageKey);
  }, [localStorageKey]);
  const [selectedOptions, setSelectedOptions] = useState<SelectedValues>(optionsFromLocalStorage);
  const [appliedOptions, setAppliedOptions] = useState<SelectedValues>(optionsFromLocalStorage);
  const didFirstApply = useRef<boolean>(false);
  const [clearTime, setClearTime] = useState<number>(0);

  /** add value to the selectedOptions for path */
  const handleSelectOption = useMemo<HandleSelectedOption>(
    () => createHandleSelectOption(setSelectedOptions, config, setNeedsApply),
    [config],
  );

  /** remove value from the selectedOptions forpath */
  const handleRemoveOption = useMemo<HandleRemoveOption>(
    () => createHandleRemoveOption(setSelectedOptions, setNeedsApply),
    [],
  );

  // apply selectedOptions to appliedOptions
  const handleApply = () => {
    setAppliedOptions(selectedOptions);
    setNeedsApply(false);
    if (typeof onApply === "function") {
      onApply(selectedOptions);
    }
  };

  // first time we have an onApply function, apply the options from local storage
  useEffect(() => {
    if (!didFirstApply.current) {
      if (typeof onApply === "function") {
        didFirstApply.current = true;
        onApply(optionsFromLocalStorage());
      }
    }
  }, [onApply, optionsFromLocalStorage]);

  // update local storage when applied options change
  useEffect(() => {
    if (localStorageKey) {
      const text = JSON.stringify(appliedOptions);
      localStorage.setItem(localStorageKey, text);
    }
  }, [appliedOptions, localStorageKey]);

  const reallyNeedsApply = useMemo<boolean>(() => {
    if (!needsApply) {
      return false;
    }
    return JSON.stringify(selectedOptions) !== JSON.stringify(appliedOptions);
  }, [needsApply, selectedOptions, appliedOptions]);

  return (
    <div
      className={`box relative m-2 min-h-8 shrink-0 overflow-x-clip overflow-y-auto ${isFiltersOpen ? "pb-40" : ""}`}
    >
      <button
        type="button"
        className="absolute top-0 right-0 cursor-pointer rounded-full p-1 text-xl hover:bg-fuchsia-500"
        onClick={() => {
          dispatch({ type: "toggleFiltersOpen" });
        }}
      >
        {isFiltersOpen ? <LuPanelLeftClose /> : <LuPanelLeftOpen />}
      </button>
      {isFiltersOpen && <div className="text-xl font-bold">Filters</div>}
      {/* Clear / Apply Buttons */}
      {isFiltersOpen && (
        <div className="my-2">
          <button
            type="button"
            className="btn-outline cursor-pointer rounded-tl-2xl rounded-bl-2xl px-6 py-1"
            onClick={() => {
              setAppliedOptions({});
              setSelectedOptions({});
              setNeedsApply(false);
              setClearTime(new Date().valueOf());
              if (typeof onApply === "function") {
                onApply({});
              }
            }}
          >
            Clear
          </button>
          <button
            type="button"
            disabled={!reallyNeedsApply}
            className={`btn-main btn-main-disabled cursor-pointer rounded-tr-2xl rounded-br-2xl border px-6 py-1 disabled:cursor-not-allowed ${reallyNeedsApply ? "animate-subtle-ping" : ""}`}
            onClick={handleApply}
          >
            Apply
          </button>
        </div>
      )}
      {/* Filter Contents */}
      {isFiltersOpen && (
        <div>
          {config?.map((section, i) => (
            <FilterSection
              key={i}
              section={section}
              selectedValues={selectedOptions}
              onRemoved={handleRemoveOption}
              onSelected={handleSelectOption}
              clearTime={clearTime}
            />
          ))}
        </div>
      )}
    </div>
  );
}
