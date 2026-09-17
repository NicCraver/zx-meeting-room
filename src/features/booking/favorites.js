/**
 * 收藏与常用的本地口径。**两者不是一回事**：
 * - `favorite` 是收藏，用户手动点星标，个人意愿；
 * - `frequent` 是常用，后端按「近 30 天本人未释放的预定 ≥ 3 次」算出来的行为统计，
 *   前端只读、不可点。
 *
 * 后端 `/board` 已经按「收藏 → 常用 → 楼宇 → 楼层 → 名称」排好序。点星标之后
 * 不重新拉看板（一拉会把当前拖选的时段冲掉），所以本地要把这一行挪到新的档位里，
 * 否则收藏完位置不动、下次刷新才跳走，看起来像 bug。
 *
 * **本地只按档位重排，不复制后端那套中文排序**：Java 的 `Collator.getInstance(CHINA)`
 * 把「A401」排在「常用验证室」前面，JS 的 `localeCompare(…, "zh-CN")` 正好相反，
 * 两边对「拉丁字母 vs 汉字」的名字判定不一致（实测过）。进来的数组本就是后端排好的，
 * 同档位保留原有相对顺序（Array#sort 是稳定的）就等于沿用后端口径，比再算一遍更准。
 */

/** 档位：收藏 0、常用 1、其余 2。与后端 BoardService 的前两级比较器同序 */
export const roomTier = (room) => {
  if (room && room.favorite) return 0;
  if (room && room.frequent) return 1;
  return 2;
};

/** 只比档位；同档返回 0，交给稳定排序保留后端给的顺序 */
export const compareRooms = (a, b) => roomTier(a) - roomTier(b);

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

/** 星标的无障碍文案，两端共用。星标只管收藏，不要写成「常用」 */
export const favoriteLabel = (room) =>
  room && room.favorite
    ? `取消收藏 ${room.name || ""}`.trim()
    : `收藏 ${room.name || ""}`.trim();
