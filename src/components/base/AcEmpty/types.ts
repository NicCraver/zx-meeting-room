/** AcEmpty 组件类型契约（apps/web AcEmpty.vue 移植）。 */

export interface AcEmptyProps {
  /** 空态主文案 */
  title?: string;
}

export interface AcEmptySlots {
  /** 自定义图形区（默认 information 图标） */
  icon?: unknown;
  /** 图标下方操作区 */
  desc?: unknown;
}
