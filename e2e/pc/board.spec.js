import { expect, test } from "@playwright/test";
import { createStore, openMeeting, waitPcBoard } from "../helpers/open.js";
import { expectToast } from "../helpers/expect.js";
import { tid } from "../locators.js";
import { TODAY, TOMORROW } from "../helpers/clock.js";

test.describe("PC 看板", () => {
  test("zx 时间轴出现房间、搜索、预约、我的预定", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    await expect(tid(page, "mr-toolbar-search")).toBeVisible();
    await expect(tid(page, "mr-toolbar-book")).toHaveText("+ 预约会议室");
    await expect(tid(page, "mr-toolbar-mine")).toBeVisible();
    await expect(page.getByText("星海").first()).toBeVisible();
    await expect(page.getByText("明月").first()).toBeVisible();
    await expect(page.getByText("停用房")).toHaveCount(0);
  });

  test("日视图默认滚到当前时间", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    const board = tid(page, "mr-board");
    await expect
      .poll(async () => board.evaluate((el) => el.scrollLeft))
      .toBeGreaterThan(0);
    const nowLine = page.locator(".tl-line-now");
    await expect(nowLine).toBeVisible();
    const [boardBox, nowBox] = await Promise.all([
      board.boundingBox(),
      nowLine.boundingBox()
    ]);
    expect(nowBox.x).toBeGreaterThan(boardBox.x);
    expect(nowBox.x).toBeLessThan(boardBox.x + boardBox.width);
  });

  test("main 登录后是预定看板", async ({ page }) => {
    await openMeeting(page, { path: "/ai-meet/" });
    await waitPcBoard(page);
    await expect(tid(page, "mr-board")).toBeVisible();
  });

  test("搜索命中与空态", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    await tid(page, "mr-toolbar-search").fill("__no_such_room__");
    await expect(tid(page, "mr-board-empty")).toBeVisible();
    await expect(tid(page, "mr-board-empty")).toContainText(
      "没有符合筛选条件的会议室"
    );
    await tid(page, "mr-toolbar-search").fill("星海");
    await expect(page.getByText("星海").first()).toBeVisible();
    await expect(tid(page, "mr-room-row")).toHaveCount(1);
  });

  test("日周切换", async ({ page }) => {
    await openMeeting(page);
    await waitPcBoard(page);
    await tid(page, "mr-view-week").click();
    await expect(tid(page, "mr-view-week")).toHaveAttribute("aria-checked", "true");
    await expect(tid(page, "mr-board")).toHaveClass(/is-week/);
    await tid(page, "mr-view-day").click();
    await expect(tid(page, "mr-view-day")).toHaveAttribute("aria-checked", "true");
  });

  test("切到明天会请求对应日期", async ({ page }) => {
    const store = createStore();
    await openMeeting(page, { store });
    await waitPcBoard(page);
    await tid(page, "mr-date-select").click();
    await page.getByRole("button", { name: /明天/ }).click();
    await expect.poll(() => store.state.lastBoardDate).toBe(TOMORROW);
  });

  test("前一天后一天回到今天", async ({ page }) => {
    const store = createStore();
    await openMeeting(page, { store });
    await waitPcBoard(page);
    await tid(page, "mr-date-next").click();
    await expect.poll(() => store.state.lastBoardDate).toBe(TOMORROW);
    await tid(page, "mr-date-today").click();
    await expect.poll(() => store.state.lastBoardDate).toBe(TODAY);
    await tid(page, "mr-date-prev").click();
    await expect
      .poll(() => store.state.lastBoardDate)
      .toBe(TODAY);
  });

  test("board 失败空列表 + toast", async ({ page }) => {
    await openMeeting(page, { store: createStore({ boardFail: true }) });
    await expectToast(page, "加载失败");
    await expect(tid(page, "mr-board-empty")).toBeVisible();
  });

  test("空房间点预约 toast 暂无会议室", async ({ page }) => {
    await openMeeting(page, { store: createStore({ rooms: [] }) });
    await expect(tid(page, "mr-board-empty")).toBeVisible();
    await tid(page, "mr-toolbar-book").click();
    await expectToast(page, "暂无会议室");
  });
});
