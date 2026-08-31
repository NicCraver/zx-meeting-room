import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clampDefaultSlot,
  DEFAULT_DURATION_MIN,
  draftFromGrid,
  draftFromToolbar,
  nextHalfHour
} from "../bookingDefaults.js";

test("nextHalfHour snaps forward to the next 30-minute mark", () => {
  assert.equal(nextHalfHour(13 * 60 + 23), 13 * 60 + 30);
  assert.equal(nextHalfHour(13 * 60), 13 * 60 + 30);
  assert.equal(nextHalfHour(13 * 60 + 30), 14 * 60);
});

test("toolbar draft is today + next half hour + 1 hour", () => {
  const rooms = [{ id: "r1", name: "1号" }];
  const draft = draftFromToolbar({
    nowMin: 13 * 60 + 23,
    todayIso: "2026-08-31",
    rooms
  });
  assert.equal(draft.source, "toolbar");
  assert.equal(draft.dateIso, "2026-08-31");
  assert.equal(draft.start, 13 * 60 + 30);
  assert.equal(draft.end - draft.start, DEFAULT_DURATION_MIN);
  assert.equal(draft.room.id, "r1");
});

test("grid draft keeps the clicked room and range", () => {
  const room = { id: "a401", name: "A401" };
  const draft = draftFromGrid({
    room,
    dateIso: "2026-09-01",
    start: 17 * 60,
    end: 21 * 60
  });
  assert.equal(draft.source, "grid");
  assert.equal(draft.room.id, "a401");
  assert.equal(draft.start, 17 * 60);
  assert.equal(draft.end, 21 * 60);
  assert.deepEqual(draft.dates, ["2026-09-01"]);
});

test("clampDefaultSlot stays inside the day", () => {
  const slot = clampDefaultSlot(23 * 60 + 30);
  assert.ok(slot.end <= 24 * 60);
  assert.equal(slot.end - slot.start, 60);
});
