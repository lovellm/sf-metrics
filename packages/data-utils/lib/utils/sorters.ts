/** returns a function to use in Array.sort to sort an string ascending alphanumerically.
 * assumes the array items of Record<string, string>, or something comparable.
 * will throw if array items are not indexable by strings, or if field value is not comparable.
 */
export function alphaSorter(field: string, reverse?: boolean) {
  return (a: unknown, b: unknown) => {
    const mult = reverse ? -1 : 1;
    if (!a) {
      return mult * 1;
    }
    if (!b) {
      return mult * -1;
    }
    const valA = (a as Record<string, string>)[field];
    const valB = (b as Record<string, string>)[field];
    if (valA > valB) {
      return mult * 1;
    }
    if (valB > valA) {
      return mult * -1;
    }
    return 0;
  };
}

/** returns a function to use in Array.sort, to sort an array of Strings */
export function basicStringSorter(desc?: boolean) {
  const ord = desc ? -1 : 1;
  return (a: string, b: string) => {
    if (!a) {
      return 1 * ord;
    }
    if (!b) {
      return -1 * ord;
    }
    if (a > b) {
      return 1 * ord;
    }
    if (b > a) {
      return -1 * ord;
    }
    return 0;
  };
}
/** same as basicStringSorter, but always ascending */
export const basicSorter = basicStringSorter();

export type SortDirection = -1 | 1 | undefined;
export interface SortEntry {
  accessor: string;
  direction?: -1 | 1;
}

/** returns a function to use in Array.sort to sort objects by an array of SortEntries */
export function sortBySortEntries<T extends Record<string, unknown>>(sorts: SortEntry[]) {
  return (a: T, b: T) => {
    if (sorts && sorts.length) {
      for (let sortI = 0; sortI < sorts.length; sortI++) {
        const accessor = sorts[sortI].accessor;
        const dir = sorts[sortI].direction || 0;
        let valA = a ? a[accessor] : undefined;
        if (typeof valA === "string") {
          valA = valA.trim();
        } else if (typeof valA === "boolean") {
          valA = valA ? 2 : 1;
        } else if (typeof valA !== "number") {
          valA = "";
        }

        let valB = b ? b[accessor] : undefined;
        if (typeof valB === "string") {
          valB = valB.trim();
        } else if (typeof valB === "boolean") {
          valB = valB ? 2 : 1;
        } else if (typeof valB !== "number") {
          valB = "";
        }
        if ((valA as string) > (valB as string)) {
          return 1 * dir;
        }
        if ((valA as string) < (valB as string)) {
          return -1 * dir;
        }
      }
    }
    return 0;
  };
}
