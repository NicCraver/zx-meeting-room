import { expect, test } from "@playwright/test";
import {
  createStore,
  openMeeting,
  openMine,
  pickFormTimes,
  waitPcBoard
} from "../helpers/open.js";
import { expectToast } from "../helpers/expect.js";
import { mineCard, tid } from "../locators.js";

const names = (store) => store.state.events.map((e) => e.eventName);

test.describe("埋点", () => {
  test("进看板有 page_view", async ({ page }) => {
    const store = createStore();
    await openMeeting(page, { store });
    await waitPcBoard(page);
    await expect.poll(() => names(store).includes("page_view")).toBe(true);
  });

  test("手动提交与释放打点，且无原文", async ({ page }) => {
    const store = createStore();
    await openMeeting(page, { store });
    await waitPcBoard(page);
    await page.locator('[data-testid="mr-room-book"][data-room-id="room-b"]').click();
    await pickFormTimes(page, "14:00", "15:00");
    await page.getByRole("button", { name: "提交预定" }).click();
    await expectToast(page, "预定成功");
    await expect.poll(() => names(store).includes("booking_submit")).toBe(true);
    await openMine(page);
    await mineCard(page, "bk-mine-pm").getByTestId("mr-mine-release").click();
    await page.getByRole("button", { name: "确认释放" }).click();
    await expect.poll(() => names(store).includes("booking_release")).toBe(true);
    for (const ev of store.state.events) {
      expect(ev.props?.text).toBeUndefined();
      expect(ev.props?.message).toBeUndefined();
    }
  });
});
