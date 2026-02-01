<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import ChargeSidebar from './ChargeSidebar.vue'
import ControlSidebar from './ControlSidebar.vue'
import ElectrostaticsNavBar from './ElectrostaticsNavBar.vue'
import GaussLawSimulation from './labs/GaussLawSimulation.vue'
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

// Drawing Tool State
const drawingActive = ref(false)
const drawingSidebarOpen = ref(false)
const drawingMode = ref('pen')
const drawingColor = ref('#00ff9d') // Greenish for Gauss
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
    { id: 'area_vector', label: "Area Vector" },
    { id: 'solid_angle', label: "Solid Angle" },
    { id: 'flux', label: "Electric Flux" },
    { id: 'wire', label: "Infinite Wire" },
    { id: 'sheet', label: "Infinite Plane Sheet" },
    { id: 'shell', label: "Thin Spherical Shell" },
    { id: 'solid_sphere', label: "Solid Charged Sphere" }
]
const activeTopic = ref('area_vector')

const handleTopicSelect = (topicId) => {
    activeTopic.value = topicId
    if (topicId === 'flux') {
        chargePos.value = { x: -400, y: 0, z: 0 }
        clearFlux() // Start clean as requested
    }
}

const viewportStyle = computed(() => ({
    marginLeft: '0',
    marginRight: '0',
    width: '100vw',
    transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)'
}))

// Lab parameters
const zoom = ref(1.0)
const chargeValue = ref(10) // General charge or linear/surface density
const surfaceType = ref('spherical') // spherical, cylindrical, box
const surfaceRadius = ref(100)
const surfaceLength = ref(200) // Wire length or Sheet size
const shellRadius = ref(80)
const showFormulas = ref(true)

// Area Vector State
const areaVectorShape = ref('plane')
const dASize = ref(10) // Initial size for dA and thick arrow

// Flux Source State
const fluxSourceType = ref('point') // point, plane, wire

// Flux 3D Experiment State
const chargePos = ref({ x: -400, y: 0, z: 0 })
const planePos = ref({ x: 0, y: 0, z: 0 })
const planeRotation = ref({ x: 0, y: 0, z: 0 })
const showSource = ref(true)
const showSurface = ref(true)
const showShadow = ref(true)
const showAreaVector = ref(true)
const calculatedFlux = ref(0)
const thetaAngle = ref(0)

const clearFlux = () => {
    showSource.value = false
    showSurface.value = false
    showShadow.value = false
    showAreaVector.value = false
    calculatedFlux.value = 0
    thetaAngle.value = 0
    // Also reset positions/rotations if needed? Or just hide them is "clear".
}

// Solid Angle Extra state
const solidAngleDirection = ref({ phi: 0, theta: 0 })
const showSecondary = ref(true)
const autoScan = ref(false)

let scanInterval = null
watch(autoScan, (val) => {
    if (val) {
        scanInterval = setInterval(() => {
            solidAngleDirection.value.phi = (solidAngleDirection.value.phi + 0.5) % 360
            solidAngleDirection.value.theta = Math.sin(Date.now() / 2000) * 45
        }, 30)
    } else {
        clearInterval(scanInterval)
    }
})

onUnmounted(() => {
    if (scanInterval) clearInterval(scanInterval)
})

// Visibility Toggles
const showLines = ref(true)

const zoomIn = () => {
    zoom.value = Math.min(2.0, zoom.value + 0.1)
}

const zoomOut = () => {
    zoom.value = Math.max(0.5, zoom.value - 0.1)
}

const resetZoom = () => {
    zoom.value = 1.0
}

