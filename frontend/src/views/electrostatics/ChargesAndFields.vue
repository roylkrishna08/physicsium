<script setup>
import ChargeLab from '../../components/electrostatics/ChargeLab.vue'
defineProps(['activeExam'])
</script>

<template>
  <div class="page-wrapper">
    <ChargeLab />
  </div>
</template>

<style scoped>
.page-container {
    padding-top: 6rem;
    min-height: 100vh;
    display: flex;
    justify-content: center;
}
.content-wrapper {
    width: 100%;
    max-width: 800px;
    padding: 2rem;
    background: rgba(15, 23, 42, 0.8);
}
h1 {
    font-size: 2.5rem;
    color: #fff;
    margin-bottom: 1rem;
}
p {
    color: var(--text-secondary);
    font-size: 1.1rem;
    line-height: 1.6;
    margin-bottom: 2rem;
}
.back-link {
    color: var(--primary-glow);
    text-decoration: none;
    font-weight: 600;
}
.back-link:hover {
    text-decoration: underline;
}
</style>
