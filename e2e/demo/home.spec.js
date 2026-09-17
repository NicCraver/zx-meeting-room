import { expect, test } from "@playwright/test";
import { openMeeting, waitPcBoard } from "../helpers/open.js";
import { tid } from "../locators.js";

test.describe("未登录首页", () => {
  test("main 无身份不进看板，也不出调试入口", async ({ page }) => {
    await openMeeting(page, { path: "/ai-meet/", qs: "" });
    await expect(tid(page, "mr-need-auth")).toBeVisible();
    await expect(page.getByText("请从智信打开会议室")).toBeVisible();
    await expect(tid(page, "mr-demo-enter-booking")).toHaveCount(0);
    await expect(tid(page, "mr-board")).toHaveCount(0);
  });
});

test.describe("Debugger 页", () => {
  test("main 显示本机联调入口，没有时间轴", async ({ page }) => {
    await openMeeting(page, { path: "/ai-meet/debugger", qs: "" });
    await expect(page.getByRole("heading", { name: "调试入口" })).toBeVisible();
    await expect(tid(page, "mr-demo-enter-booking")).toBeVisible();
    await expect(tid(page, "mr-board")).toHaveCount(0);
  });

  test("进入预定带 query 进看板", async ({ page }) => {
    await openMeeting(page, { path: "/ai-meet/debugger", qs: "" });
    await tid(page, "mr-demo-enter-booking").click();
    await waitPcBoard(page);
    await expect(tid(page, "mr-toolbar-book")).toBeVisible();
  });

  test("非 m 显示进入管理", async ({ page }) => {
    await openMeeting(page, { path: "/ai-meet/debugger", qs: "" });
    await expect(tid(page, "mr-demo-enter-admin")).toBeVisible();
    await expect(tid(page, "mr-demo-enter-race")).toBeVisible();
  });
});
