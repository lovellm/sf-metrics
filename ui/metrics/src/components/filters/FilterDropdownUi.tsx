import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FilterItemSelected from "./FilterItemSelected";
import { IoCaretDown, IoClose, IoCaretUp } from "react-icons/io5";
import LoadingFitParent from "../basic/LoadingFitParent";
import { FilterOptionEntry, HandleSelectedOption, HandleRemoveOption } from "@/types/filterTypes";

interface FilterDropdownProps {
  label: string;
  info?: string;
  filterPath: string;
  options: FilterOptionEntry[];
  onSelected: HandleSelectedOption;
  onRemoved: HandleRemoveOption;
  values: FilterOptionEntry[];
  search?: string;
  setSearch?: (next: string) => void;
  isLoading?: boolean;
  isActive?: boolean;
  onActive?: (next: boolean) => void;
  placeholder?: string;
  /** message to display at top of drop downs, such as an error */
  message?: string;
  /** style is more like the Dropdown component instead of normal filter dropdown styling */
  larger?: boolean;
  single?: boolean;
}

export default function FilterDropdownUi({
  label,
  info,
  filterPath,
  options,
  onSelected,
  onRemoved,
  values,
  search = "",
  setSearch,
  isLoading,
  isActive,
  onActive,
  placeholder,
  message,
  larger,
  single,
}: FilterDropdownProps) {
  const [active, setActive] = useState<boolean>(false);
  const [divBox, setDivBox] = useState<DOMRect | undefined>(undefined);
  const boxRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  // take provided active first, otherwise use local state
  const isOpen = isActive ?? active;

  /** sets both local setActive and provided onActive to the given value */
  const handleActive = useCallback(
    (next: boolean) => {
      setActive(next);
      if (typeof onActive === "function") {
        onActive(next);
      }
    },
    [onActive],
  );

  // add event listener to setActive(false) on click outside of boxRef
  useEffect(() => {
    if (isOpen) {
      const closeListener = (ev: MouseEvent) => {
        if (!(boxRef.current && boxRef.current.contains(ev.target as Element))) {
          handleActive(false);
        }
      };
      const scrollListener = () => {
        if (boxRef.current) {
          setDivBox(boxRef.current.getBoundingClientRect());
        }
      };
      document.addEventListener("mousedown", closeListener);
      document.addEventListener("scroll", scrollListener);
      return () => {
        document.removeEventListener("mousedown", closeListener);
        document.removeEventListener("scroll", scrollListener);
      };
    }
  }, [isOpen, handleActive]);

  // get available options based on already selected options
  const availableOptions = useMemo(() => {
    const isValue: Record<string, true> = {};
    values?.forEach((v) => {
      isValue[v.value] = true;
    });
    return options.filter((o) => !isValue[o.value]);
  }, [options, values]);

  // setDivBox if values changes, to move open popup down a bit if needed
  useEffect(() => {
    if (boxRef.current) {
      setDivBox(boxRef.current.getBoundingClientRect());
    }
  }, [values]);

  const removeAll = useCallback(() => {
    if (typeof onRemoved === "function") {
      onRemoved(filterPath, undefined);
    }
  }, [filterPath, onRemoved]);

  const allEntry = useMemo(
    () => ({ value: "all", label: values?.length + " values selected" }) as FilterOptionEntry,
    [values?.length],
  );

  const rounded = larger ? "rounded-xl" : "rounded";
  const roundedT = larger ? "rounded-t-xl" : "rouded-t";
  const padding = larger ? "px-4 pb-1 pt-2" : "pt-1";

  return (
    <div className="mb-1">
      {label && <div className="text-sm">{label}</div>}
      {info && <div className="text-sm">{info}</div>}
      <div
        ref={boxRef}
        className={`input-main relative cursor-text border ${isOpen ? `shadow-base ${roundedT} border-fuchsia-400` : `border-main ${rounded}`} ${padding}`}
        onClick={() => {
          if (typeof searchRef.current?.focus === "function") {
            searchRef.current.focus();
          }
        }}
      >
        {/* Currently selected values */}
        {values?.length < 10 ? (
          values?.map((value) => (
            <FilterItemSelected
              key={value.value}
              value={value}
              path={filterPath}
              onRemoved={onRemoved}
            />
          ))
        ) : (
          <FilterItemSelected key="all" value={allEntry} path={filterPath} onRemoved={removeAll} />
        )}
        {/* clear search button */}
        {search && (
          <button
            type="button"
            className="rounded font-bold hover:bg-purple-400"
            onClick={(e) => {
              e.stopPropagation();
              if (typeof setSearch === "function") {
                setSearch("");
              }
            }}
          >
            <IoClose />
          </button>
        )}
        <input
          ref={searchRef}
          style={{ width: (search.length + 1) * 10 }}
          className="max-w-full min-w-6 bg-transparent focus:outline-none"
          value={search}
          onChange={(e) => {
            if (typeof setSearch === "function") {
              setSearch(e.target.value);
            }
          }}
          onFocus={() => {
            if (boxRef.current) {
              setDivBox(boxRef.current.getBoundingClientRect());
            }
            handleActive(true);
          }}
        />
        {/* Dropdown caret button */}
        <button
          type="button"
          className="absolute top-1 right-1 float-right"
          onClick={(e) => {
            if (isOpen) {
              e.stopPropagation();
              handleActive(false);
            }
          }}
        >
          {isOpen ? <IoCaretUp /> : <IoCaretDown />}
        </button>
        {/* seletable values */}
        {isOpen && (
          <div
            className={`input-main shadow-base z-20 max-h-48 overflow-auto rounded-b border-x border-b border-fuchsia-400 ${larger ? "" : "text-sm"} ${divBox ? "fixed" : "absolute"}`}
            style={{
              width: divBox ? divBox.width : undefined,
              top: divBox ? divBox.y + divBox.height : "2.25rem",
              left: divBox ? divBox.x : 0,
            }}
            role="listbox"
          >
            {message && (
              <div className="border-main block w-full border-t px-2 py-1 text-left">{message}</div>
            )}
            {availableOptions.map((o, i) => (
              <button
                type="button"
                key={i}
                className="border-main block w-full border-t px-2 py-1 text-left hover:bg-purple-300 hover:text-zinc-200 dark:hover:bg-purple-900"
                role="option"
                aria-selected="false"
                onClick={() => {
                  onSelected(filterPath, o, single);
                }}
              >
                {o.label || o.value}
              </button>
            ))}
            {availableOptions.length < 1 && (
              <div className="border-main block w-full border-t px-2 py-1 text-left">
                {placeholder ? placeholder : "No options available"}
              </div>
            )}
            {isLoading && <LoadingFitParent>Loading Options...</LoadingFitParent>}
          </div>
        )}
      </div>
    </div>
  );
}
