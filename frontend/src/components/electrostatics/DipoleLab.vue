<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import ElectrostaticsNavBar from './ElectrostaticsNavBar.vue'
import ChargeSidebar from './ChargeSidebar.vue'
import ControlSidebar from './ControlSidebar.vue'
import DipoleSimulation from './labs/DipoleSimulation.vue'
import DrawingCanvas from '../drawingTool/DrawingCanvas.vue'
import DrawingSidebar from '../drawingTool/DrawingSidebar.vue'

const router = useRouter()

// UI State
const sidebarOpen = ref(true)
const controlsOpen = ref(true)
const drawingActive = ref(false)
const drawingSidebarOpen = ref(false)

// Drawing State
const drawingMode = ref('pen')
const drawingColor = ref('#00d4ff')
const drawingThickness = ref(3)
const drawingCanvasRef = ref(null)

// Simulation State
const activeTopic = ref('point_charge') // Default
const topics = [
    { id: 'point_charge', label: 'Electric Field (Point Charge)' },
    { id: 'dipole_field', label: 'Electric Field (Dipole)' },
    { id: 'torque', label: 'Torque on Dipole' }
]

// Simulation Controls
const showGrid = ref(true)
const showFieldLines = ref(true)
const showVectors = ref(true)    // New: show force/field vectors
const isAnimating = ref(false)

// Point Charge State
const pointChargeQ = ref(1) // in microCoulombs

// Dipole State
const dipoleCharge = ref(1)
const dipoleSeparation = ref(100) // pixels roughly cm

// Torque State
const electricFieldStrength = ref(5) // N/C * scale
const torqueDipoleMoment = ref(5) // p scale
const dipoleAngle = ref(45) // degrees

const toggleSidebar = () => {
    console.log("Toggle Left Sidebar clicked", !sidebarOpen.value);
    sidebarOpen.value = !sidebarOpen.value
}

const toggleControls = () => {
    console.log("Toggle Right Sidebar clicked", !controlsOpen.value);
    controlsOpen.value = !controlsOpen.value
}

const toggleDrawing = () => {
    drawingActive.value = !drawingActive.value
    drawingSidebarOpen.value = drawingActive.value
}

const handleClearDrawing = () => {
    if (drawingCanvasRef.value) {
        drawingCanvasRef.value.clearAll()
    }
}

const handleTopicSelect = (topicId) => {
    activeTopic.value = topicId
    isAnimating.value = false
    // Reset specific visuals if needed
}

// Layout logic
const viewportStyle = computed(() => ({
    marginLeft: '0',
    marginRight: '0',
    width: '100vw',
    transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)'
}))

</script>

