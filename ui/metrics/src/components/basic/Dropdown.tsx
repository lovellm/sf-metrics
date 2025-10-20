import { useState, useEffect, useMemo, useRef } from "react";
import { IoCaretDown, IoCaretUp } from "react-icons/io5";

export interface DropdownOption {
  value: string;
  label?: string;
}
export interface DropdownProps<T> {
  options?: DropdownOption[];
  value?: T;
  onSelect?: (value: T) => void;
  width?: number;
  fullWidth?: boolean;
  allowSearch?: boolean;
  /** less padding */
  compact?: boolean;
  center?: boolean;
}
const maxListItems = 300;

export default function Dropdown<T extends string>({
  options,
  value,
  onSelect,
  width = 240,
  fullWidth,
  allowSearch,
  compact,
  center,
}: DropdownProps<T>) {
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

  if (!options || options.length < 1) {
    return null;
  }
  let currentText = "";
  const currentOption = options.find((option) => option.value === value);
  if (currentOption) {
    currentText = currentOption.label || currentOption.value;
  }

  const toggleOpen = () => {
    const next = !isOpen;
    if (thisRef.current) {
      setDivBox(thisRef.current.getBoundingClientRect());
    }
    setIsOpen(next);
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
        <div className={center ? "grow text-center" : ""}>{currentText}&nbsp;</div>
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
          {filteredOptions.map((option) => (
            <div
              key={option.value}
              tabIndex={0}
              role="option"
              aria-selected={option.value === value}
              className={
                "input-main border-main z-50 cursor-pointer border hover:bg-fuchsia-500 hover:text-zinc-200 " +
                `${center ? "text-center" : ""} ${compact ? "pr-1 pl-2" : "px-4 pt-2 pb-1"} ${
                  option.value === value ? "bg-zinc-600 text-zinc-200 dark:bg-zinc-600" : ""
                }`
              }
              onClick={(ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                if (typeof onSelect === "function") {
                  onSelect(option.value as T);
                }
                setIsOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  if (typeof onSelect === "function") {
                    onSelect(option.value as T);
                  }
                  setIsOpen(false);
                }
              }}
            >
              {option.label || option.value}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
