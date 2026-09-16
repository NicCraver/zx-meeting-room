/**
 * 从 SSE 缓冲里切出完整事件的 data 载荷（JSON 字符串）。
 * @param {string} buffer
 * @param {{ flush?: boolean }} [opts] flush 时把没有空行结尾的尾巴也当一条事件
 * @returns {{ events: string[], rest: string }}
 */
export function splitSseEvents(buffer, opts = {}) {
  const events = [];
  let rest = String(buffer || "").replace(/\r\n/g, "\n");
  while (true) {
    const idx = rest.indexOf("\n\n");
    if (idx < 0) {
      break;
    }
    const raw = rest.slice(0, idx);
    rest = rest.slice(idx + 2);
    const data = dataPayload(raw);
    if (data) {
      events.push(data);
    }
  }
  if (opts.flush) {
    const data = dataPayload(rest);
    if (data) {
      events.push(data);
    }
    rest = "";
  }
  return { events, rest };
}

function dataPayload(raw) {
  return String(raw || "")
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).replace(/^ /, ""))
    .join("\n");
}

/**
 * ZXFilter 鉴权失败会 HTTP 200 + JSON 信封，不是 SSE。
 * 把这种包读成用户能看懂的错误文案；真 SSE 返回空串。
 * @param {string} contentType
 * @param {string} bodyText
 */
export function messageFromNonSseBody(contentType, bodyText) {
  const ctype = String(contentType || "");
  if (/text\/event-stream/i.test(ctype)) {
    return "";
  }
  const text = String(bodyText || "").trim();
  if (!text.startsWith("{")) {
    return "";
  }
  try {
    const json = JSON.parse(text);
    if (!json || typeof json !== "object") {
      return "";
    }
    if (json.type === "delta" || json.type === "done" || json.type === "error") {
      return "";
    }
    return String(json.msg || json.message || json.code || "");
  } catch {
    return "";
  }
}
