import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import asyncTimeout from "../utils/asyncTimeout";

// list of endpoints used
// - initial submit: POST /api/v2/statements?async=true
// - check status: GET /api/v2/statements/${statementHandle}
// - get partition: GET /api/v2/statements/${statementHandle}?partition=${partition}
// - cancel: POST /api/v2/statements/${statementHandle}/cancel

/** a row returned by the api */
export type SnowflakeApiDatatRow = Array<string | null>;
/** array of rows returned by the api (a table) */
export type SnowflakeApiData = SnowflakeApiDatatRow[];
/** the results of a single page (partition) */
export type SnowflakeApiPartitionResult = {
  data?: SnowflakeApiData;
};
/** information about a column in a query result
 * https://docs.snowflake.com/en/developer-guide/sql-api/reference#resultset-resultsetmetadata-rowtype
 */
export type SnowflakeApiResultRowType = {
  name: string;
  type: string;
  length?: number;
  precision?: number;
  scale?: number;
  nullable?: boolean;
};
/** metadata about a resultset
 * https://docs.snowflake.com/en/developer-guide/sql-api/reference#resultset-resultsetmetadata
 */
export type SnowflakeApiResultMetadata = {
  partition?: number;
  numRows?: number;
  format?: string;
  rowType?: SnowflakeApiResultRowType[];
  partitionInfo?: { rowCount: number; uncompressedSize?: number; compressedSize?: number }[];
};
/** stats for a dml operation
 * https://docs.snowflake.com/en/developer-guide/sql-api/reference#resultset-stats
 */
export type SnowflakeApiResultStats = {
  numRowsInserted?: number;
  numRowsUpdated?: number;
  numRowsDeleted?: number;
  numDuplicatedRowsUpdated?: number;
};
/** properties that are returned in a call to the query status api.
 * returned on a 202 response code.
 * https://docs.snowflake.com/en/developer-guide/sql-api/reference#querystatus
 */
export type SnowflakeApiQueryStatus = {
  code: string;
  sqlState: string;
  message: string;
  statementHandle: string;
  createdOn?: number;
  statementStatusUrl?: string;
};
/** properties that are returned with a result set from the api
 * https://docs.snowflake.com/en/developer-guide/sql-api/reference#resultset
 */
export type SnowflakeApiResultSet = {
  code: string;
  sqlState: string;
  message: string;
  statementHandle?: string;
  statementHandles?: string[];
  createdOn?: number;
  statementStatusUrl?: string;
  resultSetMetaData: SnowflakeApiResultMetadata;
  data: SnowflakeApiData | string;
  stats?: SnowflakeApiResultStats;
};
export type SnowflakeApiStatementResponse = SnowflakeApiQueryStatus | SnowflakeApiResultSet;

/** Parameters to pass along with the statement
 * https://docs.snowflake.com/en/developer-guide/sql-api/reference#statements-parameters
 */
export type SnowflakeApiStatementParams = {
  binary_output_format?: string;
  client_result_chunk_size?: number;
  date_output_format?: string; // ex: YYYY-MM-DD
  multi_statement_count?: number;
  query_tag?: string;
  rows_per_resultset?: number;
  time_output_format?: string;
  timestamp_ltz_output_format?: string;
  timestamp_ntz_output_format?: string;
  timestamp_output_format?: string;
  timestamp_tz_output_format?: string;
  timezone?: string;
  use_cached_resultset?: string;
};
/** the datatype and value for an individual bind variable */
export interface SnowflakeBindVariable {
  type: string;
  value: string;
}
/** bind variables for the provided query
 * https://docs.snowflake.com/en/developer-guide/sql-api/submitting-requests#using-bind-variables-in-a-statement
 */
export type SnowflakeBindings = Record<string, SnowflakeBindVariable>;
/** body of the query request
 * https://docs.snowflake.com/en/developer-guide/sql-api/reference#body-of-the-post-request-to-api-v2-statements
 */
