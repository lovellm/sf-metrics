import {
  AppConfig,
  AppConfigOption,
  SupportLink,
  SupportLinks,
  testConfigs,
  testOptions,
} from "../constants";
import {
  HttpRequest,
  DataCache,
  getDefaultCacheOptions,
  Query,
  getData,
  DataResult,
  getApiUrlForEndpoint,
  parseQueryResponse,
} from "@spcs-apps/data-utils";

const localConfigs = true;

export interface DataConfig {
  app_id?: string;
  app_title?: string;
  app_info?: string;
  search_db?: string;
  search_schema?: string;
  search_service?: string;
  search_limit?: number;
  search_as_api?: boolean;
  search_doc_name?: string;
  search_doc_content?: string;
  search_doc_url?: string;
  chat_as_api?: boolean;
  chat_model?: string;

  /** jsonified SupportLinks object */
  support_links?: string;

  has_options?: boolean;
  disabled?: boolean;
}

export interface DataConfigOption {
  app_id?: string;
  display_order?: number;
  option_name?: string;
  db_name?: string;
  table_id?: string;
  value_field?: string;
  label_field?: string;
  lookup_values?: string;
  db_type?: string;
}

const ConfigKey = "configs";
const OptionsKey = "options_";
const ConfigTable = "CORTEX_CHAT_CONFIG";
const OptionTable = "CORTEX_CHAT_OPTION";
const configQuery: Query = {
  table: ConfigTable,
  columns: [
    "app_id",
    "app_title",
    "app_info",
    "search_db",
    "search_schema",
    "search_service",
    "search_limit",
    "search_as_api",
    "search_doc_name",
    "search_doc_content",
    "search_doc_url",
    "chat_as_api",
    "chat_model",
    "support_links",
    "has_options",
  ],
  filter: { or: [{ notnull: { name: "disabled" } }, { eq: ["disabled", false] }] },
};
const optionQuery: Query = {
  table: OptionTable,
  columns: [
    "app_id",
    "display_order",
    "is_language",
    "option_name",
    "db_name",
    "table_id",
    "value_field",
    "label_field",
    "lookup_values",
    "db_type",
  ],
};
const hours8 = 1000 * 60 * 60 * 8;

export const cacheInstance = new DataCache("cortex-chat-configs", getDefaultCacheOptions());

/** utility class to get config information and cache it */
class ConfigCache {
  promise?: Promise<AppConfig[]>;
  isError?: boolean;
  request: HttpRequest;
  optionPromise: Record<string, Promise<AppConfigOption[]>> = {};
  optionError: Record<string, boolean> = {};

  constructor() {
    this.request = new HttpRequest({ noCache: true, timeout: 10000 });
  }

  /** retrieve the AppConfigs from the database (or cache) */
  async getAppConfigs(): Promise<AppConfig[]> {
    if (localConfigs === true) {
      return Object.values(testConfigs);
    }
    if (this.promise && !this.isError) {
      return this.promise;
    }
    this.promise = new Promise((resolve, reject) => {
      getData<DataResult>(getApiUrlForEndpoint("query"), this.request, {
        dataCache: cacheInstance,
        key: ConfigKey,
        maxCacheAge: hours8,
        postData: configQuery,
      })
        .then((data) => {
          const c = parseQueryResponse<DataConfig>(data, configQuery.columns)
            .map((row) => {
              const appConfig = dataConfigToAppConfig(row);
              if (appConfig) {
                return appConfig;
              }
            })
            .filter<AppConfig>((o) => o !== undefined);
          resolve(c);
        })
        .catch((e) => {
          this.isError = true;
          reject(e as Error);
        });
    });
    return this.promise;
  }

  /** inserts a new config record and refreshes the config cache */
  async addConfig(c: DataConfig): Promise<true> {
    if (localConfigs) {
      return true;
    }

    const nextData = c;
    if (!nextData?.app_id) {
      throw new Error("Must provide an app id to create a new config");
    }

    throw new Error("Not Implemented");

    // try {
    //   await this.refreshAppConfigs();
    // } catch (e) {
    //   console.error("failed to refresh config cache after creating new config");
    // }
    // return true;
  }

  /** remove a config record and refreshes the config cache */
  async removeConfig(id: string): Promise<true> {
    if (!id) {
      throw new Error("Must provide an app id to remove a config");
    }
    if (localConfigs) {
      return true;
    }

    throw new Error("Not Implemented");
    // try {
    //   await this.refreshAppConfigs();
    // } catch (e) {
    //   console.error("failed to refresh config cache after removing config");
    // }
    // return true;
  }