const isInside = computed(() => {
    if (activeTopic.value !== 'flux') return true
    
    const { x, y, z } = chargePos.value
    const R = surfaceRadius.value
    const L = surfaceLength.value / 2
    
    if (surfaceType.value === 'spherical' || activeTopic.value === 'solid_sphere') {
        return (x*x + y*y + z*z) <= R*R
    } else if (surfaceType.value === 'cylindrical') {
        const rhoSq = x*x + z*z
        return rhoSq <= R*R && Math.abs(y) <= L
    } else { // box (cube geometry, but controls say 'Box')
        // BoxGeometry created with size = radius * 2. So half-width is radius.
        // But controls have 'Length' slider? No, Box uses radius for size in setupSurfaceMesh ('const s = props.surfaceRadius * 2')
        // Wait, setupSurfaceMesh uses BoxGeometry(s, s, s) -> Cube.
        // If we want a non-cube box, we'd need length.
        // Let's assume Cube based on setupSurfaceMesh.
        return Math.abs(x) <= R && Math.abs(y) <= R && Math.abs(z) <= R
    }
})

const EPSILON_0 = 8.854e-12
const fluxValue = computed(() => {
    if (activeTopic.value === 'shell') {
        return surfaceRadius.value >= shellRadius.value ? chargeValue.value : 0
    }
    if (activeTopic.value === 'solid_sphere') {
        // q_enclosed = Q * (r/R)^3 if r < R, else Q
        const ratio = Math.min(1, surfaceRadius.value / shellRadius.value)
        return chargeValue.value * Math.pow(ratio, 3)
    }
    if (activeTopic.value === 'flux') {
        return isInside.value ? chargeValue.value : 0
    }
    return chargeValue.value
})

</script>

