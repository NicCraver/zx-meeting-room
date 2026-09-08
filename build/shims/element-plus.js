/**
 * m（移动 WebView）构建专用的 element-plus 替身。
 *
 * 为什么能替：src/composables/device.js 的 resolveDevice() 对 m 入口恒返回
 * "mobile"，utils/dialog.js 里的 Element Plus 分支不可达。
 * 为什么不做成空对象：setMobileEnv(false) 可以强制切到 pc 形态，那时会真的
 * 调进来——转发到 Vant 后行为降级但不报错，比抛 undefined 强。
 */
import { h } from "vue";
import {
  showSuccessToast,
  showFailToast,
  showToast,
  showConfirmDialog
} from "vant";

// 转发到 Vant 时故意丢弃的次要选项：Element Plus 的 duration / appendTo /
// showClose 等在 Vant toast 里没有等价物，不逐个搬运——行为降级但不报错。
const toast = (options, type) => {
  const message = typeof options === "string" ? options : options.message;
  if (type === "success") return showSuccessToast({ message, forbidClick: true });
  if (type === "error") return showFailToast({ message, forbidClick: true });
  return showToast({ message, forbidClick: true });
};

export const ElMessage = Object.assign(
  (options = {}) => toast(options, options.type),
  {
    success: (options) => toast(options, "success"),
    error: (options) => toast(options, "error"),
    warning: (options) => toast(options, "warning"),
    info: (options) => toast(options, "info"),
    closeAll: () => {}
  }
);

// 转发到 Vant 时同样丢弃 distinguishCancelAndClose / closeOnClickModal /
// closeOnPressEscape 等 Element Plus 专属选项——Vant 弹框没有对应能力，
// 行为降级但不报错。
export const ElMessageBox = {
  confirm: (message, title, options = {}) =>
    showConfirmDialog({
      title: title || "提示",
      message,
      confirmButtonText: options.confirmButtonText || "确定",
      cancelButtonText: options.cancelButtonText || "取消",
      showCancelButton: options.showCancelButton !== false,
      confirmButtonColor: "#3E7EFF"
    }),
  alert: (message, title, options = {}) =>
    showConfirmDialog({
      title: title || "提示",
      message,
      confirmButtonText: options.confirmButtonText || "确定",
      showCancelButton: false,
      confirmButtonColor: "#3E7EFF"
    })
};

/** el-scrollbar 在移动端退化成原生滚动容器 */
export const ElScrollbar = {
  name: "ElScrollbarShim",
  setup(_, { slots }) {
    return () =>
      h("div", { class: "el-scrollbar", style: "overflow:auto" }, slots.default ? slots.default() : []);
  }
};
