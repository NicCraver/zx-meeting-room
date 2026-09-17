import { expect, test } from "@playwright/test";
import { createStore, openMeeting, waitPcBoard } from "../helpers/open.js";
import { expectFitsViewport } from "../helpers/expect.js";
import { tid } from "../locators.js";
import { defaultRooms } from "../mocks/seed.js";

test.describe("PC 助手", () => {
  test.describe.configure({ timeout: 45_000 });

  test("找空闲芯片出 query 卡", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    await tid(page, "mr-ai-chip-find-free").click();
    await expect(tid(page, "mr-ai-query-card")).toBeVisible({ timeout: 15_000 });
  });

  test("多房间 query 卡不超出视口", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 560 });
    await openMeeting(page);
    await waitPcBoard(page);
    await tid(page, "mr-ai-input").fill("很多空闲会议室");
    await tid(page, "mr-ai-send").click();
    await expect(tid(page, "mr-ai-query-card")).toBeVisible({ timeout: 15_000 });
    await expectFitsViewport(page.locator(".booking-ai-bar"), page);
  });

  test("选档确认预定写入 store，不打 booking_submit", async ({ page }) => {
    const store = createStore();
    await openMeeting(page, { store });
    await waitPcBoard(page);
    await tid(page, "mr-ai-chip-find-free").click();
    await expect(tid(page, "mr-ai-query-card")).toBeVisible();
    await page.getByTestId("mr-ai-slot").first().click();
    await expect(tid(page, "mr-ai-confirm")).toBeVisible();
    await tid(page, "mr-ai-confirm-ok").click();
    await expect(tid(page, "mr-ai-booked")).toBeVisible();
    await expect.poll(() => store.state.createCalls).toBeGreaterThan(0);
    await expect
      .poll(() =>
        store.state.bookings.some(
          (b) => b.hostUserId === "u-li" && b.start !== "16:00"
        )
      )
      .toBe(true);
    await page.waitForTimeout(500);
    const names = store.state.events.map((e) => e.eventName);
    expect(names).toContain("agent_booked");
    expect(names).not.toContain("booking_submit");
  });

  test("立即预约走确认卡", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    await tid(page, "mr-ai-chip-find-free").click();
    await expect(tid(page, "mr-ai-query-card")).toBeVisible();
    await page.getByRole("button", { name: "立即预约" }).first().click();
    await expect(tid(page, "mr-ai-confirm")).toBeVisible();
  });

  test("error + 重试", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    await tid(page, "mr-ai-input").fill("error-please");
    await tid(page, "mr-ai-send").click();
    await expect(page.getByText("助手暂时不可用")).toBeVisible();
    await page.getByRole("button", { name: "重试" }).click();
    await expect(page.getByText("助手暂时不可用")).toBeVisible();
  });

  test("取消丢草稿不写库", async ({ page }) => {
    const store = createStore();
    const before = store.state.bookings.length;
    await openMeeting(page, { store });
    await waitPcBoard(page);
    await tid(page, "mr-ai-chip-find-free").click();
    await page.getByTestId("mr-ai-slot").first().click();
    await page.getByRole("button", { name: "返回" }).click();
    expect(store.state.bookings.length).toBe(before);
  });

  test("suggestions 失败时 FAB 闲置建议为空，底栏手输仍可发", async ({ page }) => {
    await openMeeting(page, { store: createStore({ suggestionsFail: true }) });
    await waitPcBoard(page);
    await expect(page.locator(".ai-buddy-idle-prompts")).toHaveCount(0);
    await tid(page, "mr-ai-input").fill("帮我找空闲会议室");
    await tid(page, "mr-ai-send").click();
    await expect(tid(page, "mr-ai-query-card")).toBeVisible();
  });

  test("取消最近一场会先确认再释放", async ({ page }) => {
    const store = createStore();
    await openMeeting(page, { store });
    await waitPcBoard(page);
    await tid(page, "mr-ai-chip-cancel-last").click();
    await expect(tid(page, "mr-ai-release")).toBeVisible();
    expect(store.state.bookings.find((b) => b.id === "bk-mine-pm")?.status).toBe(
      "upcoming"
    );
    await tid(page, "mr-ai-release-ok").click();
    await expect.poll(
      () => store.state.bookings.find((b) => b.id === "bk-mine-pm")?.status
    ).toBe("released");
  });

  test("我今天有哪些会出 mine 卡", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    await tid(page, "mr-ai-chip-my-meetings").click();
    await expect(tid(page, "mr-ai-mine-card")).toBeVisible();
    await expect(tid(page, "mr-ai-mine-card").getByText("我的周会")).toBeVisible();
    await expect(tid(page, "mr-ai-mine-card").getByText("说明：议程：周进度")).toBeVisible();
  });

  test("关闭结果卡回到快捷指令", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    await tid(page, "mr-ai-chip-my-meetings").click();
    await expect(tid(page, "mr-ai-mine-card")).toBeVisible();
    await tid(page, "mr-ai-result-close").click();
    await expect(tid(page, "mr-ai-mine-card")).toHaveCount(0);
    await expect(tid(page, "mr-ai-chip-my-meetings")).toBeVisible();
  });

  test("下午3点面试唯一空房出确认卡且主题为面试", async ({ page }) => {
    const store = createStore({
      rooms: defaultRooms().filter((r) => r.id === "room-a"),
      bookings: []
    });
    await openMeeting(page, { store });
    await waitPcBoard(page);
    await tid(page, "mr-ai-input").fill("预定下午3点一小时的面试会议");
    await tid(page, "mr-ai-send").click();
    await expect(tid(page, "mr-ai-confirm")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByLabel("会议主题")).toHaveValue("面试");
    await expect(tid(page, "mr-ai-confirm").getByText("星海")).toBeVisible();
  });
});
