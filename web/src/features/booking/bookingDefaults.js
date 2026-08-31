import { addDays, shanghaiToday, TL } from "./time.js";

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
