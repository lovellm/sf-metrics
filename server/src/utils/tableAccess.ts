import { AccessError, ConfigError } from "../errors.js";
import { readConfigJson } from "./readConfig.js";

const ANY_VALUE = "*";
export type AccessAs = "caller" | "service";
export type AccessType = "callerRead" | "serviceRead";
/** table name or * to boolean of it it can be queries */
type AllowedTables = Record<string, boolean>;
/** schema name or * to AllowedTables within it */
type AllowedSchemas = Record<string, AllowedTables>;
/** db name or * to AllowedSchemas within it */
export type AllowedDbs = Record<string, AllowedSchemas>;
/** access type to AllowedDbs for it */
export type TableAccessCache = Partial<Record<AccessType, AllowedDbs>>;

export interface CheckAccessOptions {
  /** db to access */
  db?: string;
  /** schema to access */
  schema?: string;
  /** table to access */
  table?: string;
  /** how data will be access. defaults to service */
  as?: AccessAs;
}

/** used for checking access. should not make a new instance of this except in test scripts. in the server, use the default exported instace */
export class TableAccess {
  private accessCache: TableAccessCache = {};
  private isInitialized = false;

  async initialize(override?: TableAccessCache) {
    if (override) {
      this.accessCache = override;
    } else {
      const serviceRead = await readConfigJson<AllowedDbs>("serviceRead.json");
      if (serviceRead) {
        this.accessCache.serviceRead = serviceRead;
      }

      const callerRead = await readConfigJson<AllowedDbs>("callerRead.json");
      if (callerRead) {
        this.accessCache.callerRead = callerRead;
      }
    }
    this.isInitialized = true;
  }

  /** checks whether the provided AccessOptions are allowed. returns true if they are or throws if they are not */
  canRead({ db, schema, table, as }: CheckAccessOptions = {}): boolean {
    if (!this.isInitialized) {
      throw new ConfigError("TableAccess.canRead is called before being initialized");
    }
    const allowedDbs = this.accessCache[as === "caller" ? "callerRead" : "serviceRead"];
    if (!allowedDbs) {
      throw new AccessError("access type is not allowed to be used");
    }
    const allowedSchemas = this.getAllowedSchemas(allowedDbs, db);
    if (!allowedSchemas) {
      throw new AccessError("database is not allowed to be used");
    }
    const allowedTables = this.getAllowedTables(allowedSchemas, schema);
    if (!allowedTables) {
      throw new AccessError("schema is not allowed to be used");
    }
    const check = this.checkTableAccess(allowedTables, table);
    if (!check) {
      throw new AccessError("table is not allowed to be used");
    }
    return true;
  }

  /** checks the allowedDbs to see if the given db or ANY_VALUE is allowed. returns array of AllowedSchemas for any such db */
  private getAllowedSchemas(allowedDbs: AllowedDbs, db?: string): AllowedSchemas[] | undefined {
    const allowed: AllowedSchemas[] = [];
    if (db && allowedDbs[db]) {
      allowed.push(allowedDbs[db]);
    }
    if (allowedDbs[ANY_VALUE]) {
      allowed.push(allowedDbs[ANY_VALUE]);
    }

    return allowed.length > 0 ? allowed : undefined;
  }

  /** checks each AllowedSchemas to see if the given schema or ANY_VALUE is allowed. returns array of AllowedTables for any such schema */
  private getAllowedTables(
    allowedSchemas: AllowedSchemas[],
    schema?: string,
  ): AllowedTables[] | undefined {
    const allowed: AllowedTables[] = [];
    allowedSchemas.forEach((schemas) => {
      if (schema && schemas[schema]) {
        allowed.push(schemas[schema]);
      }
      if (schemas[ANY_VALUE]) {
        allowed.push(schemas[ANY_VALUE]);
      }
    });
    return allowed.length > 0 ? allowed : undefined;
  }

  /** checks each AllowedTables to see if the given table or ANY_VALUE is allowed. returns true if any allow the access */
  private checkTableAccess(allowedTables: AllowedTables[], table?: string): boolean {
    const found = allowedTables.find((tables) => {
      if (table && tables[table] === true) {
        return true;
      } else if (tables[ANY_VALUE]) {
        return true;
      }
      return false;
    });
    return found ? true : false;
  }
}

export type TableAccessType = typeof TableAccess;
const tableAccess = new TableAccess();
export default tableAccess;
