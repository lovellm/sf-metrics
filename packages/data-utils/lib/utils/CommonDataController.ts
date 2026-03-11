import HttpRequest from "./HttpRequest";
import getData from "./getData";
import DataCache from "./DataCache";
import { getApiUrlForEndpoint } from "./apiConstants";
import { DataResult, Query } from "../dataApi";
import parseQueryResponse from "./parseQueryResponse";

export default class CommonDataController {
  private rawDataPromises: Record<string, Promise<unknown>> = {};
  private dataPromises: Record<string, Promise<unknown>> = {};
  private requester: HttpRequest;
  private cache?: DataCache;

  constructor(cache?: DataCache) {
    this.cache = cache;
    this.requester = new HttpRequest({ noCache: true });
  }

  /** if key in rawDataPromises, return existing promise, otherwise issue fetch call and return results */
  protected async genericQuery<T>(key: string, query: Query) {
    if (key in this.rawDataPromises) {
      return this.rawDataPromises[key] as Promise<T[]>;
    }
    const promise = getData<DataResult>(getApiUrlForEndpoint("query"), this.requester, {
      noCacheLimit: true,
      key: key,
      postData: query,
      dataCache: this.cache,
    }).then((d) => {
      const objs = parseQueryResponse<T>(d, query.columns);
      return objs;
    });

    this.rawDataPromises[key] = promise;
    promise.catch(() => {
      delete this.rawDataPromises[key];
    });
    return promise;
  }
  /** if a data promise for key exists, return that. otherwise call action, store its promise, and return its */
  protected async genericGet<T>(key: string, action: () => Promise<T[]>) {
    // if we already have a promise (either pending or complete), return that
    if (key in this.dataPromises) {
      return this.dataPromises[key] as Promise<T[]>;
    }
    const promise = action();
    // save it so it can be returned on subsequent calls
    this.dataPromises[key] = promise;
    // if the saved promised results in an error, remove it so the next call we make a new request
    promise.catch(() => {
      delete this.dataPromises[key];
    });
    // return the promise that will result in the data
    return promise;
  }
}
