import { useEffect, useState, useRef, useMemo } from "react";
import getData, { GetDataOptions } from "../data/getData";
import HttpRequest from "../data/HttpRequest";
import { defaultCache } from "../data/dataCache";

export interface UseDataOptions extends GetDataOptions {
  httpRequest?: HttpRequest;
  /** if this value changes, data fetching effect will be triggered */
  effectCounter?: number;
}
export interface UseDataResponse<T> {
  /** that data that was returned */
  data: T | undefined;
  /** if the api failed, this will be the error */
  error?: Error;
  /** whether the call is currently in progress or not */
  isLoading: boolean;
}

/** hook that returns data from the cache if it exists, otherwise from the api.
 * also provides loading and error state that can be used
 */
export default function useData<T>(path: string, options: UseDataOptions = {}): UseDataResponse<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);
  const requestRef = useRef<HttpRequest>(null);

  if (options.httpRequest) {
    requestRef.current = options.httpRequest;
  } else if (!requestRef.current) {
    requestRef.current = new HttpRequest();
  }

  useEffect(() => {
    let shouldSave = true;
    setData(undefined);
    setIsLoading(true);
    setError(undefined);
    // expanding object to make dependencies the individual keys, as to not worry about object reference stability (since it will change every call)
    getData<T>(path, requestRef.current!, {
      maxCacheAge: options.maxCacheAge,
      skip: options.skip,
      ttl: options.ttl,
      key: options.key,
      postData: options.postData,
      dataCache: options.dataCache || defaultCache,
    })
      .then((resultData) => {
        if (shouldSave) {
          setData(resultData);
          setIsLoading(false);
        }
      })
      .catch((e) => {
        if (shouldSave) {
          setData(undefined);
          setIsLoading(false);
          setError(e as Error);
        }
      });

    return () => {
      shouldSave = false;
      if (requestRef.current) {
        requestRef.current.cancel();
      }
    };
  }, [
    path,
    options.maxCacheAge,
    options.effectCounter,
    options.skip,
    options.ttl,
    options.key,
    options.postData,
    options.dataCache,
  ]);

  const result = useMemo(() => {
    return { data, isLoading, error };
  }, [data, isLoading, error]);

  return result;
}
