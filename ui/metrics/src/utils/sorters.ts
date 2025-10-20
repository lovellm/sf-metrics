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
export const basicSorter = basicStringSorter();
