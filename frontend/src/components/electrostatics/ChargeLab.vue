<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import ChargeSidebar from './ChargeSidebar.vue'
import ControlSidebar from './ControlSidebar.vue'
import ElectrostaticsNavBar from './ElectrostaticsNavBar.vue'
import ConservationLab from './labs/ConservationLab.vue'
import CoulombLab from './labs/CoulombLab.vue'
import MultipleForcesLab from './labs/MultipleForcesLab.vue'
import ChargeDistributionLab from './labs/ChargeDistributionLab.vue'
import Continuous3DLab from './labs/Continuous3DLab.vue'
import DrawingCanvas from '../drawingTool/DrawingCanvas.vue'
import DrawingSidebar from '../drawingTool/DrawingSidebar.vue'

const router = useRouter()

// Sidebar State
const sidebarOpen = ref(true)
const controlsOpen = ref(true)

const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value
}

const toggleControls = () => {
    controlsOpen.value = !controlsOpen.value
}

const handleExit = () => {
    router.push('/experiments')
}

// Drawing Tool State
const drawingActive = ref(false)
const drawingSidebarOpen = ref(false)
const drawingMode = ref('pen')
const drawingColor = ref('#00d4ff')
const drawingThickness = ref(3)
const drawingCanvasRef = ref(null)

const toggleDrawing = () => {
    drawingActive.value = !drawingActive.value
    if (drawingActive.value) {
        drawingSidebarOpen.value = true
    } else {
        drawingSidebarOpen.value = false
    }
}

const handleClearDrawing = () => {
    if (drawingCanvasRef.value) {
        drawingCanvasRef.value.clearAll()
    }
}

const topics = [
    { id: 'conservation', label: "Conservation of Charge" },
    { id: 'coulomb', label: "Coulomb's Law" },
    { id: 'multiple', label: "Force between Multiple Charges" },
    { id: 'distribution', label: "Charge Distribution" },
    { id: 'continuous3d', label: "Continuous 3D" }
]
const activeTopic = ref('conservation')

const handleTopicSelect = (topicId) => {
    activeTopic.value = topicId
}

const viewportStyle = computed(() => ({
    marginLeft: '0',
    marginRight: '0',
    width: '100vw',
    transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)'
}))

// Lab interaction
const labComponent = ref(null)
// Shape Controls
const selectedShape = ref('square')
const shapeSide = ref(200)
const shapeWidth = ref(300)
const shapeHeight = ref(150)
const shapeSideA = ref(200)
const shapeSideB = ref(200)
const shapeAngle = ref(60)
const forceMode = ref('resultant') // 'resultant', 'components', 'pairwise'

const applyShape = () => {
    if (multipleLabRef.value) {
        let params = {}
        if (selectedShape.value === 'square') params = { side: shapeSide.value }
        if (selectedShape.value === 'rectangle') params = { width: shapeWidth.value, height: shapeHeight.value }
        if (selectedShape.value === 'triangle') params = { a: shapeSideA.value, b: shapeSideB.value, angle: shapeAngle.value }
        multipleLabRef.value.setShape(selectedShape.value, params)
    }
}

const handleCreatePair = () => {
    if (labComponent.value) {
        labComponent.value.createPair()
    }
}

const handleResetLab = () => {
    if (labComponent.value) {
        labComponent.value.resetLab()
    }
}
// Coulomb Lab interaction
const coulombLabRef = ref(null)
const showCoulombFormula = ref(false)
const showGrid = ref(true)
const coulombZoom = ref(1)
const q1 = ref(2)
const q2 = ref(-2)

// Multiple Forces Lab
const multipleLabRef = ref(null)
const selectedCharge = ref(null)
const newChargeMag = ref(1)

const updateMultipleSelection = () => {
    if (multipleLabRef.value) {
        selectedCharge.value = multipleLabRef.value.getSelectedCharge()
    }
}
const addCharge = (mag) => {
    if (multipleLabRef.value) {
        multipleLabRef.value.addCharge(mag)
    }
}
const removeSelected = () => {
    if (multipleLabRef.value) {
        multipleLabRef.value.removeSelectedCharge()
        selectedCharge.value = null
    }
}
const updateSelectedMag = (val) => {
    if (multipleLabRef.value) {
        multipleLabRef.value.updateSelectedCharge(val)
        updateMultipleSelection()
    }
}

