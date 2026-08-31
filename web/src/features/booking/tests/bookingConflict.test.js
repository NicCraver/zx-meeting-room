import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canSubmitBooking,
  conflictMessage,
  findSlotOccupant,
  occupancySource
} from "../bookingConflict.js";

const busy = [
  { start: "10:00", end: "11:00", host: "张三", title: "晨会" },
  { start: "14:00", end: "15:00", host: "李四" }
];

test("findSlotOccupant reports the overlapping host", () => {
  const hit = findSlotOccupant(busy, 10 * 60 + 30, 11 * 60 + 30);
  assert.equal(hit.host, "张三");
  assert.equal(findSlotOccupant(busy, 11 * 60, 12 * 60), null);
});

test("occupancySource does not use today's board busyEvents for a tomorrow draft", () => {
  const today = "2026-08-31";
  const tomorrow = "2026-09-01";
  const room = {
    id: "r1",
    busyEvents: [{ start: "14:00", end: "15:00", host: "张三" }]
  };
  const pending = occupancySource({
    bookingDateIso: tomorrow,
    boardDateIso: today,
    room,
    fetchedBusy: null
  });
  assert.equal(pending.fetch, true);
  assert.equal(findSlotOccupant(pending.events, 14 * 60, 15 * 60), null);

  const todaySrc = occupancySource({
    bookingDateIso: today,
    boardDateIso: today,
    room,
    fetchedBusy: null
  });
  assert.equal(todaySrc.fetch, false);
  assert.equal(findSlotOccupant(todaySrc.events, 14 * 60, 15 * 60).host, "张三");

  const fetched = occupancySource({
    bookingDateIso: tomorrow,
    boardDateIso: today,
    room,
    fetchedBusy: [{ start: "14:00", end: "15:00", host: "李四" }]
  });
  assert.equal(fetched.fetch, false);
  const occ = findSlotOccupant(fetched.events, 14 * 60, 15 * 60);
  assert.equal(conflictMessage(occ), "该时段已被 李四 占用");
  assert.equal(
    canSubmitBooking({
      room,
      start: 14 * 60,
      end: 15 * 60,
      conflictText: conflictMessage(occ),
      occupancyLoading: false
    }),
    false
  );
  assert.equal(
    canSubmitBooking({
      room,
      start: 14 * 60,
      end: 15 * 60,
      conflictText: "",
      occupancyLoading: true
    }),
    false
  );
});

test("conflictMessage names the occupant and blocks submit", () => {
  const ev = findSlotOccupant(busy, 14 * 60, 15 * 60);
  const text = conflictMessage(ev);
  assert.match(text, /该时段已被 李四 占用/);
  assert.equal(
    canSubmitBooking({
      room: { id: "r1" },
      start: 14 * 60,
      end: 15 * 60,
      conflictText: text
    }),
    false
  );
  assert.equal(
    canSubmitBooking({
      room: { id: "r1" },
      start: 11 * 60,
      end: 12 * 60,
      conflictText: ""
    }),
    true
  );
});
