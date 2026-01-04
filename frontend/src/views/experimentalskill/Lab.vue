<script setup>
import { ref, computed, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LabNavBar from '../../components/layout/LabNavBar.vue'
import LabSidebar from '../../components/layout/LabSidebar.vue'
import LabBackground from '../../components/backgrounds/LabBackground.vue'
import SimPendulum from '../../components/simulations/SimPendulum.vue'
import SimVernier from '../../components/simulations/SimVernier.vue'
import SimScrewGauge from '../../components/simulations/SimScrewGauge.vue'
import SimMetreScale from '../../components/simulations/SimMetreScale.vue'
import SimYoungsModulus from '../../components/simulations/SimYoungsModulus.vue'
import SimProjectile from '../../components/simulations/SimProjectile.vue'
import SimSurfaceTension from '../../components/simulations/SimSurfaceTension.vue'
import SimViscosity from '../../components/simulations/SimViscosity.vue'
import SimResonanceTube from '../../components/simulations/SimResonanceTube.vue'
import SimSpecificHeat from '../../components/simulations/SimSpecificHeat.vue'
import SimMetreBridge from '../../components/simulations/SimMetreBridge.vue'
import SimOhmsLaw from '../../components/simulations/SimOhmsLaw.vue'
import SimGalvanometer from '../../components/simulations/SimGalvanometer.vue'
import SimFocalLength from '../../components/simulations/SimFocalLength.vue'
import SimPrism from '../../components/simulations/SimPrism.vue'
import SimGlassSlab from '../../components/simulations/SimGlassSlab.vue'
import SimPNJunction from '../../components/simulations/SimPNJunction.vue'
import SimZenerDiode from '../../components/simulations/SimZenerDiode.vue'
import SimComponents from '../../components/simulations/SimComponents.vue'

const route = useRoute()
const router = useRouter()
const activeId = computed(() => route.params.id)
const isLeftSidebarCollapsed = ref(false)
const isRightSidebarCollapsed = ref(true)

// Provide right sidebar state to simulation components
provide('isRightSidebarCollapsed', isRightSidebarCollapsed)

const placeholderSims = {
    '1': "Vernier Callipers",
    '2': "Screw Gauge",
    '3': "Simple Pendulum",
    '4': "Metre Scale (Principle of Moments)",
    '5': "Young's Modulus",
    '6': "Surface Tension (Capillary Rise)",
    '7': "Viscosity (Stokes' Law)",
    '8': "Speed of Sound (Resonance Tube)",
    '9': "Specific Heat (Mixtures)",
    '10': "Metre Bridge (Resistivity)",
    '11': "Ohm's Law (Resistance)",
    '12': "Galvanometer (Figure of Merit)",
    '13': "Focal Length (Optical Bench)",
    '14': "Prism (Angle of Deviation)",
    '15': "Glass Slab (Refractive Index)",
    '16': "PN Junction (IV Characteristics)",
    '17': "Zener Diode (Key Characteristics)",
    '18': "Component Identification",
    'projectile': "Projectile Motion (Concept)"
}

const currentTitle = computed(() => {
    if (!activeId.value) return 'Select Experiment'
    return placeholderSims[activeId.value] || `Experiment ${activeId.value}`
})

const exitLab = () => {
   router.push('/experiments')
}

const toggleLeftSidebar = () => {
    isLeftSidebarCollapsed.value = !isLeftSidebarCollapsed.value
}

const toggleRightSidebar = () => {
    isRightSidebarCollapsed.value = !isRightSidebarCollapsed.value
}
</script>

<template>
  <div class="lab-layout">
    <LabBackground />
    
    <!-- Section 1: Top Navbar -->
    <LabNavBar 
      :experimentName="currentTitle"
      :isLeftSidebarCollapsed="isLeftSidebarCollapsed"
      :isRightSidebarCollapsed="isRightSidebarCollapsed"
      @exit="exitLab"
      @toggleLeftSidebar="toggleLeftSidebar"
      @toggleRightSidebar="toggleRightSidebar"
    />
    
    <!-- Section 2, 3, 4: Body with sidebars and main area -->
    <div class="lab-body">
      <!-- Section 2: Left Experiment Sidebar -->
      <LabSidebar 
        :activeId="activeId" 
        :collapsed="isLeftSidebarCollapsed"
        @toggle="toggleLeftSidebar"
      />
      
      <!-- Section 3: Main Simulation Field -->
      <main class="lab-main">
        <div v-if="activeId" class="simulation-area">
          <!-- Vernier Caliper -->
          <div v-if="activeId === '1'" class="sim-wrapper">
            <SimVernier />
          </div>
          
          <!-- Simple Pendulum -->
          <div v-else-if="activeId === '3'" class="sim-wrapper">
            <SimPendulum />
          </div>

          <!-- Screw Gauge -->
          <div v-else-if="activeId === '2'" class="sim-wrapper">
            <SimScrewGauge />
          </div>

          <!-- Metre Scale -->
          <div v-else-if="activeId === '4'" class="sim-wrapper">
            <SimMetreScale />
          </div>

          <!-- Young's Modulus -->
          <div v-else-if="activeId === '5'" class="sim-wrapper">
             <SimYoungsModulus />
          </div>

          <!-- Surface Tension -->
          <div v-else-if="activeId === '6'" class="sim-wrapper">
             <SimSurfaceTension />
          </div>

          <!-- Viscosity -->
          <div v-else-if="activeId === '7'" class="sim-wrapper">
             <SimViscosity />
          </div>

          <!-- Resonance Tube -->
          <div v-else-if="activeId === '8'" class="sim-wrapper">
             <SimResonanceTube />
          </div>

          <!-- Specific Heat -->
          <div v-else-if="activeId === '9'" class="sim-wrapper">
             <SimSpecificHeat />
          </div>

          <!-- Metre Bridge -->
          <div v-else-if="activeId === '10'" class="sim-wrapper">
             <SimMetreBridge />
          </div>

          <!-- Ohm's Law -->
          <div v-else-if="activeId === '11'" class="sim-wrapper">
             <SimOhmsLaw />
          </div>

          <!-- Galvanometer -->
          <div v-else-if="activeId === '12'" class="sim-wrapper">
             <SimGalvanometer />
          </div>

          <!-- Focal Length -->
          <div v-else-if="activeId === '13'" class="sim-wrapper">
             <SimFocalLength />
          </div>

          <!-- Prism -->
          <div v-else-if="activeId === '14'" class="sim-wrapper">
             <SimPrism />
          </div>

          <!-- Glass Slab -->
          <div v-else-if="activeId === '15'" class="sim-wrapper">
             <SimGlassSlab />
          </div>

          <!-- PN Junction -->
          <div v-else-if="activeId === '16'" class="sim-wrapper">
             <SimPNJunction />
          </div>

          <!-- Zener Diode -->
          <div v-else-if="activeId === '17'" class="sim-wrapper">
             <SimZenerDiode />
          </div>

          <!-- Component Identification -->
          <div v-else-if="activeId === '18'" class="sim-wrapper">
             <SimComponents />
          </div>

          <!-- Projectile Motion -->
          <div v-else-if="activeId === 'projectile'" class="sim-wrapper">
             <SimProjectile />
          </div>
          
          <!-- Placeholder for others -->
          <div v-else class="sim-viewport">
            <div class="placeholder-content">
              <div class="sim-icon">🧪</div>
              <h3>{{ currentTitle }}</h3>
              <p>Interactive lab environment coming soon.</p>
            </div>
          </div>
        </div>
        
        <!-- Empty state when no experiment selected -->
        <div v-else class="empty-state">
          <div class="icon-box">🔬</div>
          <h2>Select an Experiment</h2>
          <p>Choose an experiment from the left sidebar to begin.</p>
        </div>
      </main>
      
      <!-- Section 4: Right Controls Sidebar -->
      <!-- This is rendered by the simulation components themselves -->
    </div>
  </div>
</template>

<style scoped>
.lab-layout {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  background: #000;
}

.lab-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.lab-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  background: radial-gradient(circle at center, #151525 0%, #000 100%);
}

.simulation-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.sim-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sim-viewport {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.3);
  position: relative;
  overflow: hidden;
}

.placeholder-content {
  text-align: center;
  color: var(--text-secondary, #94a3b8);
}

.sim-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: float 3s ease-in-out infinite;
}

.placeholder-content h3 {
  color: #fff;
  margin-bottom: 0.5rem;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary, #94a3b8);
  text-align: center;
}

.icon-box {
  font-size: 5rem;
  margin-bottom: 1.5rem;
  opacity: 0.3;
}

.empty-state h2 {
  color: #fff;
  margin-bottom: 0.5rem;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .lab-body {
    flex-direction: row;
  }
  
  .lab-main {
    overflow-y: auto;
  }
  
  .simulation-area {
    height: auto;
    min-height: 100%;
    overflow-y: visible;
  }
  
  .sim-wrapper {
    overflow-y: visible;
    height: auto;
  }
}
</style>
