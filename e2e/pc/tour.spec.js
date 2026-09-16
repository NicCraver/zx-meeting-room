import { expect, test } from "@playwright/test";
import { openMeeting, waitPcBoard } from "../helpers/open.js";
import { tid } from "../locators.js";

test.describe("新手指引", () => {
  test("首次自动弹出五步锚点", async ({ page }) => {
    await openMeeting(page, { skipTour: false });
    await waitPcBoard(page);
    await expect(page.locator(".driver-popover")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".driver-popover-title")).toContainText("会议室表格");
  });

  test("关闭后写入 localStorage，刷新不再弹", async ({ page }) => {
    await openMeeting(page, { skipTour: false });
    await waitPcBoard(page);
    await expect(page.locator(".driver-popover-close-btn")).toBeVisible({
      timeout: 15_000
    });
    await page.locator(".driver-popover-close-btn").click();
    const seen = await page.evaluate(() => localStorage.getItem("mr_tour_v1"));
    expect(seen).toBe("1");
    await page.reload();
    await waitPcBoard(page);
    await expect(page.locator(".driver-popover")).toHaveCount(0);
  });

  test("问号重播指引", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    await tid(page, "mr-toolbar-tour").click();
    await expect(page.locator(".driver-popover")).toBeVisible();
  });
});
