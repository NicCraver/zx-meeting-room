import { toMinutes } from "@/features/booking/time";

export const DRAFT_TTL_MS = 10 * 60 * 1000;

export const slotKey = (slot) =>
  `${slot?.roomId || ""}|${slot?.date || ""}|${slot?.start || ""}|${slot?.end || ""}`;

export function createDraftStore({ now = () => Date.now(), ttlMs = DRAFT_TTL_MS } = {}) {
  /** @type {Map<string, object>} */
  let issued = new Map();
  /** @type {{ draftId: string, slot: object, title: string, createdAt: number } | null} */
  let draft = null;
  /** @type {object | null} */
  let releaseBooking = null;

  const expired = (createdAt) => now() - createdAt > ttlMs;

  const issueFromRooms = (rooms) => {
    issued = new Map();
    for (const room of rooms || []) {
      for (const slot of room.slots || []) {
        issued.set(slotKey(slot), slot);
      }
    }
    draft = null;
  };

  const pickSlot = (slot, extra = {}) => {
    const hit = issued.get(slotKey(slot));
    if (!hit) {
      throw Object.assign(new Error("该档不是本轮查询结果"), { code: "SLOT_NOT_ISSUED" });
    }
    draft = {
      draftId: `draft-${now().toString(16)}`,
      slot: { ...hit },
      title: String(extra.title || "").trim().slice(0, 50),
      createdAt: now()
    };
    return draft;
  };

  const updateSlot = (patch = {}) => {
    if (!draft) {
      throw Object.assign(new Error("没有待确认草稿"), { code: "NO_DRAFT" });
    }
    if (expired(draft.createdAt)) {
      draft = null;
      throw Object.assign(new Error("草稿已过期"), { code: "DRAFT_EXPIRED" });
    }
    const next = {
      ...draft.slot,
      ...patch
    };
    if (toMinutes(next.end) <= toMinutes(next.start)) {
      throw Object.assign(new Error("结束时间必须晚于开始时间"), {
        code: "BAD_RANGE"
      });
    }
    draft = { ...draft, slot: next };
    return draft;
  };

  const confirmPayload = (title) => {
    if (!draft) {
      throw Object.assign(new Error("没有待确认草稿"), { code: "NO_DRAFT" });
    }
    if (expired(draft.createdAt)) {
      draft = null;
      throw Object.assign(new Error("草稿已过期"), { code: "DRAFT_EXPIRED" });
    }
    return {
      draftId: draft.draftId,
      slot: draft.slot,
      title: String(title || "").trim().slice(0, 50)
    };
  };

  const setRelease = (booking) => {
    releaseBooking = booking && booking.id ? { ...booking } : null;
  };

  const takeRelease = () => {
    const row = releaseBooking;
    if (!row) {
      throw Object.assign(new Error("没有待释放的预定"), { code: "NO_RELEASE" });
    }
    return row;
  };

  const clear = () => {
    draft = null;
    releaseBooking = null;
  };

  const peek = () => ({ draft, releaseBooking, issuedCount: issued.size });

  return {
    issueFromRooms,
    pickSlot,
    updateSlot,
    confirmPayload,
    setRelease,
    takeRelease,
    clear,
    peek
  };
}
