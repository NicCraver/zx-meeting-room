import { test } from "vitest";
import assert from "node:assert/strict";
import {
  applyFavorite,
  compareRooms,
  favoriteLabel,
  sortRooms
} from "../favorites.js";

const room = (id, name, over = {}) => ({
  id,
  name,
  buildingName: "奥城",
  floorName: "4层",
  favorite: false,
  ...over
});

test("常用排在最前，其余仍按楼宇→楼层→名称中文排序", () => {
  const list = [
    room("1", "阿尔法"),
    room("2", "明月", { favorite: true }),
    room("3", "白鹭", { buildingName: "北楼" })
  ];
  assert.deepEqual(
    sortRooms(list).map((r) => r.id),
    ["2", "1", "3"]
  );
});

test("同为常用时不打乱原有中文排序", () => {
  const list = [
    room("1", "白鹭", { favorite: true }),
    room("2", "阿尔法", { favorite: true })
  ];
  assert.deepEqual(
    sortRooms(list).map((r) => r.name),
    ["阿尔法", "白鹭"]
  );
});

test("sortRooms 不原地改入参", () => {
  const list = [room("1", "白鹭"), room("2", "阿尔法")];
  const out = sortRooms(list);
  assert.equal(list[0].id, "1");
  assert.notEqual(out, list);
});

test("compareRooms 对空字段不炸", () => {
  assert.equal(typeof compareRooms({}, {}), "number");
  assert.equal(typeof compareRooms(null, undefined), "number");
});

test("applyFavorite 置位并重排，且不改原对象", () => {
  const list = [room("1", "阿尔法"), room("2", "明月")];
  const out = applyFavorite(list, "2", true);
  assert.deepEqual(
    out.map((r) => r.id),
    ["2", "1"]
  );
  assert.equal(out.find((r) => r.id === "2").favorite, true);
  assert.equal(list[1].favorite, false);
});

test("applyFavorite 取消收藏会掉回中文排序位置", () => {
  const list = [room("2", "明月", { favorite: true }), room("1", "阿尔法")];
  const out = applyFavorite(list, "2", false);
  assert.deepEqual(
    out.map((r) => r.id),
    ["1", "2"]
  );
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

test("favoriteLabel 按当前状态给反向动作", () => {
  assert.equal(favoriteLabel(room("1", "A401")), "标为常用 A401");
  assert.equal(
    favoriteLabel(room("1", "A401", { favorite: true })),
    "取消常用 A401"
  );
});
