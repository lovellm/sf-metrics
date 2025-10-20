import { LocalStorageKeys } from "@/constants";
import Box from "../basic/Box";
import FilterPanel from "../filters/FilterPanel";
import useAppState from "@/context/useAppState";
import { useCallback, useState } from "react";
import { SelectedValues } from "@/types/filterTypes";
import { dynamicTablesFilterPanel } from "../filters/filterConfig";
import DTWarehouse from "../dynamictables/DTWarehouse";
import DTDbSummary from "../dynamictables/DTDbSummary";
import DTSchemaSummary from "../dynamictables/DTSchemaSummary";
import TopDynamicTables from "../dynamictables/TopDynamicTables";

export default function DynamicTables() {
  const [{ isFiltersOpen, filters }, dispatch] = useAppState();
  const [db, setDb] = useState<string>("");
  const [schema, setSchema] = useState<string>("");
  const [table, setTable] = useState<string>("");
  const [schemaSearch, setSchemaSearch] = useState<string>("");
  const [tableSearch, setTableSearch] = useState<string>("");

  const handleDbSelected = useCallback((next: string) => {
    setDb(next);
    setSchema("");
    setSchemaSearch("");
    setTableSearch("");
  }, []);

  const handleSchemaSelected = useCallback((next: string) => {
    setSchema(next);
    setTableSearch("");
    setTable("");
  }, []);

  /** dispatch setFilters action wrapped in a callback */
  const applyFilters = useCallback(
    (nextFilters?: SelectedValues) => {
      dispatch({ type: "setFilters", payload: nextFilters });
    },
    [dispatch],
  );

  return (
    <div className="grid grid-cols-12 gap-3 p-2">
      {/* Filters */}
      <div
        className={
          isFiltersOpen
            ? "col-span-12 md:col-span-4 lg:col-span-3 xl:col-span-3"
            : "col-span-12 sm:col-span-1 sm:w-12"
        }
      >
        <Box className="sticky top-0">
          <FilterPanel
            config={dynamicTablesFilterPanel}
            localStorageKey={LocalStorageKeys.filters}
            onApply={applyFilters}
          />
          {isFiltersOpen && (
            <div className="mb-2 px-2 text-sm">
              If no query date is selected, it will default to the start of previous month
            </div>
          )}
          {isFiltersOpen && (db || schema) && (
            <div className="mb-2 px-2 text-sm">
              DB: {db || "ALL"}, Schema: {schema || "ALL"}
            </div>
          )}
        </Box>
      </div>
      {/* Main Area */}
      <div
        className={
          "flex flex-col gap-y-2 " +
          (isFiltersOpen
            ? "col-span-12 md:col-span-8 lg:col-span-9 xl:col-span-9"
            : "col-span-12 sm:col-span-11 lg:-ml-8 xl:-ml-16")
        }
      >
        <DTWarehouse filters={filters} db={db} schema={schema} />
        <DTDbSummary filters={filters} db={db} setDb={handleDbSelected} />
        <DTSchemaSummary
          filters={filters}
          db={db}
          schema={schema}
          setSchema={handleSchemaSelected}
          schemaSearch={schemaSearch}
          setSchemaSearch={setSchemaSearch}
        />
        <TopDynamicTables
          filters={filters}
          db={db}
          schema={schema}
          tableSearch={tableSearch}
          setTableSearch={setTableSearch}
          table={table}
          setTable={setTable}
        />
      </div>
    </div>
  );
}
