export const TOUR_STORAGE_KEY = "mr_tour_v1";

export const TOUR_STEPS = [
  {
    element: '[data-tour="room-table"]',
    popover: {
      title: "会议室表格",
      description: "这里能看到今天所有会议室的占用情况，横轴是时间",
      side: "bottom"
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
