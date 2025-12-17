import { FilterConfig, FilterPanelConfig, FilterPath } from "@/types/filterTypes";

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
    info: "If not provided, will default to you.",
    path: "userId",
    type: "dropdownbulk",
    serverSide: {
      apiTable: "V_USERS",
      apiSchema: "SF_METRICS",
      displayFields: ["display_name"],
      idField: "name",
      showId: true,
      minSearch: 3,
      distinct: true,
      asUser: true,
    },
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
    type: "text",
  },
  schema: {
    label: "Schema Name",
    path: "schema",
    type: "text",
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
    label: "Cortex Search Filters",
    showLabel: true,
    filters: [filterConfigs.db, filterConfigs.schema],
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
