import { getCorpId, getToken, getUserId } from "@/utils";
import {
  canEnterDemoAdmin,
  destPath,
  hasDemoIdentity,
  javaEnterUrl
} from "./demoTenants";

export {
  DEMO_ADMIN_TENANTS,
  DEMO_TENANTS,
  LOCAL_JAVA_AUTH,
  canEnterDemoAdmin,
  destPath,
  hasDemoIdentity,
  javaEnterUrl
} from "./demoTenants";

export const currentHasDemoIdentity = () => {
  if (getToken()) return true;
  const accountId =
    typeof sessionStorage !== "undefined"
      ? sessionStorage.getItem("zxAccountId")
      : "";
  if (getCorpId() && accountId) return true;
  return hasDemoIdentity(getCorpId(), getUserId());
};

/** 开发态三个入口共用一次 Vite，BUILD_TARGET 恒为 main，须读 MPA 注入的平台 */
export const currentCanEnterDemoAdmin = () => {
  const platform =
    typeof window !== "undefined" && window.__VITE_MPA_PLATFORM__
      ? window.__VITE_MPA_PLATFORM__
      : typeof __BUILD_TARGET__ !== "undefined"
        ? __BUILD_TARGET__
        : "main";
  return canEnterDemoAdmin(platform);
};

export const enterAsJavaUser = (dest = "booking") => {
  location.assign(javaEnterUrl(import.meta.env.BASE_URL, destPath(dest)));
};
