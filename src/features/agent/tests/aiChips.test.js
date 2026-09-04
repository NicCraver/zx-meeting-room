import assert from "node:assert/strict";
import { test } from "vitest";
import {
  AI_PLACEHOLDER,
  AI_PLACEHOLDERS,
  nextPlaceholderIndex
} from "../aiChips.js";

test("placeholder list rotates and keeps the first line as default", () => {
  assert.equal(AI_PLACEHOLDERS.length >= 2, true);
  assert.equal(AI_PLACEHOLDER, AI_PLACEHOLDERS[0]);
  assert.equal(nextPlaceholderIndex(0), 1);
  assert.equal(nextPlaceholderIndex(AI_PLACEHOLDERS.length - 1), 0);
});
