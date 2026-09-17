<template>
  <NeedHostAuth v-if="!signedIn" />
  <RaceHubPage v-else />
</template>
<script setup>
import NeedHostAuth from "@/features/auth/NeedHostAuth.vue";
import RaceHubPage from "@/features/race/RaceHubPage.vue";
import { currentHasDemoIdentity } from "@/features/demo/session";

const signedIn = currentHasDemoIdentity();
</script>
