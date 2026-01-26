<script setup>
import { ref, computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import NavBar from './components/layout/NavBar.vue'
import Footer from './components/layout/Footer.vue'
import ProfileIcon from './components/layout/ProfileIcon.vue'

const activeExam = ref('JEE')
const route = useRoute()
const isLabMode = computed(() => route.path.includes('/lab') || route.path.includes('/freelab'))
</script>

<template>
  <div class="app-layout">
    <NavBar v-if="!isLabMode && route.path !== '/electrostatics/gauss' && route.path !== '/electrostatics/gausslaw' && route.name !== 'charges' && route.name !== 'dipole' && !route.path.includes('/gravitation') && route.name !== 'jee-mains-topic-questions'" :activeExam="activeExam" @update:activeExam="activeExam = $event" />
    
    <RouterView :activeExam="activeExam" />
  
    <Footer v-if="!isLabMode && route.path !== '/electrostatics/gauss' && route.path !== '/electrostatics/gausslaw' && route.name !== 'charges' && route.name !== 'dipole' && !route.path.includes('/gravitation') && route.name !== 'jee-mains-topic-questions'" />
    
    <ProfileIcon />
  </div>
</template>

<style scoped>
/* Global layout styles if any needed primarily live here or in global css */
</style>
