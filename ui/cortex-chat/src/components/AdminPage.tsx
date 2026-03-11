import { AppConfig } from "@/constants";
import useAppState from "@/context/useAppState";
import useConfigs from "@/hooks/useConfigs";
import { ErrorMessage, LoadingFitParent, useIncrement, useUser } from "@spcs-apps/data-utils";
import { useEffect, useMemo, useState } from "react";
import ListApps from "./admin/ListApps";
import EditApp from "./admin/EditApp";

export default function AdminPage() {
  const [currentApp, setCurrentApp] = useState<string>("");
  const [refreshConfigs, setRefreshConfigs] = useIncrement();
  const { configs, isLoading: isConfigsLoading, error: listError } = useConfigs(refreshConfigs);
  const [, dispatch] = useAppState();
  const user = useUser("ADMIN_ROLE_HERE");

  // unset loaded app config when visiting admin page
  useEffect(() => {
    dispatch({ type: "setAppConfig", payload: undefined });
  }, [dispatch]);

  const currentConfig = useMemo<AppConfig | undefined>(() => {
    if (configs && currentApp) {
      return configs.find((c) => {
        return c.appId === currentApp;
      });
    }
    return undefined;
  }, [configs, currentApp]);

  if (!user?.inRole) {
    return <div>You do not have access to this page!</div>;
  }

  return (
    <div className="relative grid h-full grid-cols-10 grid-rows-[max-content_auto]">
      <div className="bg-primary-dark text-lightGray col-span-10 w-full px-4 py-2 xl:px-10">
        <h1 className="text-lg">Maintain App Configurations</h1>
      </div>
      <div className="bg-lightGray col-span-10 md:col-span-3 xl:col-span-2 dark:bg-neutral-900">
        <ListApps
          configs={configs}
          handleRefresh={setRefreshConfigs}
          setCurrentId={setCurrentApp}
          currentId={currentApp}
        />
      </div>
      <div className="bg-accent-light col-span-10 min-h-[60lvh] md:col-span-7 xl:col-span-8 dark:bg-neutral-800">
        <EditApp
          config={currentConfig}
          setCurrentApp={setCurrentApp}
          handleRefresh={setRefreshConfigs}
        />
        {isConfigsLoading && <LoadingFitParent />}
        {listError && <ErrorMessage error={listError} message="Failed to load app configs" />}
      </div>
    </div>
  );
}
