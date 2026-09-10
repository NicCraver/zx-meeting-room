import { describe, expect, it } from "vitest";
import { splitSseEvents } from "../sse.js";

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
});
