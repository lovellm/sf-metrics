import {
  FilterConfig,
  FilterOptionEntry,
  FilterPanelConfig,
  FilterPath,
} from "@/types/filterTypes";

/** transforms the value of the provided FilterOptionEntry(ies) to be upper case */
export const transformFilterUpper = <T extends FilterOptionEntry | FilterOptionEntry[]>(
  pendingEntry: T,
): T => {
  if (!pendingEntry) {
    return pendingEntry;
  }
  if (Array.isArray(pendingEntry)) {
    return pendingEntry.map((entry) => ({ ...entry, value: entry.value?.toUpperCase() })) as T;
  }
  return { ...pendingEntry, value: pendingEntry.value };
};

/** lookup of filter configs. key should be same as the config path, but could be any string */
export const filterConfigs: Record<FilterPath, FilterConfig> = {
  queryType: {
    label: "Query Type",
    path: "queryType",
    type: "dropdown",
  },
  application: {
    label: "Application",
    path: "application",
    type: "dropdown",
  },
  userId: {
    label: "User ID",
    info: "If not provided, will default to you. Can only see data for yourself and people reporting up to you.",
    path: "userId",
    type: "dropdownbulk",
    serverSide: {
      apiTable: "V_USERS",
      apiSchema: "SF_METRICS",
      displayFields: ["DISPLAY_NAME"],
      idField: "NAME",
      showId: true,
      minSearch: 3,
      distinct: true,
      asUser: true,
    },
    transformValue: transformFilterUpper,
  },
  userIdBasic: {
    label: "User ID",
    path: "userId",
    type: "dropdownbulk",
    serverSide: {
      apiTable: "V_USERS",
      apiSchema: "SF_METRICS",
      displayFields: ["DISPLAY_NAME"],
      idField: "NAME",
      showId: true,
      minSearch: 3,
      distinct: true,
      asUser: true,
    },
    transformValue: transformFilterUpper,
  },
  warehouseName: {
    label: "Warehouse",
    path: "warehouseName",
    type: "dropdown",
  },
  executionStatus: {
    label: "Status",
    path: "executionStatus",
    type: "dropdown",
  },
  serviceType: {
    label: "Service Type",
    path: "serviceType",
    type: "dropdown",
  },
  logdate: {
    label: "Query Date",
    path: "logdate",
    type: "date",
  },
  defaultUser: {
    label: "Allow No User",
    path: "defaultUser",
    type: "toggle",
    info: "Prevents adding current user to the filter. Security still applies. May decrease performance",
  },
  db: {
    label: "Database Name",
    path: "db",
    type: "bulk",
    transformValue: transformFilterUpper,
  },
  schema: {
    label: "Schema Name",
    path: "schema",
    type: "bulk",
    transformValue: transformFilterUpper,
  },
  modelName: {
    label: "Model Name",
    path: "model",
    type: "text",
    info: "case sensitive, must match exactly.",
  },
  sourceCloud: {
    label: "Source Cloud",
    path: "source_cloud",
    type: "text",
    info: "case sensitive, must match exactly.",
  },
  targetCloud: {
    label: "Target Cloud",
    path: "target_cloud",
    type: "text",
    info: "case sensitive, must match exactly.",
  },
};

export const userFilterPanel: FilterPanelConfig = [
  {
    filters: [
      filterConfigs.logdate,
      filterConfigs.queryType,
      filterConfigs.userId,
      filterConfigs.warehouseName,
      filterConfigs.application,
      filterConfigs.executionStatus,
      filterConfigs.defaultUser,
    ],
  },
];

export const taskFilterPanel: FilterPanelConfig = [
  {
    filters: [
      filterConfigs.logdate,
      filterConfigs.warehouseName,
      filterConfigs.db,
      filterConfigs.schema,
    ],
  },
];

export const dynamicTablesFilterPanel: FilterPanelConfig = [
  {
    filters: [
      filterConfigs.logdate,
      filterConfigs.warehouseName,
      filterConfigs.db,
      filterConfigs.schema,
    ],
  },
];

export const aiFilterPanel: FilterPanelConfig = [
  {
    label: "Filters for all Tables",
    showLabel: true,
    filters: [filterConfigs.logdate],
  },
  {
    label: "Only Applied to Some Tables",
    showLabel: true,
    filters: [
      filterConfigs.userIdBasic,
      filterConfigs.modelName,
      filterConfigs.db,
      filterConfigs.schema,
    ],
  },
];

export const cortexCodeFilterPanel: FilterPanelConfig = [
  {
    filters: [filterConfigs.logdate, filterConfigs.userIdBasic],
  },
];

export const hybridTableFilters: FilterPanelConfig = [
  {
    filters: [filterConfigs.logdate],
  },
];

export const allCreditsFilters: FilterPanelConfig = [
  {
    filters: [filterConfigs.logdate, filterConfigs.serviceType],
  },
];

export const materializedViewFilters: FilterPanelConfig = [
  {
    filters: [filterConfigs.logdate, filterConfigs.db, filterConfigs.schema],
  },
];

export const computePoolFilters: FilterPanelConfig = [
  {
    filters: [filterConfigs.logdate],
  },
];

export const dataTransferFilters: FilterPanelConfig = [
  {
    filters: [filterConfigs.logdate, filterConfigs.sourceCloud, filterConfigs.targetCloud],
  },
];
