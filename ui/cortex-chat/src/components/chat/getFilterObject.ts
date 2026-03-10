import { AppConfigOption } from "@/constants";
import {
  CortexSearchFilter,
  CortexSearchFilterArray,
  CortexSearchFilterOp,
} from "@spcs-apps/data-utils";

interface FilterPart {
  name: string;
  type?: string;
  values: string[];
}
export const getFilterObject = (
  options?: AppConfigOption[],
  values?: Record<string, string | string[]>,
): CortexSearchFilter | undefined => {
  if (!options?.length || !values) {
    return undefined;
  }

  // filter values to only ones with a dbName, and standardize values to string[]
  const andValues: Record<string, FilterPart> = {};
  Object.entries(values).forEach(([name, value]) => {
    const opt = options.find((o) => o.optionName === name);
    if (!opt || !value) {
      // no opt means somehow no matching option. should not be possible at this point
      // no value probably means empty string, meaning all values or no filter
      return;
    }
    const arrayValues = Array.isArray(value) ? value : [value];
    if (!arrayValues.length) {
      // was given an empty array, ignore it
      return;
    }
    if (opt.dbName) {
      andValues[opt.dbName] = {
        name: opt.dbName,
        values: Array.isArray(value) ? value : [value],
        type: opt.dbType,
      };
    } else {
      console.warn("An option filter exists, but has no dbName", opt);
    }
  });

  let filterObject: CortexSearchFilter | undefined = undefined;
  /** convert each entry in andValues to a valid CortexSearchFilter */
  const andParts = Object.entries(andValues).map<CortexSearchFilter>(([dbName, part]) => {
    // https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-search/query-cortex-search-service
    const pieces = part.values.map<CortexSearchFilterOp>((f) => {
      const op = part.type === "array" ? "@contains" : "@eq";
      return { [op]: { [dbName]: f } } as CortexSearchFilterOp;
    });
    // only 1 value, return that filter as is
    if (pieces.length === 1) {
      return pieces[0];
    }
    // multiple values
    return {
      "@or": pieces,
    } as CortexSearchFilterArray;
  });
  if (andParts.length > 1) {
    filterObject = {
      "@and": andParts,
    } as CortexSearchFilterArray;
  } else {
    filterObject = andParts[0];
  }

  if (filterObject) {
    return filterObject;
  }
  return undefined;
};
