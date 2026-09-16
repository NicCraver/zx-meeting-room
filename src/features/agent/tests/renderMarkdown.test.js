import assert from "node:assert/strict";
import { test } from "vitest";
import { renderMarkdown } from "../renderMarkdown.js";

test("renders bold and lists", () => {
  const html = renderMarkdown(
    "明天上午可容纳 10 人的大会议室有：\n\n**奥城 4层 A401**（10人，电视/白板）\n\n可选时段：\n- 09:00–10:00\n- 09:30–10:30"
  );
  assert.match(html, /<strong>奥城 4层 A401<\/strong>/);
  assert.match(html, /<ul>/);
  assert.match(html, /<li>09:00–10:00<\/li>/);
});

test("drops raw html", () => {
  const html = renderMarkdown('hi <script>alert(1)</script> **x**');
  assert.doesNotMatch(html, /<script>/i);
  assert.match(html, /<strong>x<\/strong>/);
});

test("empty input is empty string", () => {
  assert.equal(renderMarkdown(""), "");
  assert.equal(renderMarkdown(null), "");
});
