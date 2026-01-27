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
    { id: 'flux', label: "Electric Flux" },
    { id: 'solid_angle', label: "Solid Angle" },
    { id: 'wire', label: "Infinite Wire" },
    { id: 'sheet', label: "Infinite Plane Sheet" },
    { id: 'shell', label: "Thin Spherical Shell" }
]
const activeTopic = ref('flux')

const handleTopicSelect = (topicId) => {
    activeTopic.value = topicId
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

// Charge Position (for Flux topic)
const chargePos = ref({ x: 0, y: 0, z: 0 })

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
const showSurface = ref(true)
const showLines = ref(true)
const showSource = ref(true)

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
    const distSq = x*x + y*y + z*z
    const R = surfaceRadius.value
    
    if (surfaceType.value === 'spherical') {
        return Math.sqrt(distSq) <= R
    } else if (surfaceType.value === 'cylindrical') {
        const rho = Math.sqrt(x*x + z*z)
        return rho <= R && Math.abs(y) <= 175 // 350/2 is hardcoded height in simulation
    } else {
        return Math.abs(x) <= R && Math.abs(y) <= R && Math.abs(z) <= R
    }
})

const EPSILON_0 = 8.854e-12
const fluxValue = computed(() => {
    if (activeTopic.value === 'shell') {
        return surfaceRadius.value >= shellRadius.value ? chargeValue.value : 0
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
                <div class="control-group">
                    <h3 style="margin-top: 0">Visibility</h3>
                    <label class="toggle-label">
                        <input type="checkbox" v-model="showSource">
                        Show Source (Charge/Wire)
                    </label>
                    <label class="toggle-label">
                        <input type="checkbox" v-model="showSurface">
                        Show Gaussian Surface
                    </label>
                    <label class="toggle-label">
                        <input type="checkbox" v-model="showLines">
                        Show Field Lines
                    </label>
                    <label class="toggle-label">
                        <input type="checkbox" v-model="showFormulas">
                        Show Theory & Data
                    </label>
                </div>
                <div v-if="activeTopic === 'flux'" class="topic-controls">
                    <h3>Electric Flux</h3>
                    <div class="control-group">
                        <label class="slider-label">Charge Enclosed (q): {{chargeValue}} nC</label>
                        <input type="range" v-model.number="chargeValue" min="-50" max="50" step="1" class="range-slider">
                    </div>
                    <div class="control-group">
                        <label class="slider-label">Surface Type</label>
                        <select v-model="surfaceType" class="shape-dropdown">
                            <option value="spherical">Spherical</option>
                            <option value="cylindrical">Cylindrical</option>
                            <option value="box">Cube/Box</option>
                        </select>
                    </div>
                    <div class="control-group">
                        <label class="slider-label">Surface Radius: {{surfaceRadius}} px</label>
                        <input type="range" v-model.number="surfaceRadius" min="50" max="250" step="10" class="range-slider">
                    </div>
                    <div class="control-group">
                        <h4 style="margin: 0.5rem 0 0.2rem; font-size: 0.8rem; color: #94a3b8;">Charge Position</h4>
                        <label class="slider-label">X: {{chargePos.x}}</label>
                        <input type="range" v-model.number="chargePos.x" min="-250" max="250" step="5" class="range-slider">
                        <label class="slider-label">Y: {{chargePos.y}}</label>
                        <input type="range" v-model.number="chargePos.y" min="-250" max="250" step="5" class="range-slider">
                        <label class="slider-label">Z: {{chargePos.z}}</label>
                        <input type="range" v-model.number="chargePos.z" min="-250" max="250" step="5" class="range-slider">
                    </div>
                </div>
                
                <div v-if="activeTopic === 'solid_angle'" class="topic-controls">
                    <h3>Solid Angle (Ω)</h3>
                    <div class="control-group">
                        <label class="slider-label">Aperture Angle (θ/2): {{chargeValue}}°</label>
                        <input type="range" v-model.number="chargeValue" min="5" max="175" step="1" class="range-slider">
                    </div>
                    <div class="control-group">
                        <label class="slider-label">Radius (r): {{surfaceRadius}} px</label>
                        <input type="range" v-model.number="surfaceRadius" min="50" max="350" step="10" class="range-slider">
                    </div>
                    <div class="control-group">
                        <h4 style="margin: 0.5rem 0 0.2rem; font-size: 0.8rem; color: #94a3b8;">Direction</h4>
                        <label class="slider-label">Azimuth: {{solidAngleDirection.phi}}°</label>
                        <input type="range" v-model.number="solidAngleDirection.phi" min="0" max="360" step="1" class="range-slider">
                        <label class="slider-label">Elevation: {{solidAngleDirection.theta}}°</label>
                        <input type="range" v-model.number="solidAngleDirection.theta" min="-90" max="90" step="1" class="range-slider">
                    </div>
                    <label class="toggle-label">
                        <input type="checkbox" v-model="showSecondary">
                        Show Concentric Layers
                    </label>
                    <label class="toggle-label" style="margin-top: 5px; color: #00ff9d;">
                        <input type="checkbox" v-model="autoScan">
                        Auto-Scan Mode (Demo)
                    </label>
                </div>

                <div v-if="activeTopic === 'wire'" class="topic-controls">
                    <h3>Infinite Wire</h3>
                    <div class="control-group">
                        <label class="slider-label">Linear Charge Density (λ): {{chargeValue}} nC/m</label>
                        <input type="range" v-model.number="chargeValue" min="-50" max="50" step="1" class="range-slider">
                    </div>
                    <div class="control-group">
                        <label class="slider-label">Gaussian Radius (r): {{surfaceRadius}} px</label>
                        <input type="range" v-model.number="surfaceRadius" min="30" max="150" step="5" class="range-slider">
                    </div>
                    <div class="control-group">
                        <label class="slider-label">Wire Length: {{surfaceLength}} px</label>
                        <input type="range" v-model.number="surfaceLength" min="200" max="800" step="50" class="range-slider">
                    </div>
                </div>

                <div v-if="activeTopic === 'sheet'" class="topic-controls">
                    <h3>Infinite Plane Sheet</h3>
                    <div class="control-group">
                        <label class="slider-label">Surface Charge Density (σ): {{chargeValue}} nC/m²</label>
                        <input type="range" v-model.number="chargeValue" min="-50" max="50" step="1" class="range-slider">
                    </div>
                    <div class="control-group">
                        <label class="slider-label">Sheet Size: {{surfaceLength}} px</label>
                        <input type="range" v-model.number="surfaceLength" min="400" max="1500" step="100" class="range-slider">
                    </div>
                </div>

                <div v-if="activeTopic === 'shell'" class="topic-controls">
                    <h3>Thin Spherical Shell</h3>
                    <div class="control-group">
                        <label class="slider-label">Total Charge (Q): {{chargeValue}} nC</label>
                        <input type="range" v-model.number="chargeValue" min="-50" max="50" step="1" class="range-slider">
                    </div>
                    <div class="control-group">
                        <label class="slider-label">Shell Radius (R): {{shellRadius}} px</label>
                        <input type="range" v-model.number="shellRadius" min="40" max="120" step="5" class="range-slider">
                    </div>
                    <div class="control-group">
                        <label class="slider-label">Gaussian Radius (r): {{surfaceRadius}} px</label>
                        <input type="range" v-model.number="surfaceRadius" min="20" max="250" step="5" class="range-slider">
                    </div>
                </div>

                <div class="control-group">
                    <label class="slider-label">Zoom Level: {{ zoom.toFixed(1) }}x</label>
                    <input type="range" v-model.number="zoom" min="0.5" max="2" step="0.1" class="range-slider">
                </div>
            </div>
        </ControlSidebar>

        <div class="lab-viewport" :style="viewportStyle">
            <GaussLawSimulation 
                :active-topic="activeTopic"
                :zoom="zoom"
                :charge="chargeValue"
                :charge-pos="chargePos"
                :solid-angle-dir="solidAngleDirection"
                @update:solid-angle-dir="solidAngleDirection = $event"
                :show-secondary="showSecondary"
                :surface-type="surfaceType"
                :surface-radius="surfaceRadius"
                :surface-length="surfaceLength"
                :shell-radius="shellRadius"
                :show-surface="showSurface"
                :show-lines="showLines"
                :show-source="showSource"
                :drawing-active="drawingActive"
            />

            <!-- Viewport contains only simulation and controls now -->
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
    background: radial-gradient(circle at center, #0a0614 0%, #000 100%);
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
    background: rgba(0, 255, 157, 0.1);
    color: #00ff9d;
    border: 1px solid rgba(0, 255, 157, 0.2);
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
    background: #00ff9d;
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

.topic-controls h3 {
    font-size: 1rem;
    color: #00ff9d;
    margin-bottom: 0.5rem;
    margin-top: 1rem;
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
    background: rgba(0, 255, 157, 0.2);
    border-color: #00ff9d;
    color: #00ff9d;
    transform: scale(1.1) translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 255, 157, 0.2);
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
    color: #00ff9d;
    font-weight: 700;
}

.data-card .value small {
    font-size: 0.8rem;
    font-weight: 400;
    color: #64748b;
}

.formula-card {
    align-items: center;
    border-left: 3px solid #00ff9d;
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
