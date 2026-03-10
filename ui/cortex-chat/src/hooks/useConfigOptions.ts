import { AppConfigOption } from "@/constants";
import configCache from "@/data/configCache";
import { useEffect, useState } from "react";

export default function useConfigOptions(
  appId?: string,
  hasOptions?: boolean,
  refreshCounter?: number,
) {
  const [options, setOptions] = useState<AppConfigOption[]>([]);
  const [error, setError] = useState<Error | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fun = () => {
      if (appId && hasOptions) {
        let shouldSave = true;
        setIsLoading(true);
        setError(undefined);
        configCache
          .getAppOptions(appId)
          .then((data) => {
            if (shouldSave) {
              setOptions(data);
              setIsLoading(false);
            }
          })
          .catch((e) => {
            if (shouldSave) {
              setOptions([]);
              setIsLoading(false);
              setError(e as Error);
            }
          });

        return () => {
          shouldSave = false;
        };
      } else {
        setOptions([]);
        setError(undefined);
        setIsLoading(false);
      }
    };
    fun();
  }, [appId, hasOptions, refreshCounter]);

  return { options, error, isLoading };
}
