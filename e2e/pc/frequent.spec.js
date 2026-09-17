import { expect, test } from "@playwright/test";
import { createStore, openMeeting, waitPcBoard } from "../helpers/open.js";
import { TODAY } from "../helpers/clock.js";
import { tid } from "../locators.js";

const frequentBadge = (page) => page.getByText("常用", { exact: true });

/** 造 3 场「我」在同一间房未释放的预定，达到常用阈值 */
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

test.describe("PC 常用会议室", () => {
  test("没订过的房间不挂「常用」徽标", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    await expect(frequentBadge(page)).toHaveCount(0);
  });

  test("订满 3 次的房间自动挂「常用」并置顶", async ({ page }) => {
    const store = storeWithFrequentRoom("room-b");
    await openMeeting(page, { store });
    await waitPcBoard(page);

    await expect(frequentBadge(page)).toHaveCount(1);
    await expect(tid(page, "mr-room-book").first()).toHaveAttribute(
      "data-room-id",
      "room-b"
    );
  });

  test("看板上没有收藏星标（收藏暂不上线）", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    await expect(tid(page, "mr-room-fav")).toHaveCount(0);
  });
});
