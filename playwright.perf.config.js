import { defineConfig, devices } from "@playwright/test";

// 性能度量打的是构建产物（vite preview 服务 dist/），
// 端口避开 dev server 的 6273；不挂 globalSetup，因为不依赖 contact Java。
const baseURL = "http://127.0.0.1:6274";

export default defineConfig({
  testDir: "./e2e-perf",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    baseURL,
    locale: "zh-CN",
    timezoneId: "Asia/Shanghai"
  },
  webServer: {
    // vite.config.js 在非 development 模式下会把 outDir 覆盖成 `dist_${buildTarget}`
    // （单入口产物，构建时按 BUILD_TARGET 分别输出）。不加 --outDir dist 的话，
    // vite preview 默认服务的是 dist_main，里面没有 zx/ m 子目录，
    // 对 /ai-meet/zx/ 和 /ai-meet/m/ 的请求会被 SPA fallback 到 main 的 index.html，
    // 导致三个入口测出一模一样的数字。必须显式指向 mergeDist.js 合并后的 dist/。
    command: "pnpm exec vite preview --outDir dist --port 6274 --strictPort",
    url: `${baseURL}/ai-meet/`,
    reuseExistingServer: true,
    timeout: 120_000
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }
    }
  ]
});
