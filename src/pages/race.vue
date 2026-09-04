<template>
  <DemoHomePage v-if="!signedIn" />
  <RaceHubPage v-else />
</template>
<script setup>
import DemoHomePage from "@/features/demo/DemoHomePage.vue";
import RaceHubPage from "@/features/race/RaceHubPage.vue";
import { currentHasDemoIdentity } from "@/features/demo/session";

const signedIn = currentHasDemoIdentity();
</script>
