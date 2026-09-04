import { addDays, shanghaiToday, slotWindow, TL, toMinutes } from "./time.js";

export const DEFAULT_DURATION_MIN = 60;

/** 当前分钟向后取整到「下一个」30 分钟格（整点也往后再跳一格）。 */
export const nextHalfHour = (nowMin) =>
  Math.floor(Number(nowMin) / TL.SNAP) * TL.SNAP + TL.SNAP;

export const clampDefaultSlot = (start, duration = DEFAULT_DURATION_MIN) => {
  let s = start;
  let e = s + duration;
  if (e > TL.DAY_MIN) {
    e = TL.DAY_MIN;
    s = Math.max(0, e - duration);
  }
  if (e - s < TL.SNAP) {
    s = Math.max(0, TL.DAY_MIN - TL.SNAP);
    e = s + TL.SNAP;
  }
  return { start: s, end: e };
};

/**
 * 工具栏手动预约的默认稿。
 * @param {{ nowMin: number, todayIso?: string, rooms?: object[] }} opts
 */
export const draftFromToolbar = ({
  nowMin,
  todayIso = shanghaiToday(),
  rooms = []
} = {}) => {
  const dateIso = todayIso;
  const { start, end } = clampDefaultSlot(nextHalfHour(nowMin));
  const room = rooms[0] || null;
  return {
    source: "toolbar",
    room,
    dateIso,
    dates: [dateIso],
    start,
    end
  };
};

/**
 * 时间轴格子点进来的预填。
 * @param {{ room: object, dateIso: string, start: number, end: number, dates?: string[] }} opts
 */
export const draftFromGrid = ({ room, dateIso, start, end, dates }) => ({
  source: "grid",
  room,
  dateIso,
  dates: dates?.length ? dates : [dateIso],
  start,
  end
});

export const tomorrowIso = (todayIso = shanghaiToday()) => addDays(todayIso, 1);

const asIso = (d) => (typeof d === "string" ? d : d?.value || "");

/**
 * 点击会议室名时的默认时段：当前半格起最近一小时，被占用则向后找。
 * 非当天若当前钟点已过开放时间，则从开放起点开始。
 */
export const nearestHourSlot = (
  room,
  { isToday = false, nowMin = 0, duration = DEFAULT_DURATION_MIN } = {}
) => {
  const openStart = toMinutes(room.openStart || "00:00");
  const openEnd = toMinutes(room.openEnd || "24:00");
  let cursor = isToday ? TL.nextOpen(nowMin, openStart) : openStart;
  if (!isToday) {
    const clock = TL.nextOpen(nowMin, 0);
    if (clock >= openStart && clock + TL.SNAP <= openEnd) cursor = clock;
  }
  const lastStart = openEnd - TL.SNAP;
  for (let start = cursor; start <= lastStart; start += TL.SNAP) {
    const [low, high] = slotWindow(room, start, { isToday, nowMin });
    if (start < low || start + TL.SNAP > high) continue;
    const end = Math.min(high, start + duration);
    if (end - start >= TL.SNAP) return { start, end };
  }
  return null;
};

/**
 * 时间轴左侧会议室格点进来的预填。
 * @returns {{ source: string, room: object, dateIso: string, dates: string[], start: number, end: number } | { error: string }}
 */
export const draftFromRoomCell = ({
  room,
  nowMin,
  todayIso = shanghaiToday(),
  boardDate,
  viewMode = "day",
  weekDates = []
} = {}) => {
  if (!room) return { error: "暂无会议室" };
  let dateIso = boardDate || todayIso;
  let dayRoom = room;
  if (viewMode === "week") {
    const dates = weekDates.map(asIso).filter(Boolean);
    dateIso =
      dates.find((d) => d === todayIso) || dates.find((d) => d >= todayIso);
    if (!dateIso) return { error: "不能预约过去的日期" };
    const i = dates.indexOf(dateIso);
    dayRoom = {
      ...room,
      busyEvents: room.weekDays?.[i]?.busyEvents || []
    };
  } else if (dateIso < todayIso) {
    return { error: "不能预约过去的日期" };
  }
  const slot = nearestHourSlot(dayRoom, {
    isToday: dateIso === todayIso,
    nowMin
  });
  if (!slot) return { error: "该会议室暂无足够空闲时段" };
  return {
    source: "room-cell",
    room,
    dateIso,
    dates: [dateIso],
    start: slot.start,
    end: slot.end
  };
};
