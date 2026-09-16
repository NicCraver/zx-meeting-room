import assert from "node:assert/strict";
import { test } from "vitest";
import { createDraftStore, DRAFT_TTL_MS } from "../draftStore.js";

const slot = {
  roomId: "r1",
  date: "2026-09-15",
  start: "14:00",
  end: "15:00",
  roomName: "星海"
};

test("pickSlot must match issued slots", () => {
  const store = createDraftStore();
  store.issueFromRooms([{ slots: [slot] }]);
  const draft = store.pickSlot({ ...slot }, { title: "面试" });
  assert.equal(draft.slot.roomName, "星海");
  assert.equal(draft.title, "面试");
  assert.throws(
    () => store.pickSlot({ ...slot, start: "15:00", end: "16:00" }),
    /本轮查询结果/
  );
});

test("expired draft cannot confirm", () => {
  let t = 1000;
  const store = createDraftStore({ now: () => t, ttlMs: DRAFT_TTL_MS });
  store.issueFromRooms([{ slots: [slot] }]);
  store.pickSlot(slot);
  t += DRAFT_TTL_MS + 1;
  assert.throws(() => store.confirmPayload("评审"), /过期/);
});

test("updateSlot can retarget time after picking an issued slot", () => {
  const store = createDraftStore();
  store.issueFromRooms([{ slots: [slot] }]);
  store.pickSlot(slot);
  const next = store.updateSlot({ start: "15:00", end: "16:30", date: "2026-09-16" });
  assert.equal(next.slot.roomId, "r1");
  assert.equal(next.slot.start, "15:00");
  assert.equal(next.slot.end, "16:30");
  assert.equal(next.slot.date, "2026-09-16");
  const payload = store.confirmPayload("评审");
  assert.equal(payload.slot.start, "15:00");
  assert.equal(payload.slot.end, "16:30");
});

test("updateSlot rejects inverted range", () => {
  const store = createDraftStore();
  store.issueFromRooms([{ slots: [slot] }]);
  store.pickSlot(slot);
  assert.throws(() => store.updateSlot({ start: "16:00", end: "15:00" }), /结束时间/);
});
