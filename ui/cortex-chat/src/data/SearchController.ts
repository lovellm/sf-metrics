import {
  CortexSearchFilter,
  CortexSearchRequest,
  CortexSearchResultRow,
  CortexSearchResults,
  HttpFetch,
  HttpFetchOptions,
} from "@spcs-apps/data-utils";
import { AppConfig, ChatHistoryEntry } from "../constants";

const getSearchEndpoint = (db: string, schema: string, service: string) => {
  return `/api/sf/api/v2/databases/${db}/schemas/${schema}/cortex-search-services/${service}/query`;
};
const DEFAULT_SEARCH_LIMIT = 4;

export interface SearchControllerProps {
  db?: string;
  schema?: string;
  service?: string;
  columns?: string[];
  fetchOptions?: HttpFetchOptions;
}

export default class SearchController {
  db: string;
  schema: string;
  service: string;
  columns: string[];
  limit: number = DEFAULT_SEARCH_LIMIT;
  asApi?: boolean = false;

  #fetcher: HttpFetch;
  #results?: CortexSearchResultRow[];

  constructor({ db, schema, service, columns, fetchOptions }: SearchControllerProps = {}) {
    this.db = db || "";
    this.schema = schema || "";
    this.service = service || "";
    this.columns = columns || ([] as string[]);

    this.#fetcher = new HttpFetch(fetchOptions);
  }

  async search(message: string, filter?: CortexSearchFilter) {
    const request: CortexSearchRequest = {
      columns: this.columns,
      asUser: !this.asApi,
      query: message,
      filter: filter,
      limit: this.limit,
    };

    const responseBody = await this.#fetcher.post<CortexSearchResults>(
      getSearchEndpoint(this.db, this.schema, this.service),
      request,
    );
    this.#results = responseBody?.results;
    return this.#results;
  }

  get results() {
    return this.#results;
  }

  /** remove any saved results from previous calls */
  clearResults() {
    this.#results = undefined;
  }

  /** given an appConfig, returns whether it has sufficient fields for a search */
  static hasSearch(appConfig?: AppConfig) {
    if (!appConfig) {
      return false;
    }
    return !!(
      appConfig.cortexSearchService?.db &&
      appConfig.cortexSearchService?.schema &&
      appConfig.cortexSearchService?.service &&
      appConfig.cortexSearchDocuments?.nameField &&
      appConfig.cortexSearchDocuments?.contentField
    );
  }

  loadSavedHistory(savedHistory?: ChatHistoryEntry) {
    if (!savedHistory) {
      return;
    }
    this.#results = savedHistory.docs;
  }
}
