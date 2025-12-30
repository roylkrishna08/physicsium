<script setup>
import { useSearch } from '../composables/useSearch.js'
import { useRoute } from 'vue-router'
import { ref, nextTick } from 'vue'

const { searchQuery } = useSearch()
const isSearchOpen = ref(false)
const searchInput = ref(null)

const toggleSearch = async () => {
    isSearchOpen.value = !isSearchOpen.value
    if (!isSearchOpen.value) {
        searchQuery.value = ''
    } else {
        await nextTick()
        searchInput.value?.focus()
    }
}

const props = defineProps({
  activeExam: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:activeExam'])
const route = useRoute()

const isMenuOpen = ref(false)

const toggleMenu = () => {
    isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
    isMenuOpen.value = false
}

const setExam = (exam) => {
    emit('update:activeExam', exam)
}
</script>

<template>
  <nav class="navbar glass-card" :class="{ 'search-mode': isSearchOpen }">
    <router-link to="/" class="logo">Physicsium<span class="dot">.</span></router-link>
    
    <div class="search-nav" v-if="route.path !== '/'">
        <button class="icon-btn" @click="toggleSearch" aria-label="Search" v-if="!isSearchOpen">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
        </button>
        <div class="search-input-wrapper" v-if="isSearchOpen">
            <input 
                ref="searchInput"
                v-model="searchQuery" 
                class="nav-search-input" 
                placeholder="Search..."
            >
            <button class="icon-btn close-btn" @click="toggleSearch">✕</button>
        </div>
    </div>
    
    <button class="menu-toggle" @click="toggleMenu" aria-label="Toggle Menu">
        <span></span>
        <span></span>
        <span></span>
    </button>

    <div class="links" :class="{ 'is-open': isMenuOpen }">
      <router-link to="/" @click="closeMenu">Home</router-link>
      <router-link to="/syllabus" @click="closeMenu">Syllabus</router-link>
      <router-link to="/topics" @click="closeMenu">Topics</router-link>
      <router-link to="/#practice" @click="closeMenu">Free Resources</router-link>
    </div>
    
    <div class="controls">
        <div class="exam-switch" v-if="route.path === '/syllabus'">
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
  text-decoration: none; /* Ensure no underline for link */
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



/* Search Styles */
.search-nav {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-left: auto; /* Push to right on Desktop */
    margin-right: 1rem;
}

.search-input-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.icon-btn {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    transition: 0.3s;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
}

.icon-btn:hover {
    background: rgba(255, 255, 255, 0.1);
}

.nav-search-input {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    padding: 0.4rem 1rem;
    color: white;
    width: 200px; /* Slightly wider on desktop */
    font-size: 0.9rem;
    outline: none;
    animation: slideIn 0.3s ease;
}

@keyframes slideIn {
    from { width: 0; opacity: 0; }
    to { width: 200px; opacity: 1; }
}

@media (max-width: 768px) {
    .search-nav {
         margin-left: 0; /* Reset margin on mobile */
         margin-right: 0;
    }

    /* Mobile Search Mode */
    .navbar.search-mode {
        padding: 0; /* Maximize space */
    }

    .navbar.search-mode .logo,
    .navbar.search-mode .lang-btn,
    .navbar.search-mode .menu-toggle,
    .navbar.search-mode .controls {
        display: none;
    }

    .navbar.search-mode .search-nav {
        width: 100%;
        padding: 0.5rem 1rem;
    }

    .navbar.search-mode .search-input-wrapper {
        width: 100%;
    }

    .navbar.search-mode .nav-search-input {
        width: 100%;
        background: transparent;
        border: none;
        border-bottom: 1px solid rgba(255,255,255,0.2);
        border-radius: 0;
        animation: none;
    }
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

.menu-toggle {
    display: none;
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
    padding: 1rem;
    width: 95%;
  }

  /* Hamburger Button */
  .menu-toggle {
      display: flex;
      flex-direction: column;
      gap: 6px;
      background: transparent;
      border: none;
      cursor: pointer;
      z-index: 201; /* Above menu */
  }

  .menu-toggle span {
      display: block;
      width: 25px;
      height: 2px;
      background: white;
      border-radius: 2px;
      transition: 0.3s;
  }

  /* Links Container (Mobile Menu) */
  .links {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(5, 7, 14, 0.95);
    backdrop-filter: blur(20px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    font-size: 1.5rem;
    z-index: 200;
    opacity: 0;
    pointer-events: none;
    transform: translateY(-20px);
    transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .links.is-open {
      opacity: 1;
      pointer-events: all;
      transform: translateY(0);
  }

  .links a {
      font-weight: 600;
  }

  .controls {
      display: none; /* Hide exam controls inside navbar for simplicity, or move them */
  }

  /* Adjust Language Button for Mobile */
  .lang-btn {
      right: 60px; /* Move left of hamburger (25px width + gap) */
      top: 1.1rem; /* Align vertically with hamburger approx */
      padding: 4px 10px;
      font-size: 0.8rem;
  }
}
</style>
