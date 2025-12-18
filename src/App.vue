<script setup>
import { ref } from 'vue'
import { RouterView } from 'vue-router'
import NavBar from './components/NavBar.vue'
import Footer from './components/Footer.vue'

const activeExam = ref('JEE')
</script>

<template>
  <div class="app-layout">
    <NavBar :activeExam="activeExam" @update:activeExam="activeExam = $event" />
    
    <RouterView :activeExam="activeExam" />
  
    <Footer />
  </div>
</template>

<style scoped>
/* Global layout styles if any needed primarily live here or in global css */
</style>
