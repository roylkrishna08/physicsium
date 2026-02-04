<script setup>
import { ref } from 'vue'
import GravitationSidebar from '../../../components/unit/gravitation/GravitationSidebar.vue'
import GravitationBackground from '../../../components/unit/gravitation/GravitationBackground.vue'
import GravitationNavBar from '../../../components/unit/gravitation/GravitationNavBar.vue'

const isSidebarOpen = ref(true)
</script>

<template>
  <div class="topic-page">
    <GravitationBackground />
    <GravitationNavBar @toggleSidebar="isSidebarOpen = !isSidebarOpen" />
    <GravitationSidebar :is-open="isSidebarOpen" @close="isSidebarOpen = false" />
    
    <main class="content" :class="{ 'sidebar-open': isSidebarOpen }">
      
      <header class="topic-header">
        <div class="pill">ORBITS & SATELLITES</div>
        <h1>Satellite Motion</h1>
        <p class="subtitle">Exploring the dynamics of objects orbiting planets, including velocity, period, and energy.</p>
      </header>

      <div class="content-grid">
        
        <!-- Orbital Velocity -->
        <div class="glass-card highlight">
          <h2>Orbital Velocity (<i>v<sub>o</sub></i>)</h2>
          <p>
            The velocity required to put a satellite into its orbit around the Earth.
          </p>
          <div class="formula-container">
            <div class="formula">
              v<sub>o</sub> = <span class="sqrt">√</span><span class="root-content"><div class="fraction"><span class="numerator">GM</span><span class="denominator">r</span></div></span>
            </div>
          </div>
          <p class="caption">For a close-Earth orbit (<i>r ≈ R</i>), <i>v<sub>o</sub></i> ≈ 7.92 km/s</p>
        </div>

        <!-- Time Period -->
        <div class="glass-card">
          <h2>Time Period (T)</h2>
          <p>The time taken by a satellite to complete one revolution around the Earth.</p>
          <div class="formula-container small">
            <div class="formula">
              T = 2π <span class="sqrt">√</span><span class="root-content"><div class="fraction"><span class="numerator">r<sup>3</sup></span><span class="denominator">GM</span></div></span>
            </div>
          </div>
        </div>

        <!-- Geostationary Satellites -->
        <div class="glass-card full-width">
          <h2>Geostationary Satellites</h2>
          <p>Satellites that appear stationary relative to the Earth.</p>
          <ul class="feature-list">
            <li><strong>Time Period:</strong> 24 hours (Matches Earth's rotation)</li>
            <li><strong>Height:</strong> ~35,800 km above the surface</li>
            <li><strong>Plane:</strong> Equatorial Plane</li>
          </ul>
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

.topic-header {
  margin-bottom: 3rem;
  animation: fadeInDown 0.8s ease-out;
}

.pill {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(167, 139, 250, 0.1);
  border: 1px solid rgba(167, 139, 250, 0.3);
  color: #a78bfa;
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
  background: linear-gradient(135deg, #fff, #ddd6fe);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.1;
}

.subtitle { font-size: 1.25rem; color: #94a3b8; max-width: 700px; }

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
  border-color: rgba(167, 139, 250, 0.2);
}

.glass-card.highlight {
  background: linear-gradient(145deg, rgba(76, 29, 149, 0.4), rgba(46, 16, 101, 0.4));
  border: 1px solid rgba(167, 139, 250, 0.2);
}

.content-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 2rem; }
.full-width { grid-column: 1 / -1; }

h2 { font-size: 1.5rem; margin-bottom: 1rem; color: #e2e8f0; }
p, li { color: #cbd5e1; line-height: 1.7; }
.feature-list { list-style: none; padding: 0; margin-top: 1rem; }
.feature-list li { margin-bottom: 0.8rem; padding-left: 1.5rem; position: relative; }
.feature-list li::before { content: '•'; color: #a78bfa; position: absolute; left: 0; font-size: 1.2rem; }

.formula-container { display: flex; justify-content: center; margin: 1.5rem 0; }
.formula { font-family: 'Times New Roman', serif; font-size: 2.2rem; font-style: italic; display: flex; align-items: center; gap: 0.2rem; }
.fraction { display: inline-flex; flex-direction: column; align-items: center; }
.numerator { border-bottom: 1px solid #fff; padding-bottom: 2px; }
.sqrt { font-size: 2.5rem; margin-right: -2px; }
.root-content { border-top: 2px solid #fff; padding-top: 2px; margin-top: 8px; }
.caption { text-align: center; font-size: 0.9rem; opacity: 0.8; margin-top: 1rem; }

@keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 768px) {
  .content { margin-left: 0 !important; padding: 1.5rem; padding-top: 100px; }
  h1 { font-size: 2.5rem; }
  .content-grid { grid-template-columns: 1fr; }
}
</style>
