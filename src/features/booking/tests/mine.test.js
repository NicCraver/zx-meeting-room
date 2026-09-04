import assert from "node:assert/strict";
import { test } from "vitest";
import {
  defaultMineTab,
  draftRangeFromMine,
  formatMineAddress,
  formatMineDate,
  formatMinePlace,
  formatMineSlashDate,
  formatMineWhen,
  pickNextReleasable,
  roomFromMine,
  splitMineBookings
} from "../mine.js";

test("pickNextReleasable takes the next upcoming releasable booking", () => {
  const items = [
    { id: "ended", date: "2026-08-30", start: "18:00", status: "ended" },
    { id: "later", date: "2026-09-01", start: "09:00", status: "upcoming" },
    { id: "soon", date: "2026-08-31", start: "19:00", status: "upcoming" }
  ];
  assert.equal(pickNextReleasable(items, "2026-08-31")?.id, "soon");
});

test("pickNextReleasable returns null when nothing can be released", () => {
  assert.equal(
    pickNextReleasable([{ id: "x", status: "released" }], "2026-08-31"),
    null
  );
});

test("splitMineBookings 把可操作和历史分开", () => {
  const split = splitMineBookings([
    { id: "a", status: "upcoming" },
    { id: "b", status: "released" },
    { id: "c", status: "ongoing" },
    { id: "d", status: "ended" }
  ]);
  assert.deepEqual(
    split.live.map((x) => x.id),
    ["a", "c"]
  );
  assert.deepEqual(
    split.past.map((x) => x.id),
    ["b", "d"]
  );
});

test("defaultMineTab 有可操作项时落在 live", () => {
  assert.equal(
    defaultMineTab([{ status: "upcoming" }, { status: "ended" }]),
    "live"
  );
  assert.equal(defaultMineTab([{ status: "released" }]), "past");
  assert.equal(defaultMineTab([]), "past");
});

test("formatMineDate 用月日而不是 ISO", () => {
  assert.equal(formatMineDate("2026-09-04"), "9月4日");
  assert.equal(formatMineDate(""), "");
  assert.equal(formatMineDate("bad"), "bad");
});

test("formatMineSlashDate 用斜杠年月日", () => {
  assert.equal(formatMineSlashDate("2026-09-04"), "2026/09/04");
  assert.equal(formatMineSlashDate(""), "");
});

test("formatMineWhen 拼日期和时段", () => {
  assert.equal(
    formatMineWhen({ date: "2026-09-04", start: "11:00", end: "17:00" }),
    "2026/09/04 11:00 - 17:00"
  );
});

test("formatMineAddress 没楼层就写暂无", () => {
  assert.equal(
    formatMineAddress({ buildingName: "奥城", floorName: "4层" }),
    "奥城 4层"
  );
  assert.equal(formatMineAddress({ buildingName: "", floorName: "" }), "暂无");
});

test("formatMinePlace 空楼层不留下空括号", () => {
  assert.equal(
    formatMinePlace({
      roomName: "A401",
      buildingName: "奥城",
      floorName: "4层"
    }),
    "A401（奥城 4层）"
  );
  assert.equal(
    formatMinePlace({ roomName: "A401", buildingName: "", floorName: "" }),
    "A401"
  );
});

test("draftRangeFromMine 把时段转成分钟稿", () => {
  const draft = draftRangeFromMine({
    date: "2026-09-05",
    start: "10:00",
    end: "11:30"
  });
  assert.equal(draft.start, 10 * 60);
  assert.equal(draft.end, 11 * 60 + 30);
  assert.equal(draft.dateIso, "2026-09-05");
  assert.deepEqual(draft.dates, ["2026-09-05"]);
});

test("roomFromMine 优先用看板里的房间", () => {
  const rooms = [{ id: "r1", name: "实体" }];
  assert.equal(
    roomFromMine({ roomId: "r1", roomName: "列表名" }, rooms).name,
    "实体"
  );
  assert.equal(
    roomFromMine({ roomId: "r2", roomName: "列表名" }, rooms).name,
    "列表名"
  );
});
