<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import ElectrostaticsNavBar from './ElectrostaticsNavBar.vue'
import ChargeSidebar from './ChargeSidebar.vue'
import ControlSidebar from '../ui/ControlSidebar.vue'
import DipoleSimulation from './labs/DipoleSimulation.vue'
import DrawingCanvas from '../drawingTool/DrawingCanvas.vue'
import DrawingSidebar from '../drawingTool/DrawingSidebar.vue'

const router = useRouter()

// UI State
// UI State
const isMobile = window.innerWidth < 768
const sidebarOpen = ref(!isMobile)
const controlsOpen = ref(!isMobile)
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
const showGrid = ref(false)
const showFieldLines = ref(false)
const showVectors = ref(false)    // New: show force/field vectors
const momentOfInertia = ref(2)
const dampingFactor = ref(0.2)
const showEquilibrium = ref(true)
const isAnimating = ref(false)

// Point Charge State
const pointCharges = ref([])

const addCharge = () => {
    pointCharges.value.push({
        id: Date.now(),
        q: 1, 
        x: null, // Will be initialized by Sim to center
        y: null
    })
}

const removeCharge = (index) => {
    pointCharges.value.splice(index, 1)
}

// Test Charge State
const testCharges = ref([])

const addTestCharge = () => {
    testCharges.value.push({
        id: Date.now(),
        x: null, // Center
        y: null,
        trail: [] // History
    })
}

const clearTestCharges = () => {
    testCharges.value = []
}

// Dipole State
const dipoles = ref([
    { id: Date.now(), q: 1, sep: 100, x: null, y: null, phi: 0 }
])
const dipoleCharge = ref(1)
const dipoleSeparation = ref(100) // pixels roughly cm

const addDipole = () => {
    dipoles.value.push({
        id: Date.now(),
        q: dipoleCharge.value,
        sep: dipoleSeparation.value,
        x: null,
        y: null,
        phi: 0
    })
}

const removeDipole = (index) => {
    dipoles.value.splice(index, 1)
}

// Torque State
const electricFieldStrength = ref(5) // N/C * scale
const electricFieldAngle = ref(0) // Fixed to 0 for left-to-right
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
    if (topicId === 'point_charge') {
        // Optional: Reset logic if needed
    }
}

