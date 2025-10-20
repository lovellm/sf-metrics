import { DataApplication, DataQueryType, DataWarehouseName } from "@/types/commonTypes";
import HttpRequest from "./HttpRequest";
import getData from "./getData";
import { getMonthForMonthsAgo } from "@/utils/dates";
import { DataCache, defaultCache } from "./dataCache";
import { getApiUrlForEndpoint } from "@/data/apiConstants";
import { DataResult, Query } from "@/types/dataApi";
import parseQueryResponse from "@/utils/parseQueryResponse";

class CommonDataController {
  private rawDataPromises: Record<string, Promise<unknown>> = {};
  private dataPromises: Record<string, Promise<unknown>> = {};
  private requester: HttpRequest;
  private cache: DataCache;

  constructor(cache: DataCache) {
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

  private async queryQueryType(): Promise<DataQueryType[]> {
    const key = "common_data_query_type";
    return this.genericQuery<DataQueryType>(key, {
      schema: "SF_METRICS",
      table: "V_USER_QUERY_FACT",
      columns: ["QUERY_TYPE"],
      filter: {
        gte: ["LOGDATE", `'${getMonthForMonthsAgo(1)}'`],
      },
      distinct: true,
      limit: 1000,
      asUser: true,
    });
  }
  async getQueryType(): Promise<DataQueryType[]> {
    const key = "query_type";
    const action = async (): Promise<DataQueryType[]> => {
      const rawData = await this.queryQueryType();
      return rawData;
    };
    return this.genericGet<DataQueryType>(key, action);
  }

  private async queryWarehouseName(): Promise<DataWarehouseName[]> {
    const key = "common_data_warehouse_name";
    return this.genericQuery<DataWarehouseName>(key, {
      schema: "SF_METRICS",
      table: "V_USER_QUERY_FACT",
      columns: ["WAREHOUSE_NAME"],
      filter: {
        gte: ["LOGDATE", `'${getMonthForMonthsAgo(1)}'`],
      },
      distinct: true,
      limit: 1000,
      asUser: true,
    });
  }
  async getWarehouseName(): Promise<DataWarehouseName[]> {
    const key = "warehouse_name";
    const action = async (): Promise<DataWarehouseName[]> => {
      const rawData = await this.queryWarehouseName();
      return rawData;
    };
    return this.genericGet<DataWarehouseName>(key, action);
  }

  private async queryApplication(): Promise<DataApplication[]> {
    const key = "common_data_application";
    return this.genericQuery<DataApplication>(key, {
      schema: "SF_METRICS",
      table: "V_USER_QUERY_FACT",
      columns: ["APPLICATION"],
      filter: {
        gte: ["LOGDATE", `'${getMonthForMonthsAgo(1)}'`],
      },
      distinct: true,
      limit: 1000,
      asUser: true,
    });
  }
  async getApplication(): Promise<DataApplication[]> {
    const key = "application";
    const action = async (): Promise<DataApplication[]> => {
      const rawData = await this.queryApplication();
      return rawData;
    };
    return this.genericGet<DataApplication>(key, action);
  }
}

const commonDataController = new CommonDataController(defaultCache);
export default commonDataController;
