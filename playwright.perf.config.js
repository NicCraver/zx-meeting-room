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
    command: "pnpm exec vite preview --port 6274 --strictPort",
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
