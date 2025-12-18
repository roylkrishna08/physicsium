<script setup>
import { ref } from 'vue'

const activeExam = ref('JEE')
const toggleExam = () => {
    activeExam.value = activeExam.value === 'JEE' ? 'NEET' : 'JEE'
    // In a real app, emit this change or use a store
}
</script>

<template>
  <nav class="navbar glass-card">
    <div class="logo">Physicsium<span class="dot">.</span></div>
    <div class="links">
      <a href="#" class="active">Home</a>
      <a href="#topics">Topics</a>
      <a href="#practice">Practice</a>
      <a href="#formulas">Formulas</a>
    </div>
    <div class="exam-switch" @click="toggleExam">
      <div class="switch-bg" :class="{ right: activeExam === 'NEET' }"></div>
      <span :class="{ active: activeExam === 'JEE' }">JEE</span>
      <span :class="{ active: activeExam === 'NEET' }">NEET</span>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2.5rem;
  margin: 1.5rem auto;
  width: 90%;
  max-width: 1200px;
  position: sticky;
  top: 1rem;
  z-index: 100;
}

.logo {
  font-size: 1.8rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: -1px;
}

.dot {
  color: var(--primary-glow);
}

.links {
  display: flex;
  gap: 2rem;
}

.links a {
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
  transition: 0.3s;
  position: relative;
}

.links a:hover, .links a.active {
  color: #fff;
}

.links a::after {
  content: '';
  position: absolute;
  width: 0;
  height: 2px;
  bottom: -4px;
  left: 0;
  background: var(--primary-glow);
  transition: 0.3s;
}

.links a:hover::after, .links a.active::after {
  width: 100%;
}

.exam-switch {
  display: flex;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 30px;
  padding: 4px;
  position: relative;
  cursor: pointer;
  overflow: hidden;
}

.switch-bg {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 50%; /* Approx */
  height: calc(100% - 8px);
  background: var(--primary-glow);
  border-radius: 20px;
  transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
  width: 60px; /* Fixed width matching span */
}

.switch-bg.right {
  transform: translateX(100%);
  background: var(--accent-green);
}

.exam-switch span {
  position: relative;
  z-index: 2;
  padding: 6px 18px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-secondary);
  transition: 0.3s;
  width: 60px;
  text-align: center;
  user-select: none;
}

.exam-switch span.active {
  color: #000;
}
</style>
