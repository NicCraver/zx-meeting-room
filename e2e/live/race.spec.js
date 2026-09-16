import { expect, test } from "@playwright/test";
import { javaReady, openLive } from "./helpers.js";

test.describe("live 抢订", () => {
  test.beforeAll(async () => {
    if (!(await javaReady())) {
      test.skip(true, "contact Java :7004 未就绪");
    }
  });

  test("两人同时订同一空档，一人成功一人 M4010", async ({ page }) => {
    await openLive(page, "/ai-meet/race");
    const empty = page.getByText("明天没有 30 分钟空档");
    if (await empty.isVisible({ timeout: 8_000 }).catch(() => false)) {
      test.skip(true, "明天没有 30 分钟空档");
    }
    const fire = page.getByRole("button", { name: "同时预定" });
    await expect(fire).toBeEnabled({ timeout: 20_000 });
    await fire.click();
    await expect(page.getByText(/串行|一人成功|M4010|重叠/)).toBeVisible({
      timeout: 30_000
    });
    const release = page.getByRole("button", { name: "释放刚订上的" });
    if (await release.isEnabled().catch(() => false)) {
      await release.click();
    }
  });
});
