import StorageBreakdown, { DbSizeBuckets, DbSizePercs } from "@/components/charts/StorageBreakdown";
import { TableColumn } from "@/components/table/TableTypes";
import { ColumnDefinition, Filter, GenericObject, Query } from "@/types/dataApi";
import { combineFilters } from "@/utils/filterUtils";
import { bytesToGbString, formatStorageCost } from "@/utils/formatters";

export interface TableStorageFact extends GenericObject, DbSizeBuckets {
  table_catalog?: string;
  table_schema?: string;
  table_name?: string;
  is_transient?: string;
  count_active?: number;
  count_deleted?: number;
  total_bytes?: number;
  time_travel_x?: number;
  failsafe_x?: number;
  table_first_created?: number;
  table_last_dropped?: number;
}
export interface DbSizeSummary extends GenericObject, DbSizeBuckets, DbSizePercs {
  table_catalog?: string;
}
export interface SchemaSizeSummary extends GenericObject, DbSizeBuckets {
  table_catalog?: string;
  table_schema?: string;
}

export const dbSizeEntries: ColumnDefinition[] = [
  { name: "table_catalog" },
  { name: "active_bytes", agg: "sum" },
  { name: "time_travel_bytes", agg: "sum" },
  { name: "failsafe_bytes", agg: "sum" },
  { name: "retained_for_clone_bytes", agg: "sum" },
  { name: "total_bytes", agg: "sum" },
];

export const schemaSizeEntries: ColumnDefinition[] = [
  { name: "table_catalog" },
  { name: "table_schema" },
  { name: "active_bytes", agg: "sum" },
  { name: "time_travel_bytes", agg: "sum" },
  { name: "failsafe_bytes", agg: "sum" },
  { name: "retained_for_clone_bytes", agg: "sum" },
  { name: "total_bytes", agg: "sum" },
];

export const tableSizeEntries: ColumnDefinition[] = [
  { name: "table_catalog" },
  { name: "table_schema" },
  { name: "table_name" },
  { name: "is_transient" },
  { name: "count_active" },
  { name: "count_deleted" },
  { name: "active_bytes" },
  { name: "time_travel_bytes" },
  { name: "failsafe_bytes" },
  { name: "retained_for_clone_bytes" },
  { name: "total_bytes" },
  { name: "time_travel_x" },
  { name: "failsafe_x" },
  { name: "table_first_created" },
  { name: "table_last_dropped" },
];

export const specForDb: Query = {
  schema: "SF_METRICS",
  table: "V_TABLE_STORAGE_FACT",
  columns: dbSizeEntries,
  order: [{ name: { name: "total_bytes", agg: "sum" }, dir: "desc" }],
  having: { gt: [{ name: "total_bytes", agg: "sum" }, 500000000000] },
};

export const specForSchema = (db?: string): Query => {
  const spec: Query = {
    schema: "SF_METRICS",
    table: "V_TABLE_STORAGE_FACT",
    columns: schemaSizeEntries,
    filter: db ? { eq: ["table_catalog", `'${db}'`] } : undefined,
    order: [{ name: { name: "total_bytes", agg: "sum" }, dir: "desc" }],
  };

  return spec;
};

export const specForTables = (db?: string, schema?: string): Query => {
  const filters: Filter[] = [];
  if (db) {
    filters.push({ eq: ["table_catalog", `'${db}'`] });
  }
  if (schema) {
    filters.push({ eq: ["table_schema", `'${schema}'`] });
  }
  const spec: Query = {
    schema: "SF_METRICS",
    table: "V_TABLE_STORAGE_FACT",
    columns: tableSizeEntries,
    filter: combineFilters(filters),
    order: [{ name: "total_bytes", dir: "desc" }],
    limit: db && schema ? 2000 : 20,
  };

  return spec;
};

export const tableSizeColumns: TableColumn<TableStorageFact>[] = [
  { accessor: "table_catalog", Header: "DB", width: 110 },
  { accessor: "table_schema", Header: "Schema", width: 150 },
  { accessor: "table_name", Header: "Name", width: 270 },
  { accessor: "is_transient", Header: "Transient?", width: 100 },
  {
    key: "total_cost",
    accessor: "total_bytes",
    Header: "Monthly Storage Cost",
    width: 110,
    format: formatStorageCost,
  },
  { accessor: "total_bytes", Header: "Total GB", width: 110, format: bytesToGbString },
  { accessor: "active_bytes", Header: "Active GB", width: 130, format: bytesToGbString },
  { accessor: "time_travel_bytes", Header: "Time Travel GB", width: 130, format: bytesToGbString },
  { accessor: "failsafe_bytes", Header: "Failsafe GB", width: 130, format: bytesToGbString },
  {
    accessor: "retained_for_clone_bytes",
    Header: "For Clones GB",
    width: 130,
    format: bytesToGbString,
  },
  { accessor: "time_travel_x", Header: "Time Travel Multiplier", width: 100 },
  { accessor: "failsafe_x", Header: "Failsafe Multiplier", width: 100 },
  { accessor: "count_active", Header: "Active Instances", width: 100 },
  { accessor: "count_deleted", Header: "Deleted Instances", width: 100 },
];

export const dbSizeColumns: TableColumn<DbSizeSummary>[] = [
  { accessor: "table_catalog", Header: "DB", width: 110 },
  {
    key: "total_cost",
    accessor: "total_bytes",
    Header: "Monthly Storage Cost",
    width: 110,
    format: formatStorageCost,
  },
  { accessor: "total_bytes", Header: "Total GB", width: 110, format: bytesToGbString },
  {
    accessor: "active_types",
    Header: "Storage Breakdown",
    width: 300,
    fixedSize: true,
    cellClass: "py-0 px-2 border table-row-border whitespace-nowrap text-sm",
    Cell: (row) => {
      return <StorageBreakdown data={row} width={282} height={24} />;
    },
  },
];

export const schemaSizeColumns: TableColumn<SchemaSizeSummary>[] = [
  { accessor: "table_schema", Header: "Schema", width: 180 },
  {
    key: "total_cost",
    accessor: "total_bytes",
    Header: "Monthly Storage Cost",
    width: 110,
    format: formatStorageCost,
  },
  { accessor: "total_bytes", Header: "Total GB", width: 110, format: bytesToGbString },
  {
    accessor: "active_types",
    Header: "Storage Breakdown",
    width: 300,
    fixedSize: true,
    cellClass: "py-0 px-2 border table-row-border whitespace-nowrap text-sm",
    Cell: (row) => {
      return <StorageBreakdown data={row} width={282} height={24} />;
    },
  },
];
