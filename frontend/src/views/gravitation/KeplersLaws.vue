<script setup>
import { ref } from 'vue'
import GravitationSidebar from '../../components/gravitation/GravitationSidebar.vue'
import GravitationBackground from '../../components/gravitation/GravitationBackground.vue'
import GravitationNavBar from '../../components/gravitation/GravitationNavBar.vue'
import KeplerOrbitLab from '../../components/gravitation/labs/KeplerOrbitLab.vue'

const isSidebarOpen = ref(true)
</script>

<template>
  <div class="topic-page">
    <GravitationBackground />
    <GravitationNavBar @toggleSidebar="isSidebarOpen = !isSidebarOpen" />
    <GravitationSidebar :is-open="isSidebarOpen" @close="isSidebarOpen = false" />
    
    <main class="content" :class="{ 'sidebar-open': isSidebarOpen }">
      
      <header class="topic-header">
        <div class="pill">PLANETARY MOTION</div>
        <h1>Kepler's Laws</h1>
        <p class="subtitle">The three fundamental rules describing how planets orbit the Sun.</p>
      </header>

      <div class="content-grid">
        
        <!-- Law 1 -->
        <div class="glass-card full-width">
          <h2>1. Law of Orbits</h2>
          <p>
            All planets move in <strong>elliptical orbits</strong>, with the Sun situated at one of the foci of the ellipse.
          </p>
          <div class="lab-container">
             <KeplerOrbitLab mode="law1" />
          </div>
        </div>

        <!-- Law 2 -->
        <div class="glass-card full-width">
          <h2>2. Law of Areas</h2>
          <p>
            The line that joins a planet to the Sun sweeps out <strong>equal areas in equal intervals of time</strong>.
          </p>
          <p class="note">This implies planets move faster when closer to the Sun (Perihelion) and slower when farther (Aphelion).</p>
          <div class="lab-container">
             <KeplerOrbitLab mode="law2" />
          </div>
        </div>

        <!-- Law 3 -->
        <div class="glass-card highlight full-width">
          <h2>3. Law of Periods</h2>
          <p>
            The square of the time period of revolution (<i>T</i>) of a planet is proportional to the cube of the semi-major axis (<i>a</i>) of its ellipse.
          </p>
          <div class="formula-container">
            <div class="formula">
              T<sup>2</sup> ∝ a<sup>3</sup>
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

.topic-header {
  margin-bottom: 3rem;
  animation: fadeInDown 0.8s ease-out;
}

.pill {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(244, 114, 182, 0.1);
  border: 1px solid rgba(244, 114, 182, 0.3);
  color: #f472b6;
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
  background: linear-gradient(135deg, #fff, #fbcfe8);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.1;
}

.subtitle {
  font-size: 1.25rem;
  color: #94a3b8;
  max-width: 700px;
}

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
  border-color: rgba(244, 114, 182, 0.2);
}

.glass-card.highlight {
  background: linear-gradient(145deg, rgba(80, 7, 36, 0.4), rgba(40, 4, 18, 0.4));
  border: 1px solid rgba(244, 114, 182, 0.2);
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
  margin-bottom: 1rem;
  color: #e2e8f0;
}

p, .note {
  color: #cbd5e1;
  line-height: 1.7;
}

.note {
  font-size: 0.9rem;
  margin-top: 1rem;
  padding: 0.8rem;
  background: rgba(255,255,255,0.05);
  border-radius: 8px;
  border-left: 3px solid #f472b6;
}

.visual-box {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  height: 120px;
  margin-top: 1rem;
  background: rgba(0,0,0,0.2);
  border-radius: 12px;
}

.emoji { font-size: 3rem; }

.formula-container {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
}

.formula {
  font-family: 'Times New Roman', serif;
  font-size: 2.5rem;
  font-style: italic;
  color: #f472b6;
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.lab-container {
  margin-top: 1.5rem;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.1);
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
