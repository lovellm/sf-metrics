import { useMemo, useState } from "react";
import { max, sum } from "d3-array";
import Box from "../basic/Box";
import {
  dbSizeColumns,
  DbSizeSummary,
  schemaSizeColumns,
  SchemaSizeSummary,
  specForDb,
  specForSchema,
  specForTables,
  tableSizeColumns,
  TableStorageFact,
} from "@/specs/tableSize";
import { defaultCache } from "@/data/dataCache";
import LoadingFitParent from "../basic/LoadingFitParent";
import ErrorMessage from "../basic/ErrorMessage";
import Table from "../table/Table";
import { basicTableRowSelected, basicTableTR } from "@/constants";
import { bytesToGbString, formatStorageCost } from "@/utils/formatters";
import parseQueryResponse from "@/utils/parseQueryResponse";
import { useQuery } from "@/hooks/useApiData";

export default function Storage() {
  const [db, setDb] = useState<string>("");
  const [schema, setSchema] = useState<string>("");
  const [schemaSearch, setSchemaSearch] = useState<string>("");
  const [tableSearch, setTableSearch] = useState<string>("");

  // db
  const {
    data: dbData,
    error: dbError,
    isLoading: dbIsLoading,
  } = useQuery(specForDb, { dataCache: defaultCache });
  const dbObjs = useMemo(() => {
    const objs = parseQueryResponse<DbSizeSummary>(dbData, specForDb.columns);
    const maxTotal = max(objs, (row) => row.total_bytes);
    if (maxTotal && maxTotal > 0) {
      objs.forEach((row) => {
        row.active_perc = (row.active_bytes || 0) / maxTotal;
        row.time_travel_perc = (row.time_travel_bytes || 0) / maxTotal;
        row.failsafe_perc = (row.failsafe_bytes || 0) / maxTotal;
        row.retain_for_clone_perc = (row.retained_for_clone_bytes || 0) / maxTotal;
      });
    }
    return objs;
  }, [dbData]);
  const { totalCost, totalGb } = useMemo(() => {
    if (!dbObjs) {
      return { totalCost: "--", totalGb: "--" };
    }
    const totalBytes = sum(dbObjs, (row) => row.total_bytes || 0);
    return {
      totalCost: formatStorageCost(totalBytes),
      totalGb: bytesToGbString(totalBytes),
    };
  }, [dbObjs]);

  // schema
  const schemaQuery = useMemo(() => specForSchema(db), [db]);
  const {
    data: schemaData,
    error: schemaError,
    isLoading: schemaIsLoading,
  } = useQuery(schemaQuery, { dataCache: defaultCache, skip: !db });
  const schemaObjs = useMemo(() => {
    const objs = parseQueryResponse<SchemaSizeSummary>(schemaData, schemaQuery.columns);
    const maxTotal = max(objs, (row) => row.total_bytes);
    if (maxTotal && maxTotal > 0) {
      objs.forEach((row) => {
        row.active_perc = (row.active_bytes || 0) / maxTotal;
        row.time_travel_perc = (row.time_travel_bytes || 0) / maxTotal;
        row.failsafe_perc = (row.failsafe_bytes || 0) / maxTotal;
        row.retain_for_clone_perc = (row.retained_for_clone_bytes || 0) / maxTotal;
      });
    }
    return objs;
  }, [schemaData, schemaQuery.columns]);
  const filteredSchemaObjs = useMemo(() => {
    return schemaObjs.filter(
      (row) =>
        !schemaSearch || row.table_schema?.toUpperCase().includes(schemaSearch.toUpperCase()),
    );
  }, [schemaObjs, schemaSearch]);

  // tables
  const tableQuery = useMemo(() => specForTables(db, schema), [db, schema]);
  const {
    data: tableData,
    error: tableError,
    isLoading: tableIsLoading,
  } = useQuery(tableQuery, { dataCache: defaultCache });
  const tableObjs = useMemo(() => {
    return parseQueryResponse<TableStorageFact>(tableData, tableQuery.columns);
  }, [tableData, tableQuery.columns]);
  const filteredTableObjs = useMemo(() => {
    return tableObjs.filter(
      (row) => !tableSearch || row.table_name?.toUpperCase().includes(tableSearch.toUpperCase()),
    );
  }, [tableObjs, tableSearch]);

  return (
    <div>
      <Box className="m-3 p-2">
        <table className="text-xl">
          <tbody>
            <tr>
              <th className="px-2 text-left">Total Monthly Cost</th>
              <td className="px-2 text-right">{totalCost}</td>
            </tr>
            <tr>
              <th className="px-2 text-left">Total GB</th>
              <td className="px-2 text-right">{totalGb}</td>
            </tr>
          </tbody>
        </table>
        <div className="mt-2 text-sm italic">
          The data on this page only include Databases that have at least 0.5TB of billable data.
        </div>
      </Box>
      {/* DB / Schema*/}
      <Box className="m-3 grid grid-cols-1 gap-x-4 p-4 xl:grid-cols-2">
        {/* DB */}
        <div>
          <div className="text-lg">Databases</div>
          <div className="relative my-2 max-h-96 overflow-auto">
            <Table<DbSizeSummary>
              data={dbObjs}
              columns={dbSizeColumns}
              fullWidth
              getTRClass={(row) => {
                if (row.table_catalog === db) {
                  return basicTableRowSelected + " cursor-pointer";
                }
                return basicTableTR + " cursor-pointer";
              }}
              onTRClick={(row) => {
                if (row.table_catalog !== db) {
                  setDb(row.table_catalog || "");
                } else {
                  setDb("");
                }
                setSchema("");
                setTableSearch("");
                setSchemaSearch("");
              }}
            />
            {dbIsLoading && <LoadingFitParent>Loading DB Data</LoadingFitParent>}
          </div>
        </div>
        {/* Schema */}
        <div>
          <div className="flex items-center gap-x-4">
            <div className="shrink-0 text-lg">Schemas</div>
            <input
              className="input-main border-main grow border px-2"
              placeholder="Search..."
              type="text"
              value={schemaSearch}
              onChange={(e) => setSchemaSearch(e.target.value)}
            />
          </div>
          <div className="relative my-2 max-h-96 overflow-auto">
            {db ? (
              <Table<SchemaSizeSummary>
                data={filteredSchemaObjs}
                columns={schemaSizeColumns}
                fullWidth
                getTRClass={(row) => {
                  if (row.table_schema === schema) {
                    return basicTableRowSelected + " cursor-pointer";
                  }
                  return basicTableTR + " cursor-pointer";
                }}
                onTRClick={(row) => {
                  if (row.table_schema !== schema) {
                    setSchema(row.table_schema || "");
                  } else {
                    setSchema("");
                  }
                  setTableSearch("");
                }}
              />
            ) : (
              <div>Select a database to see schemas</div>
            )}
            {schemaIsLoading && <LoadingFitParent>Loading Schema Data</LoadingFitParent>}
          </div>
        </div>
      </Box>
      {/* Table */}
      <Box className="m-3 p-4">
        <div className="flex items-center gap-x-4">
          <div className="shrink-0 text-lg">{!(db && schema) ? "Top" : "All"} Tables</div>
          {db && schema && (
            <input
              className="input-main border-main grow border px-2"
              placeholder="Search..."
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
            />
          )}
        </div>
        <div className="relative my-2 max-h-[60lvh] overflow-auto">
          <Table<TableStorageFact>
            data={filteredTableObjs}
            columns={tableSizeColumns}
            fullWidth
            getTRClass={basicTableTR}
          />
          {tableIsLoading && <LoadingFitParent />}
        </div>
      </Box>
      {/* Info */}
      <Box className="m-3 p-4">
        <div className="text-lg">What does this data mean?</div>
        <div className="list">
          <ol>
            <li>
              There are different categories of data.
              <ul>
                <li>
                  <b>Active</b> - Data currently in the table.
                </li>
                <li>
                  <b>Time Travel</b> - Data that has been deleted but is still billed due to being
                  retained for time travel. By default, time travel persists data for 2 weeks after
                  deletion. Anyone with access to the table can still query this data with special
                  query syntax.
                </li>
                <li>
                  <b>Failsafe</b> - Data that has been deleted and purged from time travel, but
                  still billed due to being retained for failsafe. Only Snowflake can restore this
                  data.
                </li>
                <li>
                  <b>For Clones</b> - Data that has been replaced in this table, but is still used
                  as Active by at least one clone of the table.
                </li>
                <li>
                  <b>Total</b> - The SUM of the other 4 categories.
                </li>
              </ul>
            </li>
            <li>
              Every time data is deleted, truncated, ovewrriten, or a table is dropped or replaced,
              the previously <b>Active</b> data in the table is moved to <b>Time Travel</b>.
              <ul>
                <li>
                  Once it has been in <b>Time Travel</b> for the configured time, it gets moved to{" "}
                  <b>Failsafe.</b>
                </li>
                <li>
                  This means that full loads can result in billing being dramatically more than the{" "}
                  <b>Active</b> table size.
                  <ul>
                    <li>For example, you have a 10GB table.</li>
                    <li>
                      This is loaded via an INSERT OVERWRITE (or TRUNCATE, or CREATE TABLE AS) 4
                      times per day.
                    </li>
                    <li>
                      The <b>Active</b> size will be 10GB. But the total billable size will be
                      850GB. 10GB (Active) + 560GB (Time Travel: 10GB * 4 per day * 14 days) + 280GB
                      (Failsafe: 10GB * 4 per day * 7 days).
                    </li>
                  </ul>
                </li>
              </ul>
            </li>
            <li>
              A <b>Transient</b> table is a way to save money when Time Travel and Failsafe are not
              needed.
              <ul>
                <li>
                  It is a <b>Permanent</b> table, just like a regular table.
                </li>
                <li>It has 0 Failsafe.</li>
                <li>It has a maximum of 1 day Time Travel.</li>
                <li>
                  If the table in the example above were Transient, it would be billed as maximum
                  50GB instead of 850GB. 10GB (Active) + 40GB (Time Travel: 10GB * 4 per day * 1
                  day)
                </li>
              </ul>
            </li>
            <li>
              Guidelines to determine if your table should be <b>Transient</b>
              <ul>
                <li>
                  Is it loaded via a TRUNCATE, INSERT OVERWRITE, CREATE TABLE AS, or similar method?
                  Make it Transient
                </li>
                <li>
                  Is it a short lived working or staging table that gets dropped when a procedure is
                  finished? Make it Transient.
                </li>
                <li>Is it loaded using delta loads? Leave it as regular.</li>
                <li>
                  Does the data above show a Time Travel Multiplier or Failsafe Multiplier above 4?
                  Make it Transient.
                </li>
              </ul>
            </li>
            <li>
              Converting a regular table to a Transient table.
              <ul>
                <li>This can not be done directly.</li>
                <li>
                  You can create a transient clone of the original table, then swap the original
                  with the clone, then drop the original. The time travel and failsafe of the
                  original will persist for the original durations, meaning billing will continue
                  until they fall off.
                </li>
              </ul>
            </li>
            <li>
              Storage space and cost are owned by the table that initially created the rows. This is
              relevant for clones.
              <ul>
                <li>A table can be deleted but still show as having active data.</li>
                <li>
                  A table created as a clone may not show at all, as the original table owns the
                  data.
                </li>
              </ul>
            </li>
            <li>
              Billable storage space (as shown on this page) will probably not match the table size
              listed in the Snowflake UI or INFORMATION_SCHEMA.TABLES.
              <ul>
                <li>Billable storge includes all categories of storage, as described above.</li>
                <li>The Snowflake UI and Information Schema only include Active storage.</li>
                <li>
                  Billable storage is attributed to the table that owns it (see above point). The
                  other sources show the space on the table that uses it. Therefore, for things such
                  as cloned tables, this page shows the space on the initial table it was made in,
                  the other sources show it on the eventual clone.
                </li>
              </ul>
            </li>
          </ol>
        </div>
      </Box>
      <Box className="m-3 p-4">All costs are using the on-demand list price of $23/TB.</Box>
      {(dbError || schemaError) && (
        <ErrorMessage error={dbError || schemaError} message="Error Retrieving DB/Schema Data" />
      )}
      {tableError && <ErrorMessage error={tableError} message="Error Retreiving Table Data" />}
    </div>
  );
}