const toggleFormula = () => {
    showCoulombFormula.value = !showCoulombFormula.value
}

// Charge Distribution Lab
const distributionLabRef = ref(null)
const distributionSelected = ref(null)

const updateDistributionSelection = () => {
    if (distributionLabRef.value) {
        distributionSelected.value = distributionLabRef.value.getSelectedSphere()
    }
}

const addDistributionSphere = () => {
    if (distributionLabRef.value) {
        distributionLabRef.value.addSphere()
    }
}

const removeDistributionSphere = () => {
    if (distributionLabRef.value) {
        distributionLabRef.value.removeSelected()
        updateDistributionSelection()
    }
}

const updateDistributionRadius = (val) => {
    if (distributionLabRef.value) {
        distributionLabRef.value.updateSelectedRadius(parseFloat(val))
        updateDistributionSelection()
    }
}

const updateDistributionCharge = (val) => {
    if (distributionLabRef.value) {
        distributionLabRef.value.updateSelectedCharge(parseFloat(val))
        updateDistributionSelection()
    }
}


const continuous3DRef = ref(null)
const c3dMaterial = ref('dielectric')
const c3dShape = ref('solid_sphere')
const c3dCoords = ref('cartesian')
const c3dFunction = ref('r')
const c3dCutMode = ref('full')
const c3dShowGraph = ref(false)
const c3dShowDistribution = ref(false)
const c3dShowAxis = ref(false)

const handleGraphToggle = () => {
    c3dShowGraph.value = !c3dShowGraph.value
}

const handleDistributionToggle = () => {
    c3dShowDistribution.value = !c3dShowDistribution.value
}

const handleAxisToggle = () => {
    c3dShowAxis.value = !c3dShowAxis.value
}

const updateCharge = (index, value) => {
    if (coulombLabRef.value) {
        coulombLabRef.value.setCharge(index, value)
    }
}
</script>

