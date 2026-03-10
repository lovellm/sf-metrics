import { useEffect, useState } from "react";
import { AppConfig } from "../constants";
import configCache from "@/data/configCache";

export default function useConfigs(refreshCounter?: number) {
  const [configs, setConfigs] = useState<AppConfig[]>([]);
  const [configMap, setConfigMap] = useState<Record<string, AppConfig>>({});
  const [error, setError] = useState<Error | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    let shouldSave = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    setError(undefined);
    configCache
      .getAppConfigs()
      .then((data) => {
        if (shouldSave) {
          const cm: Record<string, AppConfig> = {};
          data.forEach((appConfig) => {
            if (appConfig.appId) {
              cm[appConfig.appId] = appConfig;
            }
          });
          setConfigs(data);
          setConfigMap(cm);
          setIsLoading(false);
        }
      })
      .catch((e) => {
        if (shouldSave) {
          setConfigs([]);
          setIsLoading(false);
          setError(e as Error);
        }
      });

    return () => {
      shouldSave = false;
    };
  }, [refreshCounter]);

  return { configs, error, isLoading, configMap };
}
