<script setup lang="ts">
import type { MEmptyProps } from "./types";
/**
 * 移动端空态（apps/action-center MEmpty.vue 简化移植，去图片资源依赖）。
 *
 * 数据流：
 *  props.fullHeight  占满父容器高度（默认 true）
 *  props.noImage     不显示默认图标
 *  slots: 默认（文案）、img（自定义图形区）
 */

withDefaults(defineProps<MEmptyProps>(), {
  fullHeight: true,
  noImage: false
});
</script>

<template>
  <div
    class="flex items-center justify-center"
    :class="[fullHeight ? 'h-full' : 'flex-1']"
  >
    <div class="flex items-center justify-center flex-col gap-2">
      <slot name="img">
        <span
          v-if="!noImage"
          class="i-carbon-information text-4xl text-control"
        ></span>
      </slot>
      <p class="text-body-sm text-mute text-center">
        <slot>暂无内容</slot>
      </p>
    </div>
  </div>
</template>
