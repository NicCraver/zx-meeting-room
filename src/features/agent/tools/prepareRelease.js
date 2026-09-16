import { shanghaiToday } from "@/features/booking/time";
import { pickNextReleasable } from "@/features/booking/mine";

export const PREPARE_RELEASE_TOOL = {
  name: "prepare_release",
  description:
    "指出要取消的那场会（默认最近一场未开始/进行中）。只准备确认信息，不要真正释放。",
  parameters: {
    type: "object",
    properties: {
      bookingId: { type: "string", description: "可选，指定预定 id" }
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
 * @param {{ listMyBookings?: () => Promise<unknown[]>, todayIso?: string }} [deps]
 */
export async function runPrepareReleaseTool(argumentsJson, deps = {}) {
  const args = parseArgs(argumentsJson);
  const fetchMine =
    deps.listMyBookings ||
    (await import("@/api/module/booking")).listMyBookings;
  const list = await fetchMine();
  const items = Array.isArray(list) ? list : [];
  const bookingId = String(args.bookingId || "").trim();
  let booking = null;
  if (bookingId) {
    booking = items.find((b) => b && b.id === bookingId) || null;
    if (
      booking &&
      booking.status !== "upcoming" &&
      booking.status !== "ongoing"
    ) {
      booking = null;
    }
  } else {
    booking = pickNextReleasable(items, deps.todayIso || shanghaiToday());
  }
  if (!booking) {
    return JSON.stringify({
      booking: null,
      reason: "没有可取消的预定"
    });
  }
  return JSON.stringify({ booking: toRow(booking) });
}
