import { useCallback, useState } from "react";
import { IoCheckmark, IoClose } from "react-icons/io5";
import ErrorMessage from "../basic/ErrorMessage";
import { getRemoteMatchingValues } from "./getFilterOptions";
import LoadingFitParent from "../basic/LoadingFitParent";
import { FilterOptionEntry, CommonFilterProps } from "@/types/filterTypes";

const defaultSplit = /[^0-9A-Za-z_-]/g;
const buttonClass =
  "rounded p-1 hover:bg-fuchsia-500 disabled:text-zinc-400 dark:disabled:text-zinc-600 cursor-pointer";

/** bulk filter input. ignores server side config, does not use any list of values */
export default function FilterBulkLookup({
  filter,
  onSelected,
  selectedValues,
}: CommonFilterProps) {
  const [text, setText] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [pending, setPending] = useState<boolean>(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const filterPath = filter?.path || "";

  const applyValue = useCallback(
    (textToApply: string) => {
      if (typeof onSelected === "function" && textToApply) {
        // parse the values
        const nextValues = [
          ...new Set<string>( // Set to make sure unique values
            textToApply
              .split(defaultSplit)
              .map<string>((t) => t?.trim()) // remove any surrounding whitespace (shouldn't exist with default split regex)
              .filter((t) => t), // remove any falsey values (empty strings)
          ),
        ].map<FilterOptionEntry>((t) => ({ value: t })); // convert to filter option entry
        // take different action depending on server side or not
        if (filter.serverSide) {
          setPending(true);
          setMessage("");
          setError(undefined);
          getRemoteMatchingValues(filter.serverSide, nextValues)
            .then((results) => {
              if (results && results.length > 0) {
                setMessage(results.length + " Matching Values");
                setText("");
                onSelected(filterPath, results, true);
              } else {
                setMessage("No Matching Values");
                setText("");
                onSelected(filterPath, [], true);
              }
            })
            .catch((e) => {
              setError(e as Error);
            })
            .finally(() => {
              setPending(false);
            });
        } else {
          // not server side, just set the values
          if (nextValues.length === 1) {
            onSelected(filterPath, nextValues[0], true);
          } else if (nextValues.length > 1) {
            onSelected(filterPath, nextValues, true);
          }
          setText("");
        }
      }
    },
    [onSelected, filterPath, filter.serverSide],
  );

  const values = selectedValues[filterPath];
  const hasValues = (values || []).length > 0;

  if (!filter) {
    return undefined;
  }

  return (
    <div className="mb-1">
      <div className="border-main relative rounded border bg-white dark:bg-neutral-950 dark:text-zinc-200">
        <div className="flex w-full">
          <button
            type="button"
            title="Clear Text"
            disabled={text === "" && !hasValues}
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
            rows={2}
            disabled={pending}
            placeholder={
              pending
                ? ""
                : `Paste values here, then click the checkmark.${hasValues ? " Will replace existing filter." : ""}`
            }
            className={
              "grow cursor-text resize-none rounded bg-white pt-1 pl-1 text-sm focus:outline-fuchsia-400 dark:bg-neutral-950" +
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
          <button
            type="button"
            title="Apply Values"
            disabled={!text || pending}
            className={`${buttonClass} ${text?.length > 0 ? "animate-subtle-ping bg-fuchsia-500" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              applyValue(text);
            }}
          >
            <IoCheckmark />
          </button>
          {pending && <LoadingFitParent>Validating Values</LoadingFitParent>}
        </div>
      </div>
      {message && <div className="text-xs">{message}</div>}
      {error && <ErrorMessage error={error} message="Error Validating the Values" />}
    </div>
  );
}
