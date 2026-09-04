<script setup lang="ts">
import type { AcButtonProps, AcButtonEmits } from "./types";
import { computed } from "vue";

/**
 * 生产按钮（apps/web/src/components/common/AcButton.vue 移植）。
 * 三级类型 × plain 幽灵态；loading / disabled 内置。
 * 色名与生产 uno.config 的 theme.colors 完全一致，可原样搬回生产。
 */

const props = withDefaults(defineProps<AcButtonProps>(), {
  title: "",
  type: "default",
  plain: false,
  loading: false,
  disabled: false
});

const emit = defineEmits<AcButtonEmits>();

const btnClass = computed(() => {
  let base = "";
  if (props.type === "primary") {
    base = props.plain
      ? "text-primary border-primary hover:text-primaryActive hover:border-primaryActive"
      : "text-white bg-primary border-primary hover:bg-primaryActive hover:border-primaryActive";
  } else if (props.type === "danger") {
    base = props.plain
      ? "text-danger border-danger hover:text-dangerActive hover:border-dangerActive"
      : "text-white bg-danger border-danger hover:bg-dangerActive hover:border-dangerActive";
  } else {
    base = props.plain
      ? "text-grayDark border-control hover:text-primary hover:border-primary"
      : "text-white bg-grayDark border-grayDark hover:bg-primary hover:border-primary";
  }
  // 生产里 primary+plain 的浅底是硬编码 #EBF2FF，这里换成 theme 同名色
  if (props.type === "primary" && props.plain) base += " !bg-primaryLight";
  return base;
});
</script>

<template>
  <button
    class="rounded-sm px-4 h-8 text-body-md border disabled:(op-70 cursor-not-allowed) inline-flex items-center justify-center gap-1"
    :class="btnClass"
    :disabled="disabled || loading"
    @click="emit('click')"
  >
    <span
      v-if="loading"
      class="i-carbon-circle-dash w-3.5 h-3.5 animate-spin"
    ></span>
    <span>{{ title }}</span>
    <slot />
  </button>
</template>
