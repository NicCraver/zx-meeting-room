import { TODAY, TOMORROW } from "../helpers/clock.js";

const sse = (...chunks) => chunks;

/**
 * 按 prompt / toolResults 回 /v1/aiMeet SSE 分片。
 * 第一枪出 tool_call，工具由前端真实代码执行并打被拦截的 /meetingApi。
 */
export function aiMeetSseFrames(body = {}) {
  const prompt = String(body.prompt || "");
  if (/助手失败|error-please/.test(prompt)) {
    return sse({ type: "error", msg: "助手暂时不可用" });
  }

  if (Array.isArray(body.toolResults) && body.toolResults.length) {
    const name = body.toolResults[body.toolResults.length - 1]?.name || "";
    let answer = "好的";
    if (name === "search_availability") answer = "这些时段可以";
    if (name === "list_my_meetings") answer = "今天的会如下";
    if (name === "prepare_release") answer = "确认后才会取消";
    return sse({ type: "done", kind: "text", answer });
  }

  if (/取消我最近|取消最近/.test(prompt)) {
    return sse({
      type: "done",
      kind: "tool_call",
      toolCalls: [{ name: "prepare_release", arguments: "{}", callId: "c-rel" }]
    });
  }

  if (/哪些会/.test(prompt)) {
    return sse({
      type: "done",
      kind: "tool_call",
      toolCalls: [
        {
          name: "list_my_meetings",
          arguments: JSON.stringify({ date: TODAY }),
          callId: "c-mine"
        }
      ]
    });
  }

  if (/明天上午.*大会议|订明天上午/.test(prompt)) {
    return sse({
      type: "done",
      kind: "tool_call",
      toolCalls: [
        {
          name: "search_availability",
          arguments: JSON.stringify({
            date: TOMORROW,
            windowStart: "09:00",
            windowEnd: "12:00",
            capacity: 10
          }),
          callId: "c-search"
        }
      ]
    });
  }

  return sse({
    type: "done",
    kind: "tool_call",
    toolCalls: [
      {
        name: "search_availability",
        arguments: JSON.stringify({ date: TODAY, durationMin: 60 }),
        callId: "c-search"
      }
    ]
  });
}
