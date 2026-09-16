import { getAccountId, getCorpId, getToken } from "@/utils";
import {
  messageFromNonSseBody,
  splitSseEvents
} from "@/features/agent/sse.js";

const streamHeaders = () => {
  const token = getToken("access_token") || "";
  const corpId = getCorpId() || "";
  const accountId = getAccountId() || "";
  return {
    "Content-Type": "application/json;charset=utf-8",
    Accept: "text/event-stream",
    Authorization: token ? `Bearer ${token}` : "",
    zxCorpId: corpId,
    zxAccountId: accountId,
    clientType: sessionStorage.getItem("clientType") || "app",
    version: "v1"
  };
};

/**
 * POST /v1/aiMeet SSE。onDelta 收到文本增量；Promise resolve 最终 done 载荷。
 * @param {object} body
 * @param {{ onDelta?: (text: string) => void }} [opts]
 */
export async function streamAiMeet(body, opts = {}) {
  const { onDelta, signal } = opts;
  const corpId = getCorpId() || "";
  const accountId = getAccountId() || "";
  const qs = new URLSearchParams({
    zxAccountId: accountId,
    zxCorpId: corpId,
    zxClientType: sessionStorage.getItem("clientType") || "app"
  });
  const res = await fetch(`/aiChatApi/v1/aiMeet?${qs.toString()}`, {
    method: "POST",
    headers: streamHeaders(),
    body: JSON.stringify(body),
    signal
  });
  if (!res.ok) {
    throw new Error(`aiMeet HTTP ${res.status}`);
  }
  if (!res.body) {
    throw new Error("aiMeet 无响应体");
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let donePayload = null;
  const applyEvents = (rawList) => {
    for (const raw of rawList) {
      const chunk = JSON.parse(raw);
      if (chunk.type === "delta" && chunk.delta) {
        onDelta?.(chunk.delta);
      } else if (chunk.type === "done") {
        donePayload = {
          kind: chunk.kind,
          answer: chunk.answer,
          responseId: chunk.responseId,
          toolCalls: chunk.toolCalls
        };
      } else if (chunk.type === "error") {
        throw new Error(chunk.msg || "助手暂时不可用");
      }
    }
  };
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      buf += decoder.decode();
      const split = splitSseEvents(buf, { flush: true });
      applyEvents(split.events);
      const jsonErr = messageFromNonSseBody(
        res.headers.get("content-type") || "",
        buf
      );
      if (!donePayload && jsonErr) {
        throw new Error(jsonErr);
      }
      break;
    }
    buf += decoder.decode(value, { stream: true });
    const split = splitSseEvents(buf);
    buf = split.rest;
    applyEvents(split.events);
  }
  if (!donePayload) {
    throw new Error("流式结束但没有 done");
  }
  return donePayload;
}
