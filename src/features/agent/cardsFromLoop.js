import { EMPTY_SLOT_NEED_MORE_TEXT } from "./applyEvent.js";

const parseOutput = (raw) => {
  if (raw && typeof raw === "object") return raw;
  try {
    return JSON.parse(String(raw || "{}"));
  } catch {
    return null;
  }
};

const lastTool = (log) => {
  const rows = Array.isArray(log) ? log : [];
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const row = rows[i];
    const name =
      row?.name ||
      String(row?.step || "")
        .split("-")
        .slice(2)
        .join("-");
    if (
      row &&
      (name === "search_availability" ||
        name === "list_my_meetings" ||
        name === "prepare_release")
    ) {
      return { ...row, name };
    }
  }
  return null;
};

const hasSlots = (rooms) =>
  (rooms || []).some((room) => Array.isArray(room?.slots) && room.slots.length);

const flattenSlots = (rooms) => {
  const out = [];
  for (const room of rooms || []) {
    for (const slot of room.slots || []) out.push(slot);
  }
  return out;
};

export function inferAgentBookingTitle(prompt) {
  const raw = String(prompt || "");
  if (/面试/.test(raw)) return "面试";
  if (/评审/.test(raw)) return "评审";
  if (/周会/.test(raw)) return "周会";
  if (/站会|晨会/.test(raw)) return "站会";
  return "";
}

/**
 * 用最近一次工具 JSON 切卡；answer 只当标题/说明。
 * 指定 start 且只有一档命中时出确认卡，不把精确预定打成列表。
 * @param {{ log?: unknown[], answer?: string, prompt?: string }} input
 */
export function cardsFromLoop({ log, answer, prompt } = {}) {
  const text = String(answer || "").trim();
  const tool = lastTool(log);
  if (!tool) {
    return {
      type: "need_more",
      text: text || "再说一下时间和人数？",
      expression: "puzzled"
    };
  }
  const data = parseOutput(tool.output);
  if (tool.name === "search_availability") {
    const rooms = Array.isArray(data?.rooms) ? data.rooms : [];
    if (hasSlots(rooms)) {
      const start = data?.start;
      const exact = start
        ? flattenSlots(rooms).filter((slot) => slot.start === start)
        : [];
      if (exact.length === 1) {
        return {
          type: "confirm",
          slot: exact[0],
          title:
            String(data.title || "").trim() || inferAgentBookingTitle(prompt),
          rooms,
          expression: "expect"
        };
      }
      return {
        type: "query",
        heading: text || data.heading || "",
        rooms,
        expression: "ease"
      };
    }
    return {
      type: "need_more",
      text: text || EMPTY_SLOT_NEED_MORE_TEXT,
      expression: "puzzled"
    };
  }
  if (tool.name === "list_my_meetings") {
    const bookings = Array.isArray(data?.bookings) ? data.bookings : [];
    if (!bookings.length) {
      return {
        type: "need_more",
        text: text || "今天没有会",
        expression: "ease"
      };
    }
    return {
      type: "mine",
      text: text || "",
      bookings,
      expression: "ease"
    };
  }
  if (tool.name === "prepare_release") {
    if (data?.booking?.id) {
      return {
        type: "release_confirm",
        booking: data.booking,
        expression: "expect"
      };
    }
    return {
      type: "need_more",
      text: text || data?.reason || "没有可取消的预定",
      expression: "sorry"
    };
  }
  return {
    type: "need_more",
    text: text || "再说一下时间和人数？",
    expression: "puzzled"
  };
}
