import { expect, test } from "@playwright/test";
import { openMeeting, waitPcBoard } from "../helpers/open.js";
import { tid } from "../locators.js";

test.describe("Demo 首页", () => {
  test("main 无身份显示门户，没有时间轴", async ({ page }) => {
    await openMeeting(page, { path: "/ai-meet/", qs: "" });
    await expect(page.getByRole("heading", { name: "智能会议室" })).toBeVisible();
    await expect(tid(page, "mr-demo-enter-booking")).toBeVisible();
    await expect(tid(page, "mr-board")).toHaveCount(0);
  });

  test("进入预定带 query 进看板", async ({ page }) => {
    await openMeeting(page, { path: "/ai-meet/", qs: "" });
    await tid(page, "mr-demo-enter-booking").click();
    await waitPcBoard(page);
    await expect(tid(page, "mr-toolbar-book")).toBeVisible();
  });

  test("非 m 显示进入管理", async ({ page }) => {
    await openMeeting(page, { path: "/ai-meet/", qs: "" });
    await expect(tid(page, "mr-demo-enter-admin")).toBeVisible();
    await expect(tid(page, "mr-demo-enter-race")).toBeVisible();
  });
});