export type SnowflakeQueryRequest = {
  statement: string;
  /** timeout for the query execution in Snowflake, before it returns results */
  timeout?: number;
  database?: string;
  schema?: string;
  warehouse?: string;
  role?: string;
  bindings?: SnowflakeBindings;
  parameters?: SnowflakeApiStatementParams;
};
/** error body returned from the api */
export type SnowflakeApiError = {
  code: string;
  message: string;
  sqlState: string;
  statementHandle: string;
};
/** options to provide to SnowflakeApiRequest when making a new instance.
 * apply to all queries issued by that instance.
 */
export interface SnowflakeApiRequestOptions {
  maxResultBytes?: number;
  /** the total timeout for the entire runQuery process, across all underlying queries */
  totalTimeout?: number;
  /** the timeout for any individual fetch request issued by the instance */
  timeout?: number;
  database?: string;
  schema?: string;
  warehouse?: string;
  role?: string;
  parameters?: SnowflakeApiStatementParams;
}
/** the result of calling runQuery from a SnowflakeApiRequest instance */
export interface RunQueryResult {
  data: SnowflakeApiData;
  columns: SnowflakeApiResultRowType[];
}

type SnowflakeApiHeaders = {
  Accept: "application/json";
  "Content-Type": "application/json";
};
type ApiStatus = "" | "executing" | "results" | "done" | "error";
type ValidateStatusFn = (status: number) => boolean;

const DEFAULT_TIMEOUT = 30000; // 30s
const DEFAULT_TOTAL_TIMEOUT = 300000; // 5min
const DEFAULT_MAX_BYTES = 209715200; // 200MB
const STATUS_POLLING_INTERVAL = 3000; // 3s
/** params that will format dates as iso strings */
export const datesAsStrings: Partial<SnowflakeApiStatementParams> = {
  date_output_format: "YYYY-MM-DD",
  timestamp_ntz_output_format: "YYYY-MM-DD HH:mm:ss",
  timestamp_output_format: "YYYY-MM-DD HH24:MI:SS TZHTZM",
};
/** given the result metadata, calculate the total response size of all partitions.
 * This is approximately the csv size.
 */
const getTotalSize = (meta?: SnowflakeApiResultMetadata): number => {
  if (!meta?.partitionInfo) {
    return 0;
  }
  return meta.partitionInfo.reduce(
    (running, current) => running + (current.uncompressedSize || 0),
    0,
  );
};
/** return the url to call for the provided api endpoint, which must start with "/" */
const makeUrl = (endpoint: string): string => {
  return "/api/sf" + endpoint;
};
const acceptSnowflakeStatusCodes: ValidateStatusFn = (status: number) => {
  // these can be normal “still running / retry” responses
  return status === 200 || status === 202 || status === 429;
  // 200 = query done, results ready
  // 202 = query still running
  // 429 = too many requests, try again
  // 408 = exceeeded query timeout
  // 422 = error while executing the query
};
const isResultSetResponse = (value: unknown): value is SnowflakeApiResultSet => {
  if (typeof value !== "object" || value === null || !("resultSetMetaData" in value)) {
    return false;
  }
  const meta = value.resultSetMetaData;
  return typeof meta === "object" && meta !== null;
};

/** submits a query to snowflake sql rest api.
 * handles polling for results and handling paged responses.
 */
export default class SnowflakeApiRequest {
  private abortController?: AbortController;
  private options: SnowflakeApiRequestOptions;
  private inProgress?: boolean = false;
  private statementHandle?: string;
  /** timestamp when a query was submitted */
  private ts: number = 0;
  private resultMeta?: SnowflakeApiResultMetadata;
  private allData?: SnowflakeApiData;
  private nextPartition: number = 0;
  /** the current status or step of the query */
  #status: ApiStatus = "";
  /** percent of results retrieved, as integer 0-100 */
  #percent?: number = 0;

  get percent() {
    return this.#percent;
  }
  get status() {
    return this.#status;
  }

  constructor(options: SnowflakeApiRequestOptions = {}) {
    this.abortController = new AbortController();
    this.options = options;
  }