  /** update a config record and refreshes the config cache */
  async updateConfig(c: DataConfig): Promise<true> {
    if (!c || !c.app_id) {
      throw new Error("Must provide an app id to update a config");
    }
    if (localConfigs) {
      return true;
    }

    // const nextData: Record<string, DataValue> = {
    //   app_id: c.app_id,
    //   app_title: c.app_title ?? null,
    //   app_info: c.app_info ?? null,
    //   chat_as_api: c.chat_as_api ?? null,
    //   chat_model: c.chat_model ?? null,
    //   search_as_api: c.search_as_api ?? null,
    //   search_db: c.search_db ?? null,
    //   search_schema: c.search_schema ?? null,
    //   search_service: c.search_service ?? null,
    //   search_limit: c.search_limit ?? null,
    //   search_doc_name: c.search_doc_name ?? null,
    //   search_doc_content: c.search_doc_content ?? null,
    //   search_doc_url: c.search_doc_url ?? null,
    //   has_options: c.has_options ?? null,
    //   support_links: c.support_links ?? null,
    // };

    throw new Error("Not Implemented");

    // try {
    //   await this.refreshAppConfigs();
    // } catch (e) {
    //   console.error("failed to refresh config cache after updating config");
    // }
    // return true;
  }

  /** removes current config cache and then fetches new */
  async refreshAppConfigs(): Promise<AppConfig[]> {
    this.promise = undefined;
    this.request.emptyInternalCache();
    await cacheInstance.deleteData(ConfigKey);
    return await this.getAppConfigs();
  }

  /** retrieve the search filter options for the given app id */
  async getAppOptions(appId?: string): Promise<AppConfigOption[]> {
    if (!appId) {
      return [];
    }
    if (localConfigs === true) {
      return testOptions[appId] || [];
    }
    if (appId in this.optionPromise && !this.optionError[appId]) {
      return this.optionPromise[appId];
    }
    this.optionPromise[appId] = new Promise<AppConfigOption[]>((resolve, reject) => {
      getData<DataResult>(getApiUrlForEndpoint("query"), this.request, {
        dataCache: cacheInstance,
        key: OptionsKey + appId,
        maxCacheAge: hours8,
        postData: { ...optionQuery, filter: { eq: ["APP_ID", `'${appId}'`] } },
      })
        .then((data) => {
          const c = parseQueryResponse<DataConfigOption>(data, configQuery.columns).map((row) => {
            const appOption: AppConfigOption = {
              appId: row.app_id,
              displayOrder: row.display_order,
              optionName: row.option_name,
              dbName: row.db_name,
              tableId: row.table_id,
              valueField: row.value_field,
              labelField: row.label_field,
              lookupValues: row.lookup_values,
            };
            // add db type
            switch (row.db_type) {
              case "array":
                appOption.dbType = "array";
                break;
              case "string":
              default:
                appOption.dbType = "string";
            }
            return appOption;
          });
          resolve(c);
        })
        .catch((e) => {
          this.isError = true;
          reject(e as Error);
        });
    });
    return this.optionPromise[appId];
  }

  /** inserts a new option record and refreshes the option cache */
  async addAppOption(opt: AppConfigOption): Promise<true> {
    if (!opt || !opt.appId || !opt.optionName) {
      throw new Error("Must provide an app id and option name to create a new option");
    }
    if (localConfigs) {
      return true;
    }
    throw new Error("Not Implemented");

    // const nextData: DataConfigOption = {
    //   app_id: opt.appId,
    //   display_order: opt.displayOrder || undefined,
    //   is_language: opt.isLanguage || undefined,
    //   option_name: opt.optionName,
    //   db_name: opt.dbName || undefined,
    //   table_id: opt.tableId || undefined,
    //   value_field: opt.valueField || undefined,
    //   label_field: opt.labelField || undefined,
    //   lookup_values: opt.lookupValues || undefined,
    //   db_type: opt.dbType || undefined,
    // };

    // try {
    //   await this.refreshAppOptions(opt.appId);
    // } catch (e) {
    //   console.error("failed to refresh option cache after creating new option");
    // }
    // return true;
  }

