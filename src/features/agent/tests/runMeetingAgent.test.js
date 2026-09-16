import { describe, expect, it } from "vitest";
import { runMeetingAgent } from "../runMeetingAgent.js";

describe("runMeetingAgent", () => {
  it("loops tool_call then text and maps query from tool JSON", async () => {
    const rooms = [
      {
        roomId: "r1",
        roomName: "星海",
        slots: [{ roomId: "r1", date: "2026-09-15", start: "14:00", end: "15:00" }]
      }
    ];
    const payloads = [];
    const complete = async (payload) => {
      payloads.push(payload);
      if (!payload.toolResults) {
        return {
          kind: "tool_call",
          toolCalls: [
            {
              name: "search_availability",
              arguments: '{"date":"2026-09-15"}',
              callId: "c1"
            }
          ]
        };
      }
      return { kind: "text", answer: "这些档可以" };
    };
    const result = await runMeetingAgent({
      prompt: "帮我找空闲会议室",
      todayIso: "2026-09-15",
      complete,
      runTool: async () => JSON.stringify({ heading: "工具标题", rooms })
    });
    expect(payloads[0].toolChoice).toBe("auto");
    expect(payloads[0].tools.map((t) => t.name)).toContain("search_availability");
    expect(payloads[0].tools.map((t) => t.name)).not.toContain("create_booking");
    expect(payloads[1].toolResults[0].callId).toBe("c1");
    expect(result.event.type).toBe("query");
    expect(result.event.heading).toBe("这些档可以");
    expect(result.issuedRooms[0].roomId).toBe("r1");
  });

  it("unique start hit maps to confirm with inferred 面试 title", async () => {
    const result = await runMeetingAgent({
      prompt: "预定下午3点一小时的面试会议",
      todayIso: "2026-09-15",
      complete: async (payload) => {
        if (!payload.toolResults) {
          return {
            kind: "tool_call",
            toolCalls: [
              {
                name: "search_availability",
                arguments: '{"date":"2026-09-15","start":"15:00","durationMin":60}',
                callId: "c1"
              }
            ]
          };
        }
        return { kind: "text", answer: "确认后才会预定" };
      },
      runTool: async () =>
        JSON.stringify({
          start: "15:00",
          rooms: [
            {
              roomId: "r1",
              roomName: "星海",
              slots: [
                { roomId: "r1", date: "2026-09-15", start: "15:00", end: "16:00" }
              ]
            }
          ]
        })
    });
    expect(result.event.type).toBe("confirm");
    expect(result.event.slot.start).toBe("15:00");
    expect(result.event.title).toBe("面试");
    expect(result.issuedRooms[0].roomId).toBe("r1");
  });
});
