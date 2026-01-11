<script setup>
import { ref } from 'vue'
import GravitationSidebar from '../../components/gravitation/GravitationSidebar.vue'
import GravitationBackground from '../../components/gravitation/GravitationBackground.vue'
import GravitationNavBar from '../../components/gravitation/GravitationNavBar.vue'

const isSidebarOpen = ref(true)
</script>

<template>
  <div class="topic-page">
    <GravitationBackground />
    <GravitationNavBar @toggleSidebar="isSidebarOpen = !isSidebarOpen" />
    <GravitationSidebar :is-open="isSidebarOpen" @close="isSidebarOpen = false" />
    
    <main class="content" :class="{ 'sidebar-open': isSidebarOpen }">
      
      <!-- Hero Header -->
      <header class="topic-header">
        <div class="pill">GRAVITY ON EARTH</div>
        <h1>Acceleration Due to Gravity</h1>
        <p class="subtitle">Why apples fall and satellites orbit: understanding 'g' and how it changes.</p>
      </header>

      <!-- Main Content Grid -->
      <div class="content-grid">
        
        <!-- Definition Card -->
        <div class="glass-card full-width">
          <h2>Defining 'g'</h2>
          <p>
            The acceleration gained by an object due to the gravitational force is called <strong>acceleration due to gravity</strong> (<i>g</i>). 
            on the surface of Earth, its standard value is approximately <strong>9.8 m/s²</strong>.
          </p>
          <ul class="feature-list">
            <li>It is a <strong>vector quantity</strong> directed towards the center of the Earth.</li>
            <li>It is independent of the mass, shape, or size of the body (in a vacuum).</li>
          </ul>
        </div>

        <!-- Formula Card -->
        <div class="glass-card highlight">
          <h2>Relation between g and G</h2>
          <div class="formula-container">
            <div class="formula">
              g = <div class="fraction"><span class="numerator">GM</span><span class="denominator">R<sup>2</sup></span></div>
            </div>
          </div>
          <div class="variable-grid">
            <div class="variable-item">
              <span class="symbol">g</span>
              <span class="desc">Acceleration due to gravity</span>
            </div>
            <div class="variable-item">
              <span class="symbol">G</span>
              <span class="desc">Gravitational Constant</span>
            </div>
            <div class="variable-item">
              <span class="symbol">M</span>
              <span class="desc">Mass of Earth</span>
            </div>
            <div class="variable-item">
              <span class="symbol">R</span>
              <span class="desc">Radius of Earth</span>
            </div>
          </div>
        </div>

        <!-- Variation Card -->
        <div class="glass-card full-width">
          <h2>Variation of 'g'</h2>
          <div class="grid-list">
            <div class="grid-item">
              <span class="icon">🏔️</span>
              <div>
                <strong>With Altitude (h)</strong>
                <p>Value decreases as you go up. <i>g<sub>h</sub> = g(1 - 2h/R)</i></p>
              </div>
            </div>
            <div class="grid-item">
              <span class="icon">🕳️</span>
              <div>
                <strong>With Depth (d)</strong>
                <p>Value decreases as you go down. <i>g<sub>d</sub> = g(1 - d/R)</i></p>
              </div>
            </div>
            <div class="grid-item">
              <span class="icon">🌍</span>
              <div>
                <strong>At Poles vs Equator</strong>
                <p>Max at poles, min at equator due to Earth's shape and rotation.</p>
              </div>
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
  padding-top: 150px;
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
  background: rgba(52, 211, 153, 0.1);
  border: 1px solid rgba(52, 211, 153, 0.3);
  color: #34d399;
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
  background: linear-gradient(135deg, #fff, #6ee7b7);
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
  border-color: rgba(52, 211, 153, 0.2);
}

.glass-card.highlight {
  background: linear-gradient(145deg, rgba(6, 78, 59, 0.4), rgba(2, 44, 34, 0.4));
  border: 1px solid rgba(52, 211, 153, 0.2);
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
  background: #34d399;
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
  color: #34d399;
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
  color: #34d399;
  margin-bottom: 0.5rem;
  font-style: italic;
}

.desc {
  font-size: 0.9rem;
  color: #94a3b8;
}

/* Grid List */
.grid-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.grid-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
}

.icon {
  font-size: 2rem;
}

/* Animations */
@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .content {
    margin-left: 0 !important;
    padding: 1.5rem;
    padding-top: 100px;
  }
  
  h1 { font-size: 2.5rem; }
  .content-grid { grid-template-columns: 1fr; }
}
</style>
