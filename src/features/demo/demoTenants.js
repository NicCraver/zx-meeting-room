/** 演示门户目录；仅前端展示与拼 URL，不参与鉴权 */

/** 本机联调 contact Java 的真实 query，不再用 zx-001 / demo-admin */
export const LOCAL_JAVA_AUTH = {
  zxAccountId: "1880150187008081921",
  zxCorpId: "6",
  zxClientType: "app",
  label: "李权泓"
};

export const DEMO_TENANTS = [
  {
    corpId: "zx-001",
    name: "智信科技",
    users: [
      { userId: "demo-admin", userName: "李明", dept: "研发", role: "admin" },
      { userId: "zx-u2", userName: "张伟", dept: "产品", role: "staff" },
      { userId: "zx-u3", userName: "王芳", dept: "行政", role: "staff" }
    ]
  },
  {
    corpId: "acme-001",
    name: "示例集团",
    users: [
      { userId: "acme-admin", userName: "赵强", dept: "总经办", role: "admin" },
      { userId: "acme-u2", userName: "陈晨", dept: "研发", role: "staff" }
    ]
  }
];

export const DEMO_SESSION_KEYS = [
  "meetingCorpId",
  "meetingUserId",
  "meetingUserName",
  "meetingUserDept",
  "zxAccountId",
  "zxCorpId"
];

export const hasDemoIdentity = (corpId, userId) => Boolean(corpId && userId);

export const normalizeBase = (base) => {
  const raw = String(base || "/");
  return raw.endsWith("/") ? raw : `${raw}/`;
};

/** 仅含管理员的演示目录，供首页管理端入口展示 */
export const DEMO_ADMIN_TENANTS = DEMO_TENANTS.map((tenant) => ({
  ...tenant,
  users: tenant.users.filter((user) => user.role === "admin")
})).filter((tenant) => tenant.users.length);

/** 移动入口没有 /admin 路由 */
export const canEnterDemoAdmin = (buildTarget) => buildTarget !== "m";

export const demoEnterUrl = (corpId, user, base, path = "") => {
  const q = new URLSearchParams({
    corpId,
    userId: user.userId,
    userName: user.userName,
    dept: user.dept
  });
  const dest = String(path || "").replace(/^\/+|\/+$/g, "");
  return `${normalizeBase(base)}${dest}?${q.toString()}`;
};

/** booking 落首页；admin / race / race-pane 走对应路径 */
export const destPath = (dest = "booking") => {
  if (dest === "admin") return "admin";
  if (dest === "race") return "race";
  if (dest === "race-pane") return "race-pane";
  return "";
};

export const javaEnterUrl = (base, path = "") => {
  const q = new URLSearchParams({
    zxAccountId: LOCAL_JAVA_AUTH.zxAccountId,
    zxCorpId: LOCAL_JAVA_AUTH.zxCorpId,
    zxClientType: LOCAL_JAVA_AUTH.zxClientType
  });
  const dest = String(path || "").replace(/^\/+|\/+$/g, "");
  return `${normalizeBase(base)}${dest}?${q.toString()}`;
};

export const clearDemoSession = (storage) => {
  for (const key of DEMO_SESSION_KEYS) storage.removeItem(key);
};

export const demoHomeUrl = (base) => normalizeBase(base);
