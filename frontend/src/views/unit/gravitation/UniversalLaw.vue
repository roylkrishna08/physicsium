<script setup>
import { ref, onMounted } from 'vue'
import GravitationSidebar from '../../../components/unit/gravitation/GravitationSidebar.vue'
import GravitationBackground from '../../../components/unit/gravitation/GravitationBackground.vue'
import GravitationNavBar from '../../../components/unit/gravitation/GravitationNavBar.vue'
import NewtonLawLab from '../../../components/unit/gravitation/labs/NewtonLawLab.vue'

const isSidebarOpen = ref(true)

// Simple animation logic could go here
</script>

<template>
  <div class="topic-page">
    <GravitationBackground />
    <GravitationNavBar @toggleSidebar="isSidebarOpen = !isSidebarOpen" />
    <GravitationSidebar :is-open="isSidebarOpen" @close="isSidebarOpen = false" />
    
    <main class="content" :class="{ 'sidebar-open': isSidebarOpen }">
      
      <!-- Hero Header -->
      <header class="topic-header">
        <div class="pill">NEWTON'S LAW</div>
        <h1>Universal Law of Gravitation</h1>
        <p class="subtitle">The force that binds the cosmos, from the smallest pebble to the largest galaxy.</p>
      </header>

      <!-- Main Content Grid -->
      <div class="content-grid">
        
        <!-- Statement Card -->
        <div class="glass-card full-width">
          <h2>The Statement</h2>
          <p>Every particle of matter in the universe attracts every other particle with a force that is:</p>
          <ul class="feature-list">
            <li><strong>Directly proportional</strong> to the product of their masses (<i>m<sub>1</sub></i> and <i>m<sub>2</sub></i>).</li>
            <li><strong>Inversely proportional</strong> to the square of the distance (<i>r</i>) between their centers.</li>
          </ul>
        </div>

        <!-- Formula Card -->
        <div class="glass-card highlight">
          <h2>The Formula</h2>
          <div class="formula-container">
            <div class="formula">
              F = G <div class="fraction"><span class="numerator">m<sub>1</sub> m<sub>2</sub></span><span class="denominator">r<sup>2</sup></span></div>
            </div>
          </div>
          <div class="variable-grid">
            <div class="variable-item">
              <span class="symbol">F</span>
              <span class="desc">Gravitational Force</span>
            </div>
            <div class="variable-item">
              <span class="symbol">G</span>
              <span class="desc">Universal Gravitational Constant<br><small>(6.674 × 10<sup>-11</sup> N·m²/kg²)</small></span>
            </div>
            <div class="variable-item">
              <span class="symbol">m<sub>1</sub>, m<sub>2</sub></span>
              <span class="desc">Masses of objects</span>
            </div>
            <div class="variable-item">
              <span class="symbol">r</span>
              <span class="desc">Distance between centers</span>
            </div>
          </div>
        </div>

        <!-- Interactive Simulation -->
        <div class="full-width">
            <NewtonLawLab />
        </div>

        <!-- Significance -->
        <div class="glass-card full-width">
          <h2>Why It Matters</h2>
          <p>This single law explains a multitude of phenomena:</p>
          <div class="grid-list">
            <div class="grid-item">
              <span class="icon">🌑</span>
              <span>The motion of the moon around the Earth</span>
            </div>
            <div class="grid-item">
              <span class="icon">☀️</span>
              <span>The motion of planets around the Sun</span>
            </div>
            <div class="grid-item">
              <span class="icon">🌊</span>
              <span>The tides due to the moon and the Sun</span>
            </div>
          </div>
        </div>

      </div>
    </main>
  </div>
</template>

<style scoped>
.topic-page {
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
  color: #fff;
}

.content {
  position: relative;
  z-index: 10;
  padding: 2rem;
  padding-top: 150px; /* Increased to clear the floating navbar */
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-left: 0;
  max-width: 1200px;
  margin-right: auto;
}

.content.sidebar-open {
  margin-left: 280px;
}

/* Header Styles */
.topic-header {
  margin-bottom: 3rem;
  animation: fadeInDown 0.8s ease-out;
}

.pill {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(96, 165, 250, 0.1);
  border: 1px solid rgba(96, 165, 250, 0.3);
  color: #60a5fa;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 1rem;
  letter-spacing: 1px;
}

h1 {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #fff, #93c5fd);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.1;
}

.subtitle {
  font-size: 1.25rem;
  color: #94a3b8;
  max-width: 700px;
  line-height: 1.6;
}

/* Glass Card Styles */
.glass-card {
  background: rgba(22, 26, 31, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 2.5rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.glass-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  border-color: rgba(96, 165, 250, 0.2);
}

.glass-card.highlight {
  background: linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.7));
  border: 1px solid rgba(96, 165, 250, 0.2);
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
}

.full-width {
  grid-column: 1 / -1;
}

h2 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #e2e8f0;
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

h2::before {
  content: '';
  display: block;
  width: 4px;
  height: 24px;
  background: #60a5fa;
  border-radius: 2px;
}

p, li {
  color: #cbd5e1;
  line-height: 1.7;
  font-size: 1.05rem;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin-top: 1rem;
}

.feature-list li {
  margin-bottom: 0.8rem;
  padding-left: 1.5rem;
  position: relative;
}

.feature-list li::before {
  content: '•';
  color: #60a5fa;
  position: absolute;
  left: 0;
  font-size: 1.2rem;
}

/* Formula Styles */
.formula-container {
  display: flex;
  justify-content: center;
  margin: 2rem 0;
  padding: 2rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16px;
}

.formula {
  font-family: 'Times New Roman', serif;
  font-size: 2.5rem;
  font-style: italic;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.fraction {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  vertical-align: middle;
}

.numerator {
  border-bottom: 2px solid #fff;
  padding-bottom: 0.2rem;
  margin-bottom: 0.2rem;
}

.variable-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
}

.variable-item {
  background: rgba(255, 255, 255, 0.03);
  padding: 1rem;
  border-radius: 12px;
  text-align: center;
}

.symbol {
  display: block;
  font-family: 'Times New Roman', serif;
  font-size: 1.5rem;
  color: #60a5fa;
  margin-bottom: 0.5rem;
  font-style: italic;
}

.desc {
  font-size: 0.9rem;
  color: #94a3b8;
}

/* Visualization Styles */
.visualization-stage {
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  position: relative;
  margin: 2rem 0;
}

.mass {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #60a5fa, #1d4ed8);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px rgba(96, 165, 250, 0.3);
  font-weight: bold;
  z-index: 2;
}

.mass-2 {
  width: 80px;
  height: 80px;
  background: radial-gradient(circle at 30% 30%, #f472b6, #db2777);
  box-shadow: 0 0 20px rgba(244, 114, 182, 0.3);
}

.force-line {
  flex: 1;
  height: 2px;
  background: rgba(255, 255, 255, 0.2);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.distance-label {
  background: #0f172a;
  padding: 0 0.5rem;
  color: #94a3b8;
  font-style: italic;
}

.caption {
  text-align: center;
  font-size: 0.9rem;
  font-style: italic;
  opacity: 0.8;
}

/* Grid List */
.grid-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.grid-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
}

.icon {
  font-size: 1.5rem;
}

/* Animations */
@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .content {
    margin-left: 0 !important; /* Force no margin on mobile overlap */
    padding: 1.5rem;
    padding-top: 100px;
  }
  
  h1 {
    font-size: 2.5rem;
  }
  
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
