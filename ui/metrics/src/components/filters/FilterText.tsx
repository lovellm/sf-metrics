import { useState } from "react";
import FilterItemSelected from "./FilterItemSelected";
import { IoCheckmark, IoClose } from "react-icons/io5";
import { CommonFilterProps } from "@/types/filterTypes";

const buttonClass =
  "rounded p-1 hover:bg-fuchsia-500 hover:text-purple-500 disabled:text-zinc-400 dark:disabled:text-zinc-600 cursor-pointer";

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

  if (!filter) {
    return undefined;
  }

  return (
    <div className="mb-1 w-full">
      {filter.label && <div className="text-sm">{filter.label}</div>}
      <div className="border-main rounded border bg-white dark:bg-neutral-950 dark:text-zinc-200">
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
              "grow cursor-text resize-none rounded bg-white pt-1 pl-1 focus:outline-fuchsia-400 dark:bg-neutral-950" +
              " dark:text-zinc-200 dark:[color-scheme:dark] dark:placeholder:text-zinc-600"
            }
            value={text}
            onChange={(e) => {
              setText(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSelected(filterPath, { value: text });
                // applyValue(text);
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
              onSelected(filterPath, { value: text });
              // applyValue(text);
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
