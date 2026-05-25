let version = "?";
let buildDate = "";
try {
  // just incase it is not defined, want the app to still work
  version = __APP_VERSION__;
  buildDate = __BUILD_DATE__;
  // eslint-disable-next-line no-console
  console.log("App Version: " + version);
} catch (e) {
  console.error("__APP_VERSION__ is not defined", e);
}
export const appVersion = version;
export const appVersionBuild = version + (buildDate ? "-" + buildDate : "");

export const LocalStorageKeys = {
  theme: "theme",
  filters: "metrics-filters",
  cost: "credit-cost",
};
export type LocalStorageKeys = (typeof LocalStorageKeys)[keyof typeof LocalStorageKeys];

/** utility function that will remove this app's local storage keys from the local storage */
export const clearLocalStorage = () => {
  try {
    Object.values(LocalStorageKeys).forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch (e) {
    console.error("error clearing local storage", e);
  }
};

export const basicTable = "table-row-border border-separate table-auto";
export const basicTableTR = "table-row";
export const basicTableRowSelected = "table-row-selected";
export const basicTableHeader =
  "table-th px-2 py-1 font-normal border-y border-r first:border-l table-row-border";
export const basicTableHeaderBorder0 =
  "table-th px-2 py-1 font-normal border-y border-x-0 first:border-l last:border-r table-row-border";
export const basicTableCell = "px-2 py-1 border table-row-border whitespace-nowrap text-sm";

export const fillColors: string[] = [
  "fill-chart-1",
  "fill-chart-2",
  "fill-chart-3",
  "fill-chart-4",
  "fill-chart-5",
  "fill-chart-6",
];
export const strokeColors: string[] = [
  "stroke-chart-1",
  "stroke-chart-2",
  "stroke-chart-3",
  "stroke-chart-4",
  "stroke-chart-5",
  "stroke-chart-6",
];
export const bgColors: string[] = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
  "bg-chart-6",
];

export const sizeBreakdownFills: Record<string, string> = {
  active: "fill-chart-1",
  timetravel: "fill-chart-2",
  failsafe: "fill-chart-3",
  clone: "fill-chart-4",
};
export const sizeBreakdownBGs: Record<string, string> = {
  active: "bg-chart-1",
  timetravel: "bg-chart-2",
  failsafe: "bg-chart-3",
  clone: "bg-chart-4",
};