<template>
    <div class="charge-lab">
        <ElectrostaticsNavBar 
            experiment-name="Electrostatics Lab" 
            @toggleLeftSidebar="toggleSidebar"
            @toggleRightSidebar="toggleControls"
            @toggleDrawing="toggleDrawing"
            :is-left-sidebar-collapsed="!sidebarOpen"
            :is-right-sidebar-collapsed="!controlsOpen"
            :drawing-active="drawingActive"
        />
        
        <ChargeSidebar 
            title="Charges & Fields" 
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
            <div class="sidebar-controls" v-if="activeTopic === 'conservation'">
                <button class="btn-action" @click="handleResetLab">Reset</button>
            </div>

            <div class="sidebar-controls" v-if="activeTopic === 'coulomb'">
                <div class="control-group">
                    <label class="toggle-label">
                        <input type="checkbox" v-model="showGrid">
                        Show Gridlines
                    </label>
                </div>
                
                <div class="control-group">
                    <label class="toggle-label">
                        <input type="checkbox" :checked="showCoulombFormula" @change="toggleFormula">
                        Show Formula Calculation
                    </label>
                </div>
            </div>

            <!-- Multiple Forces Lab Controls -->
             <div class="sidebar-controls" v-if="activeTopic === 'multiple'">
                <h3>Add Charges</h3>
                <div class="input-row">
                    <button class="btn-action" @click="addCharge(1)" style="flex:1">+1 µC</button>
                    <button class="btn-action" @click="addCharge(-1)" style="flex:1; background: linear-gradient(90deg, #00d4ff, #0077ff)">-1 µC</button>
                </div>

                <!-- Force Display Mode -->
                <div class="control-group">
                    <h3>Force Display</h3>
                    <select v-model="forceMode" class="shape-dropdown">
                        <option value="resultant">Resultant Force</option>
                        <option value="components">Component Forces (X-Y)</option>
                        <option value="pairwise">Pairwise Forces (Fab, Fac...)</option>
                    </select>
                </div>

                <!-- Shape Controls -->
                <div class="control-group">
                    <h3>Shape Preset</h3>
                    <select v-model="selectedShape" class="shape-dropdown">
                        <option value="square">Square (Sides)</option>
                        <option value="rectangle">Rectangle (Sides)</option>
                        <option value="triangle">Triangle (Sides & Angle)</option>
                    </select>
                    
                    <div v-if="selectedShape === 'square'" class="shape-params">
                        <label class="slider-label">Side Length: {{shapeSide}}</label>
                        <input type="number" v-model.number="shapeSide" class="number-input">
                    </div>
                    <div v-if="selectedShape === 'rectangle'" class="shape-params">
                        <label class="slider-label">Width: {{shapeWidth}}</label>
                        <input type="number" v-model.number="shapeWidth" class="number-input">
                        <label class="slider-label">Height: {{shapeHeight}}</label>
                        <input type="number" v-model.number="shapeHeight" class="number-input"> 
                    </div>
                    <div v-if="selectedShape === 'triangle'" class="shape-params">
                        <label class="slider-label">Side A: {{shapeSideA}}</label>
                        <input type="number" v-model.number="shapeSideA" class="number-input">
                        <label class="slider-label">Side B: {{shapeSideB}}</label>
                        <input type="number" v-model.number="shapeSideB" class="number-input">
                        <label class="slider-label">Angle (°): {{shapeAngle}}</label>
                        <input type="number" v-model.number="shapeAngle" class="number-input">
                    </div>
                    
                    <button class="btn-action" @click="applyShape" style="margin-top:10px; background:rgba(251, 191, 36, 0.2); border-color:rgba(251, 191, 36, 0.4); color:#fbbf24">Apply Shape</button>
                </div>

                <div class="control-group" v-if="selectedCharge">
                    <h3>Selected Charge</h3>
                    <div style="font-size:1.1rem; font-weight:bold; margin-bottom:10px; color:#fbbf24; text-align:center">
                        Net Force: {{ multipleLabRef?.selectedNetForce.toExponential(2) }} N
                    </div>
                    <label class="slider-label">Magnitude ({{selectedCharge.q}} µC)</label>
                    <div class="input-row">
                        <input 
                            type="number" 
                            class="number-input" 
                            v-model.number="selectedCharge.q"
                            step="0.1"
                            @input="updateSelectedMag(selectedCharge.q)"
                        >
                        <div class="charge-indicator" :class="selectedCharge.q > 0 ? 'pos' : (selectedCharge.q < 0 ? 'neg' : 'neu')"></div>
                    </div>
                    <button class="btn-clear" @click="removeSelected" style="width:100%; margin-top:10px; background:rgba(255,0,0,0.2); border-color:rgba(255,0,0,0.3)">
                        Remove Charge
                    </button>
                </div>
                <div v-else class="control-group">
                    <p style="color:#94a3b8; font-size:0.9rem; text-align:center">Select a charge to edit</p>
                </div>

                 <div class="control-group">
                    <label class="slider-label">Zoom Level: {{coulombZoom}}x</label>
                    <input type="range" min="0.5" max="2" step="0.1" v-model.number="coulombZoom" class="range-slider">
                </div>
                 <div class="control-group">
                    <label class="toggle-label">
                        <input type="checkbox" v-model="showGrid">
                        Show Gridlines
                    </label>
                </div>
            </div>

            <div class="sidebar-controls" v-if="activeTopic === 'coulomb'">
                <!-- Charge Controls -->
                <div class="control-group">
                    <label class="slider-label">Charge Q₁ (µC)</label>
                    <div class="input-row">
                        <input 
                            type="number" 
                            v-model.number="q1" 
                            class="number-input"
                            @input="updateCharge(0, q1)"
                        >
                        <div class="charge-indicator" :class="q1 > 0 ? 'pos' : (q1 < 0 ? 'neg' : 'neu')"></div>
                    </div>
                </div>

                <div class="control-group">
                    <label class="slider-label">Charge Q₂ (µC)</label>
                    <div class="input-row">
                        <input 
                            type="number" 
                            v-model.number="q2" 
                            class="number-input"
                            @input="updateCharge(1, q2)"
                        >
                        <div class="charge-indicator" :class="q2 > 0 ? 'pos' : (q2 < 0 ? 'neg' : 'neu')"></div>
                    </div>
                </div>

                <div class="control-group">
                    <label class="slider-label">Zoom Level: {{ coulombZoom.toFixed(1) }}x</label>
                    <input 
                        type="range" 
                        v-model.number="coulombZoom" 
                        min="0.5" 
                        max="2" 
                        step="0.1"
                        class="range-slider"
                    >
                </div>
            </div>

            <!-- Charge Distribution Lab Controls -->
            <div class="sidebar-controls" v-if="activeTopic === 'distribution'">
                <h3>Add Sphere</h3>
                <button class="btn-action" @click="addDistributionSphere">+ Add Sphere</button>

                <div class="control-group" v-if="distributionSelected">
                    <h3>Selected Sphere</h3>
                    <label class="slider-label">Radius: {{distributionSelected.r}}px</label>
                    <input 
                        type="range" 
                        min="20" 
                        max="80" 
                        step="5" 
                        :value="distributionSelected.r" 
                        @input="updateDistributionRadius($event.target.value)"
                        class="range-slider"
                    >
                    
                    <label class="slider-label">Charge: {{distributionSelected.q}} µC</label>
                    <div class="input-row">
                        <input 
                            type="number" 
                            class="number-input" 
                            :value="distributionSelected.q"
                            @input="updateDistributionCharge($event.target.value)"
                            step="0.5"
                        >
                    </div>
                    <button class="btn-clear" @click="removeDistributionSphere" style="width:100%; margin-top:10px; background:rgba(255,0,0,0.2); border-color:rgba(255,0,0,0.3)">
                        Remove Sphere
                    </button>
                </div>
                <div v-else class="control-group">
                    <p style="color:#94a3b8; font-size:0.9rem; text-align:center">Select a sphere to edit</p>
                </div>

                <div class="control-group">
                    <label class="slider-label">Zoom Level: {{ coulombZoom.toFixed(1) }}x</label>
                    <input 
                        type="range" 
                        v-model.number="coulombZoom" 
                        min="0.5" 
                        max="2" 
                        step="0.1"
                        class="range-slider"
                    >
                </div>
                <div class="control-group">
                    <label class="toggle-label">
                        <input type="checkbox" v-model="showGrid">
                        Show Gridlines
                    </label>
                </div>
            </div>

            <!-- Continuous 3D Lab Controls -->
            <div class="sidebar-controls" v-if="activeTopic === 'continuous3d'">
                <h3>3D Configuration</h3>
                
                <div class="control-group">
                    <label class="slider-label">Material Type</label>
                    <select v-model="c3dMaterial" class="shape-dropdown">
                        <option value="dielectric">Dielectric (Insulator)</option>
                        <option value="conductor">Conductor (Metal)</option>
                    </select>
                </div>

                <div class="control-group">
                    <label class="slider-label">Select Shape</label>
                    <select v-model="c3dShape" class="shape-dropdown">
                        <option value="rod">Rod (1D)</option>
                        <option value="solid_sphere">Solid Sphere</option>
                        <option value="hollow_sphere">Hollow Sphere</option>
                        <option value="solid_cylinder">Solid Cylinder</option>
                        <option value="hollow_cylinder">Hollow Cylinder</option>
                        <option value="disk">Disk (2D)</option>
                        <option value="cube">Cube</option>
                    </select>
                </div>

                <div class="control-group">
                    <label class="slider-label">Coordinate System</label>
                    <select v-model="c3dCoords" class="shape-dropdown">
                        <option value="cartesian">Cartesian (x, y, z)</option>
                        <option value="spherical">Spherical (r, θ, φ)</option>
                        <option value="cylindrical">Cylindrical (ρ, φ, z)</option>
                    </select>
                </div>

                <div class="control-group">
                    <label class="slider-label">Distribution Func ρ/λ/σ</label>
                    <input 
                        type="text" 
                        v-model="c3dFunction" 
                        class="number-input" 
                        placeholder="e.g. x*x + y*y"
                    >
                    <p style="font-size: 0.75rem; color: #94a3b8; margin-top: 4px;">
                        Try: <code>sin(r)</code>, <code>1/r</code>, <code>exp(-r)</code>

                    </p>
                </div>

                <div class="control-group">
                    <label class="slider-label">Cut View</label>
                    <select v-model="c3dCutMode" class="shape-dropdown">
                        <option value="full">Full Shape</option>
                        <option value="slice_xy">Half Slice (XY Plane)</option>
                        <option value="cut_octant">Corner Cut (1st Octant)</option>
                    </select>
                </div>

                <div class="control-group">
                    <button class="btn-action" @click="handleDistributionToggle" style="width: 100%; margin-bottom: 5px;">
                        {{ c3dShowDistribution ? 'Show Shape Only' : 'Show Distribution' }}
                    </button>
                    <button class="btn-clear" @click="handleGraphToggle" style="width: 100%; margin-bottom: 5px;">
                        {{ c3dShowGraph ? 'Close Graph' : 'Show Graph' }}
                    </button>
                    <button class="btn-clear" @click="handleAxisToggle" style="width: 100%;">
                        {{ c3dShowAxis ? 'Hide Axis' : 'Show Axis' }}
                    </button>
                </div>

                <div class="control-group">
                    <label class="slider-label">Zoom Level: {{ coulombZoom.toFixed(1) }}x</label>
                    <input 
                        type="range" 
                        v-model.number="coulombZoom" 
                        min="0.5" 
                        max="2" 
                        step="0.1"
                        class="range-slider"
                    >
                </div>
            </div>
        </ControlSidebar>

        <div class="lab-viewport" :style="viewportStyle">
            <!-- Dynamic Component Loading -->
            <transition name="fade" mode="out-in">
                <ConservationLab v-if="activeTopic === 'conservation'" ref="labComponent" />
                <CoulombLab 
                    v-else-if="activeTopic === 'coulomb'" 
                    ref="coulombLabRef"
                    :show-formula="showCoulombFormula"
                    :show-grid="showGrid"
                    :zoom="coulombZoom"
                />

                <MultipleForcesLab
                    v-else-if="activeTopic === 'multiple'"
                    ref="multipleLabRef"
                    :show-grid="showGrid"
                    :zoom="coulombZoom"
                    :force-mode="forceMode"
                    @mousedown="updateMultipleSelection"
                    @click="updateMultipleSelection"
                />
                <ChargeDistributionLab
                    v-else-if="activeTopic === 'distribution'"
                    ref="distributionLabRef"
                    :show-grid="showGrid"
                    :zoom="coulombZoom"
                    @select="updateDistributionSelection"
                />
                <Continuous3DLab
                    v-else-if="activeTopic === 'continuous3d'"
                    ref="continuous3DRef"
                    :shape="c3dShape"
                    :material="c3dMaterial"
                    :coords="c3dCoords"
                    :distributionFunc="c3dFunction"
                    :cutMode="c3dCutMode"
                    :showGraph="c3dShowGraph"
                    :showDistribution="c3dShowDistribution"
                    :showAxis="c3dShowAxis"
                    :zoom="coulombZoom"
                />
            </transition>
        </div>

        <!-- Drawing Tool Components -->
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
.charge-lab {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    overflow: hidden;
    background: transparent;
    display: flex;
    flex-direction: column;
}

