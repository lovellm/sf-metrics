import { useMemo, useState } from "react";
import EditOptionInfo from "./EditOptionInfo";
import { IoRefresh } from "react-icons/io5";
import ListOptions from "./ListOptions";
import { ErrorMessage, LoadingFitParent, useIncrement } from "@spcs-apps/data-utils";
import useConfigOptions from "@/hooks/useConfigOptions";
import { AppConfigOption } from "@/constants";

interface EditOptionsProps {
  appId?: string;
}

export default function EditOptions({ appId }: EditOptionsProps) {
  const [currentOption, setCurrentOption] = useState<string>("");
  const [refreshCount, refreshOptions] = useIncrement();
  const { options, isLoading, error } = useConfigOptions(appId, true, refreshCount);

  const selectedOption = useMemo<AppConfigOption | undefined>(() => {
    if (!currentOption || !options) {
      return undefined;
    }
    return options.find((o) => o.optionName === currentOption);
  }, [currentOption, options]);

  if (!appId) {
    return null;
  }

  return (
    <div className="relative min-h-72">
      <div className="bg-primary-dark text-lightGray dark:bg-almostBlack p-2 text-xl">
        App Options
      </div>
      {isLoading && <LoadingFitParent>Loading App Options</LoadingFitParent>}
      {error && <ErrorMessage error={error} message="Error loading app options" />}
      <div className="grid grid-cols-4">
        <div className="bg-lightGray dark:bg-almostBlack col-span-4 pb-2 lg:col-span-1">
          <div className="relative px-2 pb-1">
            <b>Current Options</b>
            <button
              type="button"
              className="hover:bg-accent absolute top-0 right-1 cursor-pointer rounded-full p-1 text-lg"
              onClick={refreshOptions}
            >
              <IoRefresh />
            </button>
          </div>
          <ListOptions
            options={options}
            currentOption={currentOption}
            setCurrentOption={setCurrentOption}
          />
        </div>
        <div className="col-span-4 lg:col-span-3">
          <EditOptionInfo
            option={selectedOption}
            options={options}
            appId={appId}
            setCurrentOption={setCurrentOption}
            refreshOptions={refreshOptions}
          />
        </div>
      </div>
      <div className="bg-primary-dark dark:bg-almostBlack h-4"></div>
    </div>
  );
}
