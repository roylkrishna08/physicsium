<script setup>
import { ref } from 'vue'
import KinematicsNavBar from '../../../components/kinematics/KinematicsNavBar.vue'
import RelativeVelocitySidebar from '../../../components/kinematics/RelativeVelocitySidebar.vue'
import RelativeVelocityControls from '../../../components/kinematics/RelativeVelocityControls.vue'
import ControlSidebar from '../../../components/ui/ControlSidebar.vue'
import RelativeVelocityLab from '../../../components/kinematics/labs/RelativeVelocityLab.vue'

const sidebarOpen = ref(true)
const controlsOpen = ref(true)

const activeScenario = ref('1d')
const v1 = ref(5)
const v2 = ref(2)
const angle1 = ref(0)
const angle2 = ref(0)
const observerFrame = ref('ground')
const visualTheme = ref('ball') // 'ball' or 'car'
const showVectors = ref(true)
const showGrid = ref(true)
const zoom = ref(1)
const objects = ref([])
const selectedObjectId = ref(null)
// Rain State
const rainSpeed = ref(10)
const manualUmbrella = ref(false)
const umbrellaAngle = ref(0)
const showTheta = ref(true) // New state for Theta Calculation visibility
const labRef = ref(null)

const scenarios = [
  { id: '1d', label: '1D Pursuit', description: 'Overtaking and head-on meeting problems on a straight line.' },
  { id: 'river', label: 'River-Boat', description: '2D motion in a moving medium. Shortest time and path scenarios.' },
  { id: 'aeroplane', label: 'Aeroplane-Wind', description: 'Aircraft navigation with wind correction and drift.' },
  { id: 'rain', label: 'Rain-Man', description: 'Determine umbrella angle based on relative rain motion.' },
  { id: 'angular-velocity', label: 'Angular Velocity', description: 'Rate of rotation of one particle relative to another (JEE Advanced).' },
  { id: 'flag-flutter', label: 'Flag Fluttering', description: 'Relative wind direction for a moving person in a breeze.' },
  { id: 'min-distance', label: 'Closest Approach', description: 'Calculate the minimum distance between two particles in 2D.' }
]

const handleScenarioSelect = (id) => {
  activeScenario.value = id
  if (id === '1d') { v1.value = 5; v2.value = 2 }
  else if (id === 'river' || id === 'aeroplane') { v1.value = 5; v2.value = 3; angle1.value = 90; angle2.value = 0 }
  else if (id === 'rain') { v1.value = 4; v2.value = 8; angle2.value = 90 }
  else if (id === 'angular-velocity') { v1.value = 5; v2.value = 5; angle1.value = 90; angle2.value = 0 }
  else if (id === 'flag-flutter') { v1.value = 5; v2.value = 3; angle2.value = 180 }
}

const handleReset = () => {
  if (labRef.value) labRef.value.reset()
}

const handleAddBall = () => {
  if (labRef.value && labRef.value.addObject) labRef.value.addObject(0, 0)
}
</script>

<template>
  <div class="relative-velocity-view">
    <KinematicsNavBar 
      experiment-name="Relative Velocity Lab"
      @toggleLeftSidebar="sidebarOpen = !sidebarOpen"
      @toggleRightSidebar="controlsOpen = !controlsOpen"
      :is-left-sidebar-collapsed="!sidebarOpen"
      :is-right-sidebar-collapsed="!controlsOpen"
    />

    <RelativeVelocitySidebar 
      title="Kinematics Scenarios"
      :topics="scenarios"
      :activeTopic="activeScenario"
      :isOpen="sidebarOpen"
      @update:isOpen="sidebarOpen = $event"
      @select="handleScenarioSelect"
    />

    <ControlSidebar 
      :isOpen="controlsOpen"
      @update:isOpen="controlsOpen = $event"
    >
      <RelativeVelocityControls 
        :mode="activeScenario"
        v-model:v1="v1"
        v-model:v2="v2"
        v-model:angle1="angle1"
        v-model:angle2="angle2"
        v-model:observerFrame="observerFrame"
        v-model:visualTheme="visualTheme"
        v-model:showVectors="showVectors"
        v-model:showGrid="showGrid"
        :objects="objects"
        v-model:selectedObjectId="selectedObjectId"
        v-model:rainSpeed="rainSpeed"
        v-model:manualUmbrella="manualUmbrella"
        v-model:umbrellaAngle="umbrellaAngle"
        v-model:showTheta="showTheta"
        @reset="handleReset"
        @addBall="handleAddBall"
      />
    </ControlSidebar>

    <main class="lab-main" :class="{ 'sidebar-open': sidebarOpen, 'controls-open': controlsOpen }">
      <RelativeVelocityLab 
        ref="labRef"
        v-model:objects="objects"
        v-model:selectedObjectId="selectedObjectId"
        :mode="activeScenario"
        :v1="v1"
        :v2="v2"
        :angle1="angle1"
        :angle2="angle2"
        :observerFrame="observerFrame"
        :visualTheme="visualTheme"
        :show-vectors="showVectors"
        :show-grid="showGrid"
        :rainSpeed="rainSpeed"
        :manualUmbrella="manualUmbrella"
        :umbrellaAngle="umbrellaAngle"
        :showTheta="showTheta"
        v-model:zoom="zoom"
      />
    </main>
  </div>
</template>

<style scoped>
.relative-velocity-view {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #020617;
  display: flex;
  flex-direction: column;
}

.lab-main {
  flex: 1;
  width: 100%;
  height: 100%;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
