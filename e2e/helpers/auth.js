export const AUTH_QS =
  "zxAccountId=1880150187008081921&zxCorpId=6&zxClientType=app";

export const meetingUrl = (path = "/ai-meet/zx/", qs = AUTH_QS) => {
  if (!qs) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}${qs}`;
};
