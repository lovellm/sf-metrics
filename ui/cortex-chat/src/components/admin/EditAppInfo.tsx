import { AppConfig } from "@/constants";
import configCache, { appConfigToDataConfig, DataConfig } from "@/data/configCache";
import { ErrorMessage, LoadingFitParent, useIncrement } from "@spcs-apps/data-utils";
import { Toggle, usePageState } from "@spcs-apps/page-parts";
import { useCallback, useEffect, useRef, useState } from "react";
import { IoCaretDown, IoCaretUp } from "react-icons/io5";

interface EditAppInfoProps {
  config?: AppConfig;
  /** when app is added/removed, calls this to set it as current */
  setCurrentApp: (next: string) => void;
  /** when app is added/removed, calls this to refresh list */
  handleRefresh: () => void;
}

const inputClass = "input-main block px-2 md:inline";
const labelClass = "inline-block w-28";
const labelClassWide = "inline-block w-48";

export default function EditAppInfo({ config, setCurrentApp, handleRefresh }: EditAppInfoProps) {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [resetCount, resetConfig] = useIncrement();
  const [editConfig, setEditConfig] = useState<Partial<DataConfig>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [, dispatchPage] = usePageState();

  // ref the prop, to use in effect without depending on object, just incase object is unstable
  const configRef = useRef<Partial<AppConfig>>({});
  // eslint-disable-next-line react-hooks/refs
  configRef.current = config || {};

  useEffect(() => {
    setEditConfig(appConfigToDataConfig(configRef.current || undefined) || {});
  }, [config?.appId, resetCount]);

  const updateConfig = useCallback((key: keyof DataConfig, value: string | boolean) => {
    setEditConfig((current) => ({
      ...current,
      [key]: value,
    }));
  }, []);

  const handleSave = () => {
    if (noSave) {
      return;
    }
    if (JSON.stringify(editConfig) === JSON.stringify(config)) {
      // no change, do nothing
      return;
    }
    if (editConfig.support_links) {
      try {
        JSON.parse(editConfig.support_links);
      } catch (e) {
        setError(new Error("The Support Links text is invalid JSON"));
        return;
      }
    }
    setIsSaving(true);
    setError(undefined);
    const promise = config?.appId
      ? configCache.updateConfig(editConfig)
      : configCache.addConfig(editConfig);
    promise
      .then(() => {
        if (!config?.appId) {
          // new app was added, select it
          if (typeof setCurrentApp === "function") {
            setCurrentApp(editConfig.app_id || "");
          }
          // refresh app list
          if (typeof handleRefresh === "function") {
            handleRefresh();
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

  const handleDelete = () => {
    if (!config?.appId) {
      return;
    }
    setIsSaving(true);
    setError(undefined);
    dispatchPage({ type: "setOverlay", payload: undefined });
    configCache
      .removeConfig(config.appId)
      .then(() => {
        if (typeof setCurrentApp === "function") {
          setCurrentApp("");
        }
        if (typeof handleRefresh === "function") {
          handleRefresh();
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

  const noSave = !editConfig.app_id || !editConfig.app_title;

  return (
    <div className="p-2">
      <div className="border-text relative mb-4 border-b pb-1 text-xl">
        {config ? (
          <div>
            {config.appTitle} ({config.appId})
          </div>
        ) : (
          <div>Create New Application</div>
        )}
        {config?.hasOptions && (
          <button
            type="button"
            className="hover:bg-accent absolute top-0 right-1 flex cursor-pointer items-center rounded-full p-1 text-lg"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <IoCaretDown /> : <IoCaretUp />}
          </button>
        )}
      </div>
      {(!config?.hasOptions || !collapsed) && (
        <div>
          {/* Inputs */}
          <div className="flex flex-col gap-y-2">
            <div>
              <label>
                <span
                  className={labelClass + " font-bold" + (!editConfig.app_id ? " text-danger" : "")}
                >
                  App Id
                </span>
                <input
                  className={inputClass}
                  disabled={!!config}
                  required
                  type="text"
                  size={10}
                  value={editConfig.app_id || ""}
                  onChange={(e) => updateConfig("app_id", e.target.value)}
                />
              </label>
            </div>
            <div>
              <label>
                <span
                  className={
                    labelClass + " font-bold" + (!editConfig.app_title ? " text-danger" : "")
                  }
                >
                  App Title
                </span>
                <input
                  className={inputClass}
                  type="text"
                  required
                  size={20}
                  value={editConfig.app_title || ""}
                  onChange={(e) => updateConfig("app_title", e.target.value)}
                />
              </label>
            </div>
            <div>
              <label>
                <span className={labelClass}>App Info</span>
                <input
                  className={inputClass}
                  type="text"
                  size={40}
                  value={editConfig.app_info || ""}
                  onChange={(e) => updateConfig("app_info", e.target.value)}
                />
              </label>
            </div>
            <div>
              <label>
                <span className={labelClass}>Support Links</span>
                <textarea
                  className={inputClass + " resize"}
                  rows={4}
                  cols={60}
                  value={editConfig.support_links || ""}
                  onChange={(e) => updateConfig("support_links", e.target.value)}
                />
              </label>
              <div className="mt-1 text-sm md:ml-28">(JSONified SupportLinks type)</div>
            </div>
            <hr />
            <div className="text-sm italic">
              Search Configuration - To use search, must provide the following: Database, Schema,
              Name, Name Field, Text Field
            </div>
            <div>
              <label>
                <span className={labelClassWide + " font-bold"}>Search Service Database</span>
                <input
                  className={inputClass}
                  type="text"
                  size={20}
                  value={editConfig.search_db || ""}
                  onChange={(e) => updateConfig("search_db", e.target.value)}
                />
              </label>
            </div>
            <div>
              <label>
                <span className={labelClassWide + " font-bold"}>Search Service Schema</span>
                <input
                  className={inputClass}
                  type="text"
                  size={20}
                  value={editConfig.search_schema || ""}
                  onChange={(e) => updateConfig("search_schema", e.target.value)}
                />
              </label>
            </div>
            <div>
              <label>
                <span className={labelClassWide + " font-bold"}>Search Service Name</span>
                <input
                  className={inputClass}
                  type="text"
                  size={20}
                  value={editConfig.search_service || ""}
                  onChange={(e) => updateConfig("search_service", e.target.value)}
                />
              </label>
            </div>
            <div>
              <label>
                <span className={labelClassWide}>Search Service Limit</span>
                <input
                  className={inputClass}
                  type="number"
                  max={10}
                  min={1}
                  value={editConfig.search_limit || ""}
                  onChange={(e) => updateConfig("search_limit", e.target.value)}
                />
              </label>
            </div>
            <div>
              <label>
                <span className={labelClassWide}>Search As Api</span>
                <Toggle
                  dimInactive
                  checked={editConfig.search_as_api || false}
                  onToggle={(next) => updateConfig("search_as_api", next)}
                />
              </label>
            </div>
            <div>
              <label>
                <span className={labelClassWide + " font-bold"}>Search Name Field</span>
                <input
                  className={inputClass}
                  type="text"
                  size={20}
                  value={editConfig.search_doc_name || ""}
                  onChange={(e) => updateConfig("search_doc_name", e.target.value)}
                />
              </label>
            </div>
            <div>
              <label>
                <span className={labelClassWide + " font-bold"}>Search Text Field</span>
                <input
                  className={inputClass}
                  type="text"
                  size={20}
                  value={editConfig.search_doc_content || ""}
                  onChange={(e) => updateConfig("search_doc_content", e.target.value)}
                />
              </label>
            </div>
            <div>
              <label>
                <span className={labelClassWide}>Search Url Field</span>
                <input
                  className={inputClass}
                  type="text"
                  size={20}
                  value={editConfig.search_doc_url || ""}
                  onChange={(e) => updateConfig("search_doc_url", e.target.value)}
                />
              </label>
            </div>
            <div>
              <label>
                <span className={labelClassWide}>Has Options?</span>
                <Toggle
                  dimInactive
                  checked={editConfig.has_options || false}
                  onToggle={(next) => updateConfig("has_options", next)}
                />
              </label>
            </div>
            <hr />
            <div className="text-sm italic">Chat Configuration - All Optional</div>
            <div>
              <label>
                <span className={labelClass}>Chat Model</span>
                <input
                  className={inputClass}
                  type="text"
                  size={20}
                  value={editConfig.chat_model || ""}
                  onChange={(e) => updateConfig("chat_model", e.target.value)}
                />
              </label>
            </div>
            <div>
              <label>
                <span className={labelClass}>Chat As Api</span>
                <Toggle
                  dimInactive
                  checked={editConfig.chat_as_api || false}
                  onToggle={(next) => updateConfig("chat_as_api", next)}
                />
              </label>
            </div>
          </div>
          {/* Save / Cancel Buttons */}
          <div className="relative mt-4 flex gap-x-4 border-t pt-3 pb-1">
            <button
              type="button"
              className="btn-main min-w-20 cursor-pointer rounded-full px-2 py-2"
              disabled={noSave}
              onClick={handleSave}
            >
              Save
            </button>
            <button
              type="button"
              className="btn-outline min-w-20 cursor-pointer rounded-full px-2 py-2"
              onClick={() => resetConfig()}
            >
              Cancel
            </button>
            {config?.appId && (
              <button
                type="button"
                className="btn-outline border-danger bg-danger min-w-20 cursor-pointer rounded-full px-2 py-2 hover:bg-red-900"
                onClick={() =>
                  dispatchPage({
                    type: "setOverlay",
                    payload: (
                      <div className="p-8">
                        <div className="my-8 text-2xl">
                          <div>You are about to Delete</div>
                          <div>
                            {config?.appTitle} ({config?.appId})
                          </div>
                        </div>
                        <div className="flex gap-x-8">
                          <button
                            type="button"
                            className="btn-outline border-danger bg-danger min-w-20 cursor-pointer rounded-full px-2 py-2 hover:bg-red-900"
                            onClick={() => handleDelete()}
                          >
                            Confirm Delete
                          </button>
                          <button
                            type="button"
                            className="btn-outline min-w-20 cursor-pointer rounded-full px-2 py-2"
                            onClick={() => dispatchPage({ type: "setOverlay", payload: undefined })}
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
        </div>
      )}
      {error && (
        <ErrorMessage error={error} message="Error Saving" onClose={() => setError(undefined)} />
      )}
    </div>
  );
}
