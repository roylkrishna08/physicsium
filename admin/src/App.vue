<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from './stores/auth';

const authStore = useAuthStore();

onMounted(() => {
  authStore.init();
});
</script>

<template>
  <router-view />
</template>

<style>
/* Global transitions or styles can go here */
</style>
