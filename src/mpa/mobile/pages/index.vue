<template>
  <NeedHostAuth v-if="!signedIn" />
  <MobileBookingPage v-else />
</template>
<script setup>
import NeedHostAuth from "@/features/auth/NeedHostAuth.vue";
import MobileBookingPage from "@/features/booking/MobileBookingPage.vue";
import { currentHasDemoIdentity } from "@/features/demo/session";

const signedIn = currentHasDemoIdentity();
</script>
