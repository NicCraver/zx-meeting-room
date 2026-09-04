<script setup lang="ts">
/**
 * PC 空态（apps/web/src/components/common/AcEmpty.vue 移植，去掉图片资源依赖）。
 * icon 用插槽覆盖（默认 information 图标），desc 可插槽。
 */

withDefaults(defineProps<{ title?: string }>(), { title: "暂无最新数据" });
</script>

<template>
  <div class="flex flex-col items-center justify-center shrink-0 gap-2">
    <slot name="icon">
      <span class="i-carbon-information text-3xl text-control"></span>
    </slot>
    <span class="text-body-sm leading-5 text-mute">{{ title }}</span>
    <div class="mt-4">
      <slot name="desc" />
    </div>
  </div>
</template>
