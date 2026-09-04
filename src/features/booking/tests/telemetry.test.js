import assert from "node:assert/strict";
import { test } from "vitest";
import {
  isAllowedEvent,
  sanitizeProps,
  TELEMETRY_EVENT_NAMES
} from "../telemetry.js";

test("白名单包含看板与助手事件", () => {
  assert.equal(isAllowedEvent("page_view"), true);
  assert.equal(isAllowedEvent("agent_booked"), true);
  assert.equal(isAllowedEvent("foo_bar"), false);
  assert.ok(TELEMETRY_EVENT_NAMES.has("agent_chip"));
});

test("agent_message 丢掉原文只留 len", () => {
  const out = sanitizeProps("agent_message", {
    text: "帮我订一间会议室",
    message: "secret",
    len: 8,
    sessionId: "s1"
  });
  assert.equal(out.text, undefined);
  assert.equal(out.message, undefined);
  assert.equal(out.len, 8);
  assert.equal(out.sessionId, "s1");
});

test("其它事件也会剥掉 text/message", () => {
  const out = sanitizeProps("agent_chip", {
    chipId: "find-free",
    text: "不该出现"
  });
  assert.equal(out.chipId, "find-free");
  assert.equal(out.text, undefined);
});
