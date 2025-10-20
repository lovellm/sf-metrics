import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  cleanStringLiteral,
  escapeString,
  getIdentifier,
  getTable,
  testBasicIdentifier,
  testQuotedIdentifier,
} from "./apiHelpers.js";
import { QueryDefinition } from "../types/dataApi.js";

await describe("apiHelpers do what is expected", async () => {
  await test("testBasicIdentifier behaves as expected", () => {
    assert.doesNotThrow(() => testBasicIdentifier("column1$Hello"));
    assert.throws(() => testBasicIdentifier("1column"), /unquoted identifier/);
    assert.throws(() => testBasicIdentifier("bad colun name"), /unquoted identifier/);
  });

  await test("testQuotedIdentifier behaves as expected", () => {
    assert.doesNotThrow(() => testQuotedIdentifier("abc.123 ABC !@#,"));
    assert.throws(() => testQuotedIdentifier('hello"goodbye'), /quoted identifier/);
  });

  await test("getIdentifier behaves as expected", () => {
    assert.equal(getIdentifier("hello"), "HELLO");
    assert.equal(getIdentifier({ name: "hello" }), "HELLO");
    assert.equal(getIdentifier({ name: "hello", from: "table" }), "TABLE.HELLO");
    assert.equal(getIdentifier({ name: "hello goodbye", quoted: true }), '"hello goodbye"');
    assert.equal(
      getIdentifier({ name: "hello goodbye", quoted: true, from: "table" }),
      'TABLE."hello goodbye"',
    );

    assert.throws(() => getIdentifier({ name: "" }), /invalid identifier/);
  });

  await test("escapeString behaves as expected", () => {
    assert.equal(escapeString("hello"), "hello");
    const s2 = "abcABC123 |!@^%&#";
    assert.equal(escapeString(s2), s2);
    assert.equal(escapeString("hello's goodbye"), "hello\\'s goodbye");
    assert.equal(escapeString("abc\\123'\\'ABC"), "abc\\\\123\\'\\\\\\'ABC");
  });

  await test("cleanStringLiteral behaves as expected", () => {
    assert.equal(cleanStringLiteral(""), undefined);
    assert.equal(cleanStringLiteral("abc"), undefined);
    assert.equal(cleanStringLiteral("'abc'"), "'abc'");
    assert.equal(cleanStringLiteral("'a'b'c'"), "'a\\'b\\'c'");
  });

  await test("getTable behaves as expected", () => {
    process.env.SNOWFLAKE_DATABASE = "TESTDB";
    process.env.SNOWFLAKE_SCHEMA = "TESTSCHEMA";

    const q1: Partial<QueryDefinition> = {
      table: "hello",
    };
    const t1 = getTable(q1);
    assert.equal(t1.table, "HELLO");
    assert.equal(t1.path, "HELLO");
    assert.equal(t1.withAlias, "HELLO");
    assert.equal(t1.defaultPath, "TESTDB.TESTSCHEMA.HELLO");
    assert.equal(t1.pathId, "TESTSCHEMA.HELLO");

    const q2: Partial<QueryDefinition> = {
      table: "hello",
      db: "DB",
      schema: "SCHEMA",
      tableAlias: "T",
    };
    const t2 = getTable(q2);
    assert.equal(t2.table, "HELLO");
    assert.equal(t2.path, "DB.SCHEMA.HELLO");
    assert.equal(t2.withAlias, "DB.SCHEMA.HELLO AS T");
    assert.equal(t2.defaultPath, "DB.SCHEMA.HELLO");
    assert.equal(t2.pathId, "SCHEMA.HELLO");

    const q3: Partial<QueryDefinition> = {
      table: "hello",
      schema: "SCHEMA",
      tableAlias: "T",
    };
    const t3 = getTable(q3);
    assert.equal(t3.table, "HELLO");
    assert.equal(t3.path, "SCHEMA.HELLO");
    assert.equal(t3.withAlias, "SCHEMA.HELLO AS T");
    assert.equal(t3.defaultPath, "TESTDB.SCHEMA.HELLO");
    assert.equal(t3.pathId, "SCHEMA.HELLO");

    const q4: Partial<QueryDefinition> = {
      table: "hello",
      db: "DB",
      tableAlias: "T",
    };
    assert.throws(() => getTable(q4), /db without a schema/);
  });
});
