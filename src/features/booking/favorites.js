/**
 * 常用会议室（个人收藏）的本地口径。
 *
 * 后端 `/board` 已经按「常用置顶 → 楼宇 → 楼层 → 名称」排好序，但点星标之后
 * 不重新拉看板（一拉就会把当前选中的时段冲掉），所以本地要按同一条规则重排，
 * 否则收藏完位置不动、下次刷新才跳走，看起来像 bug。
 */

const zh = (a, b) => String(a || "").localeCompare(String(b || ""), "zh-CN");

/** 与后端 BoardService 的比较器保持一致：常用在前，空字段排后 */
export const compareRooms = (a, b) => {
  const favA = a && a.favorite ? 0 : 1;
  const favB = b && b.favorite ? 0 : 1;
  if (favA !== favB) return favA - favB;
  return (
    zh(a && a.buildingName, b && b.buildingName) ||
    zh(a && a.floorName, b && b.floorName) ||
    zh(a && a.name, b && b.name)
  );
};

/** 返回新数组，不原地改 rooms（Vue 里原地 sort 不会触发依赖它的 computed 重算） */
export const sortRooms = (rooms) =>
  (Array.isArray(rooms) ? rooms.slice() : []).sort(compareRooms);

/**
 * 把某个房间的 favorite 置成目标值并重排。
 * 找不到该 id 时原样返回（房间可能刚被管理员停用，收藏结果没必要凭空造一行）。
 */
export const applyFavorite = (rooms, roomId, favorite) => {
  const list = Array.isArray(rooms) ? rooms : [];
  if (!list.some((room) => room && room.id === roomId)) return list.slice();
  return sortRooms(
    list.map((room) =>
      room && room.id === roomId
        ? { ...room, favorite: Boolean(favorite) }
        : room
    )
  );
};

/** 星标的无障碍文案，两端共用 */
export const favoriteLabel = (room) =>
  room && room.favorite
    ? `取消常用 ${room.name || ""}`.trim()
    : `标为常用 ${room.name || ""}`.trim();
