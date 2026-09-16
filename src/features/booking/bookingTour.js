import { fromMinutes, shanghaiNowMinutes, TL, WEEK } from "./time.js";

export const TOUR_STORAGE_KEY = "mr_tour_v1";

/**
 * 动态计算引导拖选演示的时段区间。
 * 按照当前时间对齐到下一个 30 分钟刻度，跨度 2 小时（120分钟）。
 * @param {number|null} nowMinInput 可选指定分钟数；若未指定则自动获取当前上海时间
 */
export const getTourDragRange = (nowMinInput = null) => {
  let nowMin = nowMinInput;
  if (nowMin == null || Number.isNaN(Number(nowMin))) {
    nowMin = shanghaiNowMinutes();
  }

  const DURATION = 120; // 2小时演示

  // 凌晨时段（00:00 - 08:00），以白天办公时间 09:00-11:00 演示
  if (nowMin < 8 * 60) {
    const startMin = 9 * 60;
    const endMin = startMin + DURATION;
    return {
      startMin,
      endMin,
      label: `${fromMinutes(startMin)}-${fromMinutes(endMin)}`
    };
  }

  // 向上对齐到下一个 30 分钟格（保证在当前时刻之后，不落在已过去的时段）
  let startMin = Math.ceil((nowMin + 1) / 30) * 30;
  let endMin = startMin + DURATION;

  // 若超出当天 24:00 (1440)，回退到白天标准时段 14:00-16:00
  if (endMin > 1440) {
    startMin = 14 * 60;
    endMin = startMin + DURATION;
  }

  return {
    startMin,
    endMin,
    label: `${fromMinutes(startMin)}-${fromMinutes(endMin)}`
  };
};

/** 兼容旧静态常数 */
export const TOUR_DRAG = {
  startMin: 14 * 60,
  endMin: 16 * 60,
  weekDay: 1
};

export const tourDragSlotStyle = (
  viewMode = "day",
  nowMin = null,
  weekDay = 1
) => {
  const mode =
    typeof viewMode === "object" ? viewMode.viewMode || "day" : viewMode;
  const currentNowMin = typeof viewMode === "object" ? viewMode.nowMin : nowMin;
  const currentWeekDay =
    typeof viewMode === "object" ? (viewMode.weekDay ?? 1) : weekDay;

  const { startMin, endMin } = getTourDragRange(currentNowMin);
  if (mode === "week") return WEEK.eventStyle(currentWeekDay, startMin, endMin);
  return {
    left: TL.pct(startMin),
    width: `${((endMin - startMin) / TL.DAY_MIN) * 100}%`
  };
};

export const TOUR_STEPS = [
  {
    element: '[data-tour="room-table"]',
    popover: {
      title: "会议室表格",
      description: "这里能看到今天所有会议室的占用情况，横轴是时间",
      // 表格几乎铺满视口，side=bottom 会被 driver 挤到屏幕最底下
      side: "over",
      align: "center"
    }
  },
  {
    element: '[data-tour="empty-slot"]',
    popover: {
      title: "空白格子",
      description: "点击任意空白时段即可快速预约",
      side: "bottom"
    }
  },
  {
    element: '[data-tour="drag-slot"]',
    popover: {
      title: "拖动预约",
      description: "在格子里按住拖动，可以快速圈出时段预约",
      side: "bottom"
    }
  },
  {
    element: '[data-tour="book-cta"]',
    popover: {
      title: "+ 预约会议室",
      description: "或者点这里手动填写完整信息",
      side: "bottom"
    }
  },
  {
    element: '[data-tour="ai-input"]',
    popover: {
      title: "问助手",
      description: "懒得自己挑？直接告诉它你的需求",
      side: "bottom"
    }
  },
  {
    element: '[data-tour="chip-find-free"]',
    popover: {
      title: "找空闲会议室",
      description: "比如一键找出当前所有空闲会议室",
      side: "top"
    }
  }
];

export const isTourSeen = (storage = globalThis.localStorage) => {
  try {
    return storage?.getItem(TOUR_STORAGE_KEY) === "1";
  } catch {
    return true;
  }
};

export const markTourSeen = (storage = globalThis.localStorage) => {
  try {
    storage?.setItem(TOUR_STORAGE_KEY, "1");
  } catch {
    // 无 storage 时静默
  }
  return TOUR_STORAGE_KEY;
};

export const shouldAutoStartTour = ({ seen, boardReady }) =>
  Boolean(boardReady) && !seen;
