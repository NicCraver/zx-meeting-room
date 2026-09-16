<template>
  <NeedHostAuth v-if="!signedIn" />
  <BookingBoardPage v-else />
</template>
<script setup>
import NeedHostAuth from "@/features/auth/NeedHostAuth.vue";
import BookingBoardPage from "@/features/booking/BookingBoardPage.vue";
import { currentHasDemoIdentity } from "@/features/demo/session";

const signedIn = currentHasDemoIdentity();
</script>
