import { describe, expect, it } from "vitest";
import {
  createProcessTrace,
  formatLlmDone,
  formatLlmRequest,
  formatToolRun
} from "../processTrace.js";

describe("processTrace", () => {
  it("records llm request then stream then done", () => {
    const trace = createProcessTrace();
    const id = trace.push({
      kind: "llm",
      title: "请求 LLM",
      detail: "tools: add",
      pending: true
    });
    trace.appendStream(id, "17");
    trace.appendStream(id, "+25");
    trace.patch(id, { pending: false, title: "LLM 结束 · kind=text" });
    expect(trace.steps[0].stream).toBe("17+25");
    expect(trace.steps[0].pending).toBe(false);
    expect(trace.steps[0].resultKind).toBe("");
    trace.reset();
    expect(trace.steps).toEqual([]);
  });

  it("formats request and tool payload", () => {
    expect(
      formatLlmRequest({
        prompt: "算一下",
        toolChoice: "auto",
        tools: [{ name: "add" }],
        toolResults: [{ name: "add", callId: "c1", output: "42" }]
      })
    ).toContain("已回传 toolResults: 1 条");
    expect(
      formatLlmDone({
        kind: "tool_call",
        toolCalls: [{ name: "add", callId: "c1", arguments: '{"a":1}' }]
      })
    ).toContain("add callId=c1");
    expect(formatToolRun({ arguments: '{"a":1}' }, "2")).toBe(
      'arguments: {"a":1}\noutput: 2'
    );
  });
});
