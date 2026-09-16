import assert from "node:assert/strict";
import { test } from "vitest";
import { cardsFromLoop } from "../cardsFromLoop.js";

const rooms = [
  {
    roomId: "r1",
    roomName: "星海",
    slots: [{ roomId: "r1", date: "2026-09-15", start: "14:00", end: "15:00" }]
  }
];

test("search with slots becomes query; answer is heading", () => {
  const event = cardsFromLoop({
    answer: "今天下午这些档可以",
    log: [
      {
        name: "search_availability",
        output: JSON.stringify({ heading: "工具标题", rooms })
      }
    ]
  });
  assert.equal(event.type, "query");
  assert.equal(event.heading, "今天下午这些档可以");
  assert.equal(event.rooms[0].roomId, "r1");
});

test("unique preferred start becomes confirm with title", () => {
  const event = cardsFromLoop({
    prompt: "今天下午3点订一小时面试",
    answer: "可以订这间",
    log: [
      {
        name: "search_availability",
        output: JSON.stringify({
          start: "15:00",
          title: "面试",
          rooms: [
            {
              roomId: "r1",
              roomName: "星海",
              slots: [
                {
                  roomId: "r1",
                  date: "2026-09-15",
                  start: "15:00",
                  end: "16:00"
                }
              ]
            }
          ]
        })
      }
    ]
  });
  assert.equal(event.type, "confirm");
  assert.equal(event.slot.start, "15:00");
  assert.equal(event.slot.roomId, "r1");
  assert.equal(event.title, "面试");
  assert.equal(event.rooms.length, 1);
});

test("two rooms at the same start stay query", () => {
  const event = cardsFromLoop({
    log: [
      {
        name: "search_availability",
        output: JSON.stringify({
          start: "15:00",
          rooms: [
            {
              roomId: "r1",
              slots: [
                {
                  roomId: "r1",
                  date: "2026-09-15",
                  start: "15:00",
                  end: "16:00"
                }
              ]
            },
            {
              roomId: "r2",
              slots: [
                {
                  roomId: "r2",
                  date: "2026-09-15",
                  start: "15:00",
                  end: "16:00"
                }
              ]
            }
          ]
        })
      }
    ]
  });
  assert.equal(event.type, "query");
});

test("search with no slots is need_more", () => {
  const event = cardsFromLoop({
    log: [
      { name: "search_availability", output: JSON.stringify({ rooms: [] }) }
    ]
  });
  assert.equal(event.type, "need_more");
  assert.equal(event.text, "没有符合条件的空档");
});

test("list_my_meetings maps bookings; empty is need_more", () => {
  const hit = cardsFromLoop({
    answer: "今天有一场",
    log: [
      {
        name: "list_my_meetings",
        output: JSON.stringify({
          bookings: [
            {
              id: "b1",
              title: "周会",
              roomName: "星海",
              date: "2026-09-15",
              start: "16:00",
              end: "17:00"
            }
          ]
        })
      }
    ]
  });
  assert.equal(hit.type, "mine");
  assert.equal(hit.bookings[0].id, "b1");
  assert.equal(hit.text, "今天有一场");

  const empty = cardsFromLoop({
    log: [
      { name: "list_my_meetings", output: JSON.stringify({ bookings: [] }) }
    ]
  });
  assert.equal(empty.type, "need_more");
});

test("prepare_release maps confirm or need_more", () => {
  const hit = cardsFromLoop({
    log: [
      {
        name: "prepare_release",
        output: JSON.stringify({
          booking: {
            id: "bk-1",
            title: "周会",
            roomName: "星海",
            date: "2026-09-15",
            start: "16:00",
            end: "17:00"
          }
        })
      }
    ]
  });
  assert.equal(hit.type, "release_confirm");
  assert.equal(hit.booking.id, "bk-1");

  const miss = cardsFromLoop({
    log: [
      {
        name: "prepare_release",
        output: JSON.stringify({ booking: null, reason: "没有可取消的预定" })
      }
    ]
  });
  assert.equal(miss.type, "need_more");
});
