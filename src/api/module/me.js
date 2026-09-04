import http from "../http";

/** 当前用户身份与权限 */
export const getMe = async () => {
  const me = await http.get("/me");
  if (me && me.isAdmin === undefined && me.admin !== undefined) {
    me.isAdmin = me.admin;
  }
  return me;
};
