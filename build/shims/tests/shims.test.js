/**
 * 验证 element-plus.js / vant.js 两个转发 shim 的真实调用行为——
 * Playwright 只验证过页面能挂载，从没有真正跑到过转发代码；
 * 这里用 vi.mock 顶替对端库，断言转发目标、参数与 Promise 决议方式。
 */
import assert from "node:assert/strict";
import { beforeEach, test, vi } from "vitest";
import { h } from "vue";

// ---------------------------------------------------------------------------
// build/shims/element-plus.js —— m 构建下把 ElMessage / ElMessageBox 转发到 vant
// ---------------------------------------------------------------------------
const vantMocks = vi.hoisted(() => ({
  showSuccessToast: vi.fn(),
  showFailToast: vi.fn(),
  showToast: vi.fn(),
  showConfirmDialog: vi.fn()
}));
vi.mock("vant", () => vantMocks);

// ---------------------------------------------------------------------------
// build/shims/vant.js —— zx 构建下把 Vant 的 toast / dialog 转发到 element-plus
// ---------------------------------------------------------------------------
const elementPlusMocks = vi.hoisted(() => {
  const ElMessage = Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    closeAll: vi.fn()
  });
  return { ElMessage, ElMessageBox: { confirm: vi.fn() } };
});
vi.mock("element-plus", () => elementPlusMocks);

import { ElMessage, ElMessageBox, ElScrollbar } from "../element-plus.js";
import {
  showToast,
  showSuccessToast,
  showFailToast,
  closeToast,
  showDialog,
  showConfirmDialog
} from "../vant.js";

beforeEach(() => {
  vantMocks.showSuccessToast.mockReset();
  vantMocks.showFailToast.mockReset();
  vantMocks.showToast.mockReset();
  vantMocks.showConfirmDialog.mockReset();
  elementPlusMocks.ElMessage.mockReset();
  elementPlusMocks.ElMessage.success.mockReset();
  elementPlusMocks.ElMessage.error.mockReset();
  elementPlusMocks.ElMessage.closeAll.mockReset();
  elementPlusMocks.ElMessageBox.confirm.mockReset();
});

// ---- element-plus.js ----

test("ElMessage.success 转发到 showSuccessToast", () => {
  ElMessage.success("成功");
  assert.equal(vantMocks.showSuccessToast.mock.calls.length, 1);
  assert.deepEqual(vantMocks.showSuccessToast.mock.calls[0][0], {
    message: "成功",
    forbidClick: true
  });
});

test("ElMessage.error 转发到 showFailToast", () => {
  ElMessage.error("失败");
  assert.equal(vantMocks.showFailToast.mock.calls.length, 1);
  assert.deepEqual(vantMocks.showFailToast.mock.calls[0][0], {
    message: "失败",
    forbidClick: true
  });
});

test("可调用形式 ElMessage({ type: 'warning', ... }) 落到 showToast", () => {
  ElMessage({ type: "warning", message: "请注意" });
  assert.equal(vantMocks.showToast.mock.calls.length, 1);
  assert.deepEqual(vantMocks.showToast.mock.calls[0][0], {
    message: "请注意",
    forbidClick: true
  });
});

test("ElMessageBox.confirm 转发到 showConfirmDialog，双按钮", () => {
  ElMessageBox.confirm("确认删除吗", "警告", {
    confirmButtonText: "删除",
    cancelButtonText: "手下留情"
  });
  assert.equal(vantMocks.showConfirmDialog.mock.calls.length, 1);
  assert.deepEqual(vantMocks.showConfirmDialog.mock.calls[0][0], {
    title: "警告",
    message: "确认删除吗",
    confirmButtonText: "删除",
    cancelButtonText: "手下留情",
    showCancelButton: true,
    confirmButtonColor: "#3E7EFF"
  });
});

