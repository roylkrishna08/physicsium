<script setup>
import { useLanguage } from '../composables/useLanguage.js'
import { useRoute } from 'vue-router'

const props = defineProps({
  activeExam: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:activeExam'])
const { currentLang, toggleLanguage, t } = useLanguage()
const route = useRoute()

const setExam = (exam) => {
    emit('update:activeExam', exam)
}
</script>

<template>
  <nav class="navbar glass-card">
    <button class="lang-btn" @click="toggleLanguage" title="Translate">
        {{ currentLang === 'en' ? 'हिन्दी' : 'English' }}
    </button>
    
    <div class="logo">Physicsium<span class="dot">.</span></div>
    <div class="links">
      <router-link to="/">{{ t('nav.home') }}</router-link>
      <router-link to="/syllabus">{{ t('nav.syllabus') }}</router-link>
      <router-link to="/#topics">{{ t('nav.topics') }}</router-link>
      <router-link to="/#practice">{{ t('nav.practice') }}</router-link>
    </div>
    
    <div class="controls">
        <div class="exam-switch" v-if="route.path !== '/'">
          <div class="switch-bg" :class="{ right: activeExam === 'NEET' }"></div>
          <span @click="setExam('JEE')" :class="{ active: activeExam === 'JEE' }">JEE</span>
          <span @click="setExam('NEET')" :class="{ active: activeExam === 'NEET' }">NEET</span>
        </div>
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

.controls {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-right: 3rem;
}

.lang-btn {
    position: absolute;
    top: 8px;
    right: 15px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.7);
    padding: 3px 8px;
    border-radius: 12px;
    cursor: pointer;
    font-size: 0.7rem;
    font-weight: 500;
    transition: 0.3s;
    font-family: var(--font-main);
    z-index: 200;
}

.lang-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
    border-color: var(--primary-glow);
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
/* Mobile Responsiveness */
@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    width: 95%;
    margin: 1rem auto;
  }

  .links {
    gap: 1rem;
    font-size: 0.9rem;
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }

  .logo {
    font-size: 1.5rem;
  }
  
  .controls {
      flex-direction: row;
      align-items: center;
      gap: 1rem;
  }
}
</style>
