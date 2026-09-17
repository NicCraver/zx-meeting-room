import http from "../http";

/** 分页列表；空 keyword/building/floor 不带，enabled 为 undefined 时不带 */
export const listRooms = ({
  keyword,
  enabled,
  buildingName,
  floorName,
  page,
  pageSize
} = {}) => {
  const params = {};
  if (keyword) params.keyword = keyword;
  if (buildingName) params.buildingName = buildingName;
  if (floorName) params.floorName = floorName;
  if (enabled !== undefined) params.enabled = enabled;
  if (page !== undefined) params.page = page;
  if (pageSize !== undefined) params.pageSize = pageSize;
  return http.get("/rooms", { params });
};

export const getRoom = (id) => http.get(`/rooms/get/${id}`);

export const createRoom = (payload) => http.post("/rooms/create", payload);

export const updateRoom = (id, payload) =>
  http.post(`/rooms/update/${id}`, payload);

export const setRoomEnabled = (id, enabled) =>
  http.post(`/rooms/enabled/${id}`, { enabled });

/**
 * 个人常用（收藏），任何人都能改自己的那份，不需要管理员。
 * 走 /favorites 而不是 /rooms——后者整个 controller 挂了管理员校验。
 * 回参 { roomId, favorite } 是落库后的状态，按它对账。
 */
export const setRoomFavorite = (id, favorite) =>
  http.post(`/favorites/set/${id}`, { favorite });
