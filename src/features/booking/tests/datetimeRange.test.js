import assert from "node:assert/strict";
import { test } from "vitest";
import {
  compactDuration,
  endTimeOptions,
  keepDurationEnd,
  startTimeOptions,
  TIME_PICK_SNAP
} from "../datetimeRange.js";

test("compactDuration matches Feishu-style labels", () => {
  assert.equal(compactDuration(18 * 60, 18 * 60), "0分钟");
  assert.equal(compactDuration(18 * 60, 18 * 60 + 15), "15分钟");
  assert.equal(compactDuration(18 * 60, 18 * 60 + 30), "30分钟");
  assert.equal(compactDuration(18 * 60, 19 * 60), "1小时");
  assert.equal(compactDuration(18 * 60, 19 * 60 + 30), "1小时30分钟");
});

test("startTimeOptions uses 15-minute steps through the day", () => {
  const opts = startTimeOptions();
  assert.equal(opts[0], 0);
  assert.equal(opts[1], TIME_PICK_SNAP);
  assert.equal(opts.at(-1), 23 * 60 + 45);
  assert.equal(opts.length, (24 * 60) / TIME_PICK_SNAP);
});

test("endTimeOptions include duration next to each time", () => {
  const opts = endTimeOptions(18 * 60);
  assert.equal(opts[0].label, "18:15");
  assert.equal(opts[0].duration, "15分钟");
  const hour = opts.find((o) => o.value === 19 * 60);
  assert.equal(hour.duration, "1小时");
  assert.equal(opts.at(-1).value, 1440);
});

test("keepDurationEnd preserves one hour when moving start", () => {
  assert.equal(keepDurationEnd(18 * 60, 19 * 60, 18 * 60 + 30), 19 * 60 + 30);
  assert.equal(keepDurationEnd(23 * 60, 24 * 60, 23 * 60 + 45), 1440);
});
