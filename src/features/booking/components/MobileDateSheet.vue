<template>
  <XPopup @close="emit('close')">
    <div class="sheet-header">
      <button type="button" class="navbar-action" @click="emit('close')">
        关闭
      </button>
      <span class="sheet-title">选择日期</span>
      <span style="width: 40px" />
    </div>
    <div class="sheet-body">
      <div class="m-option-list">
        <button
          v-for="d in days"
          :key="d.value"
          type="button"
          class="m-option-row"
          :class="{ active: selectedDate === d.value }"
          @click="emit('select', d.value)"
        >
          <span
            >{{ d.chip
            }}{{
              d.week === "今天"
                ? "（今天）"
                : d.week === "明天"
                  ? "（明天）"
                  : ""
            }}</span
          >
          <SvgIcon
            v-if="selectedDate === d.value"
            name="check"
            class="w-4 h-4 text-success"
          />
        </button>
      </div>
    </div>
  </XPopup>
</template>

<script setup>
import { SvgIcon, XPopup } from "@/components/base";

defineProps({
  days: { type: Array, default: () => [] },
  selectedDate: { type: String, required: true }
});

defineEmits(["select", "close"]);
</script>
