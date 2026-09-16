import http from "../http";

/** GET /api/oauth/getTokenByCode — userCode 换 token */
export const getTokenByCode = ({ code }) =>
  http.get("/api/oauth/getTokenByCode", {
    baseURL: "",
    params: { code }
  });

export const getMyInfo = () =>
  http.get("/api/contact/v1/account/get_my_info", { baseURL: "" });
