/**
 * 从 SSE 缓冲里切出完整事件的 data 载荷（JSON 字符串）。
 * @returns {{ events: string[], rest: string }}
 */
export function splitSseEvents(buffer) {
  const events = [];
  let rest = String(buffer || "").replace(/\r\n/g, "\n");
  while (true) {
    const idx = rest.indexOf("\n\n");
    if (idx < 0) {
      break;
    }
    const raw = rest.slice(0, idx);
    rest = rest.slice(idx + 2);
    const data = raw
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).replace(/^ /, ""))
      .join("\n");
    if (data) {
      events.push(data);
    }
  }
  return { events, rest };
}
