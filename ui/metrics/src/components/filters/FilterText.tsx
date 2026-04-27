import { useState } from "react";
import FilterItemSelected from "./FilterItemSelected";
import { IoCheckmark, IoClose } from "react-icons/io5";
import { CommonFilterProps, FilterOptionEntry } from "@/types/filterTypes";

const buttonClass =
  "rounded p-1 hover:bg-accent-medium hover:text-accent-link disabled:text-mediumGray dark:disabled:text-darkGray cursor-pointer";

/** bulk filter input. ignores server side config, does not use any list of values */
export default function FilterText({
  filter,
  onRemoved,
  onSelected,
  selectedValues,
}: CommonFilterProps) {
  const [text, setText] = useState<string>("");
  const filterPath = filter?.path || "";

  const values = selectedValues[filterPath];

  const transformValue = filter.transformValue;

  const applyValue = (textToApply: string) => {
    if (typeof onSelected === "function" && textToApply) {
      let nextValue: FilterOptionEntry = { value: textToApply };
      if (typeof transformValue === "function") {
        nextValue = transformValue(nextValue);
      }
      onSelected(filterPath, nextValue);
    }
    setText("");
  };

  if (!filter) {
    return undefined;
  }

  return (
    <div className="mb-1 w-full">
      {filter.label && <div className="text-sm">{filter.label}</div>}
      {filter.info && <div className="text-sm">{filter.info}</div>}
      <div className="border-main dark:text-lightGray rounded border bg-white dark:bg-neutral-950">
        <div className="flex w-full">
          <button
            type="button"
            title="Clear Text"
            disabled={text === "" && (values || []).length === 0}
            className={buttonClass}
            onClick={(e) => {
              setText("");
              e.stopPropagation();
            }}
          >
            <IoClose />
          </button>
          <input
            className={
              "focus:outline-accent grow cursor-text resize-none rounded bg-white pt-1 pl-1 dark:bg-neutral-950" +
              " dark:text-lightGray dark:placeholder:text-darkGray dark:scheme-dark"
            }
            value={text}
            onChange={(e) => {
              setText(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                applyValue(text);
              }
            }}
          />
          <button
            type="button"
            title="Apply Values"
            disabled={!text}
            className={`${buttonClass} ${text?.length > 0 ? "animate-subtle-ping" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              applyValue(text);
            }}
          >
            <IoCheckmark />
          </button>
        </div>
        {/* Currently selected "value" */}
        {values && (
          <div className={`padding relative cursor-text rounded-b pt-1`}>
            {values.map((valueEntry) => (
              <FilterItemSelected
                key={valueEntry.value}
                value={valueEntry}
                path={filterPath}
                onRemoved={onRemoved}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
