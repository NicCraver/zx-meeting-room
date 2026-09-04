/** AcPageLoading 组件类型契约（apps/web AcPageLoading.vue 移植）。 */

export interface AcPageLoadingProps {
  /** 文案，默认「页面加载中...」 */
  text?: string;
  /** 盖住整屏（含 fixed 底栏/助手），首屏进看板用 */
  fullScreen?: boolean;
}
