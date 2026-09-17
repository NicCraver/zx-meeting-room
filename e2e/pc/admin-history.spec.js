import { expect, test } from "@playwright/test";
import { createStore, openMeeting } from "../helpers/open.js";
import { tid } from "../locators.js";

test.describe("管理 · 预定记录", () => {
  test("表格有 seed 预定", async ({ page }) => {
    await openMeeting(page, { path: "/ai-meet/zx/admin/history" });
    await expect(page.getByRole("heading", { name: "预定记录" })).toBeVisible();
    await expect(tid(page, "mr-history-table")).toBeVisible();
    await expect(page.getByText("我的周会")).toBeVisible();
  });

  test("点审计出现创建记录", async ({ page }) => {
    await openMeeting(page, { path: "/ai-meet/zx/admin/history" });
    await page.getByRole("row", { name: /我的周会/ }).getByTestId("mr-history-audit").click();
    await expect(page.locator(".el-timeline")).toContainText("创建");
  });

  test("释放后再打开审计有 release", async ({ page }) => {
    const store = createStore();
    store.handle("POST", "/bookings/release/bk-mine-pm", { query: {}, body: {} });
    await openMeeting(page, { path: "/ai-meet/zx/admin/history", store });
    await page.getByRole("row", { name: /我的周会/ }).getByTestId("mr-history-audit").click();
    await expect(page.locator(".el-timeline")).toContainText("释放");
  });

  test("空审计", async ({ page }) => {
    const store = createStore();
    store.state.audits["bk-mine-ended"] = [];
    await openMeeting(page, { path: "/ai-meet/zx/admin/history", store });
    await page.getByRole("row", { name: /昨日评审/ }).getByTestId("mr-history-audit").click();
    await expect(page.getByText("暂无审计记录")).toBeVisible();
  });
});
