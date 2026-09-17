/**
 * 守卫：src/ 下所有从 "element-plus" / "vant" 裸标识符具名导入的名字，必须都在
 * 对应端转发 shim（../element-plus.js / ../vant.js）里有导出。m/zx 构建下这两个
 * 裸 specifier 会被 vite.config.js 的 alias 整体接管，shim 里没导出的名字只是
 * rolldown 警告、运行时是 undefined——build / test / test:e2e 都测不到（test:e2e
 * 打的是 dev server，alias 不激活）。
 *
 * 同时守住 zx 裁 vant 真正依赖的不变式（不是靠别名，别名覆盖不到
 * unplugin-vue-components 的 VantResolver 自动导入）：src 里不能出现 `<van-` 模板。
 */
import fs from "node:fs";
import path from "node:path";
import { test, expect } from "vitest";
import * as elementPlusShim from "../element-plus.js";
import * as vantShim from "../vant.js";

const SRC_DIR = path.resolve(import.meta.dirname, "../../../src");

const walk = (dir, files = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(vue|js|ts)$/.test(entry.name)) files.push(full);
  }
  return files;
};

const SRC_FILES = walk(SRC_DIR);

/** [^}]* 天然吃换行，能匹配 dialog.js:3-8 那种多行 import 块 */
const namedImportsFrom = (source, moduleName) => {
  const re = new RegExp(`import\\s*{([^}]*)}\\s*from\\s*["']${moduleName}["']`, "g");
  const names = [];
  let m;
  while ((m = re.exec(source))) {
    for (const part of m[1].split(",")) {
      const name = part.trim().split(/\s+as\s+/)[0].trim();
      if (name) names.push(name);
    }
  }
  return names;
};

const scanMissing = (files, moduleName, shimExports) => {
  const missing = [];
  for (const file of files) {
    const source = fs.readFileSync(file, "utf-8");
    for (const name of namedImportsFrom(source, moduleName)) {
      if (!shimExports.has(name)) missing.push(`${path.relative(SRC_DIR, file)}: ${name}`);
    }
  }
  return missing;
};

test("src/ 里 element-plus 裸 import 的具名导入都在 m 端 shim 里有导出", () => {
  const missing = scanMissing(SRC_FILES, "element-plus", new Set(Object.keys(elementPlusShim)));
  expect(missing).toEqual([]);
});

test("src/ 里 vant 裸 import 的具名导入都在 zx 端 shim 里有导出", () => {
  const missing = scanMissing(SRC_FILES, "vant", new Set(Object.keys(vantShim)));
  expect(missing).toEqual([]);
});

test("src/ 里没有 <van- 模板——这才是 zx 裁 vant 真正依赖的不变式，不是别名保证的", () => {
  const offenders = SRC_FILES.filter((file) =>
    /<van-[a-z]/i.test(fs.readFileSync(file, "utf-8"))
  );
  expect(offenders).toEqual([]);
});
