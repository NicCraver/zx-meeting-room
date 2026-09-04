<template>
  <el-config-provider :locale="zhCn">
    <div class="dt-range">
      <span class="dt-range-clock" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle
            cx="12"
            cy="12"
            r="8.25"
            stroke="currentColor"
            stroke-width="1.6"
          />
          <path
            d="M12 7.5V12l3 2"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>

      <el-date-picker
        v-model="dateIso"
        type="date"
        value-format="YYYY-MM-DD"
        format="M月D日"
        :clearable="false"
        :editable="false"
        :disabled-date="disabledDate"
        :shortcuts="shortcuts"
        popper-class="dt-date-pop"
        class="dt-range-date"
        aria-label="预定日期"
      />

      <el-popover
        v-model:visible="startOpen"
        trigger="click"
        :width="80"
        :show-arrow="false"
        popper-class="dt-time-pop"
        @show="scrollActive('start')"
      >
        <template #reference>
          <button type="button" class="dt-range-time" aria-label="开始时间">
            {{ fromMinutes(start) }}
          </button>
        </template>
        <div ref="startList" class="dt-time-list">
          <button
            v-for="t in startOpts"
            :key="t"
            type="button"
            class="dt-time-item"
            :class="{ 'is-active': t === start }"
            @click="pickStart(t)"
          >
            {{ fromMinutes(t) }}
          </button>
        </div>
      </el-popover>

      <span class="dt-range-dash">–</span>

      <el-popover
        v-model:visible="endOpen"
        trigger="click"
        :width="220"
        :show-arrow="false"
        popper-class="dt-time-pop"
        @show="scrollActive('end')"
      >
        <template #reference>
          <button type="button" class="dt-range-time" aria-label="结束时间">
            {{ fromMinutes(end) }}
          </button>
        </template>
        <div ref="endList" class="dt-time-list">
          <button
            v-for="opt in endOpts"
            :key="opt.value"
            type="button"
            class="dt-time-item"
            :class="{ 'is-active': opt.value === end }"
            @click="pickEnd(opt.value)"
          >
            {{ opt.label }}
            <span class="dt-time-dur">({{ opt.duration }})</span>
          </button>
        </div>
      </el-popover>
    </div>
  </el-config-provider>
</template>

<script setup>
import { computed, nextTick, ref } from "vue";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import { fromMinutes, shanghaiToday } from "../time";
import {
  endTimeOptions,
  keepDurationEnd,
  startTimeOptions
} from "../datetimeRange";

const dateIso = defineModel("dateIso", { type: String, required: true });
const start = defineModel("start", { type: Number, required: true });
const end = defineModel("end", { type: Number, required: true });

const startOpen = ref(false);
const endOpen = ref(false);
const startList = ref(null);
const endList = ref(null);

const shortcuts = [{ text: "今天", value: () => new Date() }];

const startOpts = computed(() => startTimeOptions());
const endOpts = computed(() => endTimeOptions(start.value));

const disabledDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}` < shanghaiToday();
};

const scrollActive = async (which) => {
  await nextTick();
  const root = which === "start" ? startList.value : endList.value;
  root?.querySelector(".is-active")?.scrollIntoView({ block: "center" });
};

const pickStart = (t) => {
  end.value = keepDurationEnd(start.value, end.value, t);
  start.value = t;
  startOpen.value = false;
};

const pickEnd = (t) => {
  end.value = t;
  endOpen.value = false;
};
</script>
