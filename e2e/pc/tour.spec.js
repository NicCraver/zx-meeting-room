import { expect, test } from "@playwright/test";
import { openMeeting, waitPcBoard } from "../helpers/open.js";
import { tid } from "../locators.js";

test.describe("新手指引", () => {
  test("首次自动弹出六步锚点", async ({ page }) => {
    await openMeeting(page, { skipTour: false });
    await waitPcBoard(page);
    await expect(page.locator(".driver-popover")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".driver-popover-title")).toContainText("会议室表格");
    const box = await page.locator(".driver-popover").boundingBox();
    const vp = page.viewportSize();
    expect(box.y + box.height / 2).toBeGreaterThan(vp.height * 0.3);
    expect(box.y + box.height / 2).toBeLessThan(vp.height * 0.7);
  });

  test("关闭后写入 localStorage，刷新不再弹", async ({ page }) => {
    await openMeeting(page, { skipTour: false });
    await waitPcBoard(page);
    await expect(page.locator(".driver-popover-close-btn")).toBeVisible({
      timeout: 15_000
    });
    await page.locator(".driver-popover-close-btn").click();
    const seen = await page.evaluate(() => localStorage.getItem("mr_tour_v1"));
    expect(seen).toBe("1");
    await page.reload();
    await waitPcBoard(page);
    await expect(page.locator(".driver-popover")).toHaveCount(0);
  });

  test("拖动预约高亮具体时段格子，下一步后与完成后不显示", async ({ page }) => {
    await openMeeting(page, { skipTour: false });
    await waitPcBoard(page);
    await expect(page.locator(".driver-popover-title")).toContainText("会议室表格");
    await page.locator(".driver-popover-next-btn").click();
    await expect(page.locator(".driver-popover-title")).toContainText("空白格子");
    await page.locator(".driver-popover-next-btn").click();
    await expect(page.locator(".driver-popover-title")).toContainText("拖动预约");
    const slot = tid(page, "mr-tour-drag-slot");
    await expect(slot).toBeVisible();
    await expect(slot).toHaveClass(/driver-active-element/);
    await expect(slot.locator(".tl-tour-drag-label")).toHaveText(
      /\d{2}:\d{2}-\d{2}:\d{2}/
    );
    const box = await slot.boundingBox();
    const trackBox = await page
      .locator('[data-testid="mr-room-track"]')
      .first()
      .boundingBox();
    expect(box.width).toBeGreaterThan(40);
    expect(box.width).toBeLessThan(trackBox.width * 0.2);

    // 下一步后应该不显示
    await page.locator(".driver-popover-next-btn").click();
    await expect(page.locator(".driver-popover-title")).toContainText(
      "+ 预约会议室"
    );
    await expect(slot).not.toBeVisible();

    // 引导关闭后也不显示
    await page.locator(".driver-popover-close-btn").click();
    await expect(page.locator(".driver-popover")).toHaveCount(0);
    await expect(slot).not.toBeVisible();
  });

  test("问号重播指引", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    await tid(page, "mr-toolbar-tour").click();
    await expect(page.locator(".driver-popover")).toBeVisible();
  });
});
