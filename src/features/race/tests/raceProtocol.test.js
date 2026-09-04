import assert from "node:assert/strict";
import { test } from "vitest";
import { classifyRacePair } from "../raceProtocol.js";

test("one success and one M4010 is serialized", () => {
  const got = classifyRacePair({
    A: { ok: true, code: "M0000", id: "1" },
    B: { ok: false, code: "M4010", msg: "该时段已被占用" }
  });
  assert.equal(got.verdict, "serialized");
});

test("both success is overlap", () => {
  const got = classifyRacePair({
    A: { ok: true, code: "M0000", id: "1" },
    B: { ok: true, code: "M0000", id: "2" }
  });
  assert.equal(got.verdict, "overlap");
});

test("missing a side is incomplete", () => {
  const got = classifyRacePair({ A: { ok: true, code: "M0000" } });
  assert.equal(got.verdict, "incomplete");
});
