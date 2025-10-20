import HttpRequest from "./HttpRequest";
import { DataCache } from "./dataCache";

export interface GetDataOptions {
  /** max age to use for existing cached data */
  maxCacheAge?: number;
  /** ttl to set on any new caches */
  ttl?: number;
  /** if true, returns undefined. useful if needing to conditionally run the precursor hook */
  skip?: boolean;
  /** if given, uses this instead of path for caching. required to cache POSTs, generated automatically from postData if needed */
  key?: string;
  /** if given, will use a POST instead of a GET and pass this as the data */
  postData?: unknown;
  /** if true, cached entry will ignore cache entry limit */
  noCacheLimit?: boolean;
  /** datacache to use for caching the requested data */
  dataCache?: DataCache;
}

/** returns data from the cache if it exists, otherwise from a GET call to the given path
 * @param path path of the api request. either full url or path after base. also used as cache key
 * @param requester the HttpRequest with which to call the api if needed
 * @returns promise that resolves to the data or undefiend
 * @throws on an api error
 */
export default async function getData<T>(
  path: string,
  requester?: HttpRequest,
  options: GetDataOptions = {},
): Promise<T | undefined> {
  if (options.skip) {
    return undefined;
  }

  // determine key for caching
  let key: string | undefined = path;
  if (options.postData) {
    key = options.key;
    if (!key) {
      key = await sha1(JSON.stringify(options.postData));
    }
  }

  // first get from cache if it exists
  if (options.dataCache) {
    const cachedData = await options.dataCache.getData<T>(key, options.maxCacheAge);
    if (cachedData) {
      return cachedData;
    }
  }

  // if no requester given, make one with no cache
  if (!requester) {
    requester = new HttpRequest({ noCache: true });
  }

  // get from api
  let apiData: T | undefined = undefined;
  if (options.postData) {
    apiData = await requester.post<T>(path, options.postData, key);
  } else {
    apiData = await requester.get<T>(path);
  }

  // if we received data, cache it for future
  if (apiData && options.dataCache) {
    await options.dataCache.putData(key, apiData, options.ttl, options.noCacheLimit);
  }

  return apiData;
}

export async function sha1(message: string) {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-1", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}
