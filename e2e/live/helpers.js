import { expect } from "@playwright/test";

export const AUTH_QS =
  "zxAccountId=1880150187008081921&zxCorpId=6&zxClientType=app";

export const meetingUrl = (path = "/ai-meet/zx/") => {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}${AUTH_QS}`;
};

export async function javaReady() {
  try {
    const res = await fetch("http://127.0.0.1:7004/swagger-ui.html", {
      signal: AbortSignal.timeout(3000)
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function openLive(page, path = "/ai-meet/zx/") {
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
  await page.getByTestId("mr-board").waitFor({ timeout: 20_000 });
  await page.getByText("数据加载中...").waitFor({ state: "hidden" }).catch(() => {});
}

export async function pickEveningSlot(page) {
  const visiblePop = () => page.locator(".dt-time-pop").filter({ visible: true });

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
}
