import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import getFilterOptions, { getRemoteFilterOptions, limitFilterOptions } from "./getFilterOptions";
import FilterDropdownUi from "./FilterDropdownUi";
import Toggle from "../basic/Toggle";
import FilterBulkLookup from "./FilterBulkLookup";
import { FilterOptionEntry, CommonFilterProps } from "@/types/filterTypes";

interface FilterDropdownProps extends CommonFilterProps {
  preLoadOptions?: boolean;
  larger?: boolean;
  single?: boolean;
}

export default function FilterDropdown({
  filter,
  onSelected,
  onRemoved,
  selectedValues,
  preLoadOptions,
  larger,
  single,
}: FilterDropdownProps) {
  const [initialPreload] = useState<boolean>(preLoadOptions || false);
  const [active, setActive] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [searchDebounce, setSearchDebounce] = useState<string>("");
  const [options, setOptions] = useState<FilterOptionEntry[]>([]);
  const [pending, setPending] = useState<boolean>(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const didInitialOptions = useRef<boolean>(false);
  const [bulkActive, setBulkActive] = useState<boolean>(false);

  const filterPath = filter?.path || "";

  /** function tha will load options from getFilterOptions (unknown or serverSide will get empty array) */
  const loadOptions = useCallback(() => {
    didInitialOptions.current = true;
    setPending(true);
    setError(undefined);
    getFilterOptions(filterPath)
      .then((data) => {
        setPending(false);
        setOptions(data);
      })
      .catch((e) => {
        didInitialOptions.current = false;
        setPending(false);
        setError(e as Error);
        console.error("error getting filter options for " + filterPath, e);
      });
  }, [filterPath]);

  /** if dropdown open and not yet retrieved options, retrieve options */
  const loadDataOnFirstActive = useCallback(
    (next: boolean) => {
      if (next === true && !didInitialOptions.current) {
        loadOptions();
      }
      setActive(next);
    },
    [loadOptions],
  );

  // debounce search changes
  useEffect(() => {
    if (!search) {
      // if search is empty, set immediately instead of debouncing
      setSearchDebounce(search);
      return undefined;
    }
    const t = setTimeout(() => {
      setSearchDebounce(search);
    }, 300);

    return () => {
      clearTimeout(t);
    };
  }, [search]);

  // if preLoadOptions, retrieve all possible options if filterPath changes
  useEffect(() => {
    if (initialPreload && !didInitialOptions.current) {
      loadOptions();
    }
  }, [loadOptions, initialPreload]);

  // for server side filters, get options as search value changes
  useEffect(() => {
    let cancel = false;
    if (active && filter.serverSide) {
      if (!searchDebounce) {
        // no search specified
        setOptions([]);
        setPending(false);
      } else if (
        !filter.serverSide.minSearch ||
        searchDebounce.length >= filter.serverSide.minSearch
      ) {
        // no minimum search, or minimum reach, perform search
        setPending(true);
        setError(undefined);
        getRemoteFilterOptions(filter.serverSide, searchDebounce, selectedValues)
          .then((data) => {
            if (!cancel) {
              setOptions(data);
              setPending(false);
            }
          })
          .catch((e) => {
            if (!cancel) {
              setPending(false);
              setError(e as Error);
              console.error(e);
            }
          });
      } else {
        // went below minimum search terms, cancel pending
        if (!cancel) {
          setOptions([]);
          setPending(false);
        }
      }
    }
    return () => {
      cancel = true;
    };
  }, [active, searchDebounce, filter.serverSide, selectedValues]);

  // get available options based on search
  const filteredOptions = useMemo(() => {
    return options.filter((o) => {
      if (search) {
        const content = ((o.label as string) || "") + (o.value || "");
        if (content?.toUpperCase()?.includes(search.toUpperCase())) {
          return true;
        }
        return false;
      }
      return true;
    });
  }, [options, search]);

  // limit the filteredOptions based on any dependencies to other filters it may have
  const dependencyOptions = useMemo(() => {
    if (filter.serverSide) {
      return filteredOptions;
    }
    return limitFilterOptions(filter, filteredOptions, selectedValues);
  }, [filteredOptions, filter, selectedValues]);

  const showPlaceholder =
    filter.serverSide &&
    (!filter.serverSide.minSearch || search.length < filter.serverSide.minSearch);
  const placeholder =
    "Start typing to retrieve list" +
    (filter.serverSide?.minSearch ? ` (min ${filter.serverSide?.minSearch} characters)` : "");
  if (!filter) {
    return undefined;
  }
  return (
    <>
      <FilterDropdownUi
        filterPath={filterPath}
        label={filter.label}
        info={filter.info}
        onRemoved={onRemoved}
        onSelected={onSelected}
        options={dependencyOptions}
        values={selectedValues[filterPath] || []}
        isLoading={pending}
        search={search}
        setSearch={setSearch}
        isActive={active}
        onActive={loadDataOnFirstActive}
        placeholder={showPlaceholder ? placeholder : ""}
        message={error ? error.message : undefined}
        larger={larger}
        single={single || filter.single}
      />
      {filter && filter.type === "dropdownbulk" && (
        <div className="mb-2">
          <label className="mb-1 flex items-center gap-x-2 text-xs">
            Lookup Many Values
            <Toggle checked={bulkActive} onToggle={setBulkActive} dimInactive />
          </label>
          {bulkActive && (
            <FilterBulkLookup
              key={filter.label}
              filter={filter}
              onRemoved={onRemoved}
              onSelected={onSelected}
              selectedValues={selectedValues}
            />
          )}
        </div>
      )}
    </>
  );
}
