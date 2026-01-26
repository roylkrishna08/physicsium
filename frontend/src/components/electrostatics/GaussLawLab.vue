<script setup>
import { ref, computed } from 'vue'
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
const showGrid = ref(false)
const zoom = ref(1.0)
const chargeValue = ref(10) // General charge or linear/surface density
const surfaceType = ref('spherical') // spherical, cylindrical, box
const surfaceRadius = ref(100)
const surfaceLength = ref(200)

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

</script>

<template>
    <div class="gauss-lab">
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
                        <input type="checkbox" v-model="showGrid">
                        Show Gridlines
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
                        <input type="range" v-model.number="surfaceRadius" min="50" max="200" step="10" class="range-slider">
                    </div>
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
                </div>

                <div v-if="activeTopic === 'sheet'" class="topic-controls">
                    <h3>Infinite Plane Sheet</h3>
                    <div class="control-group">
                        <label class="slider-label">Surface Charge Density (σ): {{chargeValue}} nC/m²</label>
                        <input type="range" v-model.number="chargeValue" min="-50" max="50" step="1" class="range-slider">
                    </div>
                </div>

                <div v-if="activeTopic === 'shell'" class="topic-controls">
                    <h3>Thin Spherical Shell</h3>
                    <div class="control-group">
                        <label class="slider-label">Total Charge (Q): {{chargeValue}} nC</label>
                        <input type="range" v-model.number="chargeValue" min="-50" max="50" step="1" class="range-slider">
                    </div>
                    <div class="control-group">
                        <label class="slider-label">Shell Radius (R): {{80}} px</label>
                        <!-- Shell radius fixed for simplicity in this interactive -->
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
                :show-grid="showGrid"
                :zoom="zoom"
                :charge="chargeValue"
                :surface-type="surfaceType"
                :surface-radius="surfaceRadius"
                :surface-length="surfaceLength"
                :show-surface="showSurface"
                :show-lines="showLines"
                :show-source="showSource"
            />

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
    background: #0f172a;
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

@media (max-width: 768px) {
    .zoom-controls {
        bottom: 100px;
        gap: 12px;
    }
}
</style>
