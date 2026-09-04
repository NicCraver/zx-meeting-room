/** AcDialog 组件类型契约（apps/web AcDialog.vue 移植）。 */

export interface AcDialogProps {
  title?: string;
  /** 标题右侧提示（12px/mute） */
  titleTip?: string;
  /** 确定按钮左侧提示 */
  buttonTip?: string;
  submitTitle?: string;
  cancelTitle?: string;
  /** 无标题栏色块，内容/脚部加分割线 */
  splitTheme?: boolean;
  /** 隐藏脚部按钮，自行放内容区操作 */
  noBtn?: boolean;
  /** 点遮罩关闭，默认 false */
  closeOnClickModal?: boolean;
  btnLoading?: boolean;
  submitDisabled?: boolean;
  /** 确定按钮额外 class（主题色覆盖） */
  submitClass?: string;
}

export interface AcDialogEmits {
  /** 点确定 */
  submit: [];
  /** 点取消/关闭图标 */
  close: [];
}

export interface AcDialogSlots {
  /** 内容区 */
  content?: unknown;
  /** 完全自定义头部 */
  "custom-header"?: unknown;
  /** 脚部左侧信息区 */
  "footer-left"?: unknown;
  /** 确定按钮左侧插槽 */
  "footer-before-actions"?: unknown;
}
