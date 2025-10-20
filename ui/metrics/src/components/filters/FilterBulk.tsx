import { useCallback, useMemo, useState } from "react";
import FilterItemSelected from "./FilterItemSelected";
import { IoCheckmark, IoClose } from "react-icons/io5";
import { PiClipboard } from "react-icons/pi";
import { FilterOptionEntry, CommonFilterProps } from "@/types/filterTypes";

const defaultSplit = /[^0-9A-Za-z_-]/g;
const buttonClass =
  "rounded p-1 hover:bg-fuchsia-500 disabled:text-zinc-400 dark:disabled:text-zinc-600 cursor-pointer";

/** bulk filter input. ignores server side config, does not use any list of values */
export default function FilterBulk({
  filter,
  onRemoved,
  onSelected,
  selectedValues,
}: CommonFilterProps) {
  const [text, setText] = useState<string>("");
  const filterPath = filter?.path || "";

  const applyValue = useCallback(
    (textToApply: string) => {
      if (typeof onSelected === "function" && textToApply) {
        const nextValues = [
          ...new Set<string>( // Set to make sure unique values
            textToApply
              .split(defaultSplit)
              .map<string>((t) => t?.trim()) // remove any surrounding whitespace (shouldn't exist with default split regex)
              .filter((t) => t), // remove any falsey values (empty strings)
          ),
        ].map<FilterOptionEntry>((t) => ({ value: t })); // convert to filter option entry
        if (nextValues.length === 1) {
          onSelected(filterPath, nextValues[0], true);
        } else if (nextValues.length > 1) {
          onSelected(filterPath, nextValues, true);
        }
      }
      setText("");
    },
    [onSelected, filterPath],
  );

  const pasteValue = useCallback(() => {
    if (typeof onSelected === "function") {
      navigator.clipboard
        .readText()
        .then((text) => {
          applyValue(text);
        })
        .catch((err) => {
          console.error("failed to read clipboard contents: ", err);
        });
    }
  }, [onSelected, applyValue]);

  const removeAll = useCallback(() => {
    if (typeof onRemoved === "function") {
      onRemoved(filterPath, undefined);
    }
  }, [filterPath, onRemoved]);

  const values = selectedValues[filterPath];
  const valueEntry = useMemo(() => {
    if (!values?.length) {
      return undefined;
    }
    return { value: values.length + " values selected" } as FilterOptionEntry;
  }, [values]);

  if (!filter) {
    return undefined;
  }

  return (
    <div className="mb-1">
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
              onSelected(filterPath, [], true);
              e.stopPropagation();
            }}
          >
            <IoClose />
          </button>
          <textarea
            rows={valueEntry ? 1 : 2}
            className={
              "grow cursor-text resize-none rounded bg-white pt-1 pl-1 focus:outline-fuchsia-400 dark:bg-neutral-950" +
              " dark:text-zinc-200 dark:[color-scheme:dark] dark:placeholder:text-zinc-600"
            }
            value={text}
            onChange={(e) => {
              setText(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.ctrlKey) {
                applyValue(text);
              }
            }}
          />
          <div className={`flex ${valueEntry ? "" : "flex-col justify-around"}`}>
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
            <button
              type="button"
              title="Paste Value(s) from Clipboard"
              className={buttonClass}
              onClick={(e) => {
                e.stopPropagation();
                pasteValue();
              }}
            >
              <PiClipboard />
            </button>
          </div>
        </div>
        {/* Currently selected "value" */}
        {valueEntry && (
          <div className={`padding relative cursor-text rounded-b pt-1`}>
            <FilterItemSelected value={valueEntry} path={filterPath} onRemoved={removeAll} />
          </div>
        )}
      </div>
    </div>
  );
}