test("ElMessageBox.confirm 的 resolve/reject 与 dialog.js confirmAsk 的消费方式一致", async () => {
  // confirmAsk 里是 showConfirmDialog(...).then(() => true).catch(() => false)，
  // 要求转发出去的 promise 在“确定”时 resolve、在“取消”时 reject，
  // 而不是把取消也当成一种 resolve 值。
  vantMocks.showConfirmDialog.mockResolvedValueOnce(undefined);
  const confirmed = await ElMessageBox.confirm("继续吗", "提示")
    .then(() => true)
    .catch(() => false);
  assert.equal(confirmed, true);

  vantMocks.showConfirmDialog.mockRejectedValueOnce(new Error("cancel"));
  const cancelled = await ElMessageBox.confirm("继续吗", "提示")
    .then(() => true)
    .catch(() => false);
  assert.equal(cancelled, false);
});

test("ElMessageBox.alert 转发时压掉取消按钮", () => {
  ElMessageBox.alert("已是最新版本", "提示", { confirmButtonText: "知道了" });
  assert.equal(vantMocks.showConfirmDialog.mock.calls.length, 1);
  assert.deepEqual(vantMocks.showConfirmDialog.mock.calls[0][0], {
    title: "提示",
    message: "已是最新版本",
    confirmButtonText: "知道了",
    showCancelButton: false,
    confirmButtonColor: "#3E7EFF"
  });
});

test("ElScrollbar 渲染容器并透传默认插槽", () => {
  const slotChildren = [h("span", "内容")];
  const vnode = ElScrollbar.setup(
    {},
    { slots: { default: () => slotChildren } }
  )();
  assert.equal(vnode.type, "div");
  assert.equal(vnode.props.class, "el-scrollbar");
  assert.equal(vnode.children, slotChildren);
});

test("ElScrollbar 无默认插槽时渲染空容器", () => {
  const vnode = ElScrollbar.setup({}, { slots: {} })();
  assert.equal(vnode.type, "div");
  assert.deepEqual(vnode.children, []);
});

// ---- vant.js ----

test("showSuccessToast 转发到 ElMessage.success", () => {
  showSuccessToast("完成");
  assert.equal(elementPlusMocks.ElMessage.success.mock.calls.length, 1);
  assert.deepEqual(elementPlusMocks.ElMessage.success.mock.calls[0][0], {
    message: "完成"
  });
});

test("showFailToast 转发到 ElMessage.error", () => {
  showFailToast({ message: "出错了" });
  assert.equal(elementPlusMocks.ElMessage.error.mock.calls.length, 1);
  assert.deepEqual(elementPlusMocks.ElMessage.error.mock.calls[0][0], {
    message: "出错了"
  });
});

test("showToast 转发到可调用的 ElMessage", () => {
  showToast("提示一下");
  assert.equal(elementPlusMocks.ElMessage.mock.calls.length, 1);
  assert.deepEqual(elementPlusMocks.ElMessage.mock.calls[0][0], {
    message: "提示一下"
  });
});

test("closeToast 转发到 ElMessage.closeAll", () => {
  closeToast();
  assert.equal(elementPlusMocks.ElMessage.closeAll.mock.calls.length, 1);
});

test("showConfirmDialog 转发到 ElMessageBox.confirm，双按钮", async () => {
  const sentinel = Promise.resolve("confirmed");
  elementPlusMocks.ElMessageBox.confirm.mockReturnValueOnce(sentinel);
  const result = showConfirmDialog({
    message: "确认吗",
    title: "确认",
    confirmButtonText: "好的",
    cancelButtonText: "不用"
  });
  assert.equal(elementPlusMocks.ElMessageBox.confirm.mock.calls.length, 1);
  assert.deepEqual(elementPlusMocks.ElMessageBox.confirm.mock.calls[0], [
    "确认吗",
    "确认",
    { confirmButtonText: "好的", cancelButtonText: "不用", autofocus: false }
  ]);
  assert.equal(await result, "confirmed");
});

test("showDialog 转发时压掉取消按钮", () => {
  showDialog({ message: "提示内容" });
  assert.equal(elementPlusMocks.ElMessageBox.confirm.mock.calls.length, 1);
  assert.deepEqual(elementPlusMocks.ElMessageBox.confirm.mock.calls[0], [
    "提示内容",
    "提示",
    { confirmButtonText: "确定", showCancelButton: false, autofocus: false }
  ]);
});
