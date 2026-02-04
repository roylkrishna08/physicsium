<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const props = defineProps(['isOpen'])
const emit = defineEmits(['close'])

const router = useRouter()
const route = useRoute()

const menuItems = [
    { title: 'Universal Law', path: '/gravitation/universal-law', icon: '🌌' },
    { title: 'Acceleration Due to Gravity', path: '/gravitation/acceleration', icon: '📉' },
    { title: 'Kepler\'s Laws', path: '/gravitation/kepler', icon: '🪐' },
    { title: 'Gravitational Potential', path: '/gravitation/potential', icon: '⛰️' },
    { title: 'Satellite Motion', path: '/gravitation/satellite', icon: '🛰️' }
]

const isActive = (path) => route.path === path

const navigate = (path) => {
    router.push(path)
    if (window.innerWidth < 1024) emit('close')
}
</script>

<template>
  <aside class="gravitation-sidebar" :class="{ 'open': isOpen }">
    <div class="header">
        <h2>Gravitation</h2>
    </div>
    
    <nav class="nav-links">
        <div 
            v-for="item in menuItems" 
            :key="item.path"
            class="nav-item"
            :class="{ active: isActive(item.path) }"
            @click="navigate(item.path)"
        >
            <span class="icon">{{ item.icon }}</span>
            <span class="label">{{ item.title }}</span>
        </div>
    </nav>
  </aside>
</template>

<style scoped>
.gravitation-sidebar {
    position: fixed;
    top: 110px; /* Start below floating navbar (24px + 80px + gap) */
    left: 0;
    width: 280px;
    height: calc(100vh - 110px);
    background: rgba(18, 20, 28, 0.98);
    backdrop-filter: blur(20px);
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    z-index: 900; /* Below Navbar (1000) */
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform: translateX(-100%); /* Hidden by default */
    box-shadow: 4px 0 30px rgba(0, 0, 0, 0.3);
    border-top-right-radius: 16px; /* consistent with rounded theme */
}

.gravitation-sidebar.open {
    transform: translateX(0); /* Visible when open */
}

@media (max-width: 1024px) {
    /* No special transform needed as base class uses -100% and .open uses 0 */
}

@media (max-width: 768px) {
    .gravitation-sidebar {
        top: 70px; /* Mobile navbar height */
        height: calc(100vh - 70px);
        width: 100%; /* Full width on mobile for better UX? Or keep 280px? usually 280px is fine, or 100% if drawer. Let's keep 280px or max-width 100% */
        border-top-right-radius: 0;
    }
}

.header {
    padding: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
    margin: 0;
    background: linear-gradient(135deg, #fff, #a5f3fc);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}
/* Close button styles removed as button will be removed from template */

.nav-links {
    padding: 1.5rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.nav-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.8rem 1rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #94a3b8;
}

.nav-item:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #e2e8f0;
}

.nav-item.active {
    background: rgba(0, 212, 255, 0.1);
    color: #00d4ff;
    border-left: 3px solid #00d4ff;
}

.icon {
    font-size: 1.2rem;
}

.label {
    font-size: 0.95rem;
    font-weight: 500;
}
</style>
