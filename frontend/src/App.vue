<script setup>
import { ref, computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import NavBar from './components/NavBar.vue'
import Footer from './components/Footer.vue'

const activeExam = ref('JEE')
const route = useRoute()
const isLabMode = computed(() => route.path.includes('/lab'))
</script>

<template>
  <div class="app-layout">
    <NavBar v-if="!isLabMode" :activeExam="activeExam" @update:activeExam="activeExam = $event" />
    
    <RouterView :activeExam="activeExam" />
  
    <Footer v-if="!isLabMode" />
  </div>
</template>

<style scoped>
/* Global layout styles if any needed primarily live here or in global css */
</style>
