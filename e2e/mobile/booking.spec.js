import { expect, test } from "@playwright/test";
import { createStore, openMeeting, waitMobileBoard } from "../helpers/open.js";
import { mineCard, roomCard, tid } from "../locators.js";

const clickTrack = async (page, roomId, ratio) => {
  const track = page.locator(
    `[data-testid="mr-room-track"][data-room-id="${roomId}"]`
  );
  const box = await track.boundingBox();
  if (!box) throw new Error("轨道不可见");
  await page.mouse.click(box.x + box.width * ratio, box.y + box.height / 2);
};

test.describe("移动预定", () => {
  test("点空档出现底栏预定", async ({ page }) => {
    await openMeeting(page, { path: "/ai-meet/m/", hideBuddy: true });
    await waitMobileBoard(page);
    await clickTrack(page, "room-b", 0.4375);
    await expect(tid(page, "mr-select-bar")).toBeVisible();
    await expect(tid(page, "mr-select-book")).toBeVisible();
    await expect(tid(page, "mr-select-bar")).toContainText("明月");
  });

  test("点占用块打开 occupancy sheet", async ({ page }) => {
    await openMeeting(page, { path: "/ai-meet/m/", hideBuddy: true });
    await waitMobileBoard(page);
    await roomCard(page, "room-a").locator('[data-testid="mr-busy-block"]').first().click();
    await expect(tid(page, "mr-sheet-occupancy")).toBeVisible();
    await expect(page.getByText("该时段已被预定")).toBeVisible();
  });

  test("我的预定释放走 ConfirmSheet 而不是 ElMessageBox", async ({ page }) => {
    const store = createStore();
    await openMeeting(page, { path: "/ai-meet/m/", store, hideBuddy: true });
    await waitMobileBoard(page);
    await tid(page, "mr-m-more").click();
    await tid(page, "mr-mine-open").click();
    await mineCard(page, "bk-mine-pm").getByTestId("mr-mine-release").click();
    await expect(tid(page, "mr-sheet-confirm")).toBeVisible();
    await expect(page.locator(".el-message-box")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "确认释放" })).toBeVisible();
  });
});
