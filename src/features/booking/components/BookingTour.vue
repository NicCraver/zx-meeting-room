<script setup>
import { onBeforeUnmount, watch } from "vue";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import {
  isTourSeen,
  markTourSeen,
  shouldAutoStartTour,
  TOUR_STEPS
} from "../bookingTour.js";

const props = defineProps({
  ready: { type: Boolean, default: false }
});

let tour = null;
let started = false;

const destroyTour = () => {
  if (tour) {
    tour.destroy();
    tour = null;
  }
};

const startTour = () => {
  if (typeof document === "undefined") return;
  const missing = TOUR_STEPS.some((s) => !document.querySelector(s.element));
  if (missing) return;
  destroyTour();
  tour = driver({
    showProgress: true,
    allowClose: true,
    overlayClickBehavior: "close",
    skipMissingElement: true,
    waitForElement: 2000,
    nextBtnText: "下一步",
    prevBtnText: "上一步",
    doneBtnText: "开始使用",
    steps: TOUR_STEPS,
    onDestroyStarted: () => {
      markTourSeen();
      if (tour) tour.destroy();
    }
  });
  tour.drive();
};

watch(
  () => props.ready,
  (ready) => {
    if (started) return;
    if (
      !shouldAutoStartTour({
        seen: isTourSeen(),
        boardReady: ready
      })
    ) {
      return;
    }
    started = true;
    startTour();
  },
  { immediate: true }
);

onBeforeUnmount(() => destroyTour());

defineExpose({ replay: startTour });
</script>

<template>
  <span class="sr-only" aria-hidden="true" />
</template>
