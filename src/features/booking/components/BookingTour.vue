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

const emit = defineEmits(["start"]);

let tour = null;
let started = false;

const clearDragSlotActive = () => {
  if (typeof document === "undefined") return;
  const elements = document.querySelectorAll('[data-tour="drag-slot"]');
  elements.forEach((el) => {
    el.classList.remove("is-active", "is-playing", "driver-active-element");
  });
};

const activateDragSlot = (element) => {
  if (!element) return;
  element.classList.add("is-active");
  element.classList.remove("is-playing");
  void element.offsetWidth;
  element.classList.add("is-playing");
};

const destroyTour = () => {
  clearDragSlotActive();
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
  emit("start");
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
    onHighlightStarted: (element) => {
      const isDragSlot = Boolean(
        element && element.getAttribute("data-tour") === "drag-slot"
      );
      if (isDragSlot) {
        activateDragSlot(element);
      } else {
        clearDragSlotActive();
      }
    },
    onHighlighted: (element) => {
      const isDragSlot = Boolean(
        element && element.getAttribute("data-tour") === "drag-slot"
      );
      if (isDragSlot) {
        activateDragSlot(element);
      } else {
        clearDragSlotActive();
      }
    },
    onDeselected: (element) => {
      if (element && element.getAttribute("data-tour") === "drag-slot") {
        clearDragSlotActive();
      }
    },
    onDestroyStarted: () => {
      clearDragSlotActive();
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
    const kick = (attempt = 0) => {
      if (started) return;
      if (TOUR_STEPS.some((s) => !document.querySelector(s.element))) {
        if (attempt < 20) window.setTimeout(() => kick(attempt + 1), 50);
        return;
      }
      started = true;
      startTour();
    };
    kick();
  },
  { immediate: true }
);

onBeforeUnmount(() => destroyTour());

defineExpose({ replay: startTour });
</script>

<template>
  <span class="sr-only" aria-hidden="true" />
</template>
