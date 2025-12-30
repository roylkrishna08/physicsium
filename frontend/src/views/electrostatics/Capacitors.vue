<script setup>
import ElectrostaticsBackground from '../../components/ElectrostaticsBackground.vue'
defineProps(['activeExam'])
</script>

<template>
  <ElectrostaticsBackground />
  <div class="page-container container">
    <div class="content-wrapper glass-card">
        <h1>Capacitors & Dielectrics</h1>
        <p>Conductors/insulators, dielectrics, polarization, capacitance, series/parallel combination, energy stored in capacitor.</p>
        <div class="placeholder">
            [Detailed content for Capacitors & Dielectrics will go here]
        </div>
        <router-link to="/electrostatics" class="back-link">← Back to Electrostatics</router-link>
    </div>
  </div>
</template>

<style scoped>
.page-container { padding-top: 6rem; min-height: 100vh; display: flex; justify-content: center; }
.content-wrapper { width: 100%; max-width: 800px; padding: 2rem; background: rgba(15, 23, 42, 0.8); }
h1 { font-size: 2.5rem; color: #fff; margin-bottom: 1rem; }
p { color: var(--text-secondary); font-size: 1.1rem; line-height: 1.6; margin-bottom: 2rem; }
.back-link { color: var(--primary-glow); text-decoration: none; font-weight: 600; }
.back-link:hover { text-decoration: underline; }
</style>
