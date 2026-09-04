<script setup lang="ts">
import { computed } from "vue";
import type { SvgIconProps } from "./types";

/**
 * SVG 图标（apps/action-center、apps/web 的 SvgIcon.vue 移植）。
 *
 * 两种渲染模式：
 * - mask 模式（默认）：颜色 = 当前文字色（bg-current + mask-image），跟随 hover/激活态；
 * - img 模式（实心底/多色图标，见 imgIcons.ts）：原色渲染，mask 下会成一坨色块。
 *
 * 数据流：
 *  props.name  图标文件名（不带 .svg，如 "add-fill"）；不存在则渲染空
 *  emits: 无
 *
 * 图标来源：本目录 svgs/（335 个，action-center 254 + web 94，含子目录扁平化）。
 * 新增图标：把 .svg 拷进 svgs/ 即自动收录（import.meta.glob）；
 * 若是实心底/多色图标，同时在 imgIcons.ts 登记，否则默认走 mask。
 */

const props = withDefaults(defineProps<SvgIconProps>(), { name: "" });

/** 该图标是否走 img 原色渲染（实心底/多色图标，mask 会成一坨色块） */
const isImgIcon = computed(() => svgIconImgNames.includes(props.name));

const maskStyle = computed(() => {
  const url = ICON_URLS[props.name];
  if (!url) return {};
  // 与生产一致：maskSize 100% + maskRepeat no-repeat 缺一不可。
  // 80 个 svg 自带 width/height 固有尺寸，若按 mask-size:auto 渲染会平铺/裁切；
  // bg-no-repeat 只设 background-repeat，管不到 mask-repeat（默认 repeat）。
  // data URL 内 SVG 属性是单引号，url() 必须加双引号包裹才能解析
  return {
    maskImage: `url("${url}")`,
    WebkitMaskImage: `url("${url}")`,
    maskSize: "100%",
    WebkitMaskSize: "100%",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat"
  };
});

const hasIcon = computed(() => Boolean(ICON_URLS[props.name]));
</script>

<template>
  <img
    v-if="isImgIcon && hasIcon"
    class="inline-block"
    :src="ICON_URLS[props.name]"
    :alt="props.name"
  />
  <span
    v-else-if="hasIcon"
    class="inline-block bg-current bg-no-repeat"
    :style="maskStyle"
  ></span>
</template>

<script lang="ts">
/**
 * 图标索引：eager glob 收集 svgs/ 下全部 .svg 的 URL。
 * 文件名（去掉 .svg）即 SvgIcon 的 name。
 */
import { svgIconImgNames } from "./imgIcons";

const modules = import.meta.glob("./svgs/*.svg", {
  eager: true,
  query: "?url",
  import: "default"
}) as Record<string, string>;

const ICON_URLS: Record<string, string> = Object.fromEntries(
  Object.entries(modules).map(([path, url]) => [
    path.replace("./svgs/", "").replace(/\.svg$/, ""),
    url
  ])
);

/** 全部图标名（供展示页与外部引用） */
export const svgIconNames: string[] = Object.keys(ICON_URLS).sort();

/** img 原色渲染的图标名（实心底/多色，见 imgIcons.ts） */
export { svgIconImgNames };

/** mask 跟随文字色渲染的图标名（img 名单之外） */
export const svgIconMaskNames: string[] = svgIconNames.filter(
  (n) => !svgIconImgNames.includes(n)
);

// dev 调试：检查 ICON_URLS 运行时值
if (import.meta.env.DEV) {
  (window as any).__ICON_URLS = ICON_URLS;
  (window as any).__ICON_NAMES = svgIconNames;
}
</script>
