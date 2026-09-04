import assert from "node:assert/strict";
import { test } from "vitest";
import { flush } from "../../booking/telemetry.js";
import {
  trackAgentChip,
  trackAgentMessage,
  trackAgentStreamEvent
} from "../telemetry.js";

const lastBatch = async () => {
  const bodies = [];
  globalThis.fetch = async (_url, opts) => {
    bodies.push(JSON.parse(opts.body));
    return { ok: true };
  };
  await flush();
  return bodies[0]?.events || [];
};

test("chip 不上报原文", async () => {
  trackAgentChip({ sessionId: "s1" }, "find-free");
  const events = await lastBatch();
  assert.equal(events[0].eventName, "agent_chip");
  assert.equal(events[0].props.chipId, "find-free");
  assert.equal(events[0].props.sessionId, "s1");
  assert.equal(events[0].props.text, undefined);
});

test("agent_message 只带 len", async () => {
  trackAgentMessage({ sessionId: "s2" }, "帮我订一间会议室");
  const events = await lastBatch();
  assert.equal(events[0].eventName, "agent_message");
  assert.equal(events[0].props.len, 8);
  assert.equal(events[0].props.text, undefined);
});

test("query 结果带 roomCount", async () => {
  trackAgentStreamEvent({ sessionId: "s3" }, { type: "query", rooms: [{}, {}] });
  const events = await lastBatch();
  assert.equal(events[0].eventName, "agent_result");
  assert.equal(events[0].props.kind, "query");
  assert.equal(events[0].props.roomCount, 2);
});

test("booked 不与 booking_submit 混用", async () => {
  trackAgentStreamEvent(
    { sessionId: "s4" },
    { type: "booked", bookingId: "b1" }
  );
  const events = await lastBatch();
  assert.equal(events[0].eventName, "agent_booked");
  assert.equal(events[0].props.bookingId, "b1");
});
