import assert from "node:assert/strict";
import { test } from "vitest";
import { TODAY, TOMORROW } from "../helpers/clock.js";
import { aiMeetSseFrames } from "./aiMeetSse.js";

test("first gun for 找空闲 is search_availability with today", () => {
  const frames = aiMeetSseFrames({ prompt: "帮我找空闲会议室" });
  assert.equal(frames[0].type, "done");
  assert.equal(frames[0].kind, "tool_call");
  assert.equal(frames[0].toolCalls[0].name, "search_availability");
  assert.equal(JSON.parse(frames[0].toolCalls[0].arguments).date, TODAY);
});

test("second gun with toolResults is kind=text", () => {
  const frames = aiMeetSseFrames({
    prompt: "帮我找空闲会议室",
    toolResults: [{ name: "search_availability", output: "{}" }]
  });
  assert.equal(frames[0].kind, "text");
  assert.equal(frames[0].answer, "这些时段可以");
});

test("error-please emits SSE error", () => {
  const frames = aiMeetSseFrames({ prompt: "error-please" });
  assert.equal(frames[0].type, "error");
  assert.equal(frames[0].msg, "助手暂时不可用");
});

test("cancel and mine chips pick the matching tool", () => {
  const cancel = aiMeetSseFrames({ prompt: "取消我最近的一场会" });
  assert.equal(cancel[0].toolCalls[0].name, "prepare_release");
  const mine = aiMeetSseFrames({ prompt: "我今天有哪些会" });
  assert.equal(mine[0].toolCalls[0].name, "list_my_meetings");
  assert.equal(JSON.parse(mine[0].toolCalls[0].arguments).date, TODAY);
});

test("book large room uses tomorrow morning window", () => {
  const frames = aiMeetSseFrames({ prompt: "帮我订明天上午的大会议室" });
  const args = JSON.parse(frames[0].toolCalls[0].arguments);
  assert.equal(args.date, TOMORROW);
  assert.equal(args.capacity, 10);
  assert.equal(args.windowStart, "09:00");
});
