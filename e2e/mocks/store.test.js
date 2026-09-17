import { test } from "vitest";
import assert from "node:assert/strict";
import { createStore } from "./store.js";
import { TODAY } from "../helpers/clock.js";

test("create booking succeeds and appears on board + mine", () => {
  const store = createStore();
  const created = store.handle("POST", "/bookings/create", {
    query: {},
    body: {
      roomId: "room-b",
      date: TODAY,
      start: "14:00",
      end: "15:00",
      title: "评审"
    }
  });
  assert.equal(created.json.code, "M0000");
  const mine = store.handle("GET", "/bookings/mine", { query: {}, body: {} });
  assert.ok(mine.json.data.some((b) => b.title === "评审"));
  const board = store.handle("GET", "/board", { query: { date: TODAY }, body: {} });
  const roomB = board.json.data.rooms.find((r) => r.id === "room-b");
  assert.ok(roomB.busyEvents.some((e) => e.title === "评审" && e.mine));
});

test("overlapping create returns M4010", () => {
  const store = createStore();
  const res = store.handle("POST", "/bookings/create", {
    query: {},
    body: {
      roomId: "room-a",
      date: TODAY,
      start: "11:00",
      end: "12:00",
      title: "撞车"
    }
  });
  assert.equal(res.json.code, "M4010");
});

test("release moves booking out of live occupancy", () => {
  const store = createStore();
  const res = store.handle("POST", "/bookings/release/bk-mine-pm", {
    query: {},
    body: {}
  });
  assert.equal(res.json.code, "M0000");
  const board = store.handle("GET", "/board", { query: { date: TODAY }, body: {} });
  const roomA = board.json.data.rooms.find((r) => r.id === "room-a");
  assert.equal(
    roomA.busyEvents.some((e) => e.title === "我的周会"),
    false
  );
});

test("staff me is not admin", () => {
  const store = createStore({
    me: { userId: "u-staff", userName: "张伟", dept: "产品", isAdmin: false }
  });
  const me = store.handle("GET", "/me", { query: {}, body: {} });
  assert.equal(me.json.data.isAdmin, false);
});

test("unknown path returns M9999", () => {
  const store = createStore();
  const res = store.handle("GET", "/nope", { query: {}, body: {} });
  assert.equal(res.json.code, "M9999");
});
