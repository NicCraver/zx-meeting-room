import { setClientType } from "@/api/http";
import { getMyInfo, getTokenByCode } from "@/api/module/login";
import { bootstrapAuthFromUrl, getCorpId, getToken, setToken } from "@/utils";
import { bootstrapUserCodeAuth } from "./userCodeAuth.js";

/**
 * 三个入口唯一的登录态引导入口，挂载前调用一次。
 *
 * 1. `bootstrapAuthFromUrl()`：宿主 WebView 带的 token / corpId / accountId 落盘（同步）。
 * 2. 地址带一次性 userCode 且本地没 token 时，再换一遍登录态（异步，本机调试与环境门户走这条）。
 *
 * 换不出来就静默放行，页面自己会显示「请从智信打开会议室」。
 */
export const bootstrapAuth = () => {
  bootstrapAuthFromUrl();
  return bootstrapUserCodeAuth({
    href: location.href,
    hasToken: Boolean(getToken("access_token")),
    corpId: getCorpId() || "",
    exchange: getTokenByCode,
    fetchMe: getMyInfo,
    setToken,
    setClientType,
    storage: sessionStorage,
    replaceUrl: (url) => history.replaceState(null, "", url)
  });
};
