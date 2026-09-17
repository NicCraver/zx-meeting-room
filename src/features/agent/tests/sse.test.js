import { describe, expect, it } from "vitest";
import { messageFromNonSseBody, splitSseEvents } from "../sse.js";

describe("splitSseEvents", () => {
  it("parses two JSON events and keeps a partial tail", () => {
    const { events, rest } = splitSseEvents(
      'data: {"type":"delta","delta":"你"}\n\ndata: {"type":"done","kind":"text"}\n\ndata: {"type":"del'
    );
    expect(events).toEqual([
      '{"type":"delta","delta":"你"}',
      '{"type":"done","kind":"text"}'
    ]);
    expect(rest).toBe('data: {"type":"del');
  });

  it("flushes a trailing done that has no blank line", () => {
    const { events, rest } = splitSseEvents(
      'data: {"type":"done","kind":"text","answer":"好"}',
      { flush: true }
    );
    expect(events).toEqual(['{"type":"done","kind":"text","answer":"好"}']);
    expect(rest).toBe("");
  });
});

describe("messageFromNonSseBody", () => {
  it("reads O_T_001 JSON that ZXFilter returns as HTTP 200", () => {
    expect(
      messageFromNonSseBody(
        "application/json; charset=UTF-8",
        '{"msg":"认证失败，请重新登录！","code":"O_T_001"}'
      )
    ).toBe("认证失败，请重新登录！");
  });

  it("ignores real SSE", () => {
    expect(
      messageFromNonSseBody(
        "text/event-stream",
        'data: {"type":"done","kind":"text"}\n\n'
      )
    ).toBe("");
  });
});
