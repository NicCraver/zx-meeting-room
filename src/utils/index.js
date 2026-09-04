export * from "./dialog";

/** 取 token（本期只从 sessionStorage 读，来源见 bootstrapAuthFromUrl） */
export const getToken = (type = "access_token") => {
  try {
    const token = JSON.parse(sessionStorage.getItem("meetingToken") || "null");
    return token ? token[type] : null;
  } catch (error) {
    return null;
  }
};

/** 保存 token */
export const setToken = (data) => {
  sessionStorage.setItem("meetingToken", JSON.stringify(data));
};

/** 取企业 ID */
export const getCorpId = () => sessionStorage.getItem("meetingCorpId");

/** 取用户 ID */
export const getUserId = () => sessionStorage.getItem("meetingUserId");

/** 取用户姓名 */
export const getUserName = () => sessionStorage.getItem("meetingUserName");

/** 取用户部门 */
export const getDept = () => sessionStorage.getItem("meetingUserDept");

/** 智信登录账号，Java AAuthFilter 用；不是企业内 user.id */
export const getAccountId = () => sessionStorage.getItem("zxAccountId");

/** 解析 URL 查询参数（用 URLSearchParams 按规范处理 + 与 %XX 转义） */
export const getUrlParams = (data) => {
  const qs = typeof data === "string" ? data.split("?")[1] || "" : data.search;
  const sp = new URLSearchParams(qs);
  const result = new Map();
  for (const [k] of sp) {
    // 同名参数保留首个值，与旧实现行为一致
    if (!result.has(k)) result.set(k, sp.get(k));
  }
  return result;
};

/**
 * 本期登录态入口：从 URL query 取 token / corpId / clientType 落 sessionStorage，
 * 没带参数时沿用已有的 sessionStorage 值。
 * 本地联调 Java 时用 zxAccountId / zxCorpId / zxClientType（AAuthFilter 只读 query）。
 * 后续接 JSBridge（wnsdk.meeting.* 或 window.webview.ipcRenderer）时只改这一个函数，
 * 不要在组件里各写一份取 token 逻辑。
 */
export const bootstrapAuthFromUrl = () => {
  const params = getUrlParams(location.href);
  const token = params.get("token");
  const zxAccountId = params.get("zxAccountId");
  const zxCorpId = params.get("zxCorpId");
  const zxClientType = params.get("zxClientType");
  const corpId = zxCorpId || params.get("corpId");
  const rawClientType = zxClientType || params.get("clientType");
  const clientType = rawClientType === "1" ? "app" : rawClientType;
  const userId = params.get("userId");
  const userName = params.get("userName");
  const dept = params.get("dept");

  if (token) {
    setToken({
      access_token: token,
      refresh_token: params.get("refreshToken") || ""
    });
  }
  if (zxAccountId) {
    sessionStorage.setItem("zxAccountId", zxAccountId);
  }
  if (corpId) {
    sessionStorage.setItem("meetingCorpId", corpId);
    sessionStorage.setItem("zxCorpId", corpId);
  }
  if (clientType) {
    sessionStorage.setItem("clientType", clientType);
  }
  if (userId) {
    sessionStorage.setItem("meetingUserId", userId);
  } else if (zxAccountId && !getUserId()) {
    // 进页门槛只要有身份；/me 返回后会改写成企业内 user.id
    sessionStorage.setItem("meetingUserId", zxAccountId);
  }
  if (userName) {
    sessionStorage.setItem("meetingUserName", userName);
  }
  if (dept) {
    sessionStorage.setItem("meetingUserDept", dept);
  }

  // 落盘之后再清理地址栏里的敏感参数，避免明文 token 残留（Referer/日志泄露）
  if (
    token ||
    corpId ||
    clientType ||
    userId ||
    userName ||
    dept ||
    zxAccountId ||
    zxCorpId ||
    zxClientType
  ) {
    const u = new URL(location.href);
    [
      "token",
      "refreshToken",
      "corpId",
      "clientType",
      "userId",
      "userName",
      "dept",
      "zxAccountId",
      "zxCorpId",
      "zxClientType"
    ].forEach((k) => u.searchParams.delete(k));
    history.replaceState(null, "", u.toString());
  }

  return {
    token: getToken(),
    corpId: getCorpId(),
    clientType: clientType || "app"
  };
};
