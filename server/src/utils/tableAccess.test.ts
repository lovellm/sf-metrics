import { describe, test, before, mock } from "node:test";
import assert from "node:assert/strict";
import { TableAccessType, TableAccessCache, AllowedDbs } from "./tableAccess.js";

const testConfig: TableAccessCache = {
  serviceRead: {
    DB: {
      SCHEMA: {
        TABLE: true,
        NOPE: false,
      },
      "*": {
        STAR1: true,
      },
    },
    "*": {
      SCHEMA_STAR: {
        "*": true,
      },
    },
  },
};

const testConfigNoStar: AllowedDbs = {
  DB: {
    SCHEMA: {
      TABLE: true,
      NOPE: false,
    },
  },
};

await describe("tableAccess does what is expected", async () => {
  const readConfigJsonMock = mock.fn<(...args: unknown[]) => AllowedDbs>();
  let TableAccess: TableAccessType;

  before(async () => {
    mock.module("./readConfig.js", {
      namedExports: {
        readConfigJson: readConfigJsonMock,
      },
    });

    ({ TableAccess } = await import("./tableAccess.js"));
  });

  await test("tableAccess behaves as expected", async () => {
    const ta = new TableAccess();
    // show throw before being initalized
    assert.throws(() => ta.canRead(), "initialized");

    await ta.initialize(testConfig);

    // defaults to serviceRead, which exists, but no *.*.* exists
    assert.throws(() => ta.canRead(), "database");
    // *.SCHEMA_STAR.* exists, should work
    assert.equal(ta.canRead({ schema: "SCHEMA_STAR" }), true);
    // no caller config was set
    assert.throws(() => ta.canRead({ schema: "SCHEMA_STAR", as: "caller" }), "access type");
    // DB.*.STAR1 should work
    assert.equal(ta.canRead({ schema: "ANY_SCHEMA", db: "DB", table: "STAR1" }), true);
    // but DB.*.STAR2 should not
    assert.throws(() => ta.canRead({ schema: "ANY_SCHEMA", db: "DB", table: "STAR2" }), "table");
    // a specific table that is allowed
    assert.equal(ta.canRead({ db: "DB", schema: "SCHEMA", table: "TABLE", as: "service" }), true);
    // a specific table that is not allowed
    assert.throws(
      () => ta.canRead({ db: "DB", schema: "SCHEMA", table: "NOPE", as: "service" }),
      "table",
    );
    // db other than DB only allows a specific schema
    assert.equal(
      ta.canRead({ db: "DB2", schema: "SCHEMA_STAR", table: "TABLE", as: "service" }),
      true,
    );
    assert.throws(
      () => ta.canRead({ db: "DB2", schema: "SCHEMA", table: "TABLE", as: "service" }),
      "schema",
    );
  });

  await test("tableAccess using mocks behaves as expected", async () => {
    readConfigJsonMock.mock.mockImplementation(() => {
      return testConfigNoStar;
    });
    const ta = new TableAccess();
    await ta.initialize();
    assert.equal(readConfigJsonMock.mock.callCount(), 2);

    assert.equal(ta.canRead({ db: "DB", schema: "SCHEMA", table: "TABLE", as: "caller" }), true);
    assert.throws(() => ta.canRead({ schema: "ANY_SCHEMA", db: "DB", table: "STAR1" }), "schema");
  });
});
