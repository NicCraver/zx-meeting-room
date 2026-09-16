import { expect, test } from "@playwright/test";
import { createStore, openMeeting, openMine, waitPcBoard } from "../helpers/open.js";
import { expectToast } from "../helpers/expect.js";
import { mineCard, tid } from "../locators.js";

test.describe("PC 我的预定", () => {
  test("打开弹层有 live / past 分区", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    await openMine(page);
    await expect(tid(page, "mr-mine-section-live")).toBeVisible();
    await expect(tid(page, "mr-mine-section-past")).toBeVisible();
    await expect(mineCard(page, "bk-mine-pm")).toBeVisible();
    await expect(mineCard(page, "bk-mine-ended")).toBeVisible();
  });

  test("upcoming 能释放，ended 没有释放按钮", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    await openMine(page);
    await expect(mineCard(page, "bk-mine-pm").getByTestId("mr-mine-release")).toBeVisible();
    await expect(mineCard(page, "bk-mine-ended").getByTestId("mr-mine-release")).toHaveCount(0);
  });

  test("确认释放后进已结束，看板空出", async ({ page }) => {
    const store = createStore();
    await openMeeting(page, { store });
    await waitPcBoard(page);
    await openMine(page);
    await mineCard(page, "bk-mine-pm").getByTestId("mr-mine-release").click();
    await page.getByRole("button", { name: "确认释放" }).click();
    await expectToast(page, "会议室已提前释放");
    await expect.poll(() =>
      store.state.bookings.find((b) => b.id === "bk-mine-pm")?.status
    ).toBe("released");
  });

  test("取消确认不释放", async ({ page }) => {
    const store = createStore();
    await openMeeting(page, { store });
    await waitPcBoard(page);
    await openMine(page);
    await mineCard(page, "bk-mine-pm").getByTestId("mr-mine-release").click();
    await page.getByRole("button", { name: "取消" }).click();
    expect(store.state.bookings.find((b) => b.id === "bk-mine-pm").status).toBe(
      "upcoming"
    );
  });

  test("空列表暂无预定", async ({ page }) => {
    await openMeeting(page, { store: createStore({ bookings: [] }) });
    await waitPcBoard(page);
    await openMine(page);
    await expect(tid(page, "mr-mine-empty")).toBeVisible();
  });

  test("接口失败 toast 列表空", async ({ page }) => {
    await openMeeting(page, { store: createStore({ mineFail: true }) });
    await waitPcBoard(page);
    await tid(page, "mr-toolbar-mine").click();
    await expectToast(page, "加载失败");
  });

  test("没有修改预定按钮", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    await openMine(page);
    await expect(page.getByRole("button", { name: /修改预定/ })).toHaveCount(0);
  });
});
