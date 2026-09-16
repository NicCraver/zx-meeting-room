import { test } from "vitest";
import assert from "node:assert/strict";
import {
  FORBIDDEN_TOAST,
  ME_FAILED_TOAST,
  MISSING_CORP_TOAST,
  resolveAdminAccess
} from "../adminAccess.js";

test("缺企业", () => {
  const access = resolveAdminAccess({ corpId: "" });
  assert.equal(access.ok, false);
  assert.equal(access.reason, "missing-corp");
  assert.equal(access.toast, MISSING_CORP_TOAST);
});

test("非管理员", () => {
  const access = resolveAdminAccess({
    corpId: "6",
    me: { isAdmin: false }
  });
  assert.equal(access.ok, false);
  assert.equal(access.reason, "forbidden");
  assert.equal(access.toast, FORBIDDEN_TOAST);
});

test("管理员", () => {
  const access = resolveAdminAccess({
    corpId: "6",
    me: { isAdmin: true }
  });
  assert.equal(access.ok, true);
});

test("isAdmin 缺省当非管理员", () => {
  const access = resolveAdminAccess({
    corpId: "6",
    me: { userId: "u1" }
  });
  assert.equal(access.ok, false);
  assert.equal(access.reason, "forbidden");
});

test("/me 失败", () => {
  const access = resolveAdminAccess({
    corpId: "6",
    meError: "网络错误"
  });
  assert.equal(access.ok, false);
  assert.equal(access.reason, "me-failed");
  assert.equal(access.toast, "网络错误");
  assert.equal(ME_FAILED_TOAST, "获取身份失败");
});
