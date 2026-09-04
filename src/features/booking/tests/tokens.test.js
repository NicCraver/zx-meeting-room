import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "vitest";
import { fileURLToPath } from "node:url";

const css = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../../../styles/tokens.css"),
  "utf8"
);

test("--zx-color-primary is the source of truth", () => {
  assert.match(css, /--zx-color-primary:\s*#3e7eff/i);
});

test("--color-primary aliases --zx-color-primary", () => {
  assert.match(css, /--color-primary:\s*var\(--zx-color-primary\)/);
});

test("--spacing-md aliases --zx-space-md", () => {
  assert.match(css, /--spacing-md:\s*var\(--zx-space-md\)/);
});

test("--radius-sm aliases --zx-rounded-sm", () => {
  assert.match(css, /--radius-sm:\s*var\(--zx-rounded-sm\)/);
});
