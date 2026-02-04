<script setup>
import GaussLawLab from '../../../components/unit/electrostatics/GaussLawLab.vue'
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
    overflow: hidden;
}
</style>
