import { Filter, OperatorsBoolean, OpereratorsCompare } from "@/types/dataApi";
import {
  FilterPath,
  ApiField,
  FilterOptionValue,
  SelectedValues,
  FilterPanelConfig,
  FilterConfig,
  FilterOptionEntry,
} from "@/types/filterTypes";

/** a mapping of filter field paths to the associated api field it should apply to.
 * any filters not in this object will not be applied.
 */
type FieldMap = Record<FilterPath, ApiField>;
/** ADDITIONAL fields that should be OR'd together with what was in FieldMap for a filter path */
type OrFields = Record<FilterPath, ApiField[]>;
/** fields from FieldMap that should be wrapped in % for a like any match */
type LikeFields = Record<FilterPath, true>;
export type ReplaceValues = Record<FilterPath, (selectedValues: FilterOptionValue[]) => string[]>;

export default class MakeFilters {
  private fieldMap: FieldMap;
  private orFields: OrFields;
  private likeFields: LikeFields;

  constructor(fieldMap: FieldMap, orFields?: OrFields, likeFields?: LikeFields) {
    if (typeof fieldMap === "object") {
      // use given object (or empty object if null)
      this.fieldMap = fieldMap || {};
    } else {
      // invalid input, default to empty object
      this.fieldMap = {};
    }
    if (typeof orFields === "object") {
      this.orFields = orFields || {};
    } else {
      this.orFields = {};
    }
    if (typeof likeFields === "object") {
      this.likeFields = likeFields || {};
    } else {
      this.likeFields = {};
    }
  }

  /** generate api filters for the given SelectedValues and field mapping */
  makeFilters(selectedValues?: SelectedValues, replaceValues?: ReplaceValues): Filter[] {
    if (!selectedValues || typeof selectedValues !== "object") {
      return [];
    }
    const filterParts: Filter[] = [];

    // loop through selected filter paths
    Object.entries(selectedValues).forEach(([filterPath, selectedOptions]) => {
      const apiField = this.fieldMap[filterPath];
      if (apiField) {
        let op: OpereratorsCompare | undefined;
        let values = selectedOptions.map((option) => {
          if (option.operator) {
            op = option.operator;
          }
          return option.value;
        });
        if (replaceValues && replaceValues[filterPath]) {
          values = replaceValues[filterPath](values);
        }
        if (values.length === 0) {
          return;
        }
        const isLike = this.likeFields[filterPath] || false;
        const noQuotes = values.length > 1;
        if (this.orFields[filterPath]) {
          const orParts = [arrayToFilter(apiField, values, { noQuotes, like: isLike, op })];
          this.orFields[filterPath].forEach((orField) => {
            orParts.push(arrayToFilter(orField, values, { noQuotes, like: isLike, op }));
          });
          filterParts.push({ or: orParts });
        } else {
          filterParts.push(arrayToFilter(apiField, values, { noQuotes, like: isLike, op }));
        }
      }
    });

    return filterParts;
  }
}

interface ArrayToFilterOptions {
  /** if true, do not wrap each value in quotes */
  noQuotes?: boolean;
  /** if true, use like instead of eq, or like any instead of in  */
  like?: boolean;
  /** if true, make values uppercase */
  toUpper?: boolean;
  /** if true, make values lowercase (ignored it toUpper is true) */
  toLower?: boolean;
  /** filter operator to use */
  op?: OpereratorsCompare;
}
/** convert an array of values to an API filter */
export const arrayToFilter = (
  /** field name on the target table */
  fieldName: string,
  /** array of values for the filter */
  values?: FilterOptionValue[],
  options: ArrayToFilterOptions = {},
): Filter => {
  let hasNull = false;
  let filter: Filter;
  // get the values to pass in the filter
  const valueStrings: string[] = (values || []).map((v) => {
    if (options.toUpper && typeof v === "string") {
      v = v.toUpperCase();
    } else if (options.toLower && typeof v === "string") {
      v = v.toLowerCase();
    }
    if (v === "~") {
      hasNull = true;
    }
    if (options.noQuotes) {
      if (options.like) {
        return `%${v}%`;
      }
      return "" + v;
    }
    if (options.like) {
      return `'%${v}%'`;
    }
    return `'${v}'`;
  });
  if (valueStrings.length === 1) {
    if (options.like) {
      filter = { like: [fieldName, valueStrings[0]] };
    } else {
      const op = options.op || "eq";
      filter = { [op]: [fieldName, valueStrings[0]] };
    }
  } else {
    if (options.like) {
      filter = {
        likeany: [fieldName, valueStrings],
      };
    } else {
      filter = {
        in: [fieldName, valueStrings],
      };
    }
  }
  if (hasNull) {
    filter = {
      or: [filter, { isnull: fieldName }, { eq: [fieldName, "''"] }],
    };
  }
  return filter;
};

