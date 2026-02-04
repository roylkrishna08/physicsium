<script setup>
import ChargeLab from '../../../components/unit/electrostatics/ChargeLab.vue'
defineProps(['activeExam'])
</script>

<template>
  <div class="page-wrapper">
    <ChargeLab />
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
