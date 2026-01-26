<template>
  <nav class="lab-navbar glass-panel">
    <!-- Left: Hamburger + Brand -->
    <div class="left-section">
      <button 
        class="hamburger-btn" 
        @click="$emit('toggleLeftSidebar')"
        :title="isLeftSidebarCollapsed ? 'Show Experiments' : 'Hide Experiments'"
      >
        <!-- Always Hamburger as requested -->
        <span class="hamburger-icon">☰</span>
      </button>
      
      <div class="brand">
        <router-link to="/" class="logo">Physicsium</router-link>
        <router-link to="/electrostatics" class="lab-badge">Electrostatics</router-link>
      </div>
    </div>
    
    <!-- Center: Experiment Name -->
    <div class="experiment-name">{{ experimentName }}</div>
    
    <!-- Right: Exit + Hamburger -->
    <div class="right-section">
      <router-link :to="exitPath" class="exit-btn">
        ← Exit
      </router-link>
      
      <button 
        class="hamburger-btn drawing-toggle" 
        :class="{ 'active': drawingActive }"
        @click="$emit('toggleDrawing')"
        title="Toggle Drawing Tool"
      >
        <span class="pen-icon">✏️</span>
      </button>

      <button 
        class="hamburger-btn" 
        @click="$emit('toggleRightSidebar')"
        :title="isRightSidebarCollapsed ? 'Show Controls' : 'Hide Controls'"
      >
        <!-- Always Hamburger as requested -->
        <span class="hamburger-icon">☰</span>
      </button>
    </div>
  </nav>
</template>

<script setup>
defineProps({
  experimentName: {
    type: String,
    default: 'Electrostatics'
  },
  isLeftSidebarCollapsed: {
    type: Boolean,
    default: false
  },
  isRightSidebarCollapsed: {
    type: Boolean,
    default: false
  },
  exitPath: {
    type: String,
    default: '/electrostatics'
  },
  drawingActive: {
    type: Boolean,
    default: false
  }
})

defineEmits(['toggleLeftSidebar', 'toggleRightSidebar', 'toggleDrawing'])
</script>

<style scoped>
.lab-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: rgba(22, 26, 31, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 100;
  height: 60px;
  flex-shrink: 0;
}

.left-section,
.right-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.hamburger-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  width: 40px;
  height: 40px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hamburger-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--primary-glow, #00d4ff);
  transform: scale(1.05);
}

.hamburger-icon {
  font-size: 1.5rem;
  line-height: 1;
}

/* Brand styles are defined below with router-link support */

.experiment-name {
  flex: 1;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 500;
  color: #cbd5e1;
  letter-spacing: 0.3px;
  white-space: normal;
  line-height: 1.2;
  padding: 0 10px;
}

.exit-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  padding: 0.5rem 1.2rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none; /* For router-link */
  display: inline-flex; /* For router-link */
  align-items: center;
}

.exit-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--primary-glow, #00d4ff);
  color: var(--primary-glow, #00d4ff);
  transform: translateX(-2px);
}

.brand {
    text-decoration: none; /* For router-link */
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.5px;
  text-decoration: none;
}

.logo:hover {
    opacity: 0.9;
}

.lab-badge {
  background: var(--primary-glow, #00d4ff);
  color: #000;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-decoration: none;
  cursor: pointer;
}

.lab-badge:hover {
    filter: brightness(1.1);
}

.drawing-toggle.active {
    background: rgba(0, 212, 255, 0.2);
    border-color: #00d4ff;
    color: #00d4ff;
    box-shadow: 0 0 15px rgba(0, 212, 255, 0.3);
}

.pen-icon {
    font-size: 1.2rem;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
    .lab-navbar {
        padding: 0.5rem 1rem;
    }

    .brand .logo {
        font-size: 1.2rem;
    }

    .brand .lab-badge {
        display: none; /* Hide badge to save space */
    }

    .experiment-name {
        font-size: 0.9rem;
        display: none; /* Hide in favor of logo/exit on very small or just simplify */
    }
    
    /* If we want to keep experiment name, maybe hide brand logo */
}

@media (max-width: 480px) {
    .exit-btn {
        padding: 0.4rem 0.8rem;
        font-size: 0.8rem;
    }
    
    .hamburger-btn {
        width: 36px;
        height: 36px;
    }
}
</style>