<template>
    <div class="dipole-lab">
        <ElectrostaticsNavBar 
            experiment-name="Electric Field & Dipole" 
            @toggleLeftSidebar="toggleSidebar"
            @toggleRightSidebar="toggleControls"
            @toggleDrawing="toggleDrawing"
            :is-left-sidebar-collapsed="!sidebarOpen"
            :is-right-sidebar-collapsed="!controlsOpen"
            :drawing-active="drawingActive"
        />

        <ChargeSidebar 
            title="Syllabus Topics" 
            :topics="topics" 
            :activeTopic="activeTopic"
            :isOpen="sidebarOpen"
            @update:isOpen="sidebarOpen = $event"
            @select="handleTopicSelect"
        />

        <ControlSidebar 
            :isOpen="controlsOpen"
            @update:isOpen="controlsOpen = $event"
        >
            <!-- Common Controls -->
            <div class="control-group">
                 <label class="toggle-label">
                    <input type="checkbox" v-model="showGrid">
                    Show Gridlines
                </label>
                <label v-if="activeTopic !== 'torque'" class="toggle-label">
                    <input type="checkbox" v-model="showFieldLines">
                    Show Field Lines
                </label>
                 <label class="toggle-label">
                    <input type="checkbox" v-model="showVectors">
                    Show Vectors
                </label>
            </div>

            <!-- Point Charge Controls -->
            <div v-if="activeTopic === 'point_charge'" class="sidebar-controls">
                <h3>Point Charge</h3>
                <p class="description">
                    Investigate the electric field due to a point charge Q.
                    <br><strong>E = kQ / r²</strong>
                </p>
                <div class="control-group">
                    <label class="slider-label">Charge Q ({{pointChargeQ}} µC)</label>
                    <input type="range" v-model.number="pointChargeQ" min="-5" max="5" step="0.5" class="range-slider">
                    <div class="indicator-row">
                        <span>-5µC</span><span>0</span><span>+5µC</span>
                    </div>
                </div>
            </div>

            <!-- Dipole Field Controls -->
            <div v-if="activeTopic === 'dipole_field'" class="sidebar-controls">
                <h3>Electric Dipole</h3>
                <p class="description">
                    Two point charges +q and -q separated by a small distance 2a.
                </p>
                <div class="control-group">
                    <label class="slider-label">Charge Magnitude q ({{dipoleCharge}} µC)</label>
                    <input type="range" v-model.number="dipoleCharge" min="0.5" max="5" step="0.5" class="range-slider">
                </div>
                <div class="control-group">
                    <label class="slider-label">Separation 2a ({{dipoleSeparation}} px)</label>
                    <input type="range" v-model.number="dipoleSeparation" min="50" max="300" step="10" class="range-slider">
                </div>
            </div>

            <!-- Torque Controls -->
            <div v-if="activeTopic === 'torque'" class="sidebar-controls">
                <h3>Torque in Uniform Field</h3>
                <p class="description">
                    A dipole in a uniform electric field experiences a torque <strong>τ = p × E</strong>.
                </p>
                 <div class="control-group">
                    <label class="slider-label">Electric Field (E): {{electricFieldStrength}} N/C</label>
                    <input type="range" v-model.number="electricFieldStrength" min="1" max="10" class="range-slider">
                </div>
                 <div class="control-group">
                    <label class="slider-label">Dipole Moment (p)</label>
                    <input type="range" v-model.number="torqueDipoleMoment" min="1" max="10" class="range-slider">
                </div>
                 <div class="control-group">
                    <label class="slider-label">Angle (θ): {{dipoleAngle}}°</label>
                    <input type="range" v-model.number="dipoleAngle" min="0" max="360" class="range-slider">
                </div>
                <button class="btn-action" @click="isAnimating = !isAnimating">
                    {{ isAnimating ? 'Pause' : 'Release Dipole' }}
                </button>
            </div>

        </ControlSidebar>

        <div class="lab-viewport" :style="viewportStyle">
            <DipoleSimulation 
                :mode="activeTopic"
                :show-grid="showGrid"
                :show-field-lines="showFieldLines"
                :show-vectors="showVectors"
                :play-animation="isAnimating"
                :point-q="pointChargeQ"
                :dipole-q="dipoleCharge"
                :dipole-sev="dipoleSeparation"
                :torque-e="electricFieldStrength"
                :torque-p="torqueDipoleMoment"
                :torque-angle="dipoleAngle"
                @update:angle="dipoleAngle = $event" 
            />
        </div>

        <DrawingCanvas 
            ref="drawingCanvasRef"
            :active="drawingActive"
            :mode="drawingMode"
            :color="drawingColor"
            :thickness="drawingThickness"
        />

        <DrawingSidebar 
            v-model:isOpen="drawingSidebarOpen"
            v-model:activeMode="drawingMode"
            v-model:activeColor="drawingColor"
            v-model:activeThickness="drawingThickness"
            @clearAll="handleClearDrawing"
        />
    </div>
</template>

<style scoped>
/* Sidebar Controls Styling */
.sidebar-controls {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
}

.dipole-lab {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    overflow: hidden;
    background: #0f172a;
    display: flex;
    flex-direction: column;
    z-index: 10; /* Base context */
}

/* Ensure navbar is above sidebars if they overlap at top */
:deep(.lab-navbar) {
    z-index: 60 !important; 
}

/* Ensure Sidebars are above canvas */
:deep(.lab-sidebar-container),
:deep(.control-sidebar-container) {
    z-index: 50 !important;
}

.lab-viewport {
    position: relative;
    width: 100%;
    flex: 1;
    overflow: hidden;
    z-index: 0;
}

/* Reusing generic classes from ChargeLab for consistency */
.control-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    margin-bottom: 1rem;
}

.toggle-label {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    color: #e2e8f0;
}

.slider-label {
    font-size: 0.9rem;
    color: #94a3b8;
}

.range-slider {
    width: 100%;
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    outline: none;
    -webkit-appearance: none;
}

.range-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px;
    height: 18px;
    background: #00d4ff;
    border-radius: 50%;
    cursor: pointer;
}

.btn-action {
    width: 100%;
    padding: 12px;
    background: linear-gradient(90deg, #ff0055, #00d4ff);
    border: none;
    border-radius: 8px;
    color: white;
    font-weight: bold;
    cursor: pointer;
    margin-top: 10px;
    transition: transform 0.2s;
}

.btn-action:hover {
    transform: scale(1.02);
}

.sidebar-controls h3 {
    color: #cbd5e1;
    font-size: 1rem;
    margin-bottom: 0.5rem;
    font-weight: 600;
}

.description {
    color: #94a3b8;
    font-size: 0.85rem;
    line-height: 1.4;
    margin-bottom: 0.8rem;
    background: rgba(0,0,0,0.2);
    padding: 8px;
    border-radius: 6px;
    border-left: 2px solid #00d4ff;
}

.indicator-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: #64748b;
    margin-top: 4px;
}
</style>
