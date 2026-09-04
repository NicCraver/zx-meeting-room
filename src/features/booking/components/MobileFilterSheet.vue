<template>
  <XPopup @close="emit('close')">
    <div class="sheet-header">
      <button type="button" class="navbar-action" @click="emit('close')">
        关闭
      </button>
      <span class="sheet-title">{{ title }}</span>
      <span style="width: 40px" />
    </div>

    <div class="sheet-body">
      <div v-if="type === 'place'" class="m-option-list">
        <button
          v-for="p in placeOptions"
          :key="p"
          type="button"
          class="m-option-row"
          :class="{ active: draft.place === p }"
          @click="draft.place = p"
        >
          <span>{{ p === "all" ? "全部建筑楼层" : p }}</span>
          <SvgIcon
            v-if="draft.place === p"
            name="check"
            class="w-4 h-4 text-success"
          />
        </button>
      </div>

      <div v-else class="m-chip-grid">
        <button
          v-for="f in facilityOptions"
          :key="f"
          type="button"
          class="m-chip"
          :class="{ active: draft.facilities.includes(f) }"
          @click="toggleFacility(f)"
        >
          {{ f }}
        </button>
      </div>
    </div>

    <div class="sheet-footer flex gap-12px">
      <AcButton class="flex-1 h-11" title="重置" @click="resetDraft" />
      <AcButton
        class="flex-1 h-11"
        type="primary"
        title="确定"
        @click="apply"
      />
    </div>
  </XPopup>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { AcButton, SvgIcon, XPopup } from "@/components/base";

const props = defineProps({
  type: { type: String, required: true },
  filters: { type: Object, required: true },
  places: { type: Array, default: () => [] },
  facilityOptions: { type: Array, default: () => [] }
});

const emit = defineEmits(["apply", "close"]);

const draft = ref({ ...props.filters });

watch(
  () => props.filters,
  (next) => {
    draft.value = { ...next };
  }
);

const title = computed(() =>
  props.type === "place" ? "建筑 · 楼层" : "设备设施"
);

const placeOptions = computed(() => ["all", ...props.places]);

const toggleFacility = (name) => {
  const list = draft.value.facilities;
  draft.value = {
    ...draft.value,
    facilities: list.includes(name)
      ? list.filter((f) => f !== name)
      : [...list, name]
  };
};

const resetDraft = () => {
  draft.value = { ...draft.value, place: "all", facilities: [] };
};

const apply = () => {
  emit("apply", { ...draft.value });
};
</script>
