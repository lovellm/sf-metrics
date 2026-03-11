import { cacheInstance } from "@/data/configCache";
import languageOptions, { getLanguageOption, LanguageOption } from "@/utils/languageOptions";
import { alphaSorter } from "@spcs-apps/data-utils";
import {
  ErrorMessage,
  HttpRequest,
  parseQueryResponse,
  Query,
  useQuery,
} from "@spcs-apps/data-utils";
import { Dropdown, DropdownOption, MultiDropdown } from "@spcs-apps/page-parts";
import { useEffect, useMemo, useRef, useState } from "react";

export interface OptionConfig {
  appId: string;
  name: string;
  order: number;
  options: DropdownOption[];
  tableId?: string;
  valueField?: string;
  labelField?: string;
  isLanguage?: boolean;
  lookupValues?: string;
  isMulti?: boolean;
}
interface ChatOptionProps {
  dropdown: OptionConfig;
  values?: Record<string, string | string[]>;
  onSelect: (optionName: string, nextValue: string | string[]) => void;
}
type RemoteLOV = Record<string, string>;

export default function ChatOption({ dropdown, values, onSelect }: ChatOptionProps) {
  const [hideError, setHideError] = useState<boolean>(false);
  const didSetDefault = useRef<boolean>(false);
  const request = useRef<HttpRequest | null>(null);
  if (request.current === null) {
    request.current = new HttpRequest({ timeout: 30000 });
  }
  // wrap onSelect in a ref to use inside an effect without triggering it
  const onSelectRef = useRef<(optionName: string, nextValue: string) => void>(null);
  // eslint-disable-next-line react-hooks/refs
  onSelectRef.current = onSelect;

  /** if sufficient config to make a remote fetch, makes the fetchSpec, otherwise undefined */
  const querySpec = useMemo<Query | undefined>(() => {
    if (dropdown?.tableId && dropdown?.valueField) {
      const columns = [dropdown?.valueField];
      if (dropdown?.labelField) {
        columns.push(dropdown.labelField);
      }
      return {
        table: dropdown.tableId,
        columns: columns,
        limit: 100,
      };
    } else {
      return undefined;
    }
  }, [dropdown?.tableId, dropdown?.valueField, dropdown?.labelField]);

  // if we have a fetchSpec, do a fetch
  const { data, isLoading, error } = useQuery(querySpec, {
    // eslint-disable-next-line react-hooks/refs
    skip: !querySpec || !request.current,
    // eslint-disable-next-line react-hooks/refs
    httpRequest: request.current,
    key: dropdown.appId + "lov" + dropdown.name,
    dataCache: cacheInstance,
  });

  /** remote options parsed from the fetch data, or undefined if not fetch or no options */
  const remoteOptions = useMemo<DropdownOption[] | undefined>(() => {
    if (data && querySpec) {
      const objs = parseQueryResponse<RemoteLOV>(data, querySpec.columns);
      const valueField = dropdown?.valueField?.toLowerCase();
      const labelField = dropdown?.labelField?.toLowerCase();
      const opts = objs
        .map<DropdownOption | undefined>((o) => {
          if (valueField && o[valueField]) {
            const opt: DropdownOption = {
              value: o[valueField],
            };
            if (labelField) {
              opt.label = o[labelField];
            }
            return opt;
          }
        })
        // remote undefineds
        .filter((o) => o) as DropdownOption[];
      if (opts.length > 0) {
        return opts;
      }
    }
    return undefined;
  }, [data, querySpec, dropdown?.valueField, dropdown?.labelField]);

  /** options to use in the dropdown */
  const options = useMemo(() => {
    let opts: LanguageOption[];
    if (dropdown.options?.length > 0) {
      // first take local options if the exist
      opts = dropdown.options;
    } else if (remoteOptions) {
      // otherwise take remote options and all items entry
      opts = [{ value: "", label: "All Items" }, ...remoteOptions];
    } else {
      // or just return the all items entry
      opts = [{ value: "", label: "All Items" }];
    }
    if (dropdown.isLanguage) {
      // if a language option, add in the language field
      opts = languageOptions(opts);
    }
    opts.sort(alphaSorter("value"));
    return opts;
  }, [dropdown.options, remoteOptions, dropdown.isLanguage]);

  // if it is a language option, set the default value based on browser language
  useEffect(() => {
    if (
      dropdown.isLanguage /* is langauge option */ &&
      !didSetDefault.current /* did not already set it on this instance */ &&
      (dropdown.lookupValues || data) /* we have the final list of options */ &&
      !values?.[dropdown.name] /* do not already have a value in state */
    ) {
      didSetDefault.current = true;
      const defaultValue = getLanguageOption(options);
      if (typeof onSelectRef.current === "function") {
        onSelectRef.current(dropdown.name, defaultValue);
      }
    }
  }, [options, dropdown.isLanguage, dropdown.lookupValues, data, dropdown.name, values]);

  const optionValues = values?.[dropdown.name];
  const singleValue = Array.isArray(optionValues) ? optionValues[0] : optionValues;

  return (
    <div className="flex w-full flex-col md:w-64">
      <div className="py-1 pl-2">{dropdown.name}</div>
      {dropdown.isMulti ? (
        <MultiDropdown
          isLoading={isLoading}
          options={options}
          fullWidth
          values={optionValues}
          onSelect={(nextValue: string[]) => {
            onSelect(dropdown.name, nextValue);
          }}
        />
      ) : (
        <Dropdown
          isLoading={isLoading}
          options={options}
          fullWidth
          value={singleValue}
          onSelect={(nextValue: string) => {
            onSelect(dropdown.name, nextValue);
          }}
        />
      )}
      {error && !hideError && (
        <ErrorMessage
          error={error}
          message={"Error getting values for " + dropdown?.name}
          onClose={() => setHideError(true)}
        />
      )}
    </div>
  );
}
