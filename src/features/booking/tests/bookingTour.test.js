import assert from "node:assert/strict";
import { test } from "vitest";
import {
  isTourSeen,
  markTourSeen,
  shouldAutoStartTour,
  TOUR_STEPS,
  TOUR_STORAGE_KEY
} from "../bookingTour.js";

const memoryStorage = () => {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v))
  };
};

test("tour steps use data-tour anchors in the required order", () => {
  assert.equal(TOUR_STEPS.length, 5);
  assert.deepEqual(
    TOUR_STEPS.map((s) => s.element),
    [
      '[data-tour="room-table"]',
      '[data-tour="empty-slot"]',
      '[data-tour="book-cta"]',
      '[data-tour="ai-input"]',
      '[data-tour="chip-find-free"]'
    ]
  );
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
