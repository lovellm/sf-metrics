import { getApiUrlForEndpoint } from "@/data/apiConstants";
import useData, { UseDataOptions, UseDataResponse } from "./useData";
import { DataResult, Query } from "@/types/dataApi";

/** hook that issues a query request, using cached data if available */
export function useQuery(query?: Query, options: UseDataOptions = {}): UseDataResponse<DataResult> {
  return useData(getApiUrlForEndpoint("query"), {
    ...options,
    postData: query,
    skip: options.skip || !query,
  });
}
