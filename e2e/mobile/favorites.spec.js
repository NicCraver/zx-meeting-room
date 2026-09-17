import { expect, test } from "@playwright/test";
import { createStore, openMeeting, waitMobileBoard } from "../helpers/open.js";
import { TODAY } from "../helpers/clock.js";
import { tid } from "../locators.js";

const frequentBadge = (page) => page.getByText("常用", { exact: true });

const storeWithFrequentRoom = (roomId) => {
  const store = createStore();
  for (let i = 0; i < 3; i += 1) {
    store.handle("POST", "/bookings/create", {
      query: {},
      body: {
        roomId,
        date: TODAY,
        start: `1${i}:00`,
        end: `1${i}:30`,
        title: `常用统计 ${i}`
      }
    });
  }
  return store;
};

test.describe("移动收藏与常用", () => {
  test("点星标只切收藏并置顶，不产生「常用」徽标", async ({ page }) => {
    await openMeeting(page, { path: "/ai-meet/m/" });
    await waitMobileBoard(page);

    await expect(frequentBadge(page)).toHaveCount(0);

    const star = tid(page, "mr-room-fav").last();
    const roomId = await star.getAttribute("data-room-id");
    await star.click();

    await expect(tid(page, "mr-room-card").first()).toHaveAttribute(
      "data-room-id",
      roomId
    );
    await expect(frequentBadge(page)).toHaveCount(0);

    await tid(page, "mr-room-fav").first().click();
    await expect(tid(page, "mr-room-fav").first()).toHaveAttribute(
      "data-favorite",
      "0"
    );
  });

  test("订满 3 次的房间挂「常用」徽标", async ({ page }) => {
    const store = storeWithFrequentRoom("room-b");
    await openMeeting(page, { path: "/ai-meet/m/", store });
    await waitMobileBoard(page);

    await expect(frequentBadge(page)).toHaveCount(1);
    await expect(tid(page, "mr-room-card").first()).toHaveAttribute(
      "data-room-id",
      "room-b"
    );
  });

  test("点星标不会打开房间详情", async ({ page }) => {
    await openMeeting(page, { path: "/ai-meet/m/" });
    await waitMobileBoard(page);

    await tid(page, "mr-room-fav").first().click();
    await expect(tid(page, "mr-dialog-detail")).toHaveCount(0);
  });
});
