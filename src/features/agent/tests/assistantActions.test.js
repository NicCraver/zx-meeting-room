import assert from "node:assert/strict";
import { test } from "vitest";
import {
  confirmBookingAction,
  confirmReleaseAction
} from "../assistantActions.js";

const slot = {
  roomId: "r1",
  roomName: "星海",
  date: "2026-09-15",
  start: "14:00",
  end: "15:00"
};

test("confirmBookingAction createBooking then booked", async () => {
  const event = await confirmBookingAction({ draftId: "d1", slot }, "评审会", {
    createBooking: async (payload) => ({ id: "bk-1", ...payload })
  });
  assert.equal(event.type, "booked");
  assert.equal(event.bookingId, "bk-1");
  assert.equal(event.title, "评审会");
  assert.equal(event.slot.roomId, "r1");
});

test("confirmBookingAction M4010 becomes suggest from board slots", async () => {
  const event = await confirmBookingAction({ draftId: "d1", slot }, "评审会", {
    createBooking: async () => {
      throw Object.assign(new Error("占用"), {
        code: "M4010",
        msg: "该时段已被占用"
      });
    },
    now: { date: "2026-09-15", minute: 9 * 60 },
    getBoard: async () => ({
      rooms: [
        {
          id: "r2",
          name: "明月",
          buildingName: "A",
          floorName: "5F",
          capacity: 12,
          facilities: [],
          openStart: "09:00",
          openEnd: "18:00",
          busyEvents: []
        }
      ]
    })
  });
  assert.equal(event.type, "suggest");
  assert.ok(event.options.length >= 1);
  assert.equal(event.options[0].roomId, "r2");
});

test("confirmReleaseAction only then calls release", async () => {
  const ids = [];
  const event = await confirmReleaseAction(
    {
      id: "bk-mine-pm",
      title: "我的周会",
      roomName: "星海",
      date: "2026-09-15",
      start: "16:00",
      end: "17:00"
    },
    { releaseBooking: async (id) => ids.push(id) }
  );
  assert.deepEqual(ids, ["bk-mine-pm"]);
  assert.equal(event.type, "booked");
  assert.match(event.title, /已释放/);
});
