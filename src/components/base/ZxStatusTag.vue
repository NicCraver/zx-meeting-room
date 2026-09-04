<script setup lang="ts">
import { computed } from "vue";

/**
 * 状态标签 —— DESIGN.md 的标志性组件。
 * 2px 圆角、20px 高、12px 字号；语义色做前景，同色系浅底做背景。
 * 逾期与警告色相接近但语义不同，这里作为两个独立类型，不可互替。
 */

type TagTone =
  "todo" | "doing" | "done" | "overdue" | "warning" | "danger" | "ts" | "t0";

const props = defineProps<{ tone: TagTone; label: string }>();

// 待确认：DESIGN.md 只定义了 success-bg 一个语义浅底，
// overdue / warning / danger 的浅底是按同色系推导的临时值，需回填进 DESIGN.md 才算数。
const TONE_STYLE: Record<TagTone, { color: string; background: string }> = {
  todo: {
    color: "var(--zx-color-body)",
    background: "var(--zx-color-canvas-soft)"
  },
  doing: {
    color: "var(--zx-color-primary)",
    background: "var(--zx-color-primary-bg)"
  },
  done: {
    color: "var(--zx-color-success)",
    background: "var(--zx-color-success-bg)"
  },
  overdue: { color: "var(--zx-color-overdue)", background: "#FFF3E5" },
  warning: { color: "var(--zx-color-warning)", background: "#FFF7E6" },
  danger: { color: "var(--zx-color-danger)", background: "#FFECEC" },
  ts: {
    color: "var(--zx-color-biz-ts)",
    background: "var(--zx-color-biz-ts-bg)"
  },
  t0: {
    color: "var(--zx-color-biz-t0)",
    background: "var(--zx-color-biz-t0-bg)"
  }
};

const style = computed(() => TONE_STYLE[props.tone]);
</script>

<template>
  <span class="zx-status-tag" :style="style">{{ label }}</span>
</template>

<style scoped>
.zx-status-tag {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 var(--zx-space-sm);
  border-radius: var(--zx-rounded-xs);
  font-size: var(--zx-font-size-caption);
  line-height: var(--zx-line-height-caption);
  white-space: nowrap;
}
</style>
