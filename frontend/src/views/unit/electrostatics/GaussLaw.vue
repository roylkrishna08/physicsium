<script setup>
import GaussLawLab from '../../../components/electrostatics/GaussLawLab.vue'
defineProps(['activeExam'])
</script>

<template>
  <div class="page-wrapper">
    <GaussLawLab />
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
