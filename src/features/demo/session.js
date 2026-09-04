import { getCorpId, getUserId } from "@/utils";
import {
  canEnterDemoAdmin,
  clearDemoSession,
  demoEnterUrl,
  destPath,
  demoHomeUrl,
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

export const enterAsDemoUser = (corpId, user, dest = "booking") => {
  location.assign(
    demoEnterUrl(corpId, user, import.meta.env.BASE_URL, destPath(dest))
  );
};

export const enterAsJavaUser = (dest = "booking") => {
  location.assign(javaEnterUrl(import.meta.env.BASE_URL, destPath(dest)));
};

export const switchDemoUser = () => {
  clearDemoSession(sessionStorage);
  location.assign(demoHomeUrl(import.meta.env.BASE_URL));
};
