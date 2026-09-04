<script setup lang="ts">
import type { AcLoadingBarEmits } from "./types";
import { ref, watch } from "vue";
import { useElementVisibility } from "@vueuse/core";

/**
 * 滚动加载指示器（apps/web AcLoadingBar.vue 移植，去 console.log）。
 * 进入视口即触发加载，配合列表滚动实现「触底加载更多」。
 *
 * 数据流：
 *  emits: change(visible: boolean) —— 指示器进入/离开视口时触发
 */

const emit = defineEmits<AcLoadingBarEmits>();

const loadingRef = ref<HTMLElement | null>(null);
const visible = useElementVisibility(loadingRef);

watch(visible, (v) => emit("change", v));
</script>

<template>
  <div
    ref="loadingRef"
    class="h-10 flex items-center justify-center gap-2 text-body-sm text-mute bg-transparent"
  >
    <span class="i-carbon-circle-dash animate-spin"></span>
    <span>正在加载更多...</span>
  </div>
</template>
