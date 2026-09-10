import { shanghaiToday } from "@/features/booking/time";
import { searchFreeSlots } from "../findFree.js";

export const SEARCH_AVAILABILITY_TOOL = {
  name: "search_availability",
  description:
    "按日期查空闲会议室。必须传 date（yyyy-MM-dd）。不要编造房间或时段，结果里的 slots 才能给用户点选。",
  parameters: {
    type: "object",
    properties: {
      date: { type: "string", description: "日期 yyyy-MM-dd" },
      durationMin: { type: "number", description: "时长分钟，默认 60" },
      windowStart: { type: "string", description: "时段开始 HH:mm" },
      windowEnd: { type: "string", description: "时段结束 HH:mm" },
      capacity: { type: "number", description: "最少人数" },
      buildingName: { type: "string" },
      floorName: { type: "string" },
      facilities: {
        type: "array",
        items: { type: "string" }
      }
    },
    required: ["date"]
  }
};

export const shanghaiNowMinutes = (now = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(now);
  const pick = (type) => Number(parts.find((p) => p.type === type)?.value || 0);
  return pick("hour") * 60 + pick("minute");
};

const parseArgs = (argumentsJson) => {
  if (argumentsJson && typeof argumentsJson === "object") return argumentsJson;
  try {
    return JSON.parse(argumentsJson || "{}");
  } catch {
    return {};
  }
};

/**
 * @param {string|object} argumentsJson
 * @param {{ getBoard?: (date: string) => Promise<{ rooms?: unknown[] }>, now?: { date: string, minute: number } }} [deps]
 */
export async function runSearchAvailabilityTool(argumentsJson, deps = {}) {
  const args = parseArgs(argumentsJson);
  const date = String(args.date || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return JSON.stringify({
      heading: "",
      rooms: [],
      error: "缺少日期 date"
    });
  }
  const fetchBoard =
    deps.getBoard || (await import("@/api/module/booking")).getBoard;
  const data = await fetchBoard(date);
  const rooms = Array.isArray(data?.rooms) ? data.rooms : [];
  const now = deps.now || {
    date: shanghaiToday(),
    minute: shanghaiNowMinutes()
  };
  const found = searchFreeSlots(
    rooms,
    {
      dateIso: date,
      durationMin: Number(args.durationMin) || 60,
      windowStart: args.windowStart || null,
      windowEnd: args.windowEnd || null,
      capacity: args.capacity == null ? null : Number(args.capacity),
      buildingName: args.buildingName || null,
      floorName: args.floorName || null,
      facilities: Array.isArray(args.facilities) ? args.facilities : []
    },
    now
  );
  return JSON.stringify(found);
}
