import { test } from "node:test";
import assert from "node:assert/strict";
import { QueryOrder } from "../types/dataApi.js";
import planOrder from "./planOrder.js";

await test("planOrder behaves as expected", async () => {
  // basic functionality
  const o1: QueryOrder = [
    { name: "col1" },
    { name: "col2", dir: "asc" },
    { name: "col3", dir: "desc" },
  ];
  const s1 = planOrder(o1);
  assert.equal(s1?.join(", "), "COL1 ASC NULLS LAST, COL2 ASC NULLS LAST, COL3 DESC NULLS LAST");

  // a bad element
  const o2 = [{ name: "test" }, { dir: "asc" }];
  assert.throws(() => planOrder(o2 as unknown as QueryOrder), "name property");

  // empty input
  assert.equal(planOrder(undefined), undefined);

  // empty array
  assert.equal(planOrder([]), undefined);

  // more complex columns
  const o3: QueryOrder = [
    { name: { name: "bad col name", quoted: true, from: "T", alias: "ignored" }, dir: "desc" },
    { name: { name: "c1", agg: "sum", from: "T2" } },
  ];
  const s3 = planOrder(o3);
  assert.equal(s3?.join(", "), 'T."bad col name" DESC NULLS LAST, SUM(T2.C1) ASC NULLS LAST');
});
