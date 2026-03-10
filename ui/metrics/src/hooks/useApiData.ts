import {
  DataResult,
  Query,
  useData,
  UseDataOptions,
  UseDataResponse,
  getApiUrlForEndpoint,
} from "@spcs-apps/data-utils";

/** hook that issues a request, using cached data if available */
export function useQuery(query?: Query, options: UseDataOptions = {}): UseDataResponse<DataResult> {
  return useData(getApiUrlForEndpoint("query"), {
    ...options,
    postData: query,
    skip: options.skip || !query,
  });
}
