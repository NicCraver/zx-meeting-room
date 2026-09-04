import { expect } from "@playwright/test";

export const AUTH_QS =
  "zxAccountId=1880150187008081921&zxCorpId=6&zxClientType=app";

export const meetingUrl = (path = "/ai-meet/zx/") => {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}${AUTH_QS}`;
};

/** 跳过首次使用指引；每条用例独立 origin。 */
export async function openMeeting(page, path = "/ai-meet/zx/") {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("mr_tour_v1", "1");
    } catch {
      /* ignore */
    }
  });
  await page.goto(meetingUrl(path));
  const closeTour = page.locator(".driver-popover-close-btn");
  if (await closeTour.isVisible({ timeout: 1500 }).catch(() => false)) {
    await closeTour.click();
  }
}

export async function waitPcBoard(page) {
  await page.locator('[data-tour="room-table"]').waitFor();
  await page.getByText("数据加载中...").waitFor({ state: "hidden" }).catch(() => {});
  await page.locator(".tl-room-name-text").first().waitFor();
}

export async function waitMobileBoard(page) {
  await page.getByText("预定会议室").first().waitFor();
  await page.locator(".m-room-card, .m-empty").first().waitFor();
}

/** 弹层整体落在视口内，底部不被裁掉。 */
export async function expectFitsViewport(locator, page) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  const vp = page.viewportSize();
  const height = vp?.height || 900;
  expect(box, "应能量到弹层盒子").toBeTruthy();
  expect(box.y).toBeGreaterThanOrEqual(-1);
  expect(box.y + box.height).toBeLessThanOrEqual(height + 2);
}

/** 避开中午占用，改成开放时间内的 19:00–20:00。 */
export async function pickEveningSlot(page) {
  const visiblePop = () =>
    page.locator(".dt-time-pop").filter({ visible: true });

  await page.getByRole("button", { name: "开始时间" }).click();
  const startItem = visiblePop().getByRole("button", { name: "19:00", exact: true });
  await startItem.scrollIntoViewIfNeeded();
  await startItem.click();
  await expect(page.getByRole("button", { name: "开始时间" })).toHaveText("19:00");

  await page.getByRole("button", { name: "结束时间" }).click();
  const endItem = visiblePop()
    .last()
    .locator(".dt-time-item")
    .filter({ hasText: "(1小时)" })
    .filter({ hasText: "20:00" });
  await endItem.scrollIntoViewIfNeeded();
  await endItem.click();
  await expect(page.getByRole("button", { name: "结束时间" })).toHaveText("20:00");
  await expect(page.getByRole("alert")).toHaveCount(0, { timeout: 15_000 });
}