const handleResetDipole = () => {
    // We can't directly reset dipoleCenter in simulation if it's not a prop,
    // but we can trigger a re-mount or a reset event if implemented.
    // For now, let's just refresh the page or topic.
    // OR we could pass it as a prop. Let's make it a prop to be safe.
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
            exit-path="/electrostatics"
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
                <label class="toggle-label">
                    <input type="checkbox" v-model="showFieldLines">
                    Show Electric Field
                </label>
                 <label class="toggle-label">
                    <input type="checkbox" v-model="showVectors">
                    Show Vectors
                </label>
            </div>

            <!-- Point Charge Controls -->
            <div v-if="activeTopic === 'point_charge'" class="sidebar-controls">
                <h3>Point Charges</h3>
                
                <div v-for="(charge, idx) in pointCharges" :key="charge.id" class="control-group charge-card">
                    <div class="charge-header">
                        <span>Charge {{idx + 1}}</span>
                        <button class="btn-icon" @click="removeCharge(idx)">×</button>
                    </div>
                    <label class="slider-label">Magnitude (µC)</label>
                    <input type="number" v-model.number="charge.q" step="0.1" class="input-text">
                </div>

                <div class="control-group">
                     <button class="btn-action" @click="addCharge">+ Add Charge</button>
                </div>

                <div class="control-group" style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem; margin-top: 1rem;">
                    <h3>Test Charges (q0)</h3>
                    <p class="description" style="margin-bottom: 0.5rem">
                         Release a positive test charge to visualize the field line path.
                    </p>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-action" style="margin-top:0; flex: 1; background: #ea580c;" @click="addTestCharge">
                            Release q0
                        </button>
                         <button class="btn-action" style="margin-top:0; width: 40px; background: #64748b;" @click="clearTestCharges" title="Clear All q0">
                            ×
                        </button>
                    </div>
                </div>
            </div>

            <div v-if="activeTopic === 'dipole_field'" class="sidebar-controls">
                <h3>Electric Dipole</h3>
                <div class="control-group">
                    <label class="slider-label">Global Charge (p)</label>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <input type="range" v-model.number="dipoleCharge" min="1" max="10" step="0.5" class="range-slider" @input="dipoles.forEach(d => d.q = dipoleCharge)">
                        <input type="number" v-model.number="dipoleCharge" step="0.5" class="input-text" style="width: 70px;" @input="dipoles.forEach(d => d.q = dipoleCharge)">
                    </div>
                </div>
                <div class="control-group" style="margin-bottom: 2rem;">
                    <label class="slider-label">Global Separation 2a (px)</label>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <input type="range" v-model.number="dipoleSeparation" min="50" max="400" step="10" class="range-slider" @input="dipoles.forEach(d => d.sep = dipoleSeparation)">
                        <input type="number" v-model.number="dipoleSeparation" step="10" class="input-text" style="width: 70px;" @input="dipoles.forEach(d => d.sep = dipoleSeparation)">
                    </div>
                </div>

                <div class="control-group">
                     <button class="btn-action" @click="addDipole">+ Add New Dipole</button>
                </div>

                <div v-if="dipoles.length > 0" class="control-group" style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem; margin-top: 1rem;">
                    <h3>Active Dipoles</h3>
                    <div v-for="(d, idx) in dipoles" :key="d.id" class="indicator-row" style="margin-bottom: 8px; align-items: center; background: rgba(255,255,255,0.03); padding: 8px; border-radius: 6px;">
                        <span>Dipole #{{ idx + 1 }}</span>
                        <button class="btn-action" style="margin-top:0; width: 30px; padding: 4px; background: #64748b;" @click="removeDipole(idx)">×</button>
                    </div>
                </div>

                <div class="control-group" style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem; margin-top: 1rem;">
                    <h3>Test Charges (q0)</h3>
                    <p class="description" style="margin-bottom: 0.5rem">
                         Release a positive test charge to visualize the field line path.
                    </p>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-action" style="margin-top:0; flex: 1; background: #ea580c;" @click="addTestCharge">
                            Release q0
                        </button>
                         <button class="btn-action" style="margin-top:0; width: 40px; background: #64748b;" @click="clearTestCharges" title="Clear All q0">
                            ×
                        </button>
                    </div>
                </div>
            </div>

            <div v-if="activeTopic === 'torque'" class="sidebar-controls">
                <h3>Torque in Uniform Field</h3>
                <div class="control-group">
                    <label class="slider-label">Electric Field (E)</label>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <input type="range" v-model.number="electricFieldStrength" min="1" max="10" class="range-slider">
                        <input type="number" v-model.number="electricFieldStrength" step="0.5" class="input-text" style="width: 60px;">
                    </div>
                </div>
                  <div class="control-group">
                    <label class="slider-label">Angle (θ) - Degrees</label>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <input type="range" v-model.number="dipoleAngle" min="0" max="360" class="range-slider">
                        <input type="number" v-model.number="dipoleAngle" class="input-text" style="width: 60px;">
                    </div>
                </div>
                <div class="control-group">
                    <label class="slider-label">Damping (Friction)</label>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <input type="range" v-model.number="dampingFactor" min="0" max="2" step="0.1" class="range-slider">
                        <input type="number" v-model.number="dampingFactor" step="0.1" class="input-text" style="width: 60px;">
                    </div>
                </div>
                <div class="control-group checkbox-group">
                    <label class="checkbox-container">
                        <input type="checkbox" v-model="showEquilibrium">
                        <span class="checkmark"></span>
                        Show Equilibrium Points
                    </label>
                </div>
                <button class="btn-action" @click="isAnimating = !isAnimating" :style="{ background: isAnimating ? '#ef4444' : '#10b981' }">
                    {{ isAnimating ? 'Stop Animation' : 'Release Dipole' }}
                </button>
            </div>

        </ControlSidebar>

        <div class="lab-viewport" :style="viewportStyle">
            <DipoleSimulation 
                ref="simRef"
                v-if="activeTopic === 'dipole_field' || activeTopic === 'torque' || activeTopic === 'point_charge'"
                :mode="activeTopic"
                :show-grid="showGrid"
                :show-field-lines="showFieldLines"
                :show-vectors="showVectors"
                :charges="pointCharges"
                @update:charges="pointCharges = $event"
                :dipoles="dipoles"
                @update:dipoles="dipoles = $event"
                :test-charges="testCharges"
                @update:test-charges="testCharges = $event"
                :dipole-q="dipoleCharge"
                :dipole-sep="dipoleSeparation"
                :torque-e="electricFieldStrength"
                :torque-e-angle="electricFieldAngle"
                :torque-p="torqueDipoleMoment"
                :torque-angle="dipoleAngle"
                :play-animation="isAnimating"
                :damping="dampingFactor"
                :inertia="momentOfInertia"
                :show-equilibrium="showEquilibrium"
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

.charge-card {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.1);
}

.charge-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    font-size: 0.9rem;
    color: #e2e8f0;
}

.btn-icon {
    background: none;
    border: none;
    color: #ef4444;
    font-size: 1.2rem;
    cursor: pointer;
    line-height: 1;
}

.input-text {
    width: 100%;
    background: rgba(0,0,0,0.3);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 6px;
    padding: 6px;
    color: white;
    font-size: 0.9rem;
    margin-top: 4px;
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
    position: relative !important;
    z-index: 120 !important; 
    pointer-events: auto !important;
}

/* Ensure Sidebars are above canvas */
:deep(.lab-sidebar-container),
:deep(.control-sidebar-container) {
    z-index: 110 !important;
    pointer-events: auto !important;
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

/* Mobile Adjustments */
@media (max-width: 768px) {
    :deep(.lab-sidebar-container),
    :deep(.control-sidebar-container) {
        width: 280px !important; /* Slightly narrower on mobile */
    }

    .description {
        font-size: 0.8rem;
        padding: 6px;
    }

    .control-group {
        padding: 0.8rem;
    }

    .btn-action {
        padding: 10px;
        font-size: 0.9rem;
    }
}

@media (max-width: 480px) {
    :deep(.lab-sidebar-container),
    :deep(.control-sidebar-container) {
        width: 100% !important; /* Full width on tiny screens when open */
    }
}
</style>
