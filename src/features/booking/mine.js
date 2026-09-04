import { formatMonthDay, toMinutes } from "./time.js";

export const MINE_STATUS_LABEL = {
  ongoing: "进行中",
  upcoming: "待开始",
  ended: "已结束",
  released: "已释放"
};

export const isLiveMineStatus = (status) =>
  status === "ongoing" || status === "upcoming";

export const canChangeBooking = (status) => isLiveMineStatus(status);

export const splitMineBookings = (items) => {
  const list = Array.isArray(items) ? items : [];
  return {
    live: list.filter((b) => isLiveMineStatus(b.status)),
    past: list.filter((b) => !isLiveMineStatus(b.status))
  };
};

export const defaultMineTab = (items) =>
  splitMineBookings(items).live.length ? "live" : "past";

export const formatMineDate = (iso) => {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || "";
  return formatMonthDay(iso);
};

export const formatMinePlace = (booking) => {
  const name = String(booking?.roomName || "").trim();
  const loc = [booking?.buildingName, booking?.floorName]
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .join(" ");
  if (!name) return loc;
  return loc ? `${name}（${loc}）` : name;
};

export const draftRangeFromMine = (booking) => ({
  start: toMinutes(booking.start),
  end: toMinutes(booking.end),
  dates: [booking.date],
  dateIso: booking.date,
  dateLabel: formatMonthDay(booking.date),
  text: `${booking.start} - ${booking.end}`
});

export const roomFromMine = (booking, rooms = []) =>
  (rooms || []).find((r) => r.id === booking.roomId) || {
    id: booking.roomId,
    name: booking.roomName,
    buildingName: booking.buildingName,
    floorName: booking.floorName
  };

/** 下一场仍可释放的预定（按日期+开始时间） */
export const pickNextReleasable = (items, todayIso = "") => {
  const list = (Array.isArray(items) ? items : []).filter((b) =>
    canChangeBooking(b.status)
  );
  if (!list.length) return null;
  const key = (b) => `${b.date || ""} ${b.start || ""}`;
  list.sort((a, b) => key(a).localeCompare(key(b)));
  const next = list.find((b) => key(b) >= `${todayIso} `);
  return next || list[0];
};

export const createdCount = (result) => {
  if (result && Array.isArray(result.items) && result.items.length) {
    return result.items.length;
  }
  return 1;
};
