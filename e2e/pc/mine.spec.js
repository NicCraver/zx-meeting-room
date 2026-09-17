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

  test("卡片展示会议主题，房间名退到副文案", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    await openMine(page);
    const live = mineCard(page, "bk-mine-pm");
    await expect(live.getByTestId("mr-mine-title")).toHaveText("我的周会");
    await expect(live).toContainText("星海");
    await expect(live.getByTestId("mr-mine-remark")).toHaveText("说明：议程：周进度");
    await expect(mineCard(page, "bk-mine-ended").getByTestId("mr-mine-title")).toHaveText(
      "昨日评审"
    );
    await expect(mineCard(page, "bk-mine-ended").getByTestId("mr-mine-remark")).toHaveCount(0);
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

  test("弹窗容器具有圆角且溢出隐藏，底部圆角不被直角子元素遮盖", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    await openMine(page);

    const dialog = page.locator(".mine-bookings-dialog");
    await expect(dialog).toBeVisible();

    const styles = await dialog.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        borderRadius: cs.borderRadius,
        overflow: cs.overflow,
        borderBottomLeftRadius: cs.borderBottomLeftRadius,
        borderBottomRightRadius: cs.borderBottomRightRadius
      };
    });

    expect(styles.borderRadius).toBe("8px");
    expect(styles.overflow).toBe("hidden");
    expect(styles.borderBottomLeftRadius).toBe("8px");
    expect(styles.borderBottomRightRadius).toBe("8px");

    // 不应存在无用的空 footer
    await expect(page.locator(".mine-bookings-dialog .el-dialog__footer")).toHaveCount(0);

    // 弹窗 body 不额外叠加 20px padding，由内部内容统一控制 16px 边距
    const bodyPadding = await dialog.locator(".el-dialog__body").evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return cs.padding;
    });
    expect(bodyPadding).toBe("0px");
  });

  test("加载中展示 AcPageLoading 并带「数据加载中...」文案", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);

    let fulfillMine;
    await page.route("**/bookings/mine*", async (route) => {
      await new Promise((resolve) => {
        fulfillMine = () =>
          route.fulfill({ json: { code: 0, data: [] } }).then(resolve);
      });
    });

    await tid(page, "mr-toolbar-mine").click();
    await tid(page, "mr-dialog-mine").waitFor();

    const loadingEl = tid(page, "mr-mine-loading");
    await expect(loadingEl).toBeVisible();
    await expect(loadingEl).toContainText("数据加载中...");
    await expect(loadingEl.locator(".animate-spin")).toBeVisible();

    // 接口返回后 loading 消失并展示空态
    await fulfillMine();
    await expect(loadingEl).toBeHidden();
    await expect(tid(page, "mr-mine-empty")).toBeVisible();
  });
});
