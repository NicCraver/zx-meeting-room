import { test } from "vitest";
import assert from "node:assert/strict";
import {
  capacityError,
  locationDescError,
  openHoursError,
  roomNameError
} from "../roomFormRules.js";

test("名称必填且不超过 30 字", () => {
  assert.equal(roomNameError(""), "请输入名称");
  assert.equal(roomNameError("  "), "请输入名称");
  assert.equal(roomNameError("啊".repeat(31)), "名称不超过 30 个字");
  assert.equal(roomNameError("星海"), "");
});

test("位置描述不超过 50 字", () => {
  assert.equal(locationDescError(""), "");
  assert.equal(locationDescError("x".repeat(51)), "位置描述不超过 50 个字");
});

test("人数 1-999 整数", () => {
  assert.equal(capacityError(null), "请输入容纳人数（1-999整数）");
  assert.equal(capacityError(1.5), "请输入容纳人数（1-999整数）");
  assert.equal(capacityError(0), "请输入容纳人数（1-999整数）");
  assert.equal(capacityError(8), "");
});

test("开放时间结束必须晚于开始", () => {
  assert.equal(openHoursError("", "18:00"), "请选择开放时间");
  assert.equal(openHoursError("18:00", "18:00"), "结束时间必须晚于开始时间");
  assert.equal(openHoursError("07:00", "23:00"), "");
});
