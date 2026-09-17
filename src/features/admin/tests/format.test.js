import { test } from "vitest";
import assert from "node:assert/strict";
import { formatFacilities } from "../format.js";

const dicts = [
  { type: "facility", name: "电视", sort: 2 },
  { type: "facility", name: "投影", sort: 1 },
  { type: "building", name: "奥城", sort: 1 }
];

test("空数组显示 —", () => {
  assert.equal(formatFacilities([], dicts), "—");
  assert.equal(formatFacilities(null, dicts), "—");
});

test("按字典 sort 拼接，字典外的项跟在后面", () => {
  assert.equal(
    formatFacilities(["白板", "投影", "电视"], dicts),
    "投影 / 电视 / 白板"
  );
});
