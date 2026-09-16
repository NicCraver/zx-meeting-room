import assert from "node:assert/strict";
import { test } from "vitest";
import { buildMeetingSystemPrompt } from "../systemPrompt.js";

test("system prompt names tools and forbids write claims", () => {
  const text = buildMeetingSystemPrompt({ todayIso: "2026-09-15" });
  assert.match(text, /2026-09-15/);
  assert.match(text, /search_availability/);
  assert.match(text, /list_my_meetings/);
  assert.match(text, /prepare_release/);
  assert.match(text, /禁止声称已经预定成功或已经释放/);
  assert.doesNotMatch(text, /create_booking/);
  assert.doesNotMatch(text, /release_booking/);
  assert.match(text, /15:00/);
  assert.match(text, /24\s*小时/);
});
