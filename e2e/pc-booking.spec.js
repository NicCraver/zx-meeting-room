import { expect, test } from "@playwright/test";
import { expectFitsViewport, openMeeting, pickEveningSlot, waitPcBoard } from "./helpers.js";

test.describe("PC 预定漏斗", () => {
  test("打开弹层、提交、在我的预定里释放", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);

    const tomorrow = page.getByRole("button", { name: /明天/ });
    await page.locator(".pc-date-select").click();
    if (await tomorrow.isVisible().catch(() => false)) {
      await tomorrow.click();
    } else {
      await page.keyboard.press("Escape");
    }

    await page.getByRole("button", { name: /预约 / }).first().click();
    const form = page.locator(".create-schedule-form");
    await expect(form).toBeVisible();
    await expectFitsViewport(page.locator(".create-schedule-dialog"), page);

    const title = `e2e-${Date.now()}`;
    await form.getByLabel("会议主题").fill(title);
    await pickEveningSlot(page);
    const submit = page.getByRole("button", { name: "提交预定" });
    await expect(submit).toBeEnabled({ timeout: 20_000 });
    await submit.click();

    await expect(page.getByText(/预定成功/)).toBeVisible({ timeout: 20_000 });

    await page.getByRole("button", { name: "我的预定" }).click();
    const dialog = page.locator(".mine-bookings-dialog");
    await expect(dialog).toBeVisible();
    await expectFitsViewport(dialog, page);
    await expect(dialog.getByText("已预定")).toBeVisible();
    const card = dialog.locator(`[data-booking-title="${title}"]`);
    await expect(card).toBeVisible();
    const releaseBtn = card.getByRole("button", { name: "释放会议室" });
    test.skip((await releaseBtn.count()) === 0, "新预定已结束，无法释放");
    await releaseBtn.click();
    await page.getByRole("button", { name: "确认释放" }).click();
    await expect(page.getByText("会议室已提前释放")).toBeVisible();
    await expect(dialog.getByText("已结束")).toBeVisible();
    await expect(dialog.locator(`[data-booking-title="${title}"]`)).toBeVisible();
  });
});
