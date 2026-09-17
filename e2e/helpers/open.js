import { expect } from "@playwright/test";
import { AUTH_QS, meetingUrl } from "./auth.js";
import { freezeClock } from "./clock.js";
import { installMeetingApi } from "../mocks/install.js";
import { createStore } from "../mocks/store.js";
import { tid } from "../locators.js";

export { AUTH_QS, meetingUrl, createStore };

export async function skipTour(page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("mr_tour_v1", "1");
    } catch {
      /* ignore */
    }
  });
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {{ path?: string, qs?: string, store?: object, skipTour?: boolean, freeze?: boolean }} [opts]
 */
export async function openMeeting(page, opts = {}) {
  const store = opts.store || createStore();
  if (opts.freeze !== false) await freezeClock(page);
  if (opts.skipTour !== false) await skipTour(page);
  await installMeetingApi(page, store);
  const path = opts.path || "/ai-meet/zx/";
  const qs = opts.qs === undefined ? AUTH_QS : opts.qs;
  await page.goto(meetingUrl(path, qs));
  if (opts.hideBuddy) {
    await page.addStyleTag({
      content:
        ".ai-buddy,.ai-buddy-idle-prompts,.ai-buddy-dock{display:none!important}"
    });
  }
  return store;
}

export async function openAdmin(page, opts = {}) {
  const store = await openMeeting(page, {
    ...opts,
    path: opts.path || "/ai-meet/zx/admin"
  });
  await expect(
    page.getByRole("heading", { name: /会议室管理|新建会议室|编辑会议室|字典表|预定记录/ })
  ).toBeVisible();
  return store;
}

export async function waitPcBoard(page) {
  await tid(page, "mr-board").waitFor();
  await page.getByText("数据加载中...").waitFor({ state: "hidden" }).catch(() => {});
  await tid(page, "mr-room-row").first().waitFor();
}

export async function waitMobileBoard(page) {
  await page.getByText("预定会议室").first().waitFor();
  await page
    .locator('[data-testid="mr-room-card"], [data-testid="mr-m-empty"]')
    .first()
    .waitFor();
}

export async function openMine(page) {
  await tid(page, "mr-toolbar-mine").click();
  await tid(page, "mr-dialog-mine").waitFor();
  await tid(page, "mr-mine-loading").waitFor({ state: "hidden" }).catch(() => {});
}

/** 日视图时间轴：点 14:00 空档（全天 0–24h 轴，14:00 = 840/1440）。 */
export async function clickDaySlot(page, roomId, ratio = 840 / 1440) {
  const track = page.locator(
    `[data-testid="mr-room-track"][data-room-id="${roomId}"]`
  );
  const box = await track.boundingBox();
  if (!box) throw new Error("时间轴轨道不可见");
  await page.mouse.click(box.x + box.width * ratio, box.y + box.height / 2);
}

export async function tap(locator) {
  await locator.focus();
  await locator.press("Enter");
}

export async function pickFormTimes(page, start, end) {
  await tid(page, "mr-form-start").click();
  await tid(page, `mr-time-start-${start}`).click();
  await expect(tid(page, "mr-form-start")).toHaveText(start);
  await tid(page, "mr-form-end").click();
  await tid(page, `mr-time-end-${end}`).click();
  await expect(tid(page, "mr-form-end")).toHaveText(end);
}

export async function dragWeekSlot(page, roomId) {
  const track = page.locator(
    `[data-testid="mr-room-track"][data-room-id="${roomId}"]`
  );
  const box = await track.boundingBox();
  if (!box) throw new Error("周视图轨道不可见");
  // 周二 14:00 → 周三 14:00（5 列工作周）
  const x1 = box.x + box.width * ((1 + 840 / 1440) / 5);
  const x2 = box.x + box.width * ((2 + 840 / 1440) / 5);
  const y = box.y + box.height / 2;
  await page.mouse.move(x1, y);
  await page.mouse.down();
  await page.mouse.move(x2, y, { steps: 8 });
  await page.mouse.up();
}
