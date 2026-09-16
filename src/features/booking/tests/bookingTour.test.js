import assert from "node:assert/strict";
import { test } from "vitest";
import {
  getTourDragRange,
  isTourSeen,
  markTourSeen,
  shouldAutoStartTour,
  TOUR_STEPS,
  TOUR_STORAGE_KEY,
  tourDragSlotStyle
} from "../bookingTour.js";

const memoryStorage = () => {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v))
  };
};

test("tour steps use data-tour anchors in the required order", () => {
  assert.equal(TOUR_STEPS.length, 6);
  assert.deepEqual(
    TOUR_STEPS.map((s) => s.element),
    [
      '[data-tour="room-table"]',
      '[data-tour="empty-slot"]',
      '[data-tour="drag-slot"]',
      '[data-tour="book-cta"]',
      '[data-tour="ai-input"]',
      '[data-tour="chip-find-free"]'
    ]
  );
  assert.equal(TOUR_STEPS[0].popover.side, "over");
  assert.match(TOUR_STEPS[2].popover.description, /拖动/);
});

test("getTourDragRange aligns to next half hour within two-hour span", () => {
  // 14:35 (875) -> 下一个半点 15:00 (900)，演示 15:00-17:00
  const midDay = getTourDragRange(14 * 60 + 35);
  assert.equal(midDay.startMin, 15 * 60);
  assert.equal(midDay.endMin, 17 * 60);
  assert.equal(midDay.label, "15:00-17:00");

  // 凌晨 02:00 -> 回落到白天标准 09:00-11:00
  const earlyMorning = getTourDragRange(2 * 60);
  assert.equal(earlyMorning.startMin, 9 * 60);
  assert.equal(earlyMorning.endMin, 11 * 60);
  assert.equal(earlyMorning.label, "09:00-11:00");

  // 深夜 23:00 -> 超过当天 24:00，回退到白天标准 14:00-16:00
  const lateNight = getTourDragRange(23 * 60);
  assert.equal(lateNight.startMin, 14 * 60);
  assert.equal(lateNight.endMin, 16 * 60);
  assert.equal(lateNight.label, "14:00-16:00");
});

test("tour drag slot sits on a two-hour cell based on time", () => {
  // 指定 13:30 (810)，下一个半点为 14:00 (840)
  const day = tourDragSlotStyle("day", 13 * 60 + 30);
  assert.equal(day.left, `${((14 * 60) / 1440) * 100}%`);
  assert.equal(day.width, `${((2 * 60) / 1440) * 100}%`);

  // 未指定时按当前时间计算，宽恒为 2 小时跨度
  const autoDay = tourDragSlotStyle("day");
  assert.ok(autoDay.left);
  assert.equal(autoDay.width, `${((2 * 60) / 1440) * 100}%`);

  const week = tourDragSlotStyle("week");
  assert.ok(week.left);
  assert.ok(week.width);
});

test("markTourSeen writes versioned key for auto and ESC/overlay exit", () => {
  const storage = memoryStorage();
  assert.equal(isTourSeen(storage), false);
  assert.equal(shouldAutoStartTour({ seen: false, boardReady: true }), true);
  const key = markTourSeen(storage);
  assert.equal(key, TOUR_STORAGE_KEY);
  assert.equal(storage.getItem(TOUR_STORAGE_KEY), "1");
  assert.equal(isTourSeen(storage), true);
  assert.equal(shouldAutoStartTour({ seen: true, boardReady: true }), false);
});