  /** submits a new query to snowflake for execution.
   * if want to submit a new query, must call `done` before doing so or will get errors.
   * @param sql
   * @param bindings
   * @returns query status that will include the query handle id for retrieving results
   */
  private async submitQuery(sql: string, bindings?: SnowflakeBindings, query_tag?: string) {
    if (this.inProgress) {
      throw new Error("request already in progress. finish or cancel it first");
    }
    const url = makeUrl("/api/v2/statements?async=true");
    const parameters = this.options.parameters ? { ...this.options.parameters } : {};
    parameters.query_tag = query_tag;
    const body: SnowflakeQueryRequest = {
      statement: sql,
      bindings: bindings,
      database: this.options.database,
      schema: this.options.schema,
      warehouse: this.options.warehouse,
      role: this.options.role,
      parameters: parameters,
    };
    this.inProgress = true;

    const promise = this.getData<SnowflakeApiStatementResponse>("post", url, body).catch((e) => {
      if (axios.isCancel(e)) {
        console.warn("request was cancelled, returned undefined");
        return undefined;
      }
      throw e;
    });

    return promise;
  }

  /** given an initial result set, saves the first partition of data, the metadata, and sets the status to the results phase */
  private handleInitialResults(results: SnowflakeApiResultSet) {
    this.resultMeta = results.resultSetMetaData;
    if (Array.isArray(results.data)) {
      this.allData = ([] as SnowflakeApiData).concat(results.data);
    } else {
      // in case initial page had no data, just the metadata
      this.allData = [];
    }
    this.#status = "results";
    // partition 0 is this initial set, start with partition 1
    this.nextPartition = 1;
    const totalSize = getTotalSize(results.resultSetMetaData);
    if (totalSize > (this.options.maxResultBytes || DEFAULT_MAX_BYTES)) {
      this.cancel();
      throw new Error("result size is too large.");
    }
  }

  /** gets the status or first partition of results for the given statement handle.
   * a false value means execution still in process and results not yet available.
   */
  private async getStatus(statementHandle: string): Promise<false | SnowflakeApiResultSet> {
    if (!statementHandle && !this.inProgress) {
      throw new Error("statement handle and in progress query must exist");
    }
    const url = makeUrl("/api/v2/statements/" + statementHandle);
    const result = await this.getData<SnowflakeApiStatementResponse>(
      "get",
      url,
      undefined,
      acceptSnowflakeStatusCodes,
    );
    if (result.status !== 200) {
      return false;
    }
    const apiResult = result.data;
    if (isResultSetResponse(apiResult)) {
      return apiResult;
    }

    throw new Error("query status is complete, but no ResultSet response received");
  }

  /** executes the provided query, returning the resulting data and list of columns */
  async runQuery(
    sql: string,
    bindings?: SnowflakeBindings,
    query_tag?: string,
  ): Promise<RunQueryResult> {
    if (this.status) {
      throw new Error("query already in progress. cancel it or mark it as done");
    }
    try {
      // submit the query
      this.ts = new Date().valueOf();
      this.#status = "executing";
      const submitResults = await this.submitQuery(sql, bindings, query_tag);
      const submitData = submitResults?.data;
      this.statementHandle = submitData?.statementHandle;
      if (!this.statementHandle) {
        throw new Error("no statement handle returned after running the query");
      }

      if (isResultSetResponse(submitData)) {
        // if we already have a ResultSet, handle it immediately without polling.
        this.handleInitialResults(submitData);
      } else {
        // poll for results
        while (this.#status === "executing" && this.notTimedout()) {
          await asyncTimeout(STATUS_POLLING_INTERVAL);
          const statusResults = await this.getStatus(this.statementHandle);
          if (statusResults) {
            this.handleInitialResults(statusResults);
            break;
          }
        }
      }

      // get each page of results
      const totalPartitions = this.resultMeta?.partitionInfo?.length || 1;
      while (this.nextPartition < totalPartitions && this.notTimedout()) {
        try {
          const partitionResults = await this.getPartition(
            this.statementHandle,
            this.nextPartition,
          );
          if (Array.isArray(partitionResults.data)) {
            this.allData = this.allData?.concat(partitionResults.data);
          } else {
            throw new Error(`partition ${this.nextPartition} did not return data array`);
          }
          this.#percent = Math.floor((this.nextPartition / totalPartitions) * 100);
          this.nextPartition += 1;
        } catch (e) {
          if (e instanceof AxiosError) {
            const code = (e.response?.data as SnowflakeApiError | undefined)?.code || "";
            if (code === "391922") {
              // invalid partition number
              console.warn(
                `partition ${this.nextPartition} resulted in an invalid partition error`,
              );
              break;
            }
            throw e;
          }
        }
      }

      // return results
      this.#status = "done";
      return {
        data: this.allData || [],
        columns: this.resultMeta?.rowType || [],
      };
    } catch (e) {
      this.#status = "error";
      throw e;
    }
  }

