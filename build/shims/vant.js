/**
 * zx（PC WebView）构建专用的 vant 替身。
 *
 * 为什么能替：resolveDevice() 对 zx 入口恒返回 "pc"，
 * utils/dialog.js 里的 Vant 分支不可达。
 * 同样不做成空对象：setMobileEnv(true) 强制切换时转发到 Element Plus 兜底。
 */
import { ElMessage, ElMessageBox } from "element-plus";

const message = (options) =>
  typeof options === "string" ? options : options.message;

// 转发到 Element Plus 时故意丢弃的次要选项：Vant 的 duration / forbidClick /
// overlayStyle 等在 Element Plus 侧没有等价物，不逐个搬运——行为降级但不报错。
export const showToast = (options) => ElMessage({ message: message(options) });
export const showSuccessToast = (options) =>
  ElMessage.success({ message: message(options) });
export const showFailToast = (options) =>
  ElMessage.error({ message: message(options) });
export const closeToast = () => ElMessage.closeAll();

export const showDialog = (options = {}) =>
  ElMessageBox.confirm(message(options), options.title || "提示", {
    confirmButtonText: options.confirmButtonText || "确定",
    showCancelButton: false,
    autofocus: false
  });

export const showConfirmDialog = (options = {}) =>
  ElMessageBox.confirm(message(options), options.title || "提示", {
    confirmButtonText: options.confirmButtonText || "确定",
    cancelButtonText: options.cancelButtonText || "取消",
    autofocus: false
  });
