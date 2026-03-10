import { AppConfigOption } from "@/constants";
import configCache from "@/data/configCache";
import { ErrorMessage, LoadingFitParent, useIncrement } from "@spcs-apps/data-utils";
import { DropdownOption, Toggle, usePageState } from "@spcs-apps/page-parts";
import { useCallback, useEffect, useRef, useState } from "react";

interface EditOptionProps {
  /** app id we are dealing with */
  appId?: string;
  /** option currently editing, or undefined for new */
  option?: AppConfigOption;
  /** all options, to check whether a desired name already exists */
  options?: AppConfigOption[];
  /** a function to call after save/delete to update selected option */
  setCurrentOption?: (next: string) => void;
  /** a function to call after save/delete to refresh the options list */
  refreshOptions?: () => void;
}

const inputClass = "input-main block px-2 md:inline";
const labelClass = "inline-block w-32";

export default function EditOptionInfo({
  appId,
  option,
  options,
  setCurrentOption,
  refreshOptions,
}: EditOptionProps) {
  const [resetCount, resetConfig] = useIncrement();
  const [editOption, setEditOption] = useState<Partial<AppConfigOption>>({ appId: appId });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [hideError, setHideError] = useState<boolean>(false);
  const [, dispatch] = usePageState();

  // ref the prop, to use in effect without depending on object, just incase object is unstable
  const optionRef = useRef<Partial<AppConfigOption>>({});
  // eslint-disable-next-line react-hooks/refs
  optionRef.current = option || { appId: appId };

  // reset editConfig when app changes
  useEffect(() => {
    setEditOption(optionRef.current);
  }, [appId, option?.optionName, resetCount]);

  const updateConfig = useCallback(
    (key: keyof AppConfigOption, value: string | boolean | number) => {
      setEditOption((current) => ({
        ...current,
        [key]: value,
      }));
    },
    [],
  );

  /** true if all required fields have values and can save */
  const canSave =
    editOption.appId &&
    editOption.optionName &&
    (editOption.lookupValues || (editOption.tableId && editOption.valueField)) &&
    editOption.dbName;

  /** if option was provided, updates it, otherwise creates new */
  const handleSave = () => {
    setHideError(false);
    setError(undefined);
    if (!canSave || !editOption.optionName) {
      return;
    }
    if (JSON.stringify(editOption) === JSON.stringify(option)) {
      // no change, do nothing
      return;
    }
    if (editOption.lookupValues) {
      // if lookupValues is populated, make sure it is correctly formatted.
      try {
        checkLookupValues(editOption.lookupValues);
      } catch (e) {
        setError(e as Error);
        return;
      }
    }
    if (
      editOption.optionName !== option?.optionName &&
      doesOptionExist(editOption.optionName, options)
    ) {
      // option name was changed an new name already exists
      setError(new Error("option name already exists"));
      return;
    }
    setIsSaving(true);
    const promise = option?.optionName
      ? configCache.updateAppOption(editOption as AppConfigOption, option?.optionName)
      : configCache.addAppOption(editOption as AppConfigOption);
    promise
      .then(() => {
        if (!option?.optionName) {
          // new option was added, select it
          if (typeof setCurrentOption === "function") {
            setCurrentOption(editOption.optionName || "");
          }
          // refresh options list
          if (typeof refreshOptions === "function") {
            refreshOptions();
          }
        }
      })
      .catch((e) => {
        setError(e as Error);
        console.error(e);
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  /** delete the currently provided option */
  const handleDelete = () => {
    if (!appId || !option?.optionName) {
      return;
    }
    setHideError(false);
    setIsSaving(true);
    setError(undefined);
    dispatch({ type: "setOverlay", payload: undefined });
    configCache
      .removeAppOption(appId, option?.optionName)
      .then(() => {
        // delete option, deselect it
        if (typeof setCurrentOption === "function") {
          setCurrentOption("");
        }
        // refresh options list
        if (typeof refreshOptions === "function") {
          refreshOptions();
        }
      })
      .catch((e) => {
        setError(e as Error);
        console.error(e);
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  return (
    <div className="mb-2 p-2">
      <div className="border-text mb-2 border-b pb-1 text-xl">
        {option ? <div>{option.optionName}</div> : <div>Create New Option</div>}
      </div>
      {/* Inputs */}
      <div className="flex flex-col gap-y-2">
        {/* Display Info */}
        <div className="flex flex-col gap-y-2">
          <div>
            <label>
              <span
                className={labelClass + (!editOption.optionName ? " text-danger font-bold" : "")}
              >
                Option Name
              </span>
              <input
                className={inputClass}
                type="text"
                size={20}
                value={editOption.optionName || ""}
                onChange={(e) => updateConfig("optionName", e.target.value)}
              />
            </label>
          </div>
          <div>
            <label>
              <span className={labelClass}>Display Order</span>
              <input
                className={inputClass + " w-16"}
                type="number"
                min={0}
                size={4}
                value={editOption.displayOrder || "0"}
                onChange={(e) => updateConfig("displayOrder", +e.target.value)}
              />
            </label>
          </div>
          <div>
            <label>
              <span className="inline-block w-48">Is Language?</span>
              <Toggle
                dimInactive
                checked={editOption.isLanguage || false}
                onToggle={(next) => updateConfig("isLanguage", next)}
              />
            </label>
          </div>
        </div>
        {/* Source of values */}
        <div className="flex flex-col gap-y-2 border-t pt-2">
          <div>
            <label>
              <span
                className={
                  labelClass +
                  (!(editOption.tableId || editOption.lookupValues) ? " text-danger font-bold" : "")
                }
              >
                Table Id
              </span>
              <input
                className={inputClass}
                type="text"
                size={30}
                value={editOption.tableId || ""}
                onChange={(e) => updateConfig("tableId", e.target.value)}
              />
            </label>
          </div>
          <div>
            <label>
              <span
                className={
                  labelClass +
                  (editOption.tableId && !editOption.valueField ? " text-danger font-bold" : "")
                }
              >
                Value Field
              </span>
              <input
                className={inputClass}
                type="text"
                size={30}
                value={editOption.valueField || ""}
                onChange={(e) => updateConfig("valueField", e.target.value)}
              />
            </label>
          </div>
          <div>
            <label>
              <span className={labelClass}>Label Field</span>
              <input
                className={inputClass}
                type="text"
                size={30}
                value={editOption.labelField || ""}
                onChange={(e) => updateConfig("labelField", e.target.value)}
              />
            </label>
          </div>
          <hr />
          <div>
            <label>
              <span
                className={
                  labelClass +
                  (!(editOption.tableId || editOption.lookupValues) ? " text-danger font-bold" : "")
                }
              >
                Lookup Values
              </span>
              <textarea
                className={inputClass + " w-96"}
                rows={3}
                value={editOption.lookupValues || ""}
                onChange={(e) => updateConfig("lookupValues", e.target.value)}
              />
            </label>
            <div className="mt-1 text-sm md:ml-32">
              Array of Lookup Options: {`[{"value": "value1", "label": "Label 1"}]`}
            </div>
          </div>
        </div>
        {/* Argument Info */}
        <div className="flex flex-col gap-y-2 border-t pt-2">
          <div>
            <label>
              <span className={labelClass + (!editOption.dbName ? " text-danger font-bold" : "")}>
                DB Name
              </span>
              <input
                className={inputClass}
                type="text"
                size={20}
                value={editOption.dbName || ""}
                onChange={(e) => updateConfig("dbName", e.target.value)}
              />
            </label>
          </div>
        </div>
      </div>
      {/* Save / Cancel Buttons */}
      <div className="relative mt-2 flex gap-x-4 border-t pt-4">
        <button
          type="button"
          className="btn-main min-w-20 rounded-full px-2 py-2"
          disabled={!canSave}
          onClick={handleSave}
        >
          Save
        </button>
        <button
          type="button"
          className="btn-outline min-w-20 rounded-full px-2 py-2"
          onClick={resetConfig}
        >
          Cancel
        </button>
        {option?.appId && (
          <button
            type="button"
            className="btn-outline border-danger bg-danger min-w-20 cursor-pointer rounded-full px-2 py-2 hover:bg-red-900"
            onClick={() =>
              dispatch({
                type: "setOverlay",
                payload: (
                  <div className="p-8">
                    <div className="my-8 text-2xl">
                      <div>You are about to Delete</div>
                      <div>{option?.optionName}</div>
                    </div>
                    <div className="flex gap-x-8">
                      <button
                        type="button"
                        className="btn-outline border-danger bg-danger min-w-20 cursor-pointer rounded-full px-2 py-2 hover:bg-red-900"
                        onClick={handleDelete}
                      >
                        Confirm Delete
                      </button>
                      <button
                        type="button"
                        className="btn-outline min-w-20 cursor-pointer rounded-full px-2 py-2"
                        onClick={() => dispatch({ type: "setOverlay", payload: undefined })}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ),
              })
            }
          >
            Delete
          </button>
        )}
        {isSaving && <LoadingFitParent>Saving...</LoadingFitParent>}
      </div>
      {error && !hideError && (
        <ErrorMessage error={error} message="Error Saving" onClose={() => setHideError(true)} />
      )}
    </div>
  );
}

/** returns whether the given option name exists in the given list of options */
const doesOptionExist = (optionName: string, options?: AppConfigOption[]): boolean => {
  if (!options?.length) {
    return false;
  }
  return options.find((o) => o.optionName === optionName) !== undefined;
};

/** returns true if given string is valid JSON for lookup values, otherwise throws */
const checkLookupValues = (input: string): true => {
  const lookups = JSON.parse(input) as DropdownOption[];
  if (Array.isArray(lookups)) {
    lookups.forEach((l) => {
      if (!l.value) {
        throw new Error("lookup entry has no value property");
      }
      Object.entries(l).forEach(([k, v]) => {
        if (k !== "value" && k !== "label") {
          throw new Error("lookup has unexpected key: " + k);
        }
        if (typeof v !== "string") {
          throw new Error("lookup value is not a string for key: " + k);
        }
      });
    });
  } else {
    throw new Error("lookups is not an array");
  }
  return true;
};