  /** returns true unless the total timeout is exceeded, then cancels and throws */
  private notTimedout() {
    if (new Date().valueOf() - this.ts > (this.options.totalTimeout || DEFAULT_TOTAL_TIMEOUT)) {
      this.cancel();
      throw new Error("timeout exceeded");
    }
    return true;
  }

  /** if a query was already run using runQuery, this will contain the results from it. */
  getLastResult(): SnowflakeApiData {
    return this.allData || [];
  }

  /** if a query was already run using runQuery, this will return the column details for it */
  getColumns(): SnowflakeApiResultRowType[] {
    return this.resultMeta?.rowType || [];
  }

  private getHeaders(): SnowflakeApiHeaders {
    return {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
  }

  /** gets the data for the given partition of the statement handle.
   * will give an error if statement still running or partition is not valid
   */
  private async getPartition(
    statementHandle: string,
    partition: number,
  ): Promise<SnowflakeApiPartitionResult> {
    if (!statementHandle && !this.inProgress) {
      throw new Error("statement handle and in progress query must exist");
    }
    const url = makeUrl(`/api/v2/statements/${statementHandle}?partition=${partition}`);
    const result = await this.getData<SnowflakeApiPartitionResult>("get", url, undefined);
    return result.data;
  }

  /** issue the request to the url and return the data
   * @param method method of the request
   * @param url url for the request
   * @param token bearer token to use
   * @param data data to pass with the request
   * @returns data returned from the server
   */
  private async getData<T>(
    method: "get" | "post",
    url: string,
    data?: unknown,
    validateStatus?: ValidateStatusFn,
  ): Promise<AxiosResponse<T, unknown>> {
    const fetchOptions: AxiosRequestConfig = {
      signal: this.abortController?.signal,
      headers: this.getHeaders(),
      timeout: this.options.timeout || DEFAULT_TIMEOUT,
      validateStatus: validateStatus,
    };

    switch (method) {
      case "get": {
        return axios.get<T>(url, fetchOptions);
        // resultData = result.data;
        // break;
      }
      case "post": {
        return axios.post<T>(url, data, fetchOptions);
        // resultData = result.data;
        // break;
      }
      default:
        throw new Error("invalid request method");
    }
  }

  /** reset all status and tracking info. make sure to call cancel first if a query is currently running.
   * if you want to re-use an instance of this class, you must call done before issuing a new query.
   */
  done() {
    this.resultMeta = undefined;
    this.allData = undefined;
    this.nextPartition = 0;
    this.#status = "";
    this.#percent = 0;
    this.statementHandle = undefined;
    this.inProgress = false;
  }

  /** cancels any in progress api calls, including requesting snowflake to cancel the query. */
  cancel() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = new AbortController();
    }
    this.cancelStatement().catch((e) => {
      console.error("error canceling snowflake api statement", e);
    });
  }

  private async cancelStatement() {
    if (this.statementHandle && this.inProgress) {
      const url = makeUrl(`/api/v2/statements/${this.statementHandle}/cancel`);
      await this.getData("post", url, undefined);
      this.inProgress = false;
    }
  }
}
