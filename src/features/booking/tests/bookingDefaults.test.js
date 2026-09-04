import assert from "node:assert/strict";
import { test } from "vitest";
import { draftFromRoomCell, nearestHourSlot } from "../bookingDefaults.js";

const openRoom = (busyEvents = []) => ({
  id: "r1",
  name: "A401",
  openStart: "09:00",
  openEnd: "22:00",
  busyEvents
});

test("nearestHourSlot defaults to the current half-hour plus one hour", () => {
  assert.deepEqual(
    nearestHourSlot(openRoom(), { isToday: true, nowMin: 18 * 60 + 7 }),
    {
      start: 18 * 60,
      end: 19 * 60
    }
  );
});

test("nearestHourSlot walks past a busy block to the next free hour", () => {
  const room = openRoom([{ start: "18:00", end: "19:00" }]);
  assert.deepEqual(
    nearestHourSlot(room, { isToday: true, nowMin: 18 * 60 + 7 }),
    {
      start: 19 * 60,
      end: 20 * 60
    }
  );
});

test("nearestHourSlot keeps a shorter remainder near close", () => {
  assert.deepEqual(
    nearestHourSlot(openRoom(), { isToday: true, nowMin: 21 * 60 + 40 }),
    { start: 21 * 60 + 30, end: 22 * 60 }
  );
});

test("nearestHourSlot on a future day after hours starts at open time", () => {
  assert.deepEqual(
    nearestHourSlot(openRoom(), { isToday: false, nowMin: 23 * 60 }),
    { start: 9 * 60, end: 10 * 60 }
  );
});

test("draftFromRoomCell rejects a past board date", () => {
  const draft = draftFromRoomCell({
    room: openRoom(),
    nowMin: 10 * 60,
    todayIso: "2026-08-31",
    boardDate: "2026-08-30",
    viewMode: "day"
  });
  assert.equal(draft.error, "不能预约过去的日期");
});

test("draftFromRoomCell week view prefers today in the workweek", () => {
  const room = {
    ...openRoom(),
    weekDays: [
      { date: "2026-08-31", busyEvents: [] },
      { date: "2026-09-01", busyEvents: [] }
    ]
  };
  const draft = draftFromRoomCell({
    room,
    nowMin: 18 * 60 + 7,
    todayIso: "2026-08-31",
    boardDate: "2026-09-01",
    viewMode: "week",
    weekDates: ["2026-08-31", "2026-09-01"]
  });
  assert.equal(draft.dateIso, "2026-08-31");
  assert.equal(draft.start, 18 * 60);
  assert.equal(draft.end, 19 * 60);
  assert.equal(draft.source, "room-cell");
});