.lab-viewport {
    position: relative;
    width: 100%;
    flex: 1; /* Take remaining height */
    overflow: hidden;
}

/* Sidebar Controls Styling */
.sidebar-controls {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
}



.btn-action {
    padding: 12px 24px;
    background: linear-gradient(90deg, #ff0055, #00d4ff);
    border: none;
    border-radius: 30px;
    color: white;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
    transition: transform 0.2s;
}

.btn-action:hover {
    transform: scale(1.05);
}

.btn-clear {
    padding: 12px 24px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 30px;
    color: white;
    cursor: pointer;
}

/* Toggle and Slider Styling */
.control-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
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

.input-row {
    display: flex;
    align-items: center;
    gap: 10px;
}

.number-input {
    width: 100%;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    padding: 8px;
    color: white;
    font-family: monospace;
    font-size: 1rem;
}

.number-input:focus {
    outline: none;
    border-color: #00d4ff;
}

.charge-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
}
.pos { background: #ff0055; box-shadow: 0 0 8px #ff0055; }
.neg { background: #00d4ff; box-shadow: 0 0 8px #00d4ff; }
.neu { background: #94a3b8; }

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.shape-dropdown {
    width: 100%;
    padding: 8px;
    margin-bottom: 10px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
}

.shape-dropdown option {
    background: #1e293b;
    color: white;
}
</style>
