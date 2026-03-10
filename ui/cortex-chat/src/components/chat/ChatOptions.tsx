import { AppConfigOption } from "@/constants";
import useAppState from "@/context/useAppState";
import { useCallback, useMemo } from "react";
import ChatOption, { OptionConfig } from "./ChatOption";
import { DropdownOption } from "@spcs-apps/page-parts";

interface ChatOptionsProps {
  options?: AppConfigOption[];
}

export default function ChatOptions({ options }: ChatOptionsProps) {
  const [{ showOptions, optionValues: values }, dispatch] = useAppState();

  const dropdowns = useMemo<OptionConfig[]>(() => {
    if (!options || options.length < 1) {
      return [];
    }
    const drops = options
      .map<OptionConfig>((o) => parseChatOption(o))
      .sort((a, b) => a.order - b.order);
    return drops;
  }, [options]);

  /** when a value is selected, update values state and create action arguments */
  const handleSelect = useCallback(
    (optionName: string, nextValue: string | string[]) => {
      const nextValues = { ...values };
      nextValues[optionName] = nextValue;
      dispatch({ type: "setOptionValues", payload: nextValues });
    },
    [values, dispatch],
  );

  if (!showOptions || dropdowns.length < 1) {
    return null;
  }

  return (
    <div className="flex flex-row flex-wrap items-center justify-start gap-x-4 px-4 pb-4">
      {dropdowns.map((d, i) => (
        <ChatOption key={i} dropdown={d} values={values} onSelect={handleSelect} />
      ))}
    </div>
  );
}

/** convert an AppOption to a DropdownConfig */
const parseChatOption = (o: AppConfigOption): OptionConfig => {
  const hasTableLookup = o.tableId && o.valueField;
  const d: OptionConfig = {
    appId: o.appId || "",
    name: o.optionName || "Option",
    order: o.displayOrder || 9999,
    options: [],
    tableId: hasTableLookup ? o.tableId : undefined,
    valueField: hasTableLookup ? o.valueField : undefined,
    labelField: hasTableLookup ? o.labelField : undefined,
    isLanguage: o.isLanguage,
    lookupValues: o.lookupValues,
    isMulti: o.isMulti,
  };
  if (!hasTableLookup && o.lookupValues) {
    // json lookup values
    try {
      const lookups = JSON.parse(o.lookupValues) as DropdownOption[];
      if (Array.isArray(lookups)) {
        d.options = lookups
          .map<DropdownOption | undefined>((l) => {
            if (typeof l.value === "string") {
              const opt: DropdownOption = {
                value: l.value,
              };
              if (typeof l.label === "string") {
                opt.label = l.label;
              }
              return opt;
            }
          })
          .filter((o) => o) as DropdownOption[];
      }
      d.options.unshift({ value: "", label: "All Items" });
    } catch (e) {
      console.warn(`lookupValues for option ${o.optionName} could not be parsed`);
    }
  } else {
    // lookup table
  }
  return d;
};
