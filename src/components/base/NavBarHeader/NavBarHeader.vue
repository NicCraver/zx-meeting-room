<script setup lang="ts">
import type { NavBarHeaderEmits } from "./types";
/**
 * 移动端导航头（apps/action-center NavBarHeader.vue 骨架移植，去评论/更多业务）。
 * 左侧返回箭头，居中标题，右侧操作区插槽。
 *
 * 数据流：
 *  emits: back —— 点击返回（父组件决定 router.back 还是其他）
 *  slots: title（标题内容）、actions（右侧操作区）
 */

const emit = defineEmits<NavBarHeaderEmits>();
</script>

<template>
  <div class="flex items-center justify-center h-11 flex-shrink-0 relative">
    <span
      class="i-carbon-arrow-left absolute left-4 w-6 h-6 text-ink cursor-pointer"
      role="button"
      tabindex="0"
      aria-label="返回"
      title="返回"
      @click="emit('back')"
      @keydown.enter="emit('back')"
    ></span>
    <div
      class="relative flex items-center text-title-sm select-none overflow-hidden"
    >
      <div class="truncate max-w-[200px]">
        <slot name="title"></slot>
      </div>
    </div>
    <div
      class="absolute right-0 flex flex-shrink-0 h-10 items-center gap-2 ml-2 mr-2"
    >
      <slot name="actions"></slot>
    </div>
  </div>
</template>
