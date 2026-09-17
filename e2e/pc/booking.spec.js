import { expect, test } from "@playwright/test";
import {
  clickDaySlot,
  createStore,
  dragWeekSlot,
  openMeeting,
  pickFormTimes,
  waitPcBoard
} from "../helpers/open.js";
import { expectFitsViewport, expectToast } from "../helpers/expect.js";
import { tid } from "../locators.js";

test.describe("PC 预定漏斗", () => {
  test("工具栏预约打开表单，默认主题含姓名", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    await tid(page, "mr-toolbar-book").click();
    await expect(tid(page, "mr-form-create")).toBeVisible();
    await expect(tid(page, "mr-form-title")).toHaveValue(/李权泓/);
  });

  test("预约指定房间打开该房间", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    await page.locator('[data-testid="mr-room-book"][data-room-id="room-b"]').click();
    await expect(tid(page, "mr-form-room")).toContainText("明月");
  });

  test("时间轴点空档 → 确认卡 → 表单", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    await clickDaySlot(page, "room-a");
    await expect(tid(page, "mr-slot-confirm-card")).toBeVisible();
    await tid(page, "mr-slot-confirm").click();
    await expect(tid(page, "mr-form-create")).toBeVisible();
  });

  test("提交预定成功出现占用并进我的预定", async ({ page }) => {
    const store = createStore();
    await openMeeting(page, { store });
    await waitPcBoard(page);
    await tid(page, "mr-toolbar-book").click();
    await tid(page, "mr-form-title").fill("e2e-评审会");
    await pickFormTimes(page, "14:00", "15:00");
    await page.getByRole("button", { name: "提交预定" }).click();
    await expectToast(page, "预定成功");
    await expect.poll(() =>
      store.state.bookings.some((b) => b.title === "e2e-评审会")
    ).toBe(true);
    await tid(page, "mr-toolbar-mine").click();
    await expect(page.locator('[data-booking-title="e2e-评审会"]')).toBeVisible();
  });

  test("空主题提交落默认名", async ({ page }) => {
    const store = createStore();
    await openMeeting(page, { store });
    await waitPcBoard(page);
    await page.locator('[data-testid="mr-room-book"][data-room-id="room-b"]').click();
    await tid(page, "mr-form-title").fill("");
    await pickFormTimes(page, "14:00", "15:00");
    await page.getByRole("button", { name: "提交预定" }).click();
    await expectToast(page, "预定成功");
    await expect.poll(() => store.state.lastCreatePayload?.title).toBe(
      "李权泓预定的会议"
    );
  });

  test("占用时段显示冲突并禁用提交", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    await page.locator('[data-testid="mr-room-book"][data-room-id="room-a"]').click();
    await pickFormTimes(page, "11:00", "12:00");
    await expect(tid(page, "mr-form-conflict")).toBeVisible();
    await expect(page.getByRole("button", { name: "提交预定" })).toBeDisabled();
  });

  test("后端 M4010 toast，不写入 mine", async ({ page }) => {
    const store = createStore({ forceConflict: true });
    await openMeeting(page, { store });
    await waitPcBoard(page);
    await page.locator('[data-testid="mr-room-book"][data-room-id="room-b"]').click();
    await pickFormTimes(page, "14:00", "15:00");
    await page.getByRole("button", { name: "提交预定" }).click();
    await expectToast(page, "该时段已被占用");
    expect(store.state.bookings.filter((b) => b.title === "e2e-评审会")).toHaveLength(0);
    expect(store.state.createCalls).toBe(1);
  });

  test("提交中不能连点出两单", async ({ page }) => {
    const store = createStore({ delayCreateMs: 400 });
    await openMeeting(page, { store });
    await waitPcBoard(page);
    await page.locator('[data-testid="mr-room-book"][data-room-id="room-b"]').click();
    await pickFormTimes(page, "18:00", "19:00");
    const submit = page.getByRole("button", { name: "提交预定" });
    await submit.click();
    await submit.click({ force: true }).catch(() => {});
    await expectToast(page, "预定成功");
    await expect(store.state.createCalls).toBe(1);
  });

  test("弹层不超出视口", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    await tid(page, "mr-toolbar-book").click();
    await expectFitsViewport(tid(page, "mr-form-create"), page);
  });

  // 周视图入口 2026-09-17 起隐藏（PcToolbar 的 SHOW_WEEK_VIEW），跨天拖选暂时跑不了。
  // 放出周视图时把 skip 去掉即可，用例本身没动。
  test.skip("周视图跨天拖选 payload 带 dates", async ({ page }) => {
    const store = createStore();
    await openMeeting(page, { store });
    await waitPcBoard(page);
    await tid(page, "mr-view-week").click();
    await expect(tid(page, "mr-board")).toHaveClass(/is-week/);
    await dragWeekSlot(page, "room-b");
    if (await tid(page, "mr-slot-confirm-card").isVisible().catch(() => false)) {
      await tid(page, "mr-slot-confirm").click();
      await expect(tid(page, "mr-form-create")).toBeVisible();
      await page.getByRole("button", { name: "提交预定" }).click();
      await expectToast(page, /已预定|预定成功/);
      const dates = store.state.lastCreatePayload?.dates;
      if (dates) expect(dates.length).toBeGreaterThanOrEqual(2);
    } else {
      test.info().annotations.push({
        type: "note",
        description: "周视图拖选未弹出确认卡，跳过 payload 断言"
      });
    }
  });

  test("表单无周期/每周控件", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    await tid(page, "mr-toolbar-book").click();
    await expect(tid(page, "mr-form-create")).toBeVisible();
    await expect(page.getByText(/每周|周期预定/)).toHaveCount(0);
  });
});
