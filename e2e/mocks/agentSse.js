import { TODAY, TOMORROW } from "../helpers/clock.js";

const slotOf = (room, date, start, end) => ({
  roomId: room.id,
  roomName: room.name,
  buildingName: room.buildingName,
  floorName: room.floorName,
  capacity: room.capacity,
  facilities: room.facilities || [],
  date,
  start,
  end
});

const queryRoom = (room, date, slots, busy = []) => ({
  roomId: room.id,
  roomName: room.name,
  buildingName: room.buildingName,
  floorName: room.floorName,
  capacity: room.capacity,
  facilities: room.facilities || [],
  openStart: room.openStart,
  openEnd: room.openEnd,
  busy,
  slots
});

const sse = (...events) => events;

export const agentSseFrames = (state, body) => {
  const action = body.action || "message";
  const sessionId = body.sessionId || "sess-e2e";
  const roomA = state.rooms.find((r) => r.id === "room-a") || state.rooms[0];
  const roomB = state.rooms.find((r) => r.id === "room-b") || roomA;

  if (action === "pick_slot") {
    const slot = body.slot || slotOf(roomA, TODAY, "14:00", "15:00");
    return sse(
      { type: "session", sessionId },
      {
        type: "confirm",
        expression: "focus",
        draft: {
          draftId: "draft-e2e",
          title: "",
          slot
        }
      }
    );
  }

  if (action === "confirm") {
    const title = String(body.title || `${state.me.userName}预定的会议`).slice(0, 50);
    const slot = slotOf(roomA, TODAY, "14:00", "15:00");
    const booking = {
      id: `bk-agent-${Date.now().toString(16)}`,
      roomId: slot.roomId,
      roomName: slot.roomName,
      buildingName: slot.buildingName,
      floorName: slot.floorName,
      date: slot.date,
      start: slot.start,
      end: slot.end,
      title,
      remark: "",
      hostUserId: state.me.userId,
      hostUserName: state.me.userName,
      dept: state.me.dept,
      status: "upcoming"
    };
    state.bookings.push(booking);
    return sse({
      type: "booked",
      expression: "happy",
      bookingId: booking.id,
      title,
      slot
    });
  }

  if (action === "cancel") {
    return sse({ type: "closed", expression: "down" });
  }

  const message = String(body.message || "");

  if (/取消我最近/.test(message)) {
    const mine = state.bookings.find(
      (b) =>
        b.hostUserId === state.me.userId &&
        (b.status === "upcoming" || b.status === "ongoing")
    );
    if (mine) mine.status = "released";
    return sse(
      { type: "session", sessionId },
      {
        type: "status",
        text: mine ? `已释放「${mine.title}」` : "没有可取消的预定",
        expression: mine ? "happy" : "sorry"
      }
    );
  }

  if (/哪些会/.test(message)) {
    const todayMine = state.bookings.filter(
      (b) => b.hostUserId === state.me.userId && b.date === TODAY && b.status !== "released"
    );
    const text = todayMine.length
      ? todayMine.map((b) => `${b.start} ${b.roomName}：${b.title}`).join("；")
      : "今天没有会";
    return sse(
      { type: "session", sessionId },
      { type: "need_more", text, expression: "ease" }
    );
  }

  if (/助手失败|error-please/.test(message)) {
    return sse(
      { type: "session", sessionId },
      { type: "error", msg: "助手暂时不可用", code: "M5001", expression: "sorry" }
    );
  }

  if (/明天上午.*大会议/.test(message)) {
    const slot = slotOf(roomB, TOMORROW, "09:00", "10:00");
    return sse(
      { type: "session", sessionId },
      { type: "status", text: "正在查空档", expression: "focus" },
      {
        type: "query",
        heading: "明天上午 · 大会议室",
        expression: "focus",
        rooms: [queryRoom(roomB, TOMORROW, [slot])]
      }
    );
  }

  if (/很多空闲|三间空闲/.test(message)) {
    const pairs = [
      ["15:00", "16:00"],
      ["15:30", "16:30"],
      ["16:00", "17:00"],
      ["16:30", "17:30"]
    ];
    const extra = {
      id: "room-c",
      name: "二号会议室",
      buildingName: "奥城",
      floorName: "5层",
      capacity: 20,
      facilities: ["电视", "投影", "音响"],
      openStart: "08:00",
      openEnd: "22:00"
    };
    return sse(
      { type: "session", sessionId },
      { type: "status", text: "正在查空档", expression: "focus" },
      {
        type: "query",
        heading: "今天 · 空闲 ≥ 1 小时",
        expression: "focus",
        rooms: [
          queryRoom(
            roomA,
            TODAY,
            pairs.map(([s, e]) => slotOf(roomA, TODAY, s, e))
          ),
          queryRoom(
            extra,
            TODAY,
            pairs.map(([s, e]) => slotOf(extra, TODAY, s, e))
          ),
          queryRoom(
            roomB,
            TODAY,
            pairs.map(([s, e]) => slotOf(roomB, TODAY, s, e))
          )
        ]
      }
    );
  }

  // 找空闲：直接给可点档，方便 E2E 走完确认卡（不跟真实 LLM 的 need_more 日期追问绑死）
  if (/找空闲|空闲会议室/.test(message) || !message) {
    const slot = slotOf(roomA, TODAY, "14:00", "15:00");
    return sse(
      { type: "session", sessionId },
      { type: "status", text: "正在查空档", expression: "focus" },
      {
        type: "query",
        heading: "今天 · 空闲 ≥ 1 小时",
        expression: "focus",
        rooms: [queryRoom(roomA, TODAY, [slot], [{ start: "11:00", end: "12:00" }])]
      }
    );
  }

  return sse(
    { type: "session", sessionId },
    { type: "need_more", text: "你想哪天开会？", expression: "focus" }
  );
};
