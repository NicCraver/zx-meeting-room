

export const LIST_MY_MEETINGS_TOOL = {
  name: "list_my_meetings",
  description:
    "列出我的预定。可传 date（yyyy-MM-dd）只看当天。不要声称已经取消。",
  parameters: {
    type: "object",
    properties: {
      date: { type: "string", description: "可选，yyyy-MM-dd" }
    }
  }
};

const parseArgs = (argumentsJson) => {
  if (argumentsJson && typeof argumentsJson === "object") return argumentsJson;
  try {
    return JSON.parse(argumentsJson || "{}");
  } catch {
    return {};
  }
};

const toRow = (b) => ({
  id: b.id,
  title: b.title,
  roomName: b.roomName,
  date: b.date,
  start: b.start,
  end: b.end,
  status: b.status
});

/**
 * @param {string|object} argumentsJson
 * @param {{ listMyBookings?: () => Promise<unknown[]> }} [deps]
 */
export async function runListMyMeetingsTool(argumentsJson, deps = {}) {
  const args = parseArgs(argumentsJson);
  const date = String(args.date || "").trim();
  const fetchMine =
    deps.listMyBookings || (await import("@/api/module/booking")).listMyBookings;
  const list = await fetchMine();
  const rows = (Array.isArray(list) ? list : [])
    .filter((b) => b && b.status !== "released")
    .filter((b) => !date || b.date === date)
    .map(toRow);
  return JSON.stringify({ bookings: rows });
}
