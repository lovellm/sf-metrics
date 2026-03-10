import { useState, useEffect, useMemo, useRef } from "react";
import { IoCaretDown, IoCaretUp } from "react-icons/io5";
import { DropdownOption } from "./Dropdown";

const defaultOptions: DropdownOption[] = [];

export interface MultiDropdownProps<T> {
  options?: DropdownOption[];
  values?: T | T[];
  onSelect?: (values: T[]) => void;
  width?: number;
  fullWidth?: boolean;
  allowSearch?: boolean;
  /** less padding */
  compact?: boolean;
  center?: boolean;
  isLoading?: boolean;
}
const maxListItems = 300;

export default function MultiDropdown<T extends string>({
  options = defaultOptions,
  values,
  onSelect,
  width = 240,
  fullWidth,
  allowSearch,
  compact,
  center,
  isLoading,
}: MultiDropdownProps<T>) {
  const [search, setSearch] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [divBox, setDivBox] = useState<DOMRect | undefined>(undefined);
  const thisRef = useRef<HTMLDivElement>(null);

  // add document listener to close box if click outside of it
  useEffect(() => {
    if (isOpen) {
      const closeListener = (ev: MouseEvent) => {
        if (
          !(thisRef.current && thisRef.current.contains(ev.target as Element)) &&
          (ev.target as Element)?.isConnected
        ) {
          setIsOpen(false);
        }
      };
      const scrollListener = () => {
        if (thisRef.current) {
          setDivBox(thisRef.current.getBoundingClientRect());
        }
      };
      document.addEventListener("click", closeListener);
      document.addEventListener("scroll", scrollListener);
      return () => {
        document.removeEventListener("click", closeListener);
        document.removeEventListener("scroll", scrollListener);
      };
    }
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!options) {
      return [];
    }
    if (!search) {
      if (options.length > maxListItems) {
        return options.slice(0, maxListItems);
      }
      return options;
    }
    const searchUpper = search.toUpperCase();
    const filtered = options.filter((o) => {
      if (o.value && o.value.toUpperCase().includes(searchUpper)) {
        return true;
      }
      if (o.label && o.label.toUpperCase().includes(searchUpper)) {
        return true;
      }
      return false;
    });
    if (filtered.length > maxListItems) {
      return filtered.slice(0, maxListItems);
    }
    return filtered;
  }, [options, search]);

  const valueMap = useMemo(() => {
    const vm: Record<string, true> = {};
    if (!values?.length) {
      vm[""] = true;
      return vm;
    }
    const vs = Array.isArray(values) ? values : [values];
    vs?.forEach((v) => (vm[v] = true));
    return vm;
  }, [values]);

  // text for currently selected item
  let currentText = "";
  if (values?.length === 1) {
    // 1 selected value, get the text for it
    const first = values[0];
    const currentOption = options.find((option) => option.value === first);
    if (currentOption) {
      currentText = currentOption.label || currentOption.value;
    }
  } else if (values?.length) {
    // multiple selected values, show count of selected values
    currentText = values.length + " Selected Items";
  } else {
    // empty array, find the empty string value (all items) and use it
    const currentOption = options.find((option) => option.value === "");
    if (currentOption) {
      currentText = currentOption.label || currentOption.value;
    }
  }

  const toggleOpen = () => {
    const next = !isOpen;
    if (thisRef.current) {
      setDivBox(thisRef.current.getBoundingClientRect());
    }
    setIsOpen(next);
  };

  /** return then ext values array given a selected value */
  const nextValues = (value: T) => {
    // do not have any values, set array of only newly selected value
    if (!values) {
      return [value];
    }
    // only one value and matches selected value, set to array
    if (values.length === 1 && values[0] === value) {
      return [];
    }
    // selected empty value (all values), set to empty array
    if (value === "") {
      return [];
    }
    let exists = false;
    const vs = Array.isArray(values) ? values : [values];
    const next = vs.filter((v) => {
      // filter out "all values"
      if (v === "") {
        return false;
      }
      // selected value exists, filter it out, track so we do not add back in
      if (v === value) {
        exists = true;
        return false;
      }
      return true;
    });
    if (!exists) {
      next.push(value);
    }
    return next;
  };

  return (
    <div
      ref={thisRef}
      role="listbox"
      tabIndex={0}
      className={`input-main border-main relative cursor-pointer border ${compact ? "pr-1 pl-2" : "px-4 pt-2 pb-1"} ${isOpen ? "rounded-t-xl" : "rounded-xl"}`}
      style={{ width: fullWidth ? "100%" : width }}
      onClick={toggleOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          toggleOpen();
        }
      }}
    >
      <div className="flex flex-row items-center justify-between">
        <div className={center ? "grow text-center" : ""}>
          {isLoading ? "Loading..." : currentText}
        </div>
        {isOpen ? <IoCaretUp /> : <IoCaretDown />}
      </div>
      {/* Selectable Values */}
      {isOpen && (
        <div
          className={`${divBox ? "fixed" : "absolute"} shadow-base fixed z-10 max-h-60 overflow-auto`}
          style={{
            width: divBox ? divBox.width : undefined,
            top: divBox ? divBox.y + divBox.height : "2.25rem",
            left: divBox ? divBox.x : 0,
          }}
        >
          {allowSearch === true && (
            <input
              name="dropdown-search"
              className="input-main w-full px-2 py-1 italic"
              placeholder="Search..."
              value={search}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
            />
          )}
          {filteredOptions.map((option) => {
            const isSelected = valueMap[option.value] || false;
            return (
              <div
                key={option.value}
                tabIndex={0}
                role="option"
                aria-selected={isSelected}
                className={
                  "input-main border-main hover:bg-accent hover:text-lightGray z-50 cursor-pointer border " +
                  `${center ? "text-center" : ""} ${compact ? "pr-1 pl-2" : "px-4 pt-2 pb-1"} ${
                    isSelected ? "bg-darkGray text-lightGray dark:bg-darkGray" : ""
                  }`
                }
                onClick={(ev) => {
                  ev.preventDefault();
                  ev.stopPropagation();
                  if (typeof onSelect === "function") {
                    onSelect(nextValues(option.value as T));
                  }
                  setIsOpen(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    if (typeof onSelect === "function") {
                      onSelect(nextValues(option.value as T));
                    }
                    setIsOpen(false);
                  }
                }}
              >
                {option.label || option.value}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
