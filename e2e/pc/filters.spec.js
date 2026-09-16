import { expect, test } from "@playwright/test";
import { openMeeting, waitPcBoard } from "../helpers/open.js";
import { tid } from "../locators.js";

test.describe("PC 筛选", () => {
  test("建筑楼层只留该楼", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    await tid(page, "mr-filter-place").click();
    await page.getByRole("button", { name: "奥城 3层" }).click();
    await expect(page.getByText("星海").first()).toBeVisible();
    await expect(page.getByText("明月")).toHaveCount(0);
  });

  test("人数档 13+ 只留大房间", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    await tid(page, "mr-filter-advanced").click();
    await page.getByRole("button", { name: "13人以上" }).click();
    await expect(page.getByText("明月").first()).toBeVisible();
    await expect(page.getByText("星海")).toHaveCount(0);
  });

  test("设施 AND 筛选", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    await tid(page, "mr-filter-advanced").click();
    await page.getByRole("button", { name: "投影" }).click();
    await expect(page.getByText("星海").first()).toBeVisible();
    await expect(page.getByText("明月")).toHaveCount(0);
  });

  test("重置筛选恢复全部", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    await tid(page, "mr-filter-advanced").click();
    await page.getByRole("button", { name: "1-6人" }).click();
    await expect(tid(page, "mr-board-empty")).toBeVisible();
    await page.getByRole("button", { name: "重置筛选" }).click();
    await expect(page.getByText("星海").first()).toBeVisible();
    await expect(page.getByText("明月").first()).toBeVisible();
  });
});
