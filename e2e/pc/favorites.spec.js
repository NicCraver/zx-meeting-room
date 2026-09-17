import { expect, test } from "@playwright/test";
import { openMeeting, waitPcBoard } from "../helpers/open.js";
import { tid } from "../locators.js";

const favStars = (page) => tid(page, "mr-room-fav");
const roomNames = (page) =>
  tid(page, "mr-room-book").allTextContents();

test.describe("PC 常用会议室", () => {
  test("默认没有常用徽标，点星标后出现并置顶", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);

    // 「常用」是真数据驱动的，没收藏之前一个都不该有
    await expect(page.getByText("常用", { exact: true })).toHaveCount(0);

    const before = await roomNames(page);
    const last = favStars(page).last();
    const targetRoom = await last.getAttribute("data-room-id");
    await last.click();

    await expect(
      page.locator(`[data-testid="mr-room-fav"][data-room-id="${targetRoom}"]`)
    ).toHaveAttribute("data-favorite", "1");
    await expect(page.getByText("常用", { exact: true })).toHaveCount(1);

    // 置顶：刚收藏的那间成了第一行
    const firstRowRoom = await tid(page, "mr-room-book")
      .first()
      .getAttribute("data-room-id");
    expect(firstRowRoom).toBe(targetRoom);
    expect(before.length).toBeGreaterThan(1);
  });

  test("再点一次取消收藏，徽标消失", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);

    const star = favStars(page).first();
    await star.click();
    await expect(page.getByText("常用", { exact: true })).toHaveCount(1);

    await tid(page, "mr-room-fav").first().click();
    await expect(page.getByText("常用", { exact: true })).toHaveCount(0);
  });

  test("点星标不会打开预约弹层", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);

    await favStars(page).first().click();
    await expect(tid(page, "mr-dialog-create")).toHaveCount(0);
  });

  test("刷新后仍是常用（走接口不是本地状态）", async ({ page }) => {
    const store = await openMeeting(page);
    await waitPcBoard(page);

    await favStars(page).first().click();
    await expect(page.getByText("常用", { exact: true })).toHaveCount(1);

    await page.reload();
    await waitPcBoard(page);
    await expect(page.getByText("常用", { exact: true })).toHaveCount(1);
    expect(store).toBeTruthy();
  });
});
