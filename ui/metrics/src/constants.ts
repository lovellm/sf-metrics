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

export enum LocalStorageKeys {
  theme = "theme",
  filters = "metrics-filters",
  cost = "credit-cost",
}

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

export const getQueryProfileUrl = (x: string) =>
  `https://app.snowflake.com/[ORG_NAME]/[ACCOUNT_NAME/#/compute/history/queries/${x}/detail`;

export const basicTable = "table-row-border border-separate table-auto";
export const basicTableTR =
  "text-zinc-800 dark:text-zinc-200 even:bg-zinc-200 odd:bg-white hover:bg-purple-300 hover:dark:bg-purple-900 odd:dark:bg-neutral-900 even:dark:bg-stone-800";
export const basicTableRowSelected = "bg-purple-400 dark:bg-purple-700";
export const basicTableHeader =
  "bg-fuchsia-300 text-neutral-800 dark:bg-fuchsia-950 dark:text-white px-2 py-1 font-normal border-y border-r first:border-l table-row-border";
export const basicTableCell = "px-2 py-1 border table-row-border whitespace-nowrap text-sm";

export const fillColors: string[] = [
  "fill-blue-400",
  "fill-orange-300",
  "fill-teal-500",
  "fill-lime-500",
  "fill-purple-700",
  "fill-zinc-600",
];
export const strokeColors: string[] = [
  "stroke-blue-400",
  "stroke-orange-200",
  "stroke-teal-500",
  "stroke-lime-500",
  "stroke-purple-800",
  "stroke-zinc-600",
];
export const bgColors: string[] = [
  "bg-blue-400",
  "bg-orange-300",
  "bg-teal-500",
  "bg-lime-500",
  "bg-purple-700",
  "bg-zinc-600",
];

export const sizeBreakdownFills: Record<string, string> = {
  active: "fill-blue-400",
  timetravel: "fill-orange-300",
  failsafe: "fill-teal-500",
  clone: "fill-purple-700",
};
export const sizeBreakdownBGs: Record<string, string> = {
  active: "bg-blue-400",
  timetravel: "bg-orange-300",
  failsafe: "bg-teal-500",
  clone: "bg-purple-700",
};
