import assert from "node:assert/strict";
import { test } from "vitest";
import { pickFirstFreeSlot } from "../pickRaceSlot.js";

const rooms = [
  {
    id: "r1",
    name: "1号",
    openStart: "09:00",
    openEnd: "12:00",
    busyEvents: [{ start: "09:00", end: "10:00", host: "张三" }]
  },
  {
    id: "r2",
    name: "2号",
    openStart: "09:00",
    openEnd: "18:00",
    busyEvents: []
  }
];

test("pickFirstFreeSlot walks past a busy block on the first room", () => {
  const slot = pickFirstFreeSlot(rooms, {
    dateIso: "2026-09-03",
    todayIso: "2026-09-02",
    nowMin: 8 * 60
  });
  assert.equal(slot.roomId, "r1");
  assert.equal(slot.startHm, "10:00");
  assert.equal(slot.endHm, "10:30");
});

test("pickFirstFreeSlot on today skips slots before nextOpen", () => {
  const slot = pickFirstFreeSlot(
    [
      {
        id: "r1",
        name: "1号",
        openStart: "09:00",
        openEnd: "18:00",
        busyEvents: []
      }
    ],
    { dateIso: "2026-09-02", todayIso: "2026-09-02", nowMin: 10 * 60 + 7 }
  );
  assert.equal(slot.startHm, "10:00");
});

test("pickFirstFreeSlot returns null when every room is full", () => {
  const slot = pickFirstFreeSlot(
    [
      {
        id: "r1",
        name: "1号",
        openStart: "09:00",
        openEnd: "10:00",
        busyEvents: [{ start: "09:00", end: "10:00" }]
      }
    ],
    { dateIso: "2026-09-03", todayIso: "2026-09-02" }
  );
  assert.equal(slot, null);
});
