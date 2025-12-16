import { alphaSorter } from "@/utils/sorters";
import HttpRequest from "@/data/HttpRequest";
import { sha1 } from "@/data/getData";
import {
  FilterOptionEntry,
  FilterConfig,
  SelectedValues,
  ServerSideFilter,
} from "@/types/filterTypes";
import commonDataController from "@/data/CommonDataController";
import { DataResult, Filter, GenericObject, Query } from "@/types/dataApi";
import MakeFilters, { combineFilters } from "@/utils/filterUtils";
import { getApiUrlForEndpoint } from "@/data/apiConstants";
import parseQueryResponse from "@/utils/parseQueryResponse";

export default async function getFilterOptions(path: string): Promise<FilterOptionEntry[]> {
  if (!path) {
    return [];
  }
  switch (path) {
    case "queryType": {
      const data = await commonDataController.getQueryType();
      return data.map((row) => ({ value: row.query_type || "" })).sort(alphaSorter("value"));
    }
    case "warehouseName": {
      const data = await commonDataController.getWarehouseName();
      return data.map((row) => ({ value: row.warehouse_name || "" })).sort(alphaSorter("value"));
    }
    case "application": {
      const data = await commonDataController.getApplication();
      return data.map((row) => ({ value: row.application || "" })).sort(alphaSorter("value"));
    }
    case "executionStatus": {
      const data: FilterOptionEntry[] = [
        { value: "SUCCESS" },
        { value: "FAIL" },
        { value: "INCIDENT" },
      ];
      return data;
    }
    case "serviceType": {
      const data: FilterOptionEntry[] = [
        { value: "AI_SERVICES" },
        { value: "AUTO_CLUSTERING" },
        { value: "COPY_FILES" },
        { value: "HYBRID_TABLE_REQUESTS" },
        { value: "MATERIALIZED_VIEW" },
        { value: "PIPE" },
        { value: "QUERY_ACCELERATION" },
        { value: "SERVERLESS_TASK" },
        { value: "SNOWPARK_CONTAINER_SERVICES" },
        { value: "TELEMETRY_DATA_INGEST" },
        { value: "TRUST_CENTER" },
        { value: "WAREHOUSE_METERING" },
      ];
      return data;
    }
    default:
      return [];
  }
}

/** limit the filter options based on dependencies */
export function limitFilterOptions(
  filter: FilterConfig,
  options: FilterOptionEntry[],
  values: SelectedValues,
) {
  if (!Array.isArray(options)) {
    return [];
  }
  if (!filter || !values) {
    return options;
  }
  if (!filter.dependencies || !filter.dependencies.length) {
    return options;
  }
  // make a lookup of selected values relevant to dependencies
  let hasDepValues = false;
  const depLookup: Record<string, Record<string, true>> = {};
  filter.dependencies.forEach((d) => {
    if (d in values) {
      values[d].forEach((v) => {
        if (!depLookup[d]) {
          depLookup[d] = {};
        }
        depLookup[d][v.value] = true;
        hasDepValues = true;
      });
    }
  });
  if (!hasDepValues) {
    return options;
  }
  return options.filter((o) => {
    let keep = true;
    Object.entries(depLookup).forEach(([path, lookup]) => {
      if (!o[path]) {
        keep = false;
      } else if (!lookup[o[path]]) {
        keep = false;
      }
    });
    return keep;
  });
}

const maxRemoteOptions = 100;
// use HttpRequest directly instead of getData since we do not want to cache the list to normal data cache
// but we do want to cache the promises for rapid typing, so use a global version
const remoteFilterRequest = new HttpRequest({ promiseCacheTtl: 60000 });
/** retrieve options for a serverSide filter and search term */
export async function getRemoteFilterOptions(
  config: ServerSideFilter,
  search?: string,
  selectedValues?: SelectedValues,
): Promise<FilterOptionEntry[]> {
  if (!config) {
    return [];
  }
  // build the list of fields we need
  const includeFields: Set<string> = new Set<string>();
  const idField = config.idField || config.apiTable + "_id";
  includeFields.add(idField);
  if (config.displayFields) {
    config.displayFields.forEach((displayField) => {
      includeFields.add(displayField);
    });
  }

  // build the filter
  const filterParts: Filter[] = [];
  if (search) {
    const searchFields: string[] = config.searchFields ? config.searchFields : [...includeFields];
    if (searchFields) {
      const orParts: Filter[] = [];
      searchFields.forEach((searchField) => {
        orParts.push({ ilike: [searchField, `'%${search}%'`] });
      });
      const orFilter = combineFilters(orParts, "or");
      if (orFilter) {
        filterParts.push(orFilter);
      }
    }
  }
  if (config.dependencyMapping) {
    const makeFilters = new MakeFilters(config.dependencyMapping);
    const depFilter = makeFilters.makeFilters(selectedValues);
    if (depFilter) {
      filterParts.push(...depFilter);
    }
  }
  if (config.filter) {
    filterParts.push(config.filter);
  }

  const includeArray = [...includeFields];
  if (!includeArray[0]) {
    return [];
  }
  const spec: Query = {
    table: config.apiTable,
    db: config.apiDb || undefined,
    schema: config.apiSchema || undefined,
    limit: config.limit || maxRemoteOptions,
    columns: includeArray,
    filter: combineFilters(filterParts),
    order: [{ name: includeArray[0], dir: "asc" }],
    distinct: config.distinct || undefined,
    asUser: config.asUser || undefined,
  };
  // potentially long string, should be fine
  const key = (spec.table as string) + JSON.stringify(spec.filter);

  const results = await remoteFilterRequest.post<DataResult>(
    getApiUrlForEndpoint("query"),
    spec,
    key,
  );
  const objs = parseQueryResponse<GenericObject>(results, spec.columns);
  if (objs) {
    return objs.map((obj) => {
      const idValue = obj[idField.toLowerCase()] as string;
      const filterOption: FilterOptionEntry = {
        value: idValue,
      };
      if (config.displayFields) {
        const display = [];
        config.displayFields.forEach((field) => {
          if (!field) {
            return;
          }
          const value = obj[field.toLowerCase()] as string;
          if (value) {
            display.push(value);
          }
        });
        if (config.showId) {
          display.push(`(${idValue})`);
        }
        filterOption.label = display.join(" ");
      }
      return filterOption;
    });
  }
  return [];
}

/** using a ServerSideFilter, get values for it that match the provided values.
 * useful if real values have leading 0s and provided ones do not
 */
export async function getRemoteMatchingValues(
  config: ServerSideFilter,
  values?: FilterOptionEntry[],
): Promise<FilterOptionEntry[]> {
  if (!config || !values) {
    return [];
  }
  // get the id to retrieve
  const idField = config.idField || config.apiTable + "_id";

  // build the filter
  const filter: Filter = { in: [idField, [values.map((v) => `'%${v.value}'`).join(",")]] };

  const spec: Query = {
    table: config.apiTable,
    limit: config.limit || maxRemoteOptions,
    columns: [idField],
    filter: filter,
    db: config.apiDb || undefined,
    schema: config.apiSchema || undefined,
    asUser: config.asUser || undefined,
  };
  const keyString = (spec.table as string) + JSON.stringify(spec.filter);
  const key = await sha1(keyString);

  const results = await remoteFilterRequest.post<DataResult>(
    getApiUrlForEndpoint("query"),
    spec,
    key,
  );
  if (results && results.data) {
    return results.data.map((row) => {
      const idValue = row[0] as string;
      const filterOption: FilterOptionEntry = {
        value: idValue,
      };
      return filterOption;
    });
  }
  return [];
}
