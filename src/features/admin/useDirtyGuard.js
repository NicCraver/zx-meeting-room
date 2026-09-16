import { onBeforeUnmount, onMounted, ref } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { confirmAsk } from "@/utils";
import { formSnapshot, isFormDirty } from "./dirtyGuard";

/**
 * 表单脏检查：JSON.stringify(form) 对比 snapshot。
 * 路由离开弹确认；beforeunload 阻止浏览器直接关掉脏页。
 * @param {Record<string, unknown>} form
 */
export const useDirtyGuard = (form) => {
  const snapshot = ref(formSnapshot(form));

  const isDirty = () => isFormDirty(form, snapshot.value);

  const markClean = () => {
    snapshot.value = formSnapshot(form);
  };

  const confirmLeave = async () => {
    if (!isDirty()) return true;
    return confirmAsk("放弃未保存的修改？", {
      confirmText: "确定放弃",
      cancelText: "继续编辑"
    });
  };

  const onBeforeUnload = (e) => {
    if (!isDirty()) return;
    e.preventDefault();
  };

  onMounted(() => {
    window.addEventListener("beforeunload", onBeforeUnload);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("beforeunload", onBeforeUnload);
  });

  onBeforeRouteLeave(async () => {
    const ok = await confirmLeave();
    return ok;
  });

  return { isDirty, markClean, confirmLeave };
};
