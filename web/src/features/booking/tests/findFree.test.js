import assert from "node:assert/strict";
import { test } from "node:test";
import { AI_CHIPS, AI_PLACEHOLDER } from "../aiChips.js";
import {
  fallbackAdvice,
  nextMissingFindFreeField,
  parseFindFreeQuery,
  searchFreeSlots,
  slotToBookingDraft
} from "../findFree.js";

const today = "2026-08-31";
const rooms = [
  {
    id: "r1",
    name: "1号会议室",
    buildingName: "奥城",
    floorName: "3F",
    capacity: 8,
    facilities: ["电视"],
    openStart: "09:00",
    openEnd: "18:00",
    busyEvents: [{ start: "10:00", end: "11:00", host: "张三" }]
  },
  {
    id: "r2",
    name: "小会议室",
    buildingName: "奥城",
    floorName: "3F",
    capacity: 4,
    facilities: ["白板"],
    openStart: "09:00",
    openEnd: "18:00",
    busyEvents: []
  }
];

test("chips keep the four required labels and sendable messages", () => {
  assert.equal(AI_CHIPS.length, 4);
  assert.deepEqual(
    AI_CHIPS.map((c) => c.label),
    [
      "找空闲会议室",
      "我今天有哪些会",
      "帮我订明天上午的大会议室",
      "取消我最近的一场会"
    ]
  );
  assert.match(AI_PLACEHOLDER, /明天下午 2 点/);
  for (const chip of AI_CHIPS) assert.ok(chip.message.length > 2);
});

test("parseFindFreeQuery reads date, people, and afternoon time", () => {
  const q = parseFindFreeQuery("帮我找一间明天下午 2 点、能坐 8 人的空闲会议室", {
    todayIso: today
  });
  assert.equal(q.dateIso, "2026-09-01");
  assert.equal(q.capacity, 8);
  assert.equal(q.windowStart, "14:00");
});

test("bare 找空闲会议室 asks only for the date", () => {
  const q = parseFindFreeQuery("帮我找空闲会议室", { todayIso: today });
  const miss = nextMissingFindFreeField(q, { todayIso: today });
  assert.equal(miss.field, "date");
  assert.equal(miss.options.length, 3);
  assert.equal(miss.options[0].label, "今天");
});

test("searchFreeSlots returns cards and 立即预约 maps to the same draft fields", () => {
  const q = parseFindFreeQuery("今天能坐 8 人的会议室", { todayIso: today });
  assert.equal(nextMissingFindFreeField(q, { todayIso: today }), null);
  const found = searchFreeSlots(rooms, q, { date: today, minute: 8 * 60 });
  assert.ok(found.rooms.length >= 1);
  const slot = found.rooms[0].slots[0];
  assert.ok(slot.start);
  const draft = slotToBookingDraft(slot, rooms);
  assert.equal(draft.room.id, slot.roomId);
  assert.equal(draft.dateIso, slot.date);
  assert.ok(draft.start >= 0);
  assert.ok(draft.end > draft.start);
});

test("empty result still offers a non-empty fallback", () => {
  const q = {
    dateIso: today,
    durationMin: 60,
    capacity: 99,
    facilities: [],
    windowStart: "09:00",
    windowEnd: "10:00"
  };
  const found = searchFreeSlots(rooms, q, { date: today, minute: 8 * 60 });
  assert.equal(found.rooms.length, 0);
  const advice = fallbackAdvice(rooms, q, { date: today, minute: 8 * 60 });
  assert.match(advice, /没有空闲/);
  assert.ok(advice.length > 10);
});
