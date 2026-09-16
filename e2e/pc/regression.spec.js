import { expect, test } from "@playwright/test";
import { openMeeting, openMine, waitPcBoard } from "../helpers/open.js";
import { tid } from "../locators.js";

test.describe("回归锁", () => {
  test("周期预定控件不存在", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    await tid(page, "mr-toolbar-book").click();
    await expect(page.getByText(/每周重复|周期预定|repeatWeekly/)).toHaveCount(0);
  });

  test("我的预定没有修改按钮", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    await openMine(page);
    await expect(page.getByRole("button", { name: "修改预定" })).toHaveCount(0);
  });
});
