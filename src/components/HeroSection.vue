<script setup>
import SolarSystem from './SolarSystem.vue'
</script>

<template>
  <header class="hero container">
    <div class="hero-content">
      <div class="pill">🚀 Physics for Top Rankers</div>
      <h1 class="hero-title">
        Decode the <br />
        <span class="text-gradient">Universe of Physics</span>
      </h1>
      
      <!-- Mobile Interleaved Solar System -->
      <div class="mobile-solar-container">
          <SolarSystem />
      </div>

      <p class="hero-subtitle">
        Visualise concepts, master properties, and ace your JEE & NEET exams with our premium interactive learning platform.
      </p>
      <div class="hero-actions">
        <router-link to="/topics" class="btn-primary">Start Learning Free</router-link>
        <button class="btn-outline">Watch Demo</button>
      </div>
      
      <div class="stats-row">
        <div class="stat">
          <span class="number">30+</span>
          <span class="label">Chapters</span>
        </div>
        <div class="stat">
          <span class="number">2000+</span>
          <span class="label">Questions</span>
        </div>
      </div>
    </div>
    
    <div class="hero-visual">
       <SolarSystem />
       <div class="glow-backdrop"></div>
    </div>
  </header>
</template>

<style scoped>
/* ... (Keep existing layout styles) ... */
.hero {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  align-items: center;
  min-height: 80vh;
  padding-top: 2rem;
}

.hero-content {
  z-index: 2;
}

.pill {
  display: inline-block;
  padding: 8px 16px;
  background: rgba(0, 212, 255, 0.1);
  color: var(--primary-glow);
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(0, 212, 255, 0.2);
}

.hero-title {
  font-size: 4rem;
  line-height: 1.1;
  font-weight: 700;
  margin-bottom: 1.5rem;
}

/* Mobile Solar Container - Hidden by default */
.mobile-solar-container {
    display: none;
    height: 180px; 
    align-items: center;
    justify-content: center;
    margin: 0.5rem 0 1rem 0;
    overflow: hidden;
    perspective: 1000px;
    pointer-events: none;
    width: 100%; /* Force container to fit parent */
    max-width: 100vw;
}

.hero-subtitle {
  font-size: 1.2rem;
  color: var(--text-secondary);
  max-width: 500px;
  margin-bottom: 2.5rem;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 3rem;
}
.btn-outline {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.2);
  padding: 12px 32px;
  border-radius: 30px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: 0.3s;
  font-family: var(--font-main);
}

.btn-outline:hover {
  border-color: #fff;
  background: rgba(255,255,255,0.05);
}

.stats-row {
    display: flex;
    gap: 3rem;
    border-top: 1px solid rgba(255,255,255,0.1);
    padding-top: 1.5rem;
}

.stat {
    display: flex;
    flex-direction: column;
}

.stat .num {
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
}

.stat .label {
    font-size: 0.9rem;
    color: var(--text-secondary);
}

/* Visual Section (Desktop) */
.hero-visual {
  position: relative;
  height: 600px;
  display: flex;
  justify-content: center;
  align-items: center;
  perspective: 1200px;
}

.glow-backdrop {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 700px;
    height: 700px;
    background: radial-gradient(circle, rgba(255, 140, 0, 0.05) 0%, transparent 60%);
    transform: translate(-50%, -50%);
    z-index: -1;
    pointer-events: none;
}

@media (max-width: 768px) {
    .hero {
        grid-template-columns: 1fr; /* Single column */
        text-align: center;
        padding-top: 1rem;
        min-height: auto;
        padding-bottom: 4rem;
        width: 100%; /* Ensure grid doesn't overflow */
        overflow-x: hidden; /* Safety clip */
    }
    
    .hero-content {
        order: unset;
        min-width: 0; /* Critical for Grid to shrink items */
        width: 100%;
        padding: 0 1rem; /* Ensure text doesn't touch edges */
    }

    /* Show Mobile Solar System */
    .mobile-solar-container {
        display: flex;
    }
    
    /* Child solar system needs to not force width */
    :deep(.solar-system) {
        max-width: 100%; /* Allow shrinking layout-wise */
    }
    
    /* ... rest of query ... */
    
    /* Hide Desktop Solar System Container */
    .hero-visual {
        display: none;
    }

    .hero-actions, .stats-row {
        justify-content: center;
        flex-wrap: wrap;
    }
    .hero-title {
        font-size: 2.2rem; /* Slightly smaller to fit better */
        margin-bottom: 1rem;
        word-wrap: break-word; /* Ensure breaking */
        line-height: 1.2;
    }
    .hero-subtitle {
        font-size: 1rem;
        margin-bottom: 2rem;
        padding: 0 1rem; /* Extra padding for subtitle */
    }
    .btn-outline, .btn-primary {
        padding: 10px 24px;
        font-size: 0.95rem;
    }
}
@media (max-width: 400px) {
    .hero-title {
        font-size: 1.8rem; /* Even smaller for very narrow screens */
    }
}
</style>
