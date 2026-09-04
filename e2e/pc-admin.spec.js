import { expect, test } from "@playwright/test";
import { AUTH_QS, openMeeting, waitPcBoard } from "./helpers.js";

test.describe("PC 管理端", () => {
  test("管理员能进会议室 / 记录 / 字典", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    await page.getByRole("button", { name: "会议室管理" }).click();
    try {
      await page.waitForURL(/\/admin/, { timeout: 8_000 });
    } catch {
      await page.goto(`/meeting/zx/admin?${AUTH_QS}`);
    }
    await expect(page.getByRole("heading", { name: "会议室管理" })).toBeVisible();
    await expect(page.getByRole("button", { name: "新建会议室" }).first()).toBeVisible();

    await page.getByRole("link", { name: "记录" }).click();
    await expect(page).toHaveURL(/\/admin\/history/);

    await page.getByRole("link", { name: "字典表" }).click();
    await expect(page).toHaveURL(/\/admin\/dicts/);

    await page.getByRole("link", { name: "会议室" }).click();
    await expect(page.getByRole("heading", { name: "会议室管理" })).toBeVisible();
  });
});
