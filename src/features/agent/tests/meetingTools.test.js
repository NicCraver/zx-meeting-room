import assert from "node:assert/strict";
import { test } from "vitest";
import { runAgentTool } from "../runTool.js";
import { runListMyMeetingsTool } from "../tools/listMyMeetings.js";
import { runPrepareReleaseTool } from "../tools/prepareRelease.js";
import { runSearchAvailabilityTool } from "../tools/searchAvailability.js";
import { MEETING_TOOLS } from "../tools/meetingTools.js";

const rooms = [
  {
    id: "r1",
    name: "星海",
    buildingName: "奥城",
    floorName: "3F",
    capacity: 8,
    facilities: ["投影"],
    openStart: "09:00",
    openEnd: "18:00",
    busyEvents: [{ start: "10:00", end: "12:00" }]
  }
];

test("meeting tool table has no create or release", () => {
  const names = MEETING_TOOLS.map((t) => t.name);
  assert.deepEqual(names, [
    "search_availability",
    "list_my_meetings",
    "prepare_release"
  ]);
});

test("search skips occupied half-open interval and missing date does not hit board", async () => {
  let boardCalls = 0;
  const getBoard = async () => {
    boardCalls += 1;
    return { rooms };
  };
  const missing = JSON.parse(
    await runSearchAvailabilityTool("{}", { getBoard })
  );
  assert.equal(boardCalls, 0);
  assert.equal(missing.error, "缺少日期 date");
  assert.deepEqual(missing.rooms, []);

  const found = JSON.parse(
    await runSearchAvailabilityTool(
      { date: "2026-08-27", durationMin: 60 },
      { getBoard, now: { date: "2026-08-27", minute: 9 * 60 } }
    )
  );
  assert.equal(boardCalls, 1);
  const ranges = found.rooms[0].slots.map((s) => `${s.start}-${s.end}`);
  assert.equal(ranges.includes("10:00-11:00"), false);
  assert.equal(ranges.includes("11:00-12:00"), false);
  assert.equal(ranges.includes("12:00-13:00"), true);
});

test("list_my_meetings drops released and can filter date", async () => {
  const listMyBookings = async () => [
    {
      id: "a",
      date: "2026-09-15",
      start: "10:00",
      end: "11:00",
      title: "A",
      roomName: "星海",
      status: "upcoming",
      remark: "议程：周进度"
    },
    {
      id: "b",
      date: "2026-09-15",
      start: "16:00",
      end: "17:00",
      title: "B",
      roomName: "星海",
      status: "released"
    },
    {
      id: "c",
      date: "2026-09-16",
      start: "09:00",
      end: "10:00",
      title: "C",
      roomName: "明月",
      status: "upcoming"
    }
  ];
  const all = JSON.parse(await runListMyMeetingsTool({}, { listMyBookings }));
  assert.deepEqual(
    all.bookings.map((b) => b.id),
    ["a", "c"]
  );
  const today = JSON.parse(
    await runListMyMeetingsTool({ date: "2026-09-15" }, { listMyBookings })
  );
  assert.deepEqual(
    today.bookings.map((b) => b.id),
    ["a"]
  );
  assert.equal(today.bookings[0].remark, "议程：周进度");
});

test("search start and title are echoed and pin 15:00", async () => {
  const found = JSON.parse(
    await runSearchAvailabilityTool(
      {
        date: "2026-08-27",
        durationMin: 60,
        start: "15:00",
        title: "面试"
      },
      {
        getBoard: async () => ({ rooms }),
        now: { date: "2026-08-27", minute: 9 * 60 }
      }
    )
  );
  assert.equal(found.start, "15:00");
  assert.equal(found.title, "面试");
  assert.equal(found.rooms[0].slots[0].start, "15:00");
  assert.equal(found.rooms[0].slots[0].end, "16:00");
});

test("search point window 15:00 and capacity miss still returns hint", async () => {
  const getBoard = async () => ({ rooms });
  const now = { date: "2026-08-27", minute: 9 * 60 };
  const point = JSON.parse(
    await runSearchAvailabilityTool(
      {
        date: "2026-08-27",
        durationMin: 60,
        windowStart: "15:00",
        windowEnd: "15:00"
      },
      { getBoard, now }
    )
  );
  assert.equal(point.rooms.length > 0, true);
  assert.equal(point.rooms[0].slots[0].start, "15:00");

  const miss = JSON.parse(
    await runSearchAvailabilityTool(
      {
        date: "2026-08-27",
        durationMin: 60,
        windowStart: "15:00",
        windowEnd: "16:00",
        capacity: 99
      },
      { getBoard, now }
    )
  );
  assert.deepEqual(miss.rooms, []);
  assert.match(String(miss.hint || ""), /空闲/);
});

test("runAgentTool dispatches search_availability through shipped runner", async () => {
  let boardCalls = 0;
  const output = JSON.parse(
    await runAgentTool(
      {
        name: "search_availability",
        arguments: '{"date":"2026-08-27"}',
        callId: "c1"
      },
      {
        getBoard: async () => {
          boardCalls += 1;
          return { rooms };
        },
        now: { date: "2026-08-27", minute: 9 * 60 }
      }
    )
  );
  assert.equal(boardCalls, 1);
  assert.ok(output.rooms[0].slots.length);
});

test("prepare_release picks nearest upcoming and does not release", async () => {
  let released = false;
  const listMyBookings = async () => [
    {
      id: "ended",
      date: "2026-09-14",
      start: "14:00",
      end: "15:00",
      title: "昨",
      roomName: "明月",
      status: "ended"
    },
    {
      id: "later",
      date: "2026-09-15",
      start: "16:00",
      end: "17:00",
      title: "周会",
      roomName: "星海",
      status: "upcoming"
    },
    {
      id: "soon",
      date: "2026-09-15",
      start: "11:00",
      end: "12:00",
      title: "午会",
      roomName: "星海",
      status: "upcoming"
    }
  ];
  const hit = JSON.parse(
    await runPrepareReleaseTool(
      {},
      {
        listMyBookings,
        todayIso: "2026-09-15",
        releaseBooking: async () => {
          released = true;
        }
      }
    )
  );
  assert.equal(hit.booking.id, "soon");
  assert.equal(released, false);

  const empty = JSON.parse(
    await runPrepareReleaseTool(
      {},
      { listMyBookings: async () => [], todayIso: "2026-09-15" }
    )
  );
  assert.equal(empty.booking, null);
});
