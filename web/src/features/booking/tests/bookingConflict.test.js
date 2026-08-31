import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canSubmitBooking,
  conflictMessage,
  findSlotOccupant
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
