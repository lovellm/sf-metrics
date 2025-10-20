import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { QueryDefinition } from "../types/dataApi.js";
import planQuery, { DEFAULT_QUERY_LIMIT } from "./planQuery.js";
import { RequestError } from "../errors.js";
import tableAccess from "../utils/tableAccess.js";

await describe("planQuery does what is expected", async () => {
  await test("planQuery with various synthetic test cases", async () => {
    // a good query request
    const q1: QueryDefinition = {
      table: "test1",
      columns: ["c1", { name: "c2" }, { name: "c3", agg: "sum" }, { name: "c4", alias: "COL4" }],
      tableAlias: "T1",
      distinct: true,
    };
    const queryPlan = planQuery(q1);

    assert.equal(queryPlan.select, "SELECT C1, C2, SUM(C3), C4 AS COL4");
    assert.equal(queryPlan.from, "FROM TEST1 AS T1");
    assert.equal(queryPlan.groupBy, "GROUP BY 1, 2, 4");
    assert.equal(queryPlan.limit, "LIMIT " + DEFAULT_QUERY_LIMIT);
    assert.equal(queryPlan.filter, undefined);
    assert.equal(queryPlan.having, undefined);
    assert.equal(queryPlan.joins, undefined);
    assert.equal(queryPlan.order, undefined);

    // another good request
    const q2: QueryDefinition = {
      table: "test1",
      columns: [
        "c1",
        { name: "c2" },
        { name: "c 3", quoted: true, alias: "COL3" },
        { name: "c@4", quoted: true, from: "T2", alias: "COL4" },
        { name: "c5", from: "t3" },
      ],
      order: [{ name: "c1" }],
      limit: 5,
      distinct: true,
    };
    const p2 = planQuery(q2);

    assert.equal(p2.select, `SELECT DISTINCT C1, C2, "c 3" AS COL3, T2."c@4" AS COL4, T3.C5`);
    assert.equal(p2.from, "FROM TEST1");
    assert.equal(p2.groupBy, undefined);
    assert.equal(p2.order, "ORDER BY C1 ASC NULLS LAST");
    assert.equal(p2.limit, "LIMIT " + 5);

    // no table
    assert.throws(() => planQuery({ columns: ["c1"], table: "" }), RequestError);

    // no columns
    assert.throws(() => planQuery({ table: "t1", columns: [] }), RequestError);

    // filters
    const q3: QueryDefinition = {
      table: "t",
      columns: ["c1"],
      filter: {
        eq: ["c1", "'test'"],
      },
    };
    const p3 = planQuery(q3);
    assert.equal(p3.filter, "WHERE C1 = 'test'");
    assert.equal(p3.having, undefined);

    // having
    const q4: QueryDefinition = {
      table: "t",
      columns: ["c1", { name: "c2", agg: "sum" }],
      filter: { notnull: "c1" },
      having: {
        gte: [{ name: "c2", agg: "sum" }, 5],
      },
    };
    const p4 = planQuery(q4);
    assert.equal(p4.filter, "WHERE C1 IS NOT NULL");
    assert.equal(p4.having, "HAVING SUM(C2) >= 5");

    // joins
    const q5: QueryDefinition = {
      table: "t",
      columns: ["c1"],
      joins: [
        {
          table: "t2",
          on: {
            eq: [
              { name: "c1", from: "t" },
              { name: "c1", from: "t2" },
            ],
          },
        },
      ],
    };
    const p5 = planQuery(q5);
    assert.equal(p5.joins, "INNER JOIN T2 ON (T.C1 = T2.C1)");

    // check that table access will error if a query requests a table it should not
    await tableAccess.initialize({ serviceRead: { "*": { "*": { T: true, T2: true } } } });
    assert.doesNotThrow(() =>
      planQuery({ table: "T", columns: ["c1"] }, { checkTableAccess: true }),
    );
    assert.throws(
      () => planQuery({ table: "BAD_TABLE", columns: ["c1"] }, { checkTableAccess: true }),
      "table",
    );
    // check table access for joined table
    assert.doesNotThrow(() =>
      planQuery(
        { table: "T", columns: ["c1"], joins: [{ table: "T2", on: { eq: ["c1", "c1"] } }] },
        { checkTableAccess: true },
      ),
    );
    assert.throws(
      () =>
        planQuery(
          {
            table: "T",
            columns: ["c1"],
            joins: [{ table: "BAD_TABLE", on: { eq: ["c1", "c1"] } }],
          },
          { checkTableAccess: true },
        ),
      "table",
    );

    // check only agg and nothing else
    const onlyAgg: QueryDefinition = {
      table: "test",
      columns: [{ name: "c", agg: "sum" }],
    };
    const onlyAggPlan = planQuery(onlyAgg);

    assert.equal(onlyAggPlan.select, "SELECT SUM(C)");
    assert.equal(onlyAggPlan.groupBy, undefined);
  });
});
