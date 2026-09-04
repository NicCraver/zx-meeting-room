import { expect, test } from "@playwright/test";
import { openMeeting, waitMobileBoard } from "./helpers.js";

test.describe("移动端看板", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("m 入口加载房间列表与更多菜单", async ({ page }) => {
    await openMeeting(page, "/meeting/m/");
    await waitMobileBoard(page);
    await expect(page.getByPlaceholder("搜索会议室")).toBeVisible();
    await page.getByRole("button", { name: "更多" }).click();
    const mineBtn = page
      .locator(".m-action-sheet")
      .getByRole("button", { name: "我的预定" });
    await expect(mineBtn).toBeInViewport({ timeout: 5_000 });
    await page.getByTestId("mine-open").click();
    await expect(page.locator(".m-action-sheet")).toBeHidden();
    await expect(page.locator(".bookings-dialog")).toBeVisible();
    await expect(page.getByText("加载中…")).toBeHidden({ timeout: 15_000 });
    await expect(page.getByRole("tab", { name: /可操作/ })).toBeVisible();
  });

  test("点房间打开详情", async ({ page }) => {
    await openMeeting(page, "/meeting/m/");
    await waitMobileBoard(page);
    await expect(page.locator(".m-room-card").first()).toBeVisible();
    await page.locator(".m-room-main").first().click();
    await expect(page.getByText("会议室详情")).toBeVisible();
    await expect(page.getByRole("button", { name: "预定该会议室" })).toBeVisible();
  });
});
