import { test } from "vitest";
import assert from "node:assert/strict";
import { formSnapshot, isFormDirty, shouldBlockLeave } from "../dirtyGuard.js";

test("干净表单不脏", () => {
  const form = { name: "星海" };
  const snap = formSnapshot(form);
  assert.equal(isFormDirty(form, snap), false);
});

test("改字段后变脏", () => {
  const form = { name: "星海" };
  const snap = formSnapshot(form);
  form.name = "明月";
  assert.equal(isFormDirty(form, snap), true);
});

test("脏且未提交才拦离开", () => {
  assert.equal(shouldBlockLeave({ dirty: true, submitting: false }), true);
  assert.equal(shouldBlockLeave({ dirty: true, submitting: true }), false);
  assert.equal(shouldBlockLeave({ dirty: false }), false);
});
