import { expect, test } from "@playwright/test";
import { STAFF_ME } from "../mocks/seed.js";
import { createStore, openMeeting, waitPcBoard } from "../helpers/open.js";
import { expectToast } from "../helpers/expect.js";
import { tid } from "../locators.js";

test.describe("PC 鉴权", () => {
  test("zx 带身份进看板，地址栏 query 被清掉", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    await expect(page).not.toHaveURL(/zxAccountId=/);
    await expect(tid(page, "mr-toolbar-book")).toBeVisible();
  });

  test("管理员显示会议室管理，切换用户可见", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    await expect(tid(page, "mr-toolbar-admin")).toBeVisible();
    await expect(tid(page, "mr-switch-user")).toBeVisible();
  });

  test("非管理员不显示会议室管理", async ({ page }) => {
    await openMeeting(page, { store: createStore({ me: STAFF_ME }) });
    await waitPcBoard(page);
    await expect(tid(page, "mr-toolbar-admin")).toHaveCount(0);
  });

  test("直达 /admin 无企业 → toast 缺少企业信息", async ({ page }) => {
    await openMeeting(page, {
      path: "/ai-meet/zx/admin",
      qs: "zxAccountId=1880150187008081921&zxClientType=app"
    });
    await expectToast(page, "缺少企业信息");
  });

  test("O_T_003 提示登录过期", async ({ page }) => {
    await openMeeting(page, { store: createStore({ meCode: "O_T_003" }) });
    await expectToast(page, "登录已过期");
  });

  test("非管理员直达 /admin 被踢回", async ({ page }) => {
    await openMeeting(page, {
      path: "/ai-meet/zx/admin",
      store: createStore({ me: STAFF_ME })
    });
    await expectToast(page, "无管理权限");
    await expect(page).toHaveURL(/\/ai-meet\/zx\/?$/);
  });
});
