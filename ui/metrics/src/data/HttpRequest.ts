import { getApiBase } from "@/data/apiConstants";
import axios, { AxiosRequestConfig } from "axios";

type RequestMethod = "get" | "post";
interface HttpRequestOptions {
  /** will cancel any existing fetches upon fetch. implies noCache. */
  cancelOnFetch?: boolean;
  timeout?: number;
  /** no local promise cache, every fetch call issues new request */
  noCache?: boolean;
  /** ttl in ms of caches promises - should be very short and not relied upon */
  promiseCacheTtl?: number;
}

interface SimpleCacheEntry<T> {
  timestamp: number;
  promise: Promise<T>;
}

export default class HttpRequest {
  private abortController?: AbortController;
  private timeout = 30000;
  private cancelOnFetch?: boolean = false;
  private noCache?: boolean = false;
  private simpleCache: Record<string, SimpleCacheEntry<unknown>> = {};
  // very short age, mostly exists to prevent erroneous duplicate calls
  private simpleCacheAge = 1000 * 3;

  constructor(options?: HttpRequestOptions) {
    this.abortController = undefined;
    if (options) {
      this.cancelOnFetch = options.cancelOnFetch;
      this.noCache = options.noCache;
      if (options.timeout && options.timeout > 0) {
        this.timeout = options.timeout;
      }
      if (options.promiseCacheTtl) {
        this.simpleCacheAge = options.promiseCacheTtl;
      }
    }
  }

  /** wrapper around 'fetch' for GET method */
  async get<T>(endpoint: string): Promise<T | undefined> {
    return this.fetch<T>("get", endpoint);
  }

  /** wrapper around 'fetch' for POST method */
  async post<T>(endpoint: string, requestData?: unknown, key?: string): Promise<T | undefined> {
    return this.fetch<T>("post", endpoint, requestData, key);
  }

  async fetch<T>(
    method: RequestMethod,
    endpoint: string,
    requestData?: unknown,
    key?: string,
  ): Promise<T | undefined> {
    const url = this.urlFromEndpoint(endpoint);
    const now = new Date().valueOf();
    if (this.cancelOnFetch) {
      // want to cancel on fetch, do so
      this.cancel();
      this.abortController = new AbortController();
    } else if (!this.noCache) {
      // otherwise, see if a simple cache entry exists and return that
      const cached = this.simpleCache[key || endpoint] as SimpleCacheEntry<T>;
      if (cached) {
        const age = now - cached.timestamp;
        if (age < this.simpleCacheAge) {
          return cached.promise;
        }
      }
    }

    const promise = this.getData<T>(method, url, requestData).catch((e) => {
      if (axios.isCancel(e)) {
        console.warn("request was cancelled, returned undefined");
        return undefined;
      }
      throw e;
    });

    // add this promise to the simple cache
    this.simpleCache[key || endpoint] = {
      timestamp: now,
      promise: promise,
    };

    // remove old simple cache entries
    Object.entries(this.simpleCache).forEach(([cacheKey, value]) => {
      if (value && value.timestamp + this.simpleCacheAge < now) {
        delete this.simpleCache[cacheKey];
      }
    });

    // return the newly created promise
    return promise;
  }

  /** issue the request to the url and return the data
   * @param method method of the request
   * @param url url for the request
   * @param data data to pass with the request
   * @returns data returned from the server
   */
  private async getData<T>(method: RequestMethod, url: string, data?: unknown): Promise<T> {
    const fetchOptions: AxiosRequestConfig = {
      signal: this.abortController?.signal,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: this.timeout,
    };

    let resultData: T;
    switch (method) {
      case "get": {
        const result = await axios.get<T>(url, fetchOptions);
        resultData = result.data;
        break;
      }
      case "post": {
        const result = await axios.post<T>(url, data, fetchOptions);
        resultData = result.data;
        break;
      }
      default:
        throw new Error("invalid request method");
    }

    return resultData;
  }

  cancel() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /** generates a url from and endpoint.
   * if endpoint starts with http, uses as it, otherwise appends it to the base
   * @param endpoint endpoing to call
   * @returns url to use in api calls
   */
  urlFromEndpoint(endpoint: string) {
    const apiBase = getApiBase();
    let url;
    if (endpoint.startsWith("http")) {
      url = endpoint;
    } else if (endpoint.startsWith("/")) {
      url = apiBase + endpoint;
    } else {
      url = apiBase + "/" + endpoint;
    }
    return url;
  }
}