<template>
    <div class="gauss-lab" :class="{ 'sidebar-collapsed': !sidebarOpen, 'controls-collapsed': !controlsOpen }">
        <ElectrostaticsNavBar 
            experiment-name="Gauss's Law Lab" 
            @toggleLeftSidebar="toggleSidebar"
            @toggleRightSidebar="toggleControls"
            @toggleDrawing="toggleDrawing"
            :is-left-sidebar-collapsed="!sidebarOpen"
            :is-right-sidebar-collapsed="!controlsOpen"
            :drawing-active="drawingActive"
        />
        
        <ChargeSidebar 
            title="Gauss's Law" 
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
            <div class="sidebar-controls">
                <!-- Visibility controls removed as per request; simulation defaults to showing lines -->
                
                <div v-if="activeTopic === 'flux'" class="topic-controls">
                    <h3>Electric Field Source</h3>
                    <div class="control-group">
                        <label class="slider-label">Source Type</label>
                        <select v-model="fluxSourceType" class="shape-dropdown">
                            <option value="point">Point Charge</option>
                            <option value="wire">Infinite Wire</option>
                            <option value="plane">Infinite Plane Sheet</option>
                        </select>
                    </div>

                    <div class="control-group">
                        <label class="slider-label">Charge (q): {{chargeValue}} μC</label>
                        <input type="range" v-model.number="chargeValue" min="-20" max="20" step="1" class="range-slider">
                    </div>

                    <div class="control-group">
                        <label class="toggle-label">
                            <input type="checkbox" v-model="showLines">
                            Show Field Lines (Rays)
                        </label>
                        <label class="toggle-label">
                            <input type="checkbox" v-model="showSource">
                            Show Field Source
                        </label>
                        <label class="toggle-label">
                            <input type="checkbox" v-model="showSurface">
                            Show Interaction Plane
                        </label>
                        <label class="toggle-label">
                            <input type="checkbox" v-model="showShadow">
                            Show Shadow Projection
                        </label>
                        <label class="toggle-label">
                            <input type="checkbox" v-model="showAreaVector">
                            Show Area Vector (A)
                        </label>
                    </div>

                    <div v-if="showSurface" class="control-group active-data">
                        <label class="slider-label">Physical Quantities</label>
                        <div class="readout-item">
                            <span class="label">Total Flux (Φ)</span>
                            <span class="value">{{ calculatedFlux.toFixed(2) }}</span>
                        </div>
                        <div class="readout-item">
                            <span class="label">Angle (θ)</span>
                            <span class="value">{{ thetaAngle.toFixed(1) }}°</span>
                        </div>
                    </div>

                    <div v-if="showSurface" class="control-group">
                        <label class="slider-label">Experiment Controls</label>
                        <button @click="planeRotation = { x: 0, y: 0, z: 0 }" class="action-btn">Reset Orientation</button>
                        <p class="hint-text">Drag edges of plane to rotate</p>
                    </div>

                    <div class="control-group">
                        <button @click="clearFlux" class="action-btn danger">Clear Simulation</button>
                    </div>
                </div>

                <div v-if="activeTopic === 'area_vector'" class="topic-controls">
                    <h3>Area Vector</h3>
                    
                    <div class="control-group">
                        <label class="slider-label">Shape</label>
                        <select v-model="areaVectorShape" class="shape-dropdown">
                            <option value="plane">Plane</option>
                            <option value="sphere">Sphere</option>
                            <option value="cylinder">Cylinder</option>
                            <option value="cube">Cube</option>
                            <option value="potato">Random Shape</option>
                        </select>
                    </div>

                    <div class="control-group">
                        <label class="slider-label">Size</label>
                        <input type="range" v-model.number="surfaceRadius" min="50" max="250" step="10" class="range-slider">
                    </div>

                    <div class="control-group">
                        <label class="slider-label">dA Element Size</label>
                        <input type="range" v-model.number="dASize" min="1" max="20" step="1" class="range-slider">
                    </div>
                     <!-- Description text removed as per request -->
                </div>

                <div v-if="activeTopic === 'solid_angle'" class="topic-controls">
                    <h3>Solid Angle (Ω)</h3>
                    <div class="control-group">
                        <label class="slider-label">Aperture Size: {{chargeValue}}°</label>
                        <input type="range" v-model.number="chargeValue" min="2" max="179" step="1" class="range-slider">
                    </div>
                    <div class="control-group">
                        <label class="slider-label">Projection Radius: {{surfaceRadius}} px</label>
                        <input type="range" v-model.number="surfaceRadius" min="50" max="350" step="10" class="range-slider">
                    </div>
                    <div class="control-group">
                        <label class="toggle-label">
                            <input type="checkbox" v-model="showSecondary">
                            Show Solid Angle Indicator (Ω)
                        </label>
                    </div>
                </div>

            </div>
        </ControlSidebar>

        <div class="lab-viewport" :style="viewportStyle">
            <GaussLawSimulation 
                :active-topic="activeTopic"
                :zoom="zoom"
                :charge="chargeValue"
                :charge-pos="chargePos"
                @update:charge-pos="chargePos = $event"
                :solid-angle-dir="solidAngleDirection"
                @update:solid-angle-dir="solidAngleDirection = $event"
                :show-secondary="showSecondary"
                :surface-type="surfaceType"
                :surface-radius="surfaceRadius"
                :surface-length="surfaceLength"
                :shell-radius="shellRadius"
                :show-surface="showSurface"
                :show-lines="activeTopic === 'flux' ? showLines : true" 
                :show-source="showSource"
                :drawing-active="drawingActive"
                :area-vector-shape="areaVectorShape"
                :d-a-size="dASize"
                :flux-source-type="fluxSourceType"
                :plane-pos="planePos"
                @update:plane-pos="planePos = $event"
                :plane-rotation="planeRotation"
                @update:plane-rotation="planeRotation = $event"
                :wall-pos="wallPos"
                @update:wall-pos="wallPos = $event"
                :show-shadow="showShadow"
                :show-area-vector="showAreaVector"
                @update:flux-value="calculatedFlux = $event"
                @update:theta-angle="thetaAngle = $event"
            />

            <!-- Viewport contains only simulation and controls now -->
            
            <!-- Info Overlay removed as per user guidance -->

            <!-- Zoom Controls -->
            <div class="zoom-controls">
                <button @click="zoomIn" title="Zoom In">+</button>
                <button @click="resetZoom" title="Reset View">⟲</button>
                <button @click="zoomOut" title="Zoom Out">−</button>
            </div>
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
.gauss-lab {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    overflow: hidden;
    background: radial-gradient(circle at center, #0a192f 0%, #000 100%);
    display: flex;
    flex-direction: column;
}

.lab-viewport {
    position: relative;
    width: 100%;
    flex: 1;
    overflow: hidden;
}

.sidebar-controls {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
}

.control-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    background: rgba(0, 255, 255, 0.03);
    border: 1px solid rgba(0, 255, 255, 0.1);
    border-radius: 4px;
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

.status-indicator {
    margin-top: 1rem;
    padding: 8px;
    text-align: center;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    background: rgba(239, 68, 68, 0.1);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.2);
}

