export const MISSING_CORP_TOAST = "缺少企业信息，请重新登录";
export const FORBIDDEN_TOAST = "无管理权限";
export const ME_FAILED_TOAST = "获取身份失败";

/**
 * 管理端门闩：缺企业 / 非管理员 / /me 失败都不能进。
 * @param {{ corpId?: string, me?: { isAdmin?: boolean } | null, meError?: string }} input
 */
export const resolveAdminAccess = ({ corpId, me, meError } = {}) => {
  if (!corpId) {
    return { ok: false, reason: "missing-corp", toast: MISSING_CORP_TOAST };
  }
  if (meError) {
    return { ok: false, reason: "me-failed", toast: meError || ME_FAILED_TOAST };
  }
  if (me && me.isAdmin === false) {
    return { ok: false, reason: "forbidden", toast: FORBIDDEN_TOAST };
  }
  return { ok: true, reason: "admin" };
};
