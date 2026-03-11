import { GenericDataRecord } from "@spcs-apps/data-utils";

export type SeriesInfo = {
  /** the field name containing the value for this series */
  id: string;
  /** display label for the series */
  label?: string;
  /** className property for the shape */
  className?: string;
  /** style object for the shape */
  style?: React.CSSProperties;
};
/** lookup of series id to SeriesInfo */
export type SeriesLookup = Record<string, SeriesInfo>;
/** a data point for a categorical data.
 * in general, a field should exist representing the x-axis.
 * additional fields should exist (with number values) for each SeriesInfo associated with the data.
 */
export type CategoryRecord = Record<string, unknown>;
export type CategoryData = CategoryRecord[];
export type ShapeClassInfo = { fill?: string; stroke?: string; bg?: string };

export const getOrMakeObject = <T>(allObjects: Record<string, T>, key: string): T => {
  if (key in allObjects) {
    return allObjects[key];
  }
  const newValue = {} as T;
  allObjects[key] = newValue;
  return newValue;
};

/** given a dataset, find the min and max values for a field in it */
export function minAndMax<T>(
  field: string,
  data?: GenericDataRecord[],
): [T | undefined, T | undefined] {
  if (!data) {
    return [undefined, undefined];
  }
  let min: unknown = undefined;
  let max: unknown = undefined;
  data.forEach((o) => {
    const value = o[field];
    if (value === undefined || value === null) {
      return;
    }
    if (min === undefined || value < min!) {
      min = value;
    }
    if (max === undefined || value > max!) {
      max = value;
    }
  });
  return [min as T, max as T];
}
