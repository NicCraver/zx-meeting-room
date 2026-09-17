/**
 * userCode 换登录态。
 *
 * 宿主（智信 WebView）进来带的是 token，`bootstrapAuthFromUrl` 直接就能落盘；
 * 但本机调试与环境门户（点账号跳转）发过来的是**一次性 userCode**，必须先拿它
 * 换 token 再换 accountId，否则首页判定无身份、只会显示「请从智信打开会议室」。
 *
 * 取数函数都做成参数，单测不依赖 axios 与浏览器。
 */

/** 从一个完整 URL 里取 userCode（bootstrapAuthFromUrl 不认这个参数，不会被它摘掉） */
export const readUserCode = (href = "") => {
  try {
    return (new URL(href).searchParams.get("userCode") || "").trim();
  } catch (error) {
    return "";
  }
};

/** 换完之后把一次性的 userCode 从地址栏摘掉，避免刷新时拿已作废的码再换一次 */
export const stripUserCode = (href = "") => {
  try {
    const url = new URL(href);
    url.searchParams.delete("userCode");
    return url.toString();
  } catch (error) {
    return href;
  }
};

/** 在 me.corpUsers 里找当前企业的成员 id（企业内 user.id，与 accountId 不是一回事） */
export const pickCorpUserId = (me, corpId) => {
  const list = (me && me.corpUsers) || [];
  const hit = list.find((item) => String(item.corpId) === String(corpId));
  return hit && hit.id ? String(hit.id) : "";
};

/**
 * 没有 token 且地址带 userCode 时，换出登录态写进 storage。
 * 返回 `{ ok, via, reason }`：`ok=false` 时调用方什么都不用做，页面会落到「请从智信打开会议室」。
 */
export const bootstrapUserCodeAuth = async ({
  href,
  hasToken,
  corpId,
  exchange,
  fetchMe,
  setToken,
  setClientType,
  storage,
  replaceUrl
}) => {
  if (hasToken) return { ok: true, via: "token" };

  const userCode = readUserCode(href);
  if (!userCode) return { ok: false, reason: "no-usercode" };

  let tokenRes;
  try {
    tokenRes = await exchange({ code: userCode });
  } catch (error) {
    return { ok: false, reason: "exchange-error" };
  }
  if (!tokenRes || !tokenRes.access_token) {
    return { ok: false, reason: "exchange-failed" };
  }
  setToken({
    access_token: tokenRes.access_token,
    refresh_token: tokenRes.refresh_token || ""
  });
  if (tokenRes.client_id) setClientType(tokenRes.client_id);

  let me;
  try {
    me = await fetchMe();
  } catch (error) {
    return { ok: false, reason: "me-error" };
  }
  if (!me || !me.id) return { ok: false, reason: "me-empty" };

  storage.setItem("zxAccountId", String(me.id));
  const corpUserId = pickCorpUserId(me, corpId);
  // 进页门槛只要有身份即可；/me 返回后会把 meetingUserId 改写成权威值
  storage.setItem("meetingUserId", corpUserId || String(me.id));
  if (me.name) storage.setItem("meetingUserName", me.name);

  replaceUrl(stripUserCode(href));
  return { ok: true, via: "userCode" };
};
