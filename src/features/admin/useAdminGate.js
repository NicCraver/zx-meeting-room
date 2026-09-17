import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { getMe } from "@/api/module/me";
import { getCorpId, showToastError } from "@/utils";
import { ME_FAILED_TOAST, resolveAdminAccess } from "./adminAccess";

/** 管理端入口门闩：缺企业不拉子页数据；非管理员踢回首页 */
export const useAdminGate = () => {
  const router = useRouter();
  const ready = ref(false);
  const isAdmin = ref(false);

  onMounted(async () => {
    const deny = (access) => {
      showToastError(access.toast);
      isAdmin.value = false;
      ready.value = true;
      if (access.reason !== "me-failed") router.replace("/");
    };

    const corpId = getCorpId();
    const missing = resolveAdminAccess({ corpId });
    if (!missing.ok && missing.reason === "missing-corp") {
      deny(missing);
      return;
    }
    try {
      const me = await getMe();
      const access = resolveAdminAccess({ corpId, me });
      if (!access.ok) {
        deny(access);
        return;
      }
      isAdmin.value = true;
      ready.value = true;
    } catch (error) {
      deny(
        resolveAdminAccess({
          corpId,
          meError: error.msg || error.message || ME_FAILED_TOAST
        })
      );
    }
  });

  return { ready, isAdmin };
};
