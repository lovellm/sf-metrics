export type GenericDataRecord = Record<string, unknown>;

/** create a getter function that will return a number from an unknown input */
export const makeGetNumber = (property?: string) => {
  return (d: unknown): number => {
    if (!property) {
      return 0;
    }
    if (d === null || typeof d !== "object") {
      return 0;
    }
    return +(d as Record<string, number>)[property];
  };
};
/** create a getter function that will return a string from an unknown input */
export const makeGetString = (property?: string) => {
  return (d: unknown): string => {
    if (!property) {
      return "";
    }
    if (d === null || typeof d !== "object") {
      return "";
    }
    return "" + ((d as Record<string, string>)[property] || "");
  };
};

/** if the given key exists in the provided record, return it,
 * otherwise create it as an empty object and return that
 */
export const getOrMakeObject = <T extends object>(
  allObjects: Record<string, T>,
  key: string,
): T => {
  if (key in allObjects) {
    return allObjects[key];
  }
  const newValue = {} as T;
  allObjects[key] = newValue;
  return newValue;
};
