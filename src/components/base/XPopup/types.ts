/** XPopup 组件类型契约（apps/web XPopup.vue 移植）。 */

export type XPopupSlide = "bottom" | "left";

export interface XPopupProps {
  /** 遮罩透明（浮层本身仍保留） */
  maskTransparent?: boolean;
  /** 透明背景：不提供白色圆角底，由插槽内容自带 */
  bgTransparent?: boolean;
  /** 浮层层级 */
  zIndex?: number;
  /** 点击遮罩不关闭 */
  preventMaskClose?: boolean;
  /** 关闭前钩子，可 await */
  beforeCloseFn?: () => void | Promise<void>;
  /** 入场方向：bottom（默认）/ left */
  slide?: XPopupSlide;
}

export interface XPopupEmits {
  /** 出场动画结束后触发（命令式 wrapper 接住后 reject/unmount） */
  close: [];
}