  /** update option record and refreshes the option cache.
   * originalName required if different than opt.optionName
   */
  async updateAppOption(opt: AppConfigOption, originalName?: string): Promise<true> {
    const nameKey = originalName || opt.optionName;
    if (!opt || !opt.appId || !nameKey) {
      throw new Error("Must provide an app id and option name to update an option");
    }
    if (localConfigs) {
      return true;
    }
    throw new Error("Not Implemented");

    // const nextData: Record<string, DataValue | undefined> = {
    //   app_id: opt.appId,
    //   display_order: opt.displayOrder || null,
    //   option_name: opt.optionName,
    //   is_language: opt.isLanguage ?? null,
    //   db_name: opt.dbName || null,
    //   table_id: opt.tableId || null,
    //   value_field: opt.valueField || null,
    //   label_field: opt.labelField || null,
    //   lookup_values: opt.lookupValues || null,
    //   db_type: opt.dbType || null,
    // };

    // try {
    //   await this.refreshAppOptions(opt.appId);
    // } catch (e) {
    //   console.error("failed to refresh option cache after updating option");
    // }
    // return true;
  }

  /** remove an option for the given app id */
  async removeAppOption(appId: string, optionName: string): Promise<true> {
    if (!appId || !optionName) {
      throw new Error("Must provide an app id and option name to remove it");
    }
    if (localConfigs) {
      return true;
    }
    throw new Error("Not Implemented");

    // try {
    //   await this.refreshAppOptions(appId);
    // } catch (e) {
    //   console.error("failed to refresh options cache after remove option");
    // }
    // return true;
  }

  /** removes current options cache and then fetches new */
  async refreshAppOptions(appId: string): Promise<AppConfigOption[]> {
    if (appId in this.optionPromise) {
      delete this.optionPromise[appId];
    }
    this.request.emptyInternalCache();
    await cacheInstance.deleteData(OptionsKey + appId);
    return await this.getAppOptions(appId);
  }

  async clearCache() {
    this.promise = undefined;
    this.isError = false;
    this.optionError = {};
    this.optionPromise = {};
    return cacheInstance.clear();
  }
}

const configCache = new ConfigCache();
export default configCache;

/** config a DataConfig response from the database to an AppConfig object */
export const dataConfigToAppConfig = (data?: DataConfig): AppConfig | undefined => {
  // ignore if missing critical fields
  if (!data || !data.app_id) {
    return undefined;
  }
  // create the basic config
  const config: AppConfig = {
    appId: data.app_id,
    appTitle: data.app_title,
    appInfo: data.app_info,
    model: data.chat_model,
    chatAsApi: data.chat_as_api,
  };
  // add in search service fields
  if (data.search_db && data.search_schema && data.search_service) {
    config.cortexSearchService = {
      db: data.search_db,
      schema: data.search_schema,
      service: data.search_schema,
      asApi: data.search_as_api || undefined,
      limit: data.search_limit || undefined,
    };
  }
  // add in search document fields
  if (data.search_doc_name && data.search_doc_content) {
    config.cortexSearchDocuments = {
      nameField: data.search_doc_name,
      contentField: data.search_doc_content,
      urlField: data.search_doc_url,
    };
  }
  // Parse the support_links string to a SupportLinks object
  if (data.support_links) {
    try {
      const parsed = JSON.parse(data.support_links) as Partial<SupportLinks>;
      const supportLinks: Partial<SupportLinks> = {};
      if (parsed.title && typeof parsed.title === "string") {
        supportLinks.title = parsed.title;
      }
      if (Array.isArray(parsed.links)) {
        supportLinks.links = [];
        parsed.links.forEach((link) => {
          const supportLink: Partial<SupportLink> = {};
          if (typeof link.name === "string" && typeof link.href === "string") {
            supportLink.name = link.name;
            supportLink.href = link.href;
            supportLinks.links!.push(supportLink as SupportLink);
          }
        });
      }
      if (supportLinks.title || supportLinks.links) {
        config.supportLinks = supportLinks;
      }
    } catch (e) {
      console.warn("unable to parse SupportLinks for " + config.appId, e);
    }
  }

  return config;
};

/** config a DataConfig response from the database to an AppConfig object */
export const appConfigToDataConfig = (config?: AppConfig): DataConfig | undefined => {
  if (!config || !config.appId) {
    return undefined;
  }
  // create the basic config
  const data: DataConfig = {
    app_id: config.appId,
    app_info: config.appInfo,
    app_title: config.appTitle,
    chat_as_api: config.chatAsApi,
    chat_model: config.model,
    search_as_api: config.cortexSearchService?.asApi,
    search_db: config.cortexSearchService?.db,
    search_schema: config.cortexSearchService?.schema,
    search_service: config.cortexSearchService?.service,
    search_limit: config.cortexSearchService?.limit,
    search_doc_name: config.cortexSearchDocuments?.nameField,
    search_doc_content: config.cortexSearchDocuments?.contentField,
    search_doc_url: config.cortexSearchDocuments?.urlField,
    has_options: config.hasOptions,
    support_links: config.supportLinks ? JSON.stringify(config.supportLinks) : undefined,
  };

  return data;
};
