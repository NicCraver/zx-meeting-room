import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:6273";

export default defineConfig({
  testDir: "./e2e/live",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL,
    locale: "zh-CN",
    timezoneId: "Asia/Shanghai",
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  webServer: {
    command: "pnpm dev",
    url: `${baseURL}/ai-meet/`,
    reuseExistingServer: true,
    timeout: 120_000
  },
  projects: [
    {
      name: "live",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 }
      }
    }
  ]
});
