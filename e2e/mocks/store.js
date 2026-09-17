import { fail, ok } from "./envelope.js";
import {
  ADMIN_ME,
  SUGGESTIONS,
  defaultBookings,
  defaultDicts,
  defaultRooms
} from "./seed.js";
import { TODAY } from "../helpers/clock.js";

const clone = (v) => JSON.parse(JSON.stringify(v));

const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && aEnd > bStart;

const hmToMin = (hm) => {
  const [h, m] = String(hm).split(":").map(Number);
  return h * 60 + m;
};

const newId = (prefix) =>
  `${prefix}-${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 8)}`;

export const createStore = (overrides = {}) => {
  const state = {
    me: clone(overrides.me || ADMIN_ME),
    rooms: clone(overrides.rooms || defaultRooms()),
    dicts: clone(overrides.dicts || defaultDicts()),
    bookings: clone(overrides.bookings || defaultBookings()),
    audits: clone(overrides.audits || {}),
    suggestions: clone(overrides.suggestions || SUGGESTIONS),
    events: [],
    lastCreatePayload: null,
    lastBoardDate: null,
    createCalls: 0,
    flags: {
      boardFail: Boolean(overrides.boardFail),
      meCode: overrides.meCode || null,
      mineFail: Boolean(overrides.mineFail),
      suggestionsFail: Boolean(overrides.suggestionsFail),
      forceConflict: Boolean(overrides.forceConflict),
      delayCreateMs: Number(overrides.delayCreateMs || 0)
    }
  };

  for (const b of state.bookings) {
    if (!state.audits[b.id]) {
      state.audits[b.id] = [
        {
          id: `aud-${b.id}-c`,
          bookingId: b.id,
          seriesId: null,
          action: "create",
          actorUserId: b.hostUserId,
          actorUserName: b.hostUserName,
          detail: null,
          createdAt: `${b.date}T08:00:00+08:00`
        }
      ];
    }
  }

  const roomById = (id) => state.rooms.find((r) => r.id === id);

  const liveBookings = () =>
    state.bookings.filter((b) => b.status !== "released");

  const toBusy = (b, meId) => ({
    start: b.start,
    end: b.end,
    title: b.title,
    host: b.hostUserName,
    dept: b.dept || "",
    mine: b.hostUserId === meId
  });

  const boardForDate = (date) => {
    const meId = state.me.userId;
    const rooms = state.rooms
      .filter((r) => r.enabled !== false)
      .map((r) => ({
        ...r,
        busyEvents: liveBookings()
          .filter((b) => b.roomId === r.id && b.date === date)
          .map((b) => toBusy(b, meId))
      }));
    const facilitySet = new Set();
    rooms.forEach((r) => (r.facilities || []).forEach((f) => facilitySet.add(f)));
    return {
      rooms,
      facilityOptions: Array.from(facilitySet)
    };
  };

  const mineList = () =>
    state.bookings
      .filter((b) => b.hostUserId === state.me.userId)
      .map((b) => ({ ...b }));

  const appendAudit = (bookingId, action, actor) => {
    if (!state.audits[bookingId]) state.audits[bookingId] = [];
    state.audits[bookingId].push({
      id: newId("aud"),
      bookingId,
      seriesId: null,
      action,
      actorUserId: actor.userId,
      actorUserName: actor.userName,
      detail: null,
      createdAt: new Date().toISOString()
    });
  };

  const hasOverlap = (roomId, date, start, end, ignoreId) =>
    liveBookings().some(
      (b) =>
        b.id !== ignoreId &&
        b.roomId === roomId &&
        b.date === date &&
        overlaps(hmToMin(start), hmToMin(end), hmToMin(b.start), hmToMin(b.end))
    );

  const createOne = (payload) => {
    const room = roomById(payload.roomId);
    if (!room) return fail("M4004", "会议室不存在");
    if (room.enabled === false) return fail("M4009", "该会议室已停用");
    if (state.flags.forceConflict || hasOverlap(room.id, payload.date, payload.start, payload.end)) {
      return fail("M4010", "该时段已被占用");
    }
    const booking = {
      id: newId("bk"),
      roomId: room.id,
      roomName: room.name,
      buildingName: room.buildingName,
      floorName: room.floorName,
      date: payload.date,
      start: payload.start,
      end: payload.end,
      title: payload.title || `${state.me.userName}预定的会议`,
      remark: payload.remark || "",
      hostUserId: state.me.userId,
      hostUserName: state.me.userName,
      dept: state.me.dept,
      status: payload.date === TODAY && hmToMin(payload.start) <= 10 * 60
        ? "ongoing"
        : "upcoming"
    };
    state.bookings.push(booking);
    appendAudit(booking.id, "create", state.me);
    return ok(booking);
  };

  const jsonHandle = (method, path, { query, body }) => {
    if (path === "/me" && method === "GET") {
      if (state.flags.meCode) return fail(state.flags.meCode, "登录已过期，请重新登录");
      return ok(state.me);
    }

    if (path === "/board" && method === "GET") {
      if (state.flags.boardFail) return fail("M5000", "加载失败");
      state.lastBoardDate = query.date || TODAY;
      return ok(boardForDate(query.date || TODAY));
    }

    if (path === "/bookings/mine" && method === "GET") {
      if (state.flags.mineFail) return fail("M5000", "加载失败");
      return ok(mineList());
    }

    if (path === "/bookings/create" && method === "POST") {
      state.createCalls += 1;
      state.lastCreatePayload = body;
      const dates = Array.isArray(body.dates) && body.dates.length
        ? body.dates
        : [body.date];
      const items = [];
      for (const date of dates) {
        const res = createOne({ ...body, date });
        if (res.json.code !== "M0000") {
          items.forEach((it) => {
            const idx = state.bookings.findIndex((b) => b.id === it.id);
            if (idx >= 0) state.bookings.splice(idx, 1);
          });
          return res;
        }
        items.push(res.json.data);
      }
      return ok(dates.length > 1 ? { items } : items[0]);
    }

    const releaseMatch = path.match(/^\/bookings\/release\/(.+)$/);
    if (releaseMatch && method === "POST") {
      const booking = state.bookings.find((b) => b.id === releaseMatch[1]);
      if (!booking) return fail("M4004", "预定不存在");
      if (booking.status === "ended" || booking.status === "released") {
        return fail("M4010", "该预定已结束，无法释放");
      }
      booking.status = "released";
      appendAudit(booking.id, "release", state.me);
      return ok(booking);
    }

    if (path === "/bookings/admin" && method === "GET") {
      const page = Number(query.page || 1);
      const pageSize = Number(query.pageSize || 20);
      const list = state.bookings.slice();
      const start = (page - 1) * pageSize;
      return ok({ list: list.slice(start, start + pageSize), total: list.length });
    }

    const auditMatch = path.match(/^\/bookings\/audit\/(.+)$/);
    if (auditMatch && method === "GET") {
      return ok(state.audits[auditMatch[1]] || []);
    }

    if (path === "/rooms" && method === "GET") {
      let list = state.rooms.slice();
      if (query.keyword) {
        const q = String(query.keyword).toLowerCase();
        list = list.filter((r) =>
          `${r.name} ${r.buildingName} ${r.floorName}`.toLowerCase().includes(q)
        );
      }
      if (query.enabled === "true" || query.enabled === true) {
        list = list.filter((r) => r.enabled !== false);
      }
      if (query.enabled === "false" || query.enabled === false) {
        list = list.filter((r) => r.enabled === false);
      }
      if (query.buildingName) list = list.filter((r) => r.buildingName === query.buildingName);
      if (query.floorName) list = list.filter((r) => r.floorName === query.floorName);
      const page = Number(query.page || 1);
      const pageSize = Number(query.pageSize || 20);
      const start = (page - 1) * pageSize;
      return ok({ list: list.slice(start, start + pageSize), total: list.length });
    }

    if (path === "/rooms/create" && method === "POST") {
      const dup = state.rooms.find(
        (r) => r.enabled !== false && r.name === body.name
      );
      if (dup) return fail("M4009", "启用中会议室名称不能重复");
      const room = {
        id: newId("room"),
        groupName: "",
        locationDesc: null,
        locationNote: null,
        facilities: [],
        openStart: "07:00",
        openEnd: "23:00",
        bookAheadDays: 90,
        needApproval: false,
        allowPreempt: false,
        allowRecurring: false,
        enabled: true,
        ...body
      };
      state.rooms.push(room);
      return ok(room);
    }

    const getRoom = path.match(/^\/rooms\/get\/(.+)$/);
    if (getRoom && method === "GET") {
      const room = roomById(getRoom[1]);
      if (!room) return fail("M4004", "会议室不存在");
      return ok(room);
    }

    const updateRoom = path.match(/^\/rooms\/update\/(.+)$/);
    if (updateRoom && method === "POST") {
      const room = roomById(updateRoom[1]);
      if (!room) return fail("M4004", "会议室不存在");
      Object.assign(room, body);
      return ok(room);
    }

    const enabledRoom = path.match(/^\/rooms\/enabled\/(.+)$/);
    if (enabledRoom && method === "POST") {
      const room = roomById(enabledRoom[1]);
      if (!room) return fail("M4004", "会议室不存在");
      room.enabled = Boolean(body.enabled);
      return ok(room);
    }

    if (path === "/dicts" && method === "GET") {
      const type = query.type;
      const list = type ? state.dicts.filter((d) => d.type === type) : state.dicts;
      return ok(list);
    }

    if (path === "/dicts/create" && method === "POST") {
      const dup = state.dicts.find(
        (d) => d.type === body.type && d.name === body.name
      );
      if (dup) return fail("M4009", "同类型下已有相同名称");
      const item = {
        id: newId("d"),
        type: body.type,
        name: body.name,
        sort: body.sort || 1,
        enabled: true,
        usageCount: 0
      };
      state.dicts.push(item);
      return ok(item);
    }

    const updateDict = path.match(/^\/dicts\/update\/(.+)$/);
    if (updateDict && method === "POST") {
      const item = state.dicts.find((d) => d.id === updateDict[1]);
      if (!item) return fail("M4004", "字典不存在");
      const dup = state.dicts.find(
        (d) => d.type === item.type && d.name === body.name && d.id !== item.id
      );
      if (dup) return fail("M4009", "同类型下已有相同名称");
      const oldName = item.name;
      if (body.name) item.name = body.name;
      if (body.sort != null) item.sort = body.sort;
      if (item.type === "building" && oldName !== item.name) {
        state.rooms.forEach((r) => {
          if (r.buildingName === oldName) r.buildingName = item.name;
        });
      }
      return ok(item);
    }

    const enabledDict = path.match(/^\/dicts\/enabled\/(.+)$/);
    if (enabledDict && method === "POST") {
      const item = state.dicts.find((d) => d.id === enabledDict[1]);
      if (!item) return fail("M4004", "字典不存在");
      item.enabled = Boolean(body.enabled);
      return ok(item);
    }

    const deleteDict = path.match(/^\/dicts\/delete\/(.+)$/);
    if (deleteDict && method === "POST") {
      const idx = state.dicts.findIndex((d) => d.id === deleteDict[1]);
      if (idx < 0) return fail("M4004", "字典不存在");
      const item = state.dicts[idx];
      if (item.usageCount > 0) {
        return fail(
          "M4009",
          `有 ${item.usageCount} 间会议室正在使用「${item.name}」，无法删除`
        );
      }
      state.dicts.splice(idx, 1);
      return ok(true);
    }

    if (path === "/agent/suggestions" && method === "GET") {
      if (state.flags.suggestionsFail) return fail("M5000", "助手建议失败");
      return ok(state.suggestions);
    }

    if (path === "/events" && method === "POST") {
      const events = Array.isArray(body?.events) ? body.events : [];
      state.events.push(...events);
      return ok({ accepted: events.length, duplicated: 0 });
    }

    return fail("M9999", `未 mock 的路径: ${method} ${path}`);
  };

  const handle = (method, path, ctx = {}) => jsonHandle(method, path, ctx);

  return { state, handle };
};
