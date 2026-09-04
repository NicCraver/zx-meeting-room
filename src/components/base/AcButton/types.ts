/** AcButton 组件类型契约（apps/web AcButton.vue 移植）。 */

export type AcButtonType = "primary" | "danger" | "default";

export interface AcButtonProps {
  title?: string;
  /** primary / danger / default */
  type?: AcButtonType;
  /** 幽灵态（浅底 + 边框 + 同色文字） */
  plain?: boolean;
  loading?: boolean;
  disabled?: boolean;
}

export interface AcButtonEmits {
  click: [];
}
