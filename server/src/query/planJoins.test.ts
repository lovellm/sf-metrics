import { test } from "node:test";
import assert from "node:assert/strict";
import { JoinDefinition } from "../types/dataApi.js";
import planJoins, { planJoin } from "./planJoins.js";

await test("planJoin behaves as expected", () => {
  const j1: JoinDefinition = {
    table: "TEST1",
    tableAlias: "T",
    on: {
      eq: [
        { name: "C1", from: "BASE" },
        { name: "C1", from: "T" },
      ],
    },
  };
  const j1Result = "INNER JOIN TEST1 AS T ON (BASE.C1 = T.C1)";
  assert.equal(planJoin(j1), j1Result);

  const j2: JoinDefinition = {
    table: { name: "Bad Table Name", quoted: true },
    db: "DB1",
    schema: "SCHEMA1",
    tableAlias: "T2",
    type: "right",
    on: {
      and: [
        {
          eq: [
            { name: "c1", from: "T1" },
            { name: "c1", from: "T2" },
          ],
        },
        {
          eq: [
            { name: "c2", from: "T1" },
            { name: "c 2", quoted: true, from: "T2" },
          ],
        },
      ],
    },
  };
  const j2Result = `RIGHT JOIN DB1.SCHEMA1."Bad Table Name" AS T2 ON (T1.C1 = T2.C1 AND T1.C2 = T2."c 2")`;
  assert.equal(planJoin(j2), j2Result);

  assert.equal(planJoins([j1, j2])?.join("\n"), [j1Result, j2Result].join("\n"));

  assert.equal(planJoins(undefined), undefined);
  assert.equal(planJoins([]), undefined);
});
