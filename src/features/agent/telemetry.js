import { isEmptySlotNeedMore } from "./applyEvent.js";
import { track } from "../booking/telemetry.js";

const withSession = (ui, extra = {}) => {
  const sessionId = ui?.sessionId;
  return sessionId ? { sessionId, ...extra } : extra;
};

export const trackAgentChip = (ui, chipId) => {
  track("agent_chip", withSession(ui, { chipId }));
};

export const trackAgentMessage = (ui, text) => {
  track("agent_message", withSession(ui, { len: String(text || "").length }));
};

export const trackAgentPick = (ui, slot) => {
  track(
    "agent_pick",
    withSession(ui, {
      roomId: slot?.roomId,
      date: slot?.date
    })
  );
};

export const trackAgentConfirm = (ui) => {
  track("agent_confirm", withSession(ui));
};

export const trackAgentBack = (ui) => {
  track("agent_back", withSession(ui));
};

/** 流式事件侧：结果 / 成功 / 失败。不入库原文。 */
export const trackAgentStreamEvent = (ui, event) => {
  if (!event || !event.type) return;
  if (
    event.type === "query" ||
    event.type === "suggest" ||
    event.type === "need_more"
  ) {
    const extra = { kind: event.type };
    if (event.type === "query") {
      extra.roomCount = Array.isArray(event.rooms) ? event.rooms.length : 0;
    }
    if (event.type === "suggest") {
      extra.optionCount = Array.isArray(event.options) ? event.options.length : 0;
    }
    if (event.type === "need_more") {
      extra.empty = isEmptySlotNeedMore({
        type: "need_more",
        text: event.text
      });
    }
    track("agent_result", withSession(ui, extra));
    return;
  }
  if (event.type === "booked") {
    track(
      "agent_booked",
      withSession(ui, { bookingId: event.bookingId })
    );
    return;
  }
  if (event.type === "error") {
    track(
      "agent_fail",
      withSession(ui, event.code ? { code: String(event.code).slice(0, 32) } : {})
    );
  }
};
