/** AcLoadingBar 组件类型契约（apps/web AcLoadingBar.vue 移植）。 */

export interface AcLoadingBarEmits {
  /** 指示器进入/离开视口 */
  change: [visible: boolean];
}
