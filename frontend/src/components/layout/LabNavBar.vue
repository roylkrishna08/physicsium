<template>
  <nav class="lab-navbar glass-panel">
    <!-- Left: Hamburger + Brand -->
    <div class="left-section">
      <button 
        class="hamburger-btn" 
        @click="$emit('toggleLeftSidebar')"
        :title="isLeftSidebarCollapsed ? 'Show Experiments' : 'Hide Experiments'"
      >
        <span class="hamburger-icon">{{ isLeftSidebarCollapsed ? '☰' : '×' }}</span>
      </button>
      
      <div class="brand">
        <span class="logo">Physicsium</span>
        <span class="lab-badge">Lab</span>
      </div>
    </div>
    
    <!-- Center: Experiment Name -->
    <div class="experiment-name">{{ experimentName }}</div>
    
    <!-- Right: Exit + Hamburger -->
    <div class="right-section">
      <button class="exit-btn" @click="$emit('exit')">
        ← Exit Lab
      </button>
      
      <button 
        class="hamburger-btn" 
        @click="$emit('toggleRightSidebar')"
        :title="isRightSidebarCollapsed ? 'Show Controls' : 'Hide Controls'"
      >
        <span class="hamburger-icon">{{ isRightSidebarCollapsed ? '☰' : '×' }}</span>
      </button>
    </div>
  </nav>
</template>

<script setup>
defineProps({
  experimentName: {
    type: String,
    default: 'Select Experiment'
  },
  isLeftSidebarCollapsed: {
    type: Boolean,
    default: false
  },
  isRightSidebarCollapsed: {
    type: Boolean,
    default: false
  }
})

defineEmits(['exit', 'toggleLeftSidebar', 'toggleRightSidebar'])
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
}

.experiment-name {
  flex: 1;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 500;
  color: #cbd5e1;
  letter-spacing: 0.3px;
  /* Multi-line support */
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
}

.exit-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--primary-glow, #00d4ff);
  color: var(--primary-glow, #00d4ff);
  transform: translateX(-2px);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .lab-navbar {
    padding: 0.8rem 1rem;
    height: auto;
    flex-wrap: wrap;
    gap: 0.8rem; /* Space between rows */
  }
  
  .left-section {
    order: 1;
  }
  
  .right-section {
    order: 2;
  }
  
  .brand {
    display: none; 
  }
  
  .experiment-name {
    order: 3;
    width: 100%; /* Full width row */
    font-size: 0.95rem;
    text-align: center;
    white-space: normal;
    overflow: visible; /* Show everything */
    display: block; /* Normal block */
    padding: 0;
    line-height: 1.4;
  }
  
  .exit-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }
}
  /* Optional: Change Exit text to Icon only via CSS content or just keep it short */

</style>
