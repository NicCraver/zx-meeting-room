import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

/**
 * 三入口首屏加载打点。接口一律用空信封兜住，
 * 保证不依赖 contact Java、且每次跑的网络条件一致。
 */
const ENTRIES = [
  { name: "main", url: "/ai-meet/" },
  { name: "zx", url: "/ai-meet/zx/" },
  { name: "m", url: "/ai-meet/m/" }
];

const results = {};

test.describe("首屏加载打点", () => {
  for (const entry of ENTRIES) {
    test(`${entry.name} 入口`, async ({ page }) => {
      const requests = [];

      await page.route("**/meetingApi/**", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ code: "M0000", data: null, msg: "ok" })
        })
      );

      page.on("requestfinished", async (req) => {
        const sizes = await req.sizes().catch(() => null);
        requests.push({
          url: req.url(),
          bytes: sizes ? sizes.responseBodySize : 0
        });
      });

      // #app 出现第一个子节点 = Vue 挂载完成，比 load 更贴近「用户看到东西」
      await page.addInitScript(() => {
        window.__appFirstPaint = null;
        const observer = new MutationObserver(() => {
          const app = document.querySelector("#app");
          if (app && app.childElementCount > 0) {
            window.__appFirstPaint = performance.now();
            observer.disconnect();
          }
        });
        // 注意：这里必须 observe(document) 而不是 document.documentElement——
        // addInitScript 的脚本在 document start 阶段执行，此时 <html> 元素
        // 尚未被解析器创建，observe(document.documentElement) 会因参数不是
        // Node 而抛异常，导致 observer 从未真正挂上、appFirstPaint 恒为 null。
        observer.observe(document, {
          childList: true,
          subtree: true
        });
      });

      await page.goto(entry.url, { waitUntil: "load" });
      await page.waitForTimeout(1000);

      const timing = await page.evaluate(() => {
        const nav = performance.getEntriesByType("navigation")[0];
        const fcp = performance.getEntriesByName("first-contentful-paint")[0];
        return {
          domContentLoaded: nav ? nav.domContentLoadedEventEnd : null,
          load: nav ? nav.loadEventEnd : null,
          fcp: fcp ? fcp.startTime : null,
          appFirstPaint: window.__appFirstPaint
        };
      });

      // 只统计站内静态资源，排除被 mock 的接口
      const staticRequests = requests.filter(
        (r) => r.url.includes("/ai-meet/") && !r.url.includes("/meetingApi/")
      );

      results[entry.name] = {
        requests: staticRequests.length,
        transferBytes: staticRequests.reduce((s, r) => s + r.bytes, 0),
        ...timing
      };

      console.log(`【${entry.name}】`, results[entry.name]);

      // 兜底断言：页面确实加载起来了，指标才有意义
      expect(staticRequests.length).toBeGreaterThan(0);
      expect(timing.appFirstPaint).not.toBeNull();
    });
  }

  test.afterAll(() => {
    // 三个入口必须全部拿到数据才落盘：只要有一个 spec 失败，写出去的就是一份
    // 看着完整、其实缺一角的假快照——比不写更危险，宁可不写。
    if (Object.keys(results).length !== ENTRIES.length) {
      console.warn(
        `[perf:e2e] 只拿到 ${Object.keys(results).length}/${ENTRIES.length} 个入口的数据，跳过写快照`
      );
      return;
    }
    // 默认写去 gitignored 的临时路径，不动仓库里追踪的 perf/e2e-baseline.json /
    // perf/e2e-after.json——那两份是里程碑快照，日常跑 pnpm perf:e2e 不该覆盖它们。
    const out = path.resolve(import.meta.dirname, "../perf/.last/e2e.json");
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(
      out,
      `${JSON.stringify({ generatedAt: new Date().toISOString(), entries: results }, null, 2)}\n`
    );
    console.log(`性能快照已写入 ${out}`);
  });
});
