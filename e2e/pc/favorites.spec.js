import { expect, test } from "@playwright/test";
import { createStore, openMeeting, waitPcBoard } from "../helpers/open.js";
import { TODAY } from "../helpers/clock.js";
import { tid } from "../locators.js";

const favStars = (page) => tid(page, "mr-room-fav");
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

test.describe("PC 收藏与常用", () => {
  test("收藏是星标，不产生「常用」徽标", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);

    // 没人订过也没收藏过，两个标记都不该有
    await expect(frequentBadge(page)).toHaveCount(0);

    const star = favStars(page).last();
    const roomId = await star.getAttribute("data-room-id");
    await star.click();

    await expect(
      page.locator(`[data-testid="mr-room-fav"][data-room-id="${roomId}"]`)
    ).toHaveAttribute("data-favorite", "1");
    // 收藏只点亮星标，「常用」是预定次数算出来的，不该跟着亮
    await expect(frequentBadge(page)).toHaveCount(0);

    const firstRow = await tid(page, "mr-room-book")
      .first()
      .getAttribute("data-room-id");
    expect(firstRow).toBe(roomId);
  });

  test("订满 3 次的房间自动挂「常用」徽标，且星标仍是灭的", async ({ page }) => {
    const store = storeWithFrequentRoom("room-b");
    await openMeeting(page, { store });
    await waitPcBoard(page);

    await expect(frequentBadge(page)).toHaveCount(1);
    const frequentRow = tid(page, "mr-room-book").first();
    await expect(frequentRow).toHaveAttribute("data-room-id", "room-b");
    await expect(
      page.locator('[data-testid="mr-room-fav"][data-room-id="room-b"]')
    ).toHaveAttribute("data-favorite", "0");
  });

  test("收藏排在常用前面", async ({ page }) => {
    const store = storeWithFrequentRoom("room-b");
    await openMeeting(page, { store });
    await waitPcBoard(page);

    await page
      .locator('[data-testid="mr-room-fav"][data-room-id="room-a"]')
      .click();

    await expect(tid(page, "mr-room-book").first()).toHaveAttribute(
      "data-room-id",
      "room-a"
    );
    await expect(tid(page, "mr-room-book").nth(1)).toHaveAttribute(
      "data-room-id",
      "room-b"
    );
    await expect(frequentBadge(page)).toHaveCount(1);
  });

  test("再点一次取消收藏，星标灭掉", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);

    await favStars(page).first().click();
    await expect(favStars(page).first()).toHaveAttribute("data-favorite", "1");

    await favStars(page).first().click();
    await expect(favStars(page).first()).toHaveAttribute("data-favorite", "0");
  });

  test("点星标不会打开预约弹层", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);

    await favStars(page).first().click();
    await expect(tid(page, "mr-dialog-create")).toHaveCount(0);
  });

  test("刷新后收藏仍在（走接口不是本地状态）", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);

    await favStars(page).first().click();
    await expect(favStars(page).first()).toHaveAttribute("data-favorite", "1");

    await page.reload();
    await waitPcBoard(page);
    await expect(favStars(page).first()).toHaveAttribute("data-favorite", "1");
  });
});
