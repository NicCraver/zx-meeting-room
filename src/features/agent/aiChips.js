export const AI_PLACEHOLDERS = [
  "试试：帮我找一间明天下午 2 点、能坐 8 人的空闲会议室",
  "试试：我今天有哪些会",
  "试试：帮我订明天上午的大会议室",
  "试试：取消我最近的一场会"
];

export const AI_PLACEHOLDER = AI_PLACEHOLDERS[0];
export const AI_PLACEHOLDER_INTERVAL_MS = 4000;

export const nextPlaceholderIndex = (index, length = AI_PLACEHOLDERS.length) =>
  (Number(index) + 1) % length;

export const AI_CHIPS = [
  {
    id: "find-free",
    label: "找空闲会议室",
    message: "帮我找空闲会议室"
  },
  {
    id: "my-meetings",
    label: "我今天有哪些会",
    message: "我今天有哪些会"
  },
  {
    id: "book-large",
    label: "帮我订明天上午的大会议室",
    message: "帮我订明天上午的大会议室"
  },
  {
    id: "cancel-last",
    label: "取消我最近的一场会",
    message: "取消我最近的一场会"
  }
];
