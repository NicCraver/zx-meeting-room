import { expect, test } from "@playwright/test";
import { expectFitsViewport, openMeeting, waitPcBoard } from "./helpers.js";

test.describe("PC 看板", () => {
  test("zx 入口加载会议室时间轴", async ({ page }) => {
    await openMeeting(page, "/zx-ai-meet/zx/");
    await waitPcBoard(page);
    await expect(page.getByRole("button", { name: "+ 预约会议室" })).toBeVisible();
    await expect(page.getByRole("button", { name: "我的预定" })).toBeVisible();
    await expect(page.getByPlaceholder("搜索会议室")).toBeVisible();
    await expect(page.locator(".tl-room-name-text").first()).not.toHaveText("");
  });

  test("main 入口同样是预定看板", async ({ page }) => {
    await openMeeting(page, "/zx-ai-meet/");
    await waitPcBoard(page);
    await expect(page.locator('[data-tour="room-table"]')).toBeVisible();
  });

  test("搜索会筛掉不匹配的房间", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    const firstName = (
      await page.locator(".tl-room-name-text").first().innerText()
    ).trim();
    await page.getByPlaceholder("搜索会议室").fill("__no_such_room__");
    await expect(page.locator(".tl-room-name-text")).toHaveCount(0);
    await page.getByPlaceholder("搜索会议室").fill(firstName);
    await expect(page.getByText(firstName, { exact: true }).first()).toBeVisible();
  });

  test("日 / 周视图可切换", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    await page.getByRole("radio", { name: "周" }).click();
    await expect(page.getByRole("radio", { name: "周" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    await expect(page.locator(".tl-board")).toHaveClass(/is-week/);
    await page.getByRole("radio", { name: "日" }).click();
    await expect(page.getByRole("radio", { name: "日" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
  });

  test("我的预定弹层不超出视口", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    await page.getByRole("button", { name: "我的预定" }).click();
    const dialog = page.locator(".mine-bookings-dialog");
    await expect(dialog).toBeVisible();
    await expect(page.getByText("加载中…")).toBeHidden({ timeout: 15_000 });
    await expectFitsViewport(dialog, page);
    await expect(page.getByRole("tab", { name: /可操作/ })).toBeVisible();
  });
});
