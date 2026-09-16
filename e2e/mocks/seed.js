import { TODAY, TOMORROW, YESTERDAY } from "../helpers/clock.js";

export const ADMIN_ME = {
  userId: "u-li",
  userName: "李权泓",
  dept: "研发",
  isAdmin: true
};

export const STAFF_ME = {
  userId: "u-staff",
  userName: "张伟",
  dept: "产品",
  isAdmin: false
};

export const defaultDicts = () => [
  { id: "d-b1", type: "building", name: "奥城", sort: 1, enabled: true, usageCount: 1 },
  { id: "d-b2", type: "building", name: "生态城", sort: 2, enabled: true, usageCount: 1 },
  { id: "d-f1", type: "facility", name: "电视", sort: 1, enabled: true, usageCount: 1 },
  { id: "d-f2", type: "facility", name: "白板", sort: 2, enabled: true, usageCount: 1 },
  { id: "d-f3", type: "facility", name: "投影", sort: 3, enabled: true, usageCount: 1 }
];

/** 看板 + 管理共用房间主数据 */
export const defaultRooms = () => [
  {
    id: "room-a",
    name: "星海",
    groupName: "研发区",
    buildingName: "奥城",
    floorName: "3层",
    locationDesc: "7层711办公室旁边",
    locationNote: "HDMI 线在抽屉",
    capacity: 8,
    facilities: ["投影", "电视"],
    openStart: "07:00",
    openEnd: "23:00",
    bookAheadDays: 90,
    needApproval: false,
    allowPreempt: false,
    allowRecurring: false,
    enabled: true
  },
  {
    id: "room-b",
    name: "明月",
    groupName: "高管区",
    buildingName: "生态城",
    floorName: "5层",
    locationDesc: "5层电梯旁",
    locationNote: "",
    capacity: 16,
    facilities: ["白板"],
    openStart: "07:00",
    openEnd: "23:00",
    bookAheadDays: 90,
    needApproval: false,
    allowPreempt: false,
    allowRecurring: false,
    enabled: true
  },
  {
    id: "room-off",
    name: "停用房",
    groupName: "",
    buildingName: "奥城",
    floorName: "1层",
    locationDesc: "",
    locationNote: "",
    capacity: 4,
    facilities: [],
    openStart: "07:00",
    openEnd: "23:00",
    bookAheadDays: 90,
    needApproval: false,
    allowPreempt: false,
    allowRecurring: false,
    enabled: false
  }
];

export const defaultBookings = () => [
  {
    id: "bk-other-am",
    roomId: "room-a",
    roomName: "星海",
    buildingName: "奥城",
    floorName: "3层",
    date: TODAY,
    start: "11:00",
    end: "12:00",
    title: "产品晨会",
    remark: "",
    hostUserId: "u-other",
    hostUserName: "王芳",
    dept: "产品",
    status: "upcoming"
  },
  {
    id: "bk-mine-pm",
    roomId: "room-a",
    roomName: "星海",
    buildingName: "奥城",
    floorName: "3层",
    date: TODAY,
    start: "16:00",
    end: "17:00",
    title: "我的周会",
    remark: "",
    hostUserId: "u-li",
    hostUserName: "李权泓",
    dept: "研发",
    status: "upcoming"
  },
  {
    id: "bk-mine-ended",
    roomId: "room-b",
    roomName: "明月",
    buildingName: "生态城",
    floorName: "5层",
    date: YESTERDAY,
    start: "14:00",
    end: "15:00",
    title: "昨日评审",
    remark: "",
    hostUserId: "u-li",
    hostUserName: "李权泓",
    dept: "研发",
    status: "ended"
  }
];

export const SUGGESTIONS = [
  { id: "find-free", label: "找空闲会议室", message: "帮我找空闲会议室" },
  { id: "my-meetings", label: "我今天有哪些会", message: "我今天有哪些会" },
  {
    id: "book-large",
    label: "帮我订明天上午的大会议室",
    message: "帮我订明天上午的大会议室"
  },
  { id: "cancel-last", label: "取消我最近的一场会", message: "取消我最近的一场会" }
];

export { TODAY, TOMORROW, YESTERDAY };
