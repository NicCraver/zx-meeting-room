import { expect, test } from "@playwright/test";
import { createStore, openMeeting } from "../helpers/open.js";
import { expectToast } from "../helpers/expect.js";
import { tid } from "../locators.js";

const gotoAdmin = async (page, store, path = "/ai-meet/zx/admin") => {
  await openMeeting(page, { path, store: store || createStore() });
  await expect(
    page.getByRole("heading", { name: /会议室管理|新建会议室|编辑会议室/ })
  ).toBeVisible();
};

test.describe("管理 · 会议室", () => {
  test("列表加载含启用与停用房", async ({ page }) => {
    await gotoAdmin(page);
    await expect(page.getByText("星海")).toBeVisible();
    await expect(page.getByText("停用房")).toBeVisible();
  });

  test("搜索", async ({ page }) => {
    await gotoAdmin(page);
    await page.getByPlaceholder("搜索会议室").fill("明月");
    await expect(page.getByText("星海")).toHaveCount(0, { timeout: 5_000 });
    await expect(page.getByText("明月")).toBeVisible();
  });

  test("新建必填校验", async ({ page }) => {
    await gotoAdmin(page, undefined, "/ai-meet/zx/admin/rooms/new");
    await expect(page.getByRole("heading", { name: "新建会议室" })).toBeVisible();
    await tid(page, "mr-admin-save").click();
    await expectToast(page, "请检查表单必填项");
  });

  test("新建成功回列表", async ({ page }) => {
    const store = createStore();
    await gotoAdmin(page, store, "/ai-meet/zx/admin/rooms/new");
    await page.getByPlaceholder("例如：1号会议室（1-30字）").fill("e2e新房");
    await page.getByTestId("mr-form-building").click();
    await page.getByRole("option", { name: "奥城" }).click();
    await page.getByTestId("mr-form-floor").click();
    await page.getByRole("option", { name: "2层", exact: true }).click();
    await page.locator(".el-input-number input").fill("6");
    await tid(page, "mr-admin-save").click();
    await expectToast(page, "保存成功");
    await expect(page.getByText("e2e新房")).toBeVisible();
  });

  test("编辑回填 locationDesc", async ({ page }) => {
    await gotoAdmin(page, undefined, "/ai-meet/zx/admin/rooms/room-a");
    await expect(page.getByRole("heading", { name: "编辑会议室" })).toBeVisible();
    await expect(
      page.getByPlaceholder(/上限50字/)
    ).toHaveValue("7层711办公室旁边");
  });

  test("停用确认后看板消失", async ({ page }) => {
    const store = createStore();
    await gotoAdmin(page, store);
    await page
      .locator('[data-testid="mr-admin-room-toggle"][data-room-id="room-a"]')
      .click();
    await page.getByRole("button", { name: "确定停用" }).click();
    await expect
      .poll(() => store.state.rooms.find((r) => r.id === "room-a")?.enabled)
      .toBe(false);
  });

  test("脏离开提示", async ({ page }) => {
    await gotoAdmin(page, undefined, "/ai-meet/zx/admin/rooms/new");
    await page.getByPlaceholder("例如：1号会议室（1-30字）").fill("未保存");
    await page.getByRole("button", { name: "返回" }).click();
    await expect(page.getByText("放弃未保存的修改？")).toBeVisible();
    await page.getByRole("button", { name: "继续编辑" }).click();
    await expect(page.getByRole("heading", { name: "新建会议室" })).toBeVisible();
  });
});
