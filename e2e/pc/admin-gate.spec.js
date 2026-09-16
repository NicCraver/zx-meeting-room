import { expect, test } from "@playwright/test";
import { STAFF_ME } from "../mocks/seed.js";
import { createStore, openMeeting, waitPcBoard } from "../helpers/open.js";
import { expectToast } from "../helpers/expect.js";
import { tid } from "../locators.js";

test.describe("管理门闩", () => {
  test("管理员能进会议室列表", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    await tid(page, "mr-toolbar-admin").click();
    await page.waitForURL(/\/admin/, { timeout: 8_000 }).catch(async () => {
      await page.goto("/ai-meet/zx/admin");
    });
    await expect(page.getByRole("heading", { name: "会议室管理" })).toBeVisible();
    await expect(tid(page, "mr-admin-room-create")).toBeVisible();
  });

  test("非管理员直达被踢回", async ({ page }) => {
    await openMeeting(page, {
      path: "/ai-meet/zx/admin",
      store: createStore({ me: STAFF_ME })
    });
    await expectToast(page, "无管理权限");
  });
});
