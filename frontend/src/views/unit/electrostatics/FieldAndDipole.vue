<script setup>
import DipoleLab from '../../../components/electrostatics/DipoleLab.vue'
defineProps(['activeExam'])
</script>

<template>
  <div class="page-wrapper">
    <DipoleLab />
  </div>
</template>

<style scoped>
.page-wrapper {
    width: 100%;
    height: 100vh;
    position: relative;
    background: #0f172a; 
}
</style>
