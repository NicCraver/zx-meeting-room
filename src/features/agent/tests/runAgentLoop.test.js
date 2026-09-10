import { describe, expect, it } from "vitest";
import { runAgentLoop } from "../runAgentLoop.js";
import { runAgentTool } from "../runTool.js";

describe("runAgentLoop", () => {
  it("executes tools until kind=text", async () => {
    const payloads = [];
    const complete = async (payload) => {
      payloads.push(payload);
      if (!payload.toolResults) {
        return {
          kind: "tool_call",
          toolCalls: [
            { name: "add", arguments: '{"a":17,"b":25}', callId: "c1" }
          ]
        };
      }
      if (payload.toolResults.length === 1) {
        return {
          kind: "tool_call",
          toolCalls: [
            { name: "multiply", arguments: '{"a":42,"b":2}', callId: "c2" }
          ]
        };
      }
      return { kind: "text", answer: "先加再乘，得 84" };
    };

    const events = [];
    const result = await runAgentLoop({
      prompt: "17+25 再乘 2",
      tools: [{ name: "add" }, { name: "multiply" }],
      complete,
      runTool: runAgentTool,
      onEvent: (event) => events.push(event.type)
    });

    expect(result.rounds).toBe(3);
    expect(events).toEqual([
      "llm-start",
      "llm-done",
      "tool",
      "llm-start",
      "llm-done",
      "tool",
      "llm-start",
      "llm-done"
    ]);
    expect(result.answer).toBe("先加再乘，得 84");
    expect(payloads[1].toolResults).toEqual([
      { callId: "c1", name: "add", arguments: '{"a":17,"b":25}', output: "42" }
    ]);
    expect(payloads[2].toolResults[1]).toEqual({
      callId: "c2",
      name: "multiply",
      arguments: '{"a":42,"b":2}',
      output: "84"
    });
  });
});
