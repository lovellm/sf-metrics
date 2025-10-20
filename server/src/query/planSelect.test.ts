import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { ColumnDefinition } from "../types/dataApi.js";
import planSelect from "./planSelect.js";
import { RequestError } from "../errors.js";

await describe("planSelect does what is expected", async () => {
  await test("planSelect produces good results", () => {
    const c1: ColumnDefinition[] = [
      "c1",
      { name: "c2" },
      { name: "c3", agg: "sum" },
      { name: "c4", alias: "COL4" },
    ];
    const s1 = planSelect(c1);

    assert.equal(s1.selectParts.join(", "), "C1, C2, SUM(C3), C4 AS COL4");
    assert.equal(s1.aliasList.join(", "), "C1, C2, SUM(C3), COL4");
    assert.equal(s1.groupParts?.join(", "), "C1, C2, COL4");
    assert.equal(s1.groupBools?.join(", "), "true, true, false, true");

    const c2: ColumnDefinition[] = [
      "c1",
      "c2",
      "c3",
      { name: "c4" },
      { name: "mb1", agg: "max_by", by: "mb2" },
      {
        name: "mb 3",
        agg: "min_by",
        by: { name: "mb 4", from: "x", quoted: true },
        quoted: true,
        from: "t",
        alias: "z1",
      },
      { name: "l1", agg: "listagg", delim: ",", desc: true, order: "o1", distinct: true },
      { name: "l2", agg: "listagg" },
      { name: "*", agg: "count" },
    ];
    const s2 = planSelect(c2);

    assert.equal(
      s2.selectParts.join(", "),
      `C1, C2, C3, C4, MAX_BY(MB1, MB2), MIN_BY(T."mb 3", X."mb 4") AS Z1, LISTAGG(DISTINCT L1, ',') WITHIN GROUP (ORDER BY O1 DESC), LISTAGG(L2), COUNT(*)`,
    );
    assert.equal(
      s2.aliasList.join(", "),
      `C1, C2, C3, C4, MAX_BY(MB1, MB2), Z1, LISTAGG(DISTINCT L1, ',') WITHIN GROUP (ORDER BY O1 DESC), LISTAGG(L2), COUNT(*)`,
    );
    assert.equal(s2.groupParts?.join(", "), "C1, C2, C3, C4");
    assert.equal(
      s2.groupBools?.join(", "),
      "true, true, true, true, false, false, false, false, false",
    );

    // check SELECT *
    const c3: ColumnDefinition[] = ["*"];
    const s3 = planSelect(c3);

    assert.equal(s3.selectParts.join(", "), `*`);
    assert.equal(s3.aliasList.join(", "), `*`);
    assert.equal(s3.groupParts, undefined);
    assert.equal(s3.groupBools, undefined);
  });

  await test("planSelect throws when expected", () => {
    const c1: ColumnDefinition[] = [];
    assert.throws(() => planSelect(c1), /no column list/);

    const c2: ColumnDefinition[] = ["bad column name"];
    assert.throws(() => planSelect(c2), RequestError);

    const c3: ColumnDefinition[] = [{ name: "*" }, { name: "c1", agg: "sum" }];
    assert.throws(() => planSelect(c3), /\*/);
  });

  await test("planSelect for function columns produces good results", () => {
    const c1: ColumnDefinition[] = [
      "c1",
      { name: "DATE_TRUNC", args: ["'day'", { name: "c1", from: "t" }], alias: "SHORT" },
    ];
    const s1 = planSelect(c1);

    assert.equal(s1.selectParts.join(", "), "C1, DATE_TRUNC('day', T.C1) AS SHORT");
    assert.equal(s1.aliasList.join(", "), "C1, SHORT");
    assert.equal(s1.groupParts, undefined);
    assert.equal(s1.groupBools, undefined);

    const c2: ColumnDefinition[] = [
      { name: "substring", args: ["col1", 1, 6] },
      {
        name: "length",
        args: [{ name: "bad col", quoted: true, from: "t2", alias: "ignore" }],
        alias: "l",
      },
    ];
    const s2 = planSelect(c2);

    assert.equal(s2.selectParts.join(", "), `SUBSTRING(COL1, 1, 6), LENGTH(T2."bad col") AS L`);
    assert.equal(s2.aliasList.join(", "), "SUBSTRING(COL1, 1, 6), L");
    assert.equal(s1.groupParts, undefined);
    assert.equal(s1.groupBools, undefined);
  });
});
