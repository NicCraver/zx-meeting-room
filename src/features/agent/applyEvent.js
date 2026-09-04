/** @typedef {import('../../../../../../context/contracts/meeting/agentTurn').MeetingAgentEvent} MeetingAgentEvent */

/**
 * @typedef {object} AgentUiState
 * @property {boolean} open
 * @property {string} sessionId
 * @property {string} status
 * @property {string} expression
 * @property {AgentCard | null} card
 * @property {AgentCard | null} backCard
 */

/**
 * @typedef {(
 *   | { type: 'query', heading: string, rooms: unknown[] }
 *   | { type: 'confirm', draft: unknown }
 *   | { type: 'suggest', reason: string, options: unknown[] }
 *   | { type: 'need_more', text: string }
 *   | { type: 'error', msg: string, code?: string }
 *   | { type: 'booked', bookingId: string, title: string, slot: unknown }
 * )} AgentCard
 */

export const EMPTY_SLOT_IDLE_MS = 3000;
export const EMPTY_SLOT_NEED_MORE_TEXT = "没有符合条件的空档";

export function emptyAgentUi() {
  return {
    open: false,
    sessionId: "",
    status: "",
    expression: "idle",
    card: null,
    backCard: null
  };
}

/** 查空档无命中（need_more 固定文案），不是请用户补充信息。 */
export function isEmptySlotNeedMore(card) {
  return card?.type === "need_more" && card.text === EMPTY_SLOT_NEED_MORE_TEXT;
}

/** 无结果提示结束后回到快捷指令默认态，会话 id 保留。 */
export function idleAfterEmptyResult(state) {
  return {
    ...state,
    open: false,
    status: "",
    card: null,
    backCard: null,
    expression: "idle"
  };
}

/**
 * @param {AgentUiState} state
 * @param {MeetingAgentEvent} event
 * @returns {AgentUiState}
 */
export function applyAgentEvent(state, event) {
  switch (event.type) {
    case "session":
      return { ...state, sessionId: event.sessionId };

    case "status":
      return {
        ...state,
        status: event.text,
        expression: event.expression
      };

    case "query":
      return {
        ...state,
        open: true,
        status: "",
        expression: event.expression,
        card: {
          type: "query",
          heading: event.heading,
          rooms: event.rooms
        }
      };

    case "confirm":
      return {
        ...state,
        open: true,
        status: "",
        expression: event.expression,
        backCard:
          state.card?.type === "query" || state.card?.type === "suggest"
            ? state.card
            : state.backCard,
        card: { type: "confirm", draft: event.draft }
      };

    case "suggest":
      return {
        ...state,
        open: true,
        status: "",
        expression: event.expression,
        card: {
          type: "suggest",
          reason: event.reason,
          options: event.options
        }
      };

    case "need_more":
      return {
        ...state,
        open: true,
        status: "",
        expression: event.expression,
        card: { type: "need_more", text: event.text }
      };

    case "error":
      return {
        ...state,
        open: true,
        status: "",
        expression: event.expression,
        card: {
          type: "error",
          msg: event.msg,
          ...(event.code !== undefined ? { code: event.code } : {})
        }
      };

    case "booked":
      return {
        ...state,
        open: true,
        status: "",
        backCard: null,
        expression: event.expression || "happy",
        card: {
          type: "booked",
          bookingId: event.bookingId,
          title: event.title || "预定的会议",
          slot: event.slot ?? null
        }
      };

    case "closed":
      return {
        ...state,
        open: false,
        status: "",
        card: null,
        backCard: null,
        expression: "down"
      };

    case "debug":
      return state;

    default:
      return state;
  }
}

/** 确认卡取消：回到上一张空档/换档卡，不收起助手。 */
export function backFromConfirm(state) {
  if (state.card?.type !== "confirm") return state;
  if (state.backCard) {
    return {
      ...state,
      status: "",
      expression: state.backCard.type === "suggest" ? "sorry" : "ease",
      card: state.backCard
    };
  }
  return {
    ...state,
    status: "",
    expression: "idle",
    card: null
  };
}
