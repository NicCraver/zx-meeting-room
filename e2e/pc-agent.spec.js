import { expect, test } from "@playwright/test";
import { openMeeting, waitPcBoard } from "./helpers.js";

test.describe("PC 助手", () => {
  test("快捷芯片会进入助手会话", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    await expect(page.locator("#tour-ai-input")).toBeVisible();
    const chip = page.locator(".booking-ai-chip", { hasText: "找空闲会议室" });
    await expect(chip).toBeVisible();
    await chip.click({ force: true });
    await expect(
      page.locator(".booking-ai-status, .ai-buddy-card, [role='alert']").first()
    ).toBeVisible({ timeout: 25_000 });
  });
});
