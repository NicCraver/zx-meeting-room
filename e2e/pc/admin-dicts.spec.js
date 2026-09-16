import { expect, test } from "@playwright/test";
import { createStore, openMeeting } from "../helpers/open.js";
import { expectToast } from "../helpers/expect.js";
import { tid } from "../locators.js";

const openDicts = async (page, store) => {
  await openMeeting(page, {
    path: "/ai-meet/zx/admin/dicts",
    store: store || createStore()
  });
  await expect(page.getByRole("heading", { name: "字典表" })).toBeVisible();
};

test.describe("管理 · 字典", () => {
  test("Tab 建筑/设施有计数", async ({ page }) => {
    await openDicts(page);
    await expect(tid(page, "mr-dict-tab-building")).toContainText("2");
    await expect(tid(page, "mr-dict-tab-facility")).toContainText("3");
  });

  test("新增字典", async ({ page }) => {
    await openDicts(page);
    await tid(page, "mr-dict-create").click();
    await expect(page.locator("#dict-name")).toBeVisible();
    await page.locator("#dict-name").fill("高新");
    await tid(page, "mr-dialog-submit").click();
    await expectToast(page, "已新增");
    await expect(page.getByText("高新")).toBeVisible();
  });

  test("同名错误", async ({ page }) => {
    await openDicts(page);
    await tid(page, "mr-dict-create").click();
    await expect(page.locator("#dict-name")).toBeVisible();
    await page.locator("#dict-name").fill("奥城");
    await tid(page, "mr-dialog-submit").click();
    await expect(page.getByRole("alert")).toContainText("同类型下已有相同名称");
  });

  test("有引用不能删", async ({ page }) => {
    await openDicts(page);
    await page.getByRole("row", { name: /奥城/ }).getByTestId("mr-dict-delete").click();
    await expectToast(page, /正在使用/);
  });

  test("无引用可删", async ({ page }) => {
    const store = createStore();
    store.state.dicts.push({
      id: "d-spare",
      type: "building",
      name: "闲置楼",
      sort: 9,
      enabled: true,
      usageCount: 0
    });
    await openDicts(page, store);
    await page.getByRole("row", { name: /闲置楼/ }).getByTestId("mr-dict-delete").click();
    await page.getByRole("button", { name: "确定删除" }).click();
    await expectToast(page, "已删除");
  });
});