.status-indicator.inside {
    background: rgba(0, 255, 255, 0.1);
    color: #00ffff;
    border: 1px solid rgba(0, 255, 255, 0.2);
}

.range-slider {
    width: 100%;
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    outline: none;
    -webkit-appearance: none;
    appearance: none;
}

.range-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    background: #00ffff;
    border-radius: 50%;
    cursor: pointer;
}

.shape-dropdown {
    width: 100%;
    padding: 8px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
}

.shape-dropdown option {
    background: #0f172a;
    color: white;
}

.topic-controls h3 {
    font-size: 1rem;
    color: #00ffff;
    margin-bottom: 0.5rem;
    margin-top: 1rem;
}

.action-btn {
    width: 100%;
    padding: 10px;
    background: rgba(0, 255, 255, 0.1);
    border: 1px solid rgba(0, 255, 255, 0.3);
    color: #00ffff;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
    margin: 5px 0;
}

.action-btn.danger {
    background: rgba(255, 0, 85, 0.1);
    border: 1px solid rgba(255, 0, 85, 0.3);
    color: #ff0055;
    margin-top: 10px;
}

.action-btn.danger:hover {
    background: rgba(255, 0, 85, 0.2);
    box-shadow: 0 0 10px rgba(255, 0, 85, 0.2);
}

.hint-text {
    font-size: 0.75rem;
    color: #64748b;
    font-style: italic;
    margin-top: 4px;
}

.active-data {
    background: rgba(0, 255, 255, 0.05);
    padding: 12px;
    border-radius: 8px;
    border: 1px solid rgba(0, 255, 255, 0.1);
    margin-top: 15px;
}

.readout-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.readout-item:last-child {
    margin-bottom: 0;
}

.readout-item .label {
    font-size: 0.85rem;
    color: #94a3b8;
}

.readout-item .value {
    font-family: 'Courier New', monospace;
    font-size: 1rem;
    color: #00ffff;
    font-weight: bold;
    text-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
}

/* Zoom Controls */
.zoom-controls {
    position: absolute;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: row;
    gap: 16px;
    z-index: 100;
}

.zoom-controls button {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(8px);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.zoom-controls button:hover {
    background: rgba(0, 255, 255, 0.1);
    border-color: #00ffff;
    color: #00ffff;
    transform: scale(1.1) translateY(-2px);
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);
}

.zoom-controls button:active {
    transform: scale(0.95);
}

/* Info Overlays */
.info-overlay {
    position: absolute;
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 12px;
    pointer-events: none;
}

.top-left {
    top: 80px;
    left: 340px; /* Offset for sidebar */
    transition: left 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}

.sidebar-collapsed .top-left {
    left: 20px;
}

/* Data cards styling */
.data-card, .formula-card {
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 12px 20px;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
}

.data-card .label {
    font-size: 0.75rem;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.data-card .value {
    font-size: 1.5rem;
    color: #00ffff;
    font-weight: 700;
}

.data-card .value small {
    font-size: 0.8rem;
    font-weight: 400;
    color: #64748b;
}

.formula-card {
    align-items: center;
    border-left: 3px solid #00ffff;
}

.description-card {
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(5px);
    border: 1px solid rgba(255, 255, 255, 0.05);
    padding: 12px 16px;
    border-radius: 12px;
    max-width: 300px;
}

.description-card p {
    font-size: 0.85rem;
    color: #cbd5e1;
    line-height: 1.5;
    margin: 0;
}

.math-font {
    font-family: 'Cambria Math', 'serif';
    font-style: italic;
    font-size: 1.1rem;
    color: #e2e8f0;
}

@media (max-width: 768px) {
    .top-left {
        left: 20px;
        top: 70px;
    }
}
</style>
