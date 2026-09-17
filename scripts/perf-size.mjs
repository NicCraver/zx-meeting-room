#!/usr/bin/env node
/**
 * 会议室前端首屏体积度量。
 *
 * 首屏 eager 资源的判定依据：构建产物 index.html 的 <head> 里 Vite 注入的
 * entry script + modulepreload + stylesheet —— 这三类就是浏览器在首屏必须
 * 下载的东西，路由懒加载 chunk 不在其中。
 *
 * 用法：
 *   node scripts/perf-size.mjs                        打印三入口表格
 *   node scripts/perf-size.mjs --json perf/base.json  存快照
 *   node scripts/perf-size.mjs --compare perf/base.json  与快照比差值
 */
import fs from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";

const ROOT = path.resolve(import.meta.dirname, "..");
const BASE = "/ai-meet/";

const ENTRIES = [
  { name: "main", dist: "dist_main", html: "index.html" },
  { name: "zx", dist: "dist_zx", html: "zx/index.html" },
  { name: "m", dist: "dist_m", html: "m/index.html" }
];

/** 从产物 index.html 里取首屏 eager 资源的磁盘路径 */
const eagerFiles = (dist, htmlRel) => {
  const htmlPath = path.join(ROOT, dist, htmlRel);
  const html = fs.readFileSync(htmlPath, "utf8");
  const patterns = [
    /<script[^>]*type="module"[^>]*src="([^"]+)"/g,
    /<link[^>]*rel="modulepreload"[^>]*href="([^"]+)"/g,
    /<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g
  ];
  const urls = [];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(html)) !== null) urls.push(m[1]);
  }
  // href 是部署 base 下的绝对路径（/ai-meet/assets/x.js），映射回 dist 目录
  return [htmlPath].concat(
    urls.map((u) => path.join(ROOT, dist, u.replace(BASE, "")))
  );
};

/** 递归统计目录总字节 */
const dirSize = (dir) => {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    total += entry.isDirectory() ? dirSize(full) : fs.statSync(full).size;
  }
  return total;
};

const measure = () => {
  const entries = {};
  for (const { name, dist, html } of ENTRIES) {
    const distDir = path.join(ROOT, dist);
    if (!fs.existsSync(distDir)) {
      console.warn(`跳过 ${name}：${dist} 不存在，先跑对应的 build 命令`);
      continue;
    }
    const files = eagerFiles(dist, html).map((file) => {
      const buf = fs.readFileSync(file);
      return {
        file: path.relative(distDir, file),
        raw: buf.length,
        gzip: gzipSync(buf).length
      };
    });
    entries[name] = {
      eagerRaw: files.reduce((s, f) => s + f.raw, 0),
      eagerGzip: files.reduce((s, f) => s + f.gzip, 0),
      totalRaw: dirSize(distDir),
      files
    };
  }
  return { generatedAt: new Date().toISOString(), entries };
};

const kb = (n) => `${(n / 1024).toFixed(2)} KB`;
const delta = (now, before) => {
  const d = now - before;
  const pct = before === 0 ? 0 : (d / before) * 100;
  return `${d >= 0 ? "+" : ""}${(d / 1024).toFixed(2)} KB (${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%)`;
};

const print = (report) => {
  for (const [name, e] of Object.entries(report.entries)) {
    console.log(`\n【${name}】首屏 eager ${kb(e.eagerRaw)} / gzip ${kb(e.eagerGzip)}｜产物总计 ${kb(e.totalRaw)}`);
    for (const f of e.files) {
      console.log(`  ${f.file.padEnd(42)} ${kb(f.raw).padStart(10)}  gzip ${kb(f.gzip)}`);
    }
  }
};

const printCompare = (report, baseline) => {
  console.log("\n入口      首屏 raw 变化              首屏 gzip 变化");
  for (const [name, e] of Object.entries(report.entries)) {
    const b = baseline.entries[name];
    if (!b) {
      console.log(`${name.padEnd(9)} 基线无该入口`);
      continue;
    }
    console.log(
      `${name.padEnd(9)} ${delta(e.eagerRaw, b.eagerRaw).padEnd(26)} ${delta(e.eagerGzip, b.eagerGzip)}`
    );
  }
};

const args = process.argv.slice(2);
const jsonIdx = args.indexOf("--json");
const cmpIdx = args.indexOf("--compare");
const report = measure();

print(report);

if (jsonIdx !== -1) {
  const out = path.resolve(ROOT, args[jsonIdx + 1]);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`\n快照已写入 ${path.relative(ROOT, out)}`);
}

if (cmpIdx !== -1) {
  const baseline = JSON.parse(
    fs.readFileSync(path.resolve(ROOT, args[cmpIdx + 1]), "utf8")
  );
  printCompare(report, baseline);
}
