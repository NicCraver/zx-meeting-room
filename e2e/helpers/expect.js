import { expect } from "@playwright/test";

export async function expectFitsViewport(locator, page) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  const vp = page.viewportSize();
  const height = vp?.height || 900;
  expect(box, "应能量到弹层盒子").toBeTruthy();
  expect(box.y).toBeGreaterThanOrEqual(-1);
  expect(box.y + box.height).toBeLessThanOrEqual(height + 2);
}

/** PC Element Plus / 移动 Vant 成功或失败 toast。 */
export async function expectToast(page, text, { mobile = false } = {}) {
  const loc = mobile
    ? page.locator(".van-toast, .el-message").filter({ hasText: text })
    : page.locator(".el-message").filter({ hasText: text });
  await expect(loc.first()).toBeVisible();
}

export const visibleTimePop = (page) =>
  page.locator(".dt-time-pop").filter({ visible: true });
