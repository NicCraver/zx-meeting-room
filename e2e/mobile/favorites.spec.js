import { expect, test } from "@playwright/test";
import { openMeeting, waitMobileBoard } from "../helpers/open.js";
import { tid } from "../locators.js";

test.describe("移动常用会议室", () => {
  test("点星标出现常用徽标并置顶，再点取消", async ({ page }) => {
    await openMeeting(page, { path: "/ai-meet/m/" });
    await waitMobileBoard(page);

    await expect(page.getByText("常用", { exact: true })).toHaveCount(0);

    const star = tid(page, "mr-room-fav").last();
    const roomId = await star.getAttribute("data-room-id");
    await star.click();

    await expect(page.getByText("常用", { exact: true })).toHaveCount(1);
    await expect(tid(page, "mr-room-card").first()).toHaveAttribute(
      "data-room-id",
      roomId
    );

    await tid(page, "mr-room-fav").first().click();
    await expect(page.getByText("常用", { exact: true })).toHaveCount(0);
  });

  test("点星标不会打开房间详情", async ({ page }) => {
    await openMeeting(page, { path: "/ai-meet/m/" });
    await waitMobileBoard(page);

    await tid(page, "mr-room-fav").first().click();
    await expect(tid(page, "mr-dialog-detail")).toHaveCount(0);
  });
});
