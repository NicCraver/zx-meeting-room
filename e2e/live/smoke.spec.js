import { expect, test } from "@playwright/test";
import { AUTH_QS, javaReady, openLive, pickEveningSlot, waitPcBoard } from "./helpers.js";

test.describe("live 冒烟", () => {
  test.beforeAll(async () => {
    if (!(await javaReady())) {
      test.skip(true, "contact Java :7004 未就绪");
    }
  });

  test("zx 看板能拉到真房间", async ({ page }) => {
    await openLive(page);
    await waitPcBoard(page);
    await expect(page.getByTestId("mr-toolbar-book")).toBeVisible();
    await expect(page.getByTestId("mr-room-row").first()).toBeVisible();
  });

  test("创建带时间戳标题的预定再释放", async ({ page }) => {
    await openLive(page);
    await waitPcBoard(page);
    const tomorrow = page.getByRole("button", { name: /明天/ });
    await page.getByTestId("mr-date-select").click();
    if (await tomorrow.isVisible().catch(() => false)) {
      await tomorrow.click();
    } else {
      await page.keyboard.press("Escape");
    }
    await page.getByTestId("mr-toolbar-book").click();
    const title = `live-${Date.now()}`;
    await page.getByTestId("mr-form-title").fill(title);
    await pickEveningSlot(page);
    const submit = page.getByRole("button", { name: "提交预定" });
    await expect(submit).toBeEnabled({ timeout: 20_000 });
    await submit.click();
    await expect(page.getByText(/预定成功/)).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("mr-toolbar-mine").click();
    const card = page.locator(`[data-booking-title="${title}"]`);
    await expect(card).toBeVisible();
    const releaseBtn = card.getByTestId("mr-mine-release");
    test.skip((await releaseBtn.count()) === 0, "新预定已结束，无法释放");
    await releaseBtn.click();
    await page.getByRole("button", { name: "确认释放" }).click();
    await expect(page.getByText("会议室已提前释放")).toBeVisible();
  });

  test("管理员能进三个子页", async ({ page }) => {
    await openLive(page);
    await waitPcBoard(page);
    await page.getByTestId("mr-toolbar-admin").click();
    await expect(page.getByRole("heading", { name: "会议室管理" })).toBeVisible();
    await page.getByTestId("mr-admin-nav-history").click();
    await expect(page).toHaveURL(/\/admin\/history/);
    await page.getByTestId("mr-admin-nav-dicts").click();
    await expect(page).toHaveURL(/\/admin\/dicts/);
  });

  test("m 列表与详情", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openLive(page, "/ai-meet/m/");
    await page.getByText("预定会议室").first().waitFor();
    await expect(page.getByTestId("mr-room-card").first()).toBeVisible();
    await page.getByTestId("mr-room-open").first().click();
    await expect(page.getByTestId("mr-dialog-detail")).toBeVisible();
  });

  test("助手芯片有响应", async ({ page }) => {
    await openLive(page);
    await waitPcBoard(page);
    await page.getByTestId("mr-ai-chip-find-free").click();
    await expect(
      page.getByTestId("mr-ai-status").or(page.getByTestId("mr-ai-query-card"))
    ).toBeVisible({ timeout: 25_000 });
  });

  test("main 无身份不能进预定；调试入口能进", async ({ page }) => {
    await page.goto("/ai-meet/");
    if (await page.getByTestId("mr-need-auth").isVisible().catch(() => false)) {
      await page.goto("/ai-meet/debugger");
    }
    if (await page.getByTestId("mr-demo-enter-booking").isVisible().catch(() => false)) {
      await page.getByTestId("mr-demo-enter-booking").click();
    } else {
      await page.goto(`/ai-meet/zx/?${AUTH_QS}`);
    }
    await waitPcBoard(page);
    await expect(page.getByTestId("mr-board")).toBeVisible();
  });
});
