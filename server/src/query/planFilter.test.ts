import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  ColumnDefinition,
  Filter,
  FilterBoolean,
  FilterCompare,
  FilterIn,
  FilterNot,
  FilterUnary,
  OperatorsUnary,
} from "../types/dataApi.js";
import {
  planFilter,
  processBoolean,
  processCompare,
  processFilter,
  processIn,
  processUnary,
} from "./planFilter.js";

await describe("planFilter does what is expected", async () => {
  await test("processUnary behaves as expected", () => {
    const t1: FilterUnary = {
      isnull: "c1",
    };
    assert.equal(processUnary(t1, "isnull"), "C1 IS NULL");
    const t2: FilterUnary = {
      notnull: { name: "c1" },
    };
    assert.equal(processUnary(t2, "notnull"), "C1 IS NOT NULL");

    const t3: FilterUnary = {
      isnull: { name: "c 1", alias: "test", quoted: true, from: "t" } as ColumnDefinition,
    };
    assert.equal(processUnary(t3, "isnull"), `T."c 1" IS NULL`);

    const t4: FilterUnary = {
      isnull: "c1",
    };
    // test mismtach of op in function
    assert.throws(() => processUnary(t4, "notnull"), "unknown compare");
    // test bad op
    assert.throws(() => processUnary(t4, "bad" as unknown as OperatorsUnary), "unexpected unary");

    const t5: FilterUnary = {
      isnull: { name: "c1", alias: "test", from: "t", agg: "sum" } as ColumnDefinition,
    };
    assert.equal(processUnary(t5, "isnull", { isHaving: true }), `SUM(T.C1) IS NULL`);
    assert.throws(() => processUnary(t5, "isnull"), `aggregation`);
  });

  await test("processCompare behaves as expected", () => {
    const t1: FilterCompare = {
      "=": ["c1", 5],
    };
    assert.equal(processCompare(t1, "="), "C1 = 5");

    const t2: FilterCompare = {
      like: [{ name: "c1", from: "t" } as ColumnDefinition, "'hello'"],
    };
    assert.equal(processCompare(t2, "like"), "T.C1 LIKE 'hello'");

    const t3: FilterCompare = {
      lt: [{ name: "c1" }, { name: "c 1", quoted: true, from: "t" } as ColumnDefinition],
    };
    assert.equal(processCompare(t3, "lt"), `C1 < T."c 1"`);

    const t4: FilterCompare = {
      "=": ["c1", false],
    };
    assert.equal(processCompare(t4, "="), "C1 = false");

    const t5: FilterCompare = {
      "=": [] as unknown as [string, string],
    };
    assert.throws(() => processCompare(t5, "="), "tuple length 2");

    const t6: FilterCompare = {
      "=": "a" as unknown as [string, string],
    };
    assert.throws(() => processCompare(t6, "="), "tuple length 2");

    // test that a number provided as a string is still treated like a number
    const t7: FilterCompare = {
      gte: ["c", "1"],
    };
    assert.equal(processCompare(t7, "gte"), `C >= 1`);
  });

  await test("processIn behaves as expected", () => {
    const t1: FilterIn = {
      in: ["c1", ["a", "b"]],
    };
    assert.equal(processIn(t1, "in"), "C1 IN ('a', 'b')");

    const t2: FilterIn = {
      likeany: [{ name: "c 1", quoted: true, from: "t" } as ColumnDefinition, [1, 2, 3]],
    };
    assert.equal(processIn(t2, "likeany"), `T."c 1" LIKE ANY (1, 2, 3)`);

    const t3: FilterIn = {
      in: ["c1", []],
    };
    assert.throws(() => processIn(t3, "in"), "not an array");

    const t4: FilterIn = {
      in: ["c1", [{} as unknown as string, {} as unknown as string]],
    };
    assert.throws(() => processIn(t4, "in"), "datatype");
  });

  await test("not filters behaves as expected", () => {
    const t1: FilterNot = {
      not: { "=": ["c1", "'hello'"] },
    };
    assert.equal(processFilter(t1), "NOT C1 = 'hello'");

    const t2: FilterNot = {
      not: { not: { not: { in: ["c1", ["a"]] } } },
    };
    assert.equal(processFilter(t2), "NOT NOT NOT C1 IN ('a')");
  });

  await test("processBoolean behaves as expected", () => {
    const t1: FilterBoolean = {
      and: [{ eq: ["c1", "c2"] }, { eq: ["c1", "'hello'"] }],
    };
    assert.equal(processBoolean(t1, "and"), "(C1 = C2 AND C1 = 'hello')");

    const t2: FilterBoolean = {
      or: [{ in: ["c1", [1, 2, 3]] }, { eq: ["c2", "'test'"] }, { isnull: "c2" }],
    };
    assert.equal(processBoolean(t2, "or"), "(C1 IN (1, 2, 3) OR C2 = 'test' OR C2 IS NULL)");

    const t3: FilterBoolean = {
      and: [],
    };
    assert.throws(() => processBoolean(t3, "and"), "at least");

    const t4: FilterBoolean = {
      and: "hello" as unknown as [],
    };
    assert.throws(() => processBoolean(t4, "and"), "given an array");

    const t5: FilterBoolean = {
      and: [{ eq: ["c1", 1] }],
    };
    assert.equal(processBoolean(t5, "and"), "(C1 = 1)");
  });

  await test("planFilter produces good results", () => {
    // filter with unary
    assert.equal(
      processFilter({
        isnull: "c1",
      }),
      "C1 IS NULL",
    );
    // filter with compare
    assert.equal(
      processFilter({
        "=": ["c1", "'hello'"],
      }),
      "C1 = 'hello'",
    );
    // filter with in
    assert.equal(processFilter({ in: ["c1", ["a", "b"]] }), "C1 IN ('a', 'b')");
    // filter with boolean
    assert.equal(
      processFilter({
        and: [{ eq: ["c1", "c2"] }, { eq: ["c1", "'hello'"] }],
      }),
      "(C1 = C2 AND C1 = 'hello')",
    );

    // Complex Filter 1
    const f1: Filter = {
      and: [
        { or: [{ "<>": ["c1", "'hello'"] }, { "=": [{ name: "c2" }, 42] }] },
        { eq: [{ name: "c3", from: "t" }, false] },
        { gt: [{ name: "a.b c4", quoted: true }, "c5"] },
        { in: ["c1", ["a", "b", "c"]] },
        { not: { in: [{ name: "c2" }, ["d", "e"]] } },
        { isnull: "c1" },
        { notnull: { name: "c1" } },
      ],
    };
    assert.equal(
      processFilter(f1),
      [
        "(",
        "(C1 != 'hello' OR C2 = 42)",
        " AND ",
        "T.C3 = false",
        " AND ",
        `"a.b c4" > C5`,
        " AND ",
        "C1 IN ('a', 'b', 'c')",
        " AND ",
        "NOT C2 IN ('d', 'e')",
        " AND ",
        "C1 IS NULL",
        " AND ",
        "C1 IS NOT NULL",
        ")",
      ].join(""),
    );

    // higher level planFilter
    // only difference is an undefined input
    assert.equal(planFilter(undefined), undefined);
    assert.equal(planFilter({ eq: ["c1", 1] }), "C1 = 1");
  });
});
