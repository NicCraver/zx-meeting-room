import { expect, test } from "@playwright/test";
import { openMeeting, waitMobileBoard } from "../helpers/open.js";
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
});
