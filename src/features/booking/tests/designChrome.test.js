import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "vitest";
import { fileURLToPath } from "node:url";

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const walkVue = (dir, acc = []) => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walkVue(full, acc);
    else if (name.endsWith(".vue")) acc.push(full);
  }
  return acc;
};

const files = [
  ...walkVue(join(srcRoot, "features/admin")),
  ...walkVue(join(srcRoot, "features/booking")),
  ...walkVue(join(srcRoot, "features/agent")),
  ...walkVue(join(srcRoot, "features/race"))
];

const read = (file) => readFileSync(file, "utf8");
const rel = (file) => file.slice(srcRoot.length + 1);

test("admin and booking chrome do not use raw el-button / el-dialog", () => {
  const hits = [];
  for (const file of files) {
    const text = read(file);
    if (/<el-button[\s>]/.test(text) || /<el-dialog[\s>]/.test(text)) {
      hits.push(rel(file));
    }
  }
  assert.deepEqual(hits, []);
});

test("transplanted base components are used for chrome", () => {
  const corpus = files.map(read).join("\n");
  for (const name of [
    "AcButton",
    "AcDialog",
    "XPopup",
    "AcEmpty",
    "MEmpty",
    "NavBarHeader",
    "AcPageLoading",
    "SvgIcon",
    "ZxStatusTag"
  ]) {
    assert.match(corpus, new RegExp(name), `missing ${name}`);
  }
});

test("AcLoadingBar is transplanted for list sentinels", () => {
  assert.equal(
    existsSync(join(srcRoot, "components/base/AcLoadingBar/AcLoadingBar.vue")),
    true
  );
});

test("SvgIcon only ships the referenced icons", () => {
  const svgs = readdirSync(join(srcRoot, "components/base/SvgIcon/svgs"));
  assert.ok(svgs.includes("check.svg"));
  assert.ok(svgs.includes("more-point.svg"));
  assert.ok(svgs.length <= 12);
});