/** given an array of filter components, joins them together. filters out any falsey array entries */
export const combineFilters = (
  filters?: Filter[],
  by: OperatorsBoolean = "and",
): Filter | undefined => {
  if (!filters || !filters.length) {
    return undefined;
  }
  if (filters.length === 1 && filters[0]) {
    return filters[0];
  }
  if (filters.length > 1) {
    return { [by]: filters.filter((o) => o) };
  }
};

/** adds the filterPath to the FieldMap, including its fake end filterPath */
export const addDatesToFieldMap = (fieldMap: FieldMap, filterPath: string, dbPath: string) => {
  const obj = fieldMap || {};
  obj[filterPath] = dbPath;
  obj[getEndFilterPath(filterPath)] = dbPath;
};

/** fake end value path for a filterPath, original filterPath represents start value */
export const getEndFilterPath = (filterPath: string): string => {
  return (filterPath || "") + "__end";
};

/** add value to the selectedOptions for path */
export const createHandleSelectOption = (
  setSelectedOption: React.Dispatch<React.SetStateAction<SelectedValues>>,
  config?: FilterPanelConfig,
  setChanged?: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  return (path: string, value: FilterOptionEntry | FilterOptionEntry[], replace?: boolean) => {
    if (!setSelectedOption) {
      return;
    }
    setSelectedOption((previous) => {
      const next = { ...previous };

      let pathConfig: FilterConfig | undefined;
      if (config) {
        config.find((section) => {
          return section?.filters?.find((fc) => {
            if (fc?.path === path) {
              pathConfig = fc;
              return true;
            }
          });
        });
      }
      const replaceValue =
        replace ||
        pathConfig?.single ||
        pathConfig?.type === "number" ||
        pathConfig?.type === "toggle";
      if (replaceValue) {
        if (Array.isArray(value)) {
          next[path] = [...value];
        } else {
          next[path] = [value];
        }
      } else {
        const uniqueValues: Record<string, boolean> = {};
        const currentValues = next[path] || [];
        next[path] = [...currentValues];
        const valuesArray = Array.isArray(value) ? value : [value];
        currentValues.forEach((v) => {
          if (v) {
            uniqueValues[v.value] = true;
          }
        });
        valuesArray.forEach((v) => {
          if (v) {
            if (!uniqueValues[v.value]) {
              next[path].push(v);
              uniqueValues[v.value] = true;
            }
          }
        });
      }
      if (typeof setChanged === "function") {
        setChanged(true);
      }
      return next;
    });
  };
};

/** remove value from the selectedOptions forpath */
export const createHandleRemoveOption = (
  setSelectedOption: React.Dispatch<React.SetStateAction<SelectedValues>>,
  setChanged?: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  return (path: string, value: FilterOptionValue) => {
    if (!setSelectedOption) {
      return;
    }
    setSelectedOption((previous) => {
      const next = { ...previous };
      if (value === undefined) {
        // remove all options if undefined was given
        next[path] = [];
      } else {
        const nextValues = next[path] || [];
        next[path] = nextValues.filter((v) => v.value !== value);
      }
      if (next[path].length === 0) {
        delete next[path];
      }
      if (typeof setChanged === "function") {
        setChanged(true);
      }
      return next;
    });
  };
};

/** helper function to make all values upper case */
export const valuesToUpper = (values: FilterOptionValue[]) =>
  values?.map((val) => (typeof val === "string" ? val.toUpperCase() : val));
