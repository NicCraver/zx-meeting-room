import { expect, test } from "@playwright/test";
import { openMeeting, waitMobileBoard } from "../helpers/open.js";
import { expectToast } from "../helpers/expect.js";
import { roomCard, tid } from "../locators.js";

test.describe("移动看板", () => {
  test("m 入口标题、搜索、房间卡", async ({ page }) => {
    await openMeeting(page, { path: "/ai-meet/m/" });
    await waitMobileBoard(page);
    await expect(page.getByText("预定会议室").first()).toBeVisible();
    await expect(tid(page, "mr-m-search")).toBeVisible();
    await expect(roomCard(page, "room-a")).toBeVisible();
  });

  test("更多菜单含我的预定", async ({ page }) => {
    await openMeeting(page, { path: "/ai-meet/m/" });
    await waitMobileBoard(page);
    await tid(page, "mr-m-more").click();
    await expect(tid(page, "mr-sheet-more")).toBeVisible();
    await tid(page, "mr-mine-open").click();
    await expect(tid(page, "mr-dialog-mine-body")).toBeVisible();
  });

  test("点房间打开详情含位置描述", async ({ page }) => {
    await openMeeting(page, { path: "/ai-meet/m/" });
    await waitMobileBoard(page);
    await roomCard(page, "room-a").getByTestId("mr-room-open").click();
    await expect(tid(page, "mr-dialog-detail")).toBeVisible();
    await expect(page.locator(".form-cell-value", { hasText: "7层711办公室旁边" })).toBeVisible();
    await expect(tid(page, "mr-detail-book")).toBeVisible();
  });

  test("详情未选时段时预定按钮仍在页脚", async ({ page }) => {
    await openMeeting(page, { path: "/ai-meet/m/", hideBuddy: true });
    await waitMobileBoard(page);
    await roomCard(page, "room-a").getByTestId("mr-room-open").click();
    await expect(tid(page, "mr-detail-book")).toBeVisible();
    await expect(tid(page, "mr-select-bar")).toHaveCount(0);
  });

  test("无管理入口、无日周、无人数档、无底栏助手", async ({ page }) => {
    await openMeeting(page, { path: "/ai-meet/m/" });
    await waitMobileBoard(page);
    await expect(page.getByRole("button", { name: "会议室管理" })).toHaveCount(0);
    await expect(tid(page, "mr-view-week")).toHaveCount(0);
    await expect(tid(page, "mr-ai-bar")).toHaveCount(0);
    await expect(tid(page, "mr-buddy-fab")).toBeVisible();
  });

  test("m 无身份不进列表，不出现管理", async ({ page }) => {
    await openMeeting(page, { path: "/ai-meet/m/", qs: "" });
    await expect(tid(page, "mr-need-auth")).toBeVisible();
    await expect(tid(page, "mr-demo-enter-booking")).toHaveCount(0);
    await expect(tid(page, "mr-demo-enter-admin")).toHaveCount(0);
  });

  test("m debugger 门户不出现管理", async ({ page }) => {
    await openMeeting(page, { path: "/ai-meet/m/debugger", qs: "" });
    await expect(tid(page, "mr-demo-enter-booking")).toBeVisible();
    await expect(tid(page, "mr-demo-enter-admin")).toHaveCount(0);
  });

  test("返回按钮 toast", async ({ page }) => {
    await openMeeting(page, { path: "/ai-meet/m/" });
    await waitMobileBoard(page);
    await page.getByRole("button", { name: /返回/ }).click();
    await expectToast(page, "返回上一页", { mobile: true });
  });
});
