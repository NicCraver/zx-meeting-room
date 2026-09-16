/** 与 `src/api/http.js` 一致：成功码 M0000，拦截器读 data。 */

export const ok = (data) => ({
  status: 200,
  json: { code: "M0000", data, msg: "ok" }
});

export const fail = (code, msg, data = null) => ({
  status: 200,
  json: { code, data, msg }
});
