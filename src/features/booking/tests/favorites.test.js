import { test } from "vitest";
import assert from "node:assert/strict";
import {
  applyFavorite,
  compareRooms,
  favoriteLabel,
  roomTier,
  sortRooms
} from "../favorites.js";

const room = (id, name, over = {}) => ({
  id,
  name,
  buildingName: "奥城",
  floorName: "4层",
  favorite: false,
  frequent: false,
  ...over
});

test("档位：收藏 0、常用 1、其余 2；收藏优先于常用", () => {
  assert.equal(roomTier(room("1", "A", { favorite: true })), 0);
  assert.equal(roomTier(room("2", "B", { frequent: true })), 1);
  assert.equal(roomTier(room("3", "C")), 2);
  assert.equal(
    roomTier(room("4", "D", { favorite: true, frequent: true })),
    0,
    "既收藏又常用时算收藏档"
  );
  assert.equal(roomTier(null), 2);
});

test("收藏排最前，常用次之，其余在后", () => {
  const list = [
    room("1", "阿尔法"),
    room("2", "明月", { favorite: true }),
    room("3", "白鹭"),
    room("4", "长风", { frequent: true })
  ];
  assert.deepEqual(
    sortRooms(list).map((r) => r.id),
    ["2", "4", "1", "3"]
  );
});

test("同档位保留后端给的顺序，不本地再排中文", () => {
  // 后端（Java Collator）把 A401 排在汉字名前面，JS localeCompare 正好相反，
  // 所以同档位一律不重排，原样保留。
  const list = [room("1", "A401"), room("2", "常用验证室")];
  assert.deepEqual(
    sortRooms(list).map((r) => r.name),
    ["A401", "常用验证室"]
  );
  assert.equal(compareRooms(list[0], list[1]), 0);
});

test("sortRooms 不原地改入参", () => {
  const list = [room("1", "白鹭"), room("2", "阿尔法", { favorite: true })];
  const out = sortRooms(list);
  assert.equal(list[0].id, "1");
  assert.notEqual(out, list);
});

test("compareRooms 对空值不炸", () => {
  assert.equal(typeof compareRooms({}, {}), "number");
  assert.equal(typeof compareRooms(null, undefined), "number");
});

test("applyFavorite 置位并挪档，且不改原对象", () => {
  const list = [room("1", "阿尔法"), room("2", "明月")];
  const out = applyFavorite(list, "2", true);
  assert.deepEqual(
    out.map((r) => r.id),
    ["2", "1"]
  );
  assert.equal(out.find((r) => r.id === "2").favorite, true);
  assert.equal(list[1].favorite, false);
});

test("取消收藏后掉回常用档，不是掉到最后", () => {
  const list = [
    room("2", "明月", { favorite: true, frequent: true }),
    room("1", "阿尔法")
  ];
  const out = applyFavorite(list, "2", false);
  assert.deepEqual(
    out.map((r) => r.id),
    ["2", "1"],
    "仍是常用，排在普通房间前"
  );
  assert.equal(out[0].frequent, true, "收藏变化不该动常用标记");
});

test("取消收藏且不常用时掉到普通档", () => {
  const list = [room("2", "明月", { favorite: true }), room("1", "阿尔法")];
  const out = applyFavorite(list, "2", false);
  assert.deepEqual(
    out.map((r) => r.id),
    ["2", "1"],
    "同为普通档时保留原顺序"
  );
  assert.equal(roomTier(out[0]), 2);
});

test("applyFavorite 遇到未知 id 原样返回", () => {
  const list = [room("1", "阿尔法")];
  const out = applyFavorite(list, "nope", true);
  assert.deepEqual(
    out.map((r) => r.id),
    ["1"]
  );
  assert.equal(out[0].favorite, false);
});

test("favoriteLabel 说的是收藏，不是常用", () => {
  assert.equal(favoriteLabel(room("1", "A401")), "收藏 A401");
  assert.equal(
    favoriteLabel(room("1", "A401", { favorite: true })),
    "取消收藏 A401"
  );
});
