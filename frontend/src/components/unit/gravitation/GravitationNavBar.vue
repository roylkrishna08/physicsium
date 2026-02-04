<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  isSidebarOpen: {
    type: Boolean,
    default: false
  },
  showMenuToggle: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['toggleSidebar'])
const router = useRouter()

const toggleSidebar = () => {
    emit('toggleSidebar')
}

const goHome = () => {
    router.push('/')
}
</script>

<template>
  <nav class="gravitation-navbar glass-panel">
    <div class="left-section">
      <button 
        v-if="showMenuToggle"
        class="hamburger-btn" 
        @click="toggleSidebar"
        title="Toggle Menu"
      >
        <span class="hamburger-icon">☰</span>
      </button>
      
      <div class="brand" @click="goHome">
        <span class="logo-text">Physicsium</span>
        <span class="unit-badge">Gravitation</span>
      </div>
    </div>
    
    <div class="right-section">
        <router-link to="/topics" class="nav-link">Topics</router-link>
        <router-link to="/" class="nav-link">Home</router-link>
    </div>
  </nav>
</template>

<style scoped>
.gravitation-navbar {
    position: fixed;
    top: 1.5rem; /* Match standard navbar margin-top */
    left: 50%;
    transform: translateX(-50%);
    width: 90%;
    max-width: 1200px;
    height: auto; /* Allow auto height for padding */
    min-height: 80px; /* Standard navbar size approx */
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 2.5rem;
    background: rgba(22, 26, 31, 0.8); /* Keep glass effect */
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px; /* Standard navbar radius */
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
}

/* Ensure background doesn't show behind rounded corners */
.gravitation-navbar::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 20px;
    background: inherit;
    z-index: -1;
}

.left-section {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

.hamburger-btn {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #fff;
    width: 36px;
    height: 36px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}

.hamburger-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: #60a5fa;
    color: #60a5fa;
}

.brand {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    cursor: pointer;
}

.logo-text {
    font-size: 1.2rem;
    font-weight: 700;
    color: #fff;
    text-shadow: 0 2px 5px rgba(0,0,0,0.5);
}

.unit-badge {
    background: rgba(96, 165, 250, 0.2);
    color: #60a5fa;
    border: 1px solid rgba(96, 165, 250, 0.4);
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.right-section {
    display: flex;
    gap: 1.5rem;
}

.nav-link {
    color: #94a3b8;
    text-decoration: none;
    font-size: 0.95rem;
    transition: color 0.2s;
}

.nav-link:hover {
    color: #fff;
}

@media (max-width: 768px) {
    .gravitation-navbar {
        top: 0;
        left: 0;
        transform: none;
        width: 100%;
        border-radius: 0;
        padding: 1rem;
        margin: 0;
        min-height: 70px;
        background: rgba(22, 26, 31, 0.98);
    }
    
    .logo-text {
        display: none;
    }
}
</style>
