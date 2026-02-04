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
        <div class="pill">ENERGY</div>
        <h1>Gravitational Potential</h1>
        <p class="subtitle">Understanding potential energy, scalar fields, and escape velocity.</p>
      </header>

      <div class="content-grid">
        
        <!-- Potential Definition -->
        <div class="glass-card full-width">
          <h2>Gravitational Potential (V)</h2>
          <p>
            The gravitational potential at a point is the work done per unit mass in bringing a test mass from infinity to that point.
          </p>
          <div class="formula-container">
            <div class="formula">
              V = - <div class="fraction"><span class="numerator">GM</span><span class="denominator">r</span></div>
            </div>
          </div>
          <p class="note">It is a <strong>scalar quantity</strong> and is always negative (as work is done by the gravitational force).</p>
        </div>

        <!-- Potential Energy -->
        <div class="glass-card highlight">
          <h2>Potential Energy (U)</h2>
          <p>
            The energy possessed by a body due to its position in a gravitational field.
          </p>
          <div class="formula-container">
            <div class="formula">
              U = - <div class="fraction"><span class="numerator">GMm</span><span class="denominator">r</span></div>
            </div>
          </div>
        </div>

        <!-- Escape Velocity -->
        <div class="glass-card">
          <h2>Escape Velocity (v<sub>e</sub>)</h2>
          <p>
            The minimum velocity required for an object to escape the gravitational influence of a planet.
          </p>
          <div class="formula-container small">
            <div class="formula">
              v<sub>e</sub> = <span class="sqrt">√</span><span class="root-content">2gR</span>
            </div>
          </div>
          <p class="caption">For Earth, v<sub>e</sub> ≈ 11.2 km/s</p>
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
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
  color: #fbbf24;
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
  background: linear-gradient(135deg, #fff, #fde68a);
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
  border-color: rgba(251, 191, 36, 0.2);
}

.glass-card.highlight {
  background: linear-gradient(145deg, rgba(69, 26, 3, 0.4), rgba(40, 15, 2, 0.4));
  border: 1px solid rgba(251, 191, 36, 0.2);
}

.content-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 2rem; }
.full-width { grid-column: 1 / -1; }

h2 { font-size: 1.5rem; margin-bottom: 1rem; color: #e2e8f0; }
p, .note { color: #cbd5e1; line-height: 1.7; }
.note { font-size: 0.9rem; margin-top: 1rem; padding: 0.8rem; background: rgba(255,255,255,0.05); border-radius: 8px; border-left: 3px solid #fbbf24; }

.formula-container { display: flex; justify-content: center; margin: 1.5rem 0; }
.formula { font-family: 'Times New Roman', serif; font-size: 2.2rem; font-style: italic; display: flex; align-items: center; gap: 0.5rem; }
.fraction { display: inline-flex; flex-direction: column; align-items: center; }
.numerator { border-bottom: 1px solid #fff; padding-bottom: 2px; }
.sqrt { font-size: 2rem; margin-right: -5px; }
.root-content { border-top: 1px solid #fff; padding-top: 4px; }
.caption { text-align: center; font-size: 0.9rem; opacity: 0.8; }

@keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 768px) {
  .content { margin-left: 0 !important; padding: 1.5rem; padding-top: 100px; }
  h1 { font-size: 2.5rem; }
  .content-grid { grid-template-columns: 1fr; }
}
</style>
