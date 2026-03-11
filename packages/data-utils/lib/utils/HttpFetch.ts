import { urlFromEndpoint } from "./HttpRequest";

export interface HttpFetchOptions {
  timeout?: number;
  withCredentials?: boolean;
  /** no local promise cache, every fetch call issues new request */
  noCache?: boolean;
  /** ttl in ms of caches promises - should be very short and not relied upon */
  promiseCacheTtl?: number;
}

interface SimpleCacheEntry<T> {
  timestamp: number;
  promise: Promise<T>;
}

const DEFAULT_TIMEOUT = 30000;

export class FetchError extends Error {
  status: number;
  text?: string;

  constructor(status: number, message: string, text?: string) {
    super(message);
    this.name = "FetchError";
    this.status = status;
    this.text = text;
  }
}

/** Used to issue a request via browser fetch function to a remote endpoint.
 * Can stream the result back, or if not streamed, assumed the result will be JSON data. */
export default class HttpFetch {
  private abortController?: AbortController;
  private timeout = DEFAULT_TIMEOUT;
  private noCache?: boolean = false;
  private withCredentials?: boolean = undefined;
  private simpleCache: Record<string, SimpleCacheEntry<unknown>> = {};
  // very short age, mostly exists to prevent erroneous duplicate calls
  private simpleCacheAge = 1000 * 3;

  constructor(options?: HttpFetchOptions) {
    this.abortController = undefined;
    if (options) {
      this.noCache = options.noCache;
      if (options.timeout && options.timeout > 0) {
        this.timeout = options.timeout;
      }
      this.withCredentials = options.withCredentials;
      if (options.promiseCacheTtl) {
        this.simpleCacheAge = options.promiseCacheTtl;
      }
    }
  }

  /** wrapper around 'fetch' for GET method that parses result to JSON */
  async get<T>(endpoint: string): Promise<T | undefined> {
    return this.fetch<T>("get", endpoint);
  }

  /** wrapper around 'fetch' for POST method that parses result to JSON*/
  async post<T>(endpoint: string, requestData?: unknown, key?: string): Promise<T | undefined> {
    return this.fetch<T>("post", endpoint, requestData, key);
  }

  /** wrapper around 'fetch' for POST method that returns original body stream */
  async postStream(endpoint: string, requestData?: unknown, key?: string) {
    return this.fetch<ReadableStream<Uint8Array<ArrayBufferLike>> | null>(
      "post",
      endpoint,
      requestData,
      key,
      true,
    );
  }

  async fetch<T>(
    method: string,
    endpoint: string,
    requestData?: unknown,
    key?: string,
    stream?: boolean,
  ): Promise<T | undefined> {
    const url = urlFromEndpoint(endpoint);
    const now = new Date().valueOf();
    if (!this.noCache) {
      // otherwise, see if a simple cache entry exists and return that
      const cached = this.simpleCache[key || endpoint] as SimpleCacheEntry<T>;
      if (cached) {
        const age = now - cached.timestamp;
        if (age < this.simpleCacheAge) {
          return cached.promise;
        }
      }
    }

    const promise = this.getAndParseData<T>(method, url, requestData, stream);

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

    return promise;
  }

  /** gets the data. if stream, returns the original body stream. otherwise, parses to json */
  private async getAndParseData<T>(
    method: string,
    url: string,
    requestData?: unknown,
    stream?: boolean,
  ) {
    const response = await this.getData(method, url, requestData);

    if (response.status < 200 || response.status >= 300) {
      const text = await HttpFetch.parseTextStream(response.body);
      throw new FetchError(response.status, response.statusText, text);
    }

    if (!response?.body) {
      return undefined;
    }

    if (!stream) {
      return (await response.json()) as T;
    }
    return response.body as T;
  }

  /** issue the request to the url and return the data
   * @param method method of the request
   * @param url url for the request
   * @param data data to pass with the request
   * @returns data returned from the server
   */
  private async getData(method: string, url: string, data?: unknown): Promise<Response> {
    // make the headers
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    let body: BodyInit | undefined = undefined;
    if (typeof data === "string") {
      body = data;
    } else if (typeof data === "object" && data !== null) {
      body = JSON.stringify(data);
    } else if (
      data instanceof ArrayBuffer ||
      data instanceof Blob ||
      data instanceof File ||
      data instanceof URLSearchParams ||
      data instanceof FormData ||
      data instanceof ReadableStream
    ) {
      body = data;
    } else {
      throw new Error("invalid request data");
    }
    const signals: AbortSignal[] = [];
    if (this.timeout) {
      signals.push(AbortSignal.timeout(this.timeout));
    }
    if (this.abortController) {
      signals.push(this.abortController.signal);
    }
    // make the options
    const requestOptions: RequestInit = {
      method: method,
      signal: signals.length > 0 ? AbortSignal.any(signals) : undefined,
      headers: headers,
      credentials: this.withCredentials ? "include" : undefined,
      body: body,
    };

    return fetch(url, requestOptions);
  }

  cancel() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /** parse a stream to a utf-8 string. assumes data is the body from a fetch call */
  static async parseTextStream(
    data: ReadableStream<Uint8Array<ArrayBufferLike>> | null,
  ): Promise<string> {
    const allChunks: Uint8Array[] = [];
    const reader = data?.getReader();
    const decoder = new TextDecoder();
    while (reader) {
      const chunk = await reader.read();
      if (chunk.value) {
        allChunks.push(chunk.value);
      }
      if (chunk.done) {
        break;
      }
    }
    let text = "";
    for (const chunk of allChunks) {
      text += decoder.decode(chunk, { stream: true });
    }
    text += decoder.decode();
    if (text.charCodeAt(0) === 0xfeff) {
      return text.slice(1);
    }
    return text;
  }

  emptyInternalCache() {
    this.simpleCache = {};
  }
}
