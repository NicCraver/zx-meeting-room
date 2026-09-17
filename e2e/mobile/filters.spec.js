import { expect, test } from "@playwright/test";
import { openMeeting, waitMobileBoard } from "../helpers/open.js";
import { roomCard, tid } from "../locators.js";

test.describe("移动筛选", () => {
  test("搜索筛房间", async ({ page }) => {
    await openMeeting(page, { path: "/ai-meet/m/" });
    await waitMobileBoard(page);
    await tid(page, "mr-m-search").fill("明月");
    await expect(roomCard(page, "room-b")).toBeVisible();
    await expect(roomCard(page, "room-a")).toHaveCount(0);
  });

  test("建筑楼层 sheet", async ({ page }) => {
    await openMeeting(page, { path: "/ai-meet/m/" });
    await waitMobileBoard(page);
    await tid(page, "mr-m-filter-place").click();
    await expect(tid(page, "mr-sheet-filter")).toBeVisible();
    await page.getByRole("button", { name: "奥城 3层" }).click();
    await page.getByRole("button", { name: "确定" }).click();
    await expect(roomCard(page, "room-a")).toBeVisible();
    await expect(roomCard(page, "room-b")).toHaveCount(0);
  });

  test("设施 sheet + 重置含日期回今天", async ({ page }) => {
    await openMeeting(page, { path: "/ai-meet/m/" });
    await waitMobileBoard(page);
    await tid(page, "mr-m-filter-facilities").click();
    await page.getByRole("button", { name: "白板", exact: true }).click();
    await page.getByRole("button", { name: "确定" }).click();
    await expect(roomCard(page, "room-b")).toBeVisible();
    await expect(roomCard(page, "room-a")).toHaveCount(0);
    await tid(page, "mr-m-filter-reset").click();
    await expect(roomCard(page, "room-a")).toBeVisible();
    await expect(roomCard(page, "room-b")).toBeVisible();
  });

  test("筛空", async ({ page }) => {
    await openMeeting(page, { path: "/ai-meet/m/" });
    await waitMobileBoard(page);
    await tid(page, "mr-m-search").fill("__none__");
    await expect(tid(page, "mr-m-empty")).toBeVisible();
  });
});
