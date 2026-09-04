<script setup lang="ts">
import type { AcPageLoadingProps } from "./types";
/**
 * 整页加载（apps/web/src/components/common/AcPageLoading.vue 移植）。
 * 旋转环用 primary-border / primary，文字 mute。
 */

withDefaults(defineProps<AcPageLoadingProps>(), {
  fullScreen: false
});
</script>

<template>
  <div
    class="flex flex-col items-center justify-center w-full gap-3 bg-canvas-soft"
    :class="fullScreen ? 'fixed inset-0 z-50' : 'h-full flex-1 min-h-0'"
  >
    <div
      class="w-8 h-8 border-2 border-solid border-primaryBorder border-t-primary rounded-full animate-spin"
    ></div>
    <span class="text-body-sm text-mute">{{ text ?? "页面加载中..." }}</span>
  </div>
</template>
