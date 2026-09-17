import { expect, test } from "@playwright/test";
import { openMeeting, waitMobileBoard } from "../helpers/open.js";
import { expectFitsViewport } from "../helpers/expect.js";
import { tid } from "../locators.js";

test.describe("移动助手 FAB", () => {
  test("FAB 打开后能查空档", async ({ page }) => {
    await openMeeting(page, { path: "/ai-meet/m/" });
    await waitMobileBoard(page);
    await tid(page, "mr-buddy-fab").click();
    await page.getByPlaceholder("告诉我时间和人数，帮你找会议室").fill("帮我找空闲会议室");
    await page.keyboard.press("Enter");
    await expect(tid(page, "mr-ai-query-card")).toBeVisible({ timeout: 15_000 });
  });

  test("多房间 query 卡不超出视口", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 700 });
    await openMeeting(page, { path: "/ai-meet/m/" });
    await waitMobileBoard(page);
    await tid(page, "mr-buddy-fab").click();
    await page
      .getByPlaceholder("告诉我时间和人数，帮你找会议室")
      .fill("很多空闲会议室");
    await page.keyboard.press("Enter");
    await expect(tid(page, "mr-ai-query-card")).toBeVisible({ timeout: 15_000 });
    await expectFitsViewport(page.locator(".ai-buddy-dock"), page);
  });
});
