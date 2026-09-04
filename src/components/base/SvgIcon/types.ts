/** SvgIcon 组件类型契约（apps/action-center、apps/web SvgIcon.vue 移植）。 */

export interface SvgIconProps {
  /** 图标名：svgs/ 下文件名（不含 .svg），如 "add-fill"、"comment" */
  name: string;
}
