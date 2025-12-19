<script setup>
import { ref, computed, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LabNavBar from '../components/LabNavBar.vue'
import LabSidebar from '../components/LabSidebar.vue'
import LabBackground from '../components/LabBackground.vue'
import SimPendulum from '../components/simulations/SimPendulum.vue'
import SimVernier from '../components/simulations/SimVernier.vue'
import SimScrewGauge from '../components/simulations/SimScrewGauge.vue'
import SimMetreScale from '../components/simulations/SimMetreScale.vue'

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
    '4': "Metre Scale (Principle of Moments)"
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
