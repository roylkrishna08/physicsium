<script setup>
import { ref, computed, onMounted, onUnmounted, watch, inject } from 'vue'

// --- Props & Injections ---
const isRightSidebarCollapsed = inject('isRightSidebarCollapsed')

// --- State ---
const isDragging = ref(false)
const dragMode = ref(null) // 'weight', 'micrometer'
const mousePos = ref({ x: 0, y: 0 })
const showMagnifier = ref(false)
const showReadings = ref(false)

// Physics Parameters
const gravity = 9.8
const wireLength = ref(2.0) // meters
const wireRadius = ref(0.0005) // 0.5 mm
const youngsModulus = 2e11 // Steel approx
const initialMass = 0.5 // Dead weight (kg)
const addedMass = ref(0.0) // Added weights (kg)

// Micrometer State
const micrometerReading = ref(0) // distance moved in mm
const pitch = 1.0 // mm
const divisions = 100
const lc = pitch / divisions

// Visual Scale
const scaleY = ref(100) // Vertical scale factor (pixels per meter is too small, this is arbitrary visual scale)

// --- Physics Calculations ---
const totalMass = computed(() => initialMass + addedMass.value)

// Extension = (M * g * L) / (A * Y)
const extension = computed(() => {
    const area = Math.PI * (wireRadius.value ** 2)
    const force = totalMass.value * gravity
    return (force * wireLength.value) / (area * youngsModulus)
})

// Extension in mm for display
const extensionMM = computed(() => extension.value * 1000)

// Spirit Level Tilt (Visual)
// If reference wire is fixed, and experimental wire extends, the spirit level tilts.
// Tilt angle ~ extension / distance_between_wires
const tiltAngle = computed(() => {
    // Exaggerate for visual effect
    return Math.atan(extension.value * 1000 / 100) // Assuming 10cm gap? visual gap
})

// --- Interaction Handlers ---
const addWeight = (mass) => {
    if (addedMass.value + mass <= 5.0) { // Max 5kg
        addedMass.value += mass
    }
}

const removeWeight = () => {
    if (addedMass.value >= 0.5) {
        addedMass.value -= 0.5
    }
}

const resetSim = () => {
    addedMass.value = 0
    micrometerReading.value = 0
}

// Draggable Logic (Weights)
const handleStart = (e) => {
    // ... similar to previous sims
}

</script>

<template>
  <div class="sim-container">
    <div class="canvas-area">
        <svg class="main-svg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
            <!-- Definitions -->
            <defs>
                <linearGradient id="metal-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#555;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#aaa;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#555;stop-opacity:1" />
                </linearGradient>
                
                <radialGradient id="weight-grad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                    <stop offset="0%" style="stop-color:#eebb55;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#aa7722;stop-opacity:1" />
                </radialGradient>
            </defs>

            <!-- Ceiling Support -->
            <rect x="250" y="20" width="300" height="20" fill="#333" stroke="#555" />

            <!-- Reference Wire (Left) -->
            <line x1="300" y1="40" x2="300" y2="400" stroke="#aaa" stroke-width="2" />
            <!-- Dead Weight Reference -->
            <rect x="280" y="400" width="40" height="60" fill="url(#weight-grad)" rx="5" />
            
            <!-- Experimental Wire (Right) -->
            <!-- Length changes visually slightly or we just move the bottom assembly -->
            <line x1="500" y1="40" x2="500" :y2="400 + (extensionMM * 50)" stroke="#fff" stroke-width="2" />
            
            <!-- Searle's Apparatus Assembly (Crossbars) -->
            <!-- Top Bar (Fixed on Reference, moves on Exp?) Actually both define the frame -->
            
            <!-- Spirit Level (Visual) -->
            <g :transform="`translate(400, ${300 + extensionMM * 25}) rotate(${tiltAngle * 57.29})`"> 
                <rect x="-110" y="-10" width="220" height="20" fill="rgba(100, 255, 100, 0.3)" stroke="#0f0" rx="10" />
                <!-- Bubble -->
                <circle :cx="tiltAngle * 500" cy="0" r="6" fill="#0f0" stroke="#fff" />
            </g>

            <!-- Micrometer Screw (Visual) -->
            <g transform="translate(400, 350)">
                 <!-- Simplified Micrometer -->
                 <rect x="-20" y="-10" width="40" height="80" fill="url(#metal-grad)" />
                 <text x="30" y="30" fill="white" font-size="12">Reading: {{ micrometerReading.toFixed(2) }} mm</text>
            </g>

            <!-- Hanger & Weights (Experimental) -->
            <g :transform="`translate(500, ${400 + (extensionMM * 50)})`">
                <!-- Hanger -->
                <line x1="0" y1="0" x2="0" y2="60" stroke="#888" stroke-width="4" />
                <rect x="-20" y="60" width="40" height="10" fill="#555" />
                
                <!-- Added Weights -->
                <g v-for="n in (addedMass / 0.5)" :key="n">
                    <rect x="-25" :y="60 + (n * 15)" width="50" height="12" fill="url(#weight-grad)" rx="2" stroke="#000" />
                </g>
            </g>
            
        </svg>

        <!-- Magnifier Overlay -->
        <div v-if="showMagnifier" class="magnifier-glass" :style="{ left: mousePos.x + 'px', top: mousePos.y + 'px' }">
             <!-- Mag View -->
        </div>
    </div>

    <!-- Controls Panel -->
    <aside class="controls-panel glass-panel" :class="{ 'collapsed': isRightSidebarCollapsed }">
        <div class="header">
            <h3>Young's Modulus</h3>
            <div class="main-actions" style="gap: 10px;">
                <button class="tool-btn" @click="resetSim">↻</button>
            </div>
        </div>

        <div class="control-group">
            <label>Load (kg): {{ totalMass.toFixed(1) }}</label>
            <div class="button-row">
                <button class="btn-primary small" @click="removeWeight">- 0.5kg</button>
                <button class="btn-primary small" @click="addWeight(0.5)">+ 0.5kg</button>
            </div>
        </div>
        
        <div class="control-group">
             <label>Data</label>
             <div class="data-row">
                 <span>Extension:</span>
                 <span v-if="showReadings">{{ extensionMM.toFixed(4) }} mm</span>
                 <span v-else style="filter: blur(4px);">?.???? mm</span>
             </div>
             <p class="hint" v-if="!showReadings">Hide reading to test yourself!</p>
        </div>
        
        <div class="control-group">
            <button class="btn-toggle" @click="showReadings = !showReadings">
                {{ showReadings ? 'Hide Readings' : 'Show Readings' }}
            </button>
        </div>
    </aside>
  </div>
</template>

<style scoped>
.sim-container {
    width: 100%;
    height: 100%;
    display: flex;
    overflow: hidden;
    position: relative;
    background: radial-gradient(circle at center, #1a2030 0%, #000 100%);
    user-select: none;
}

.canvas-area {
    flex: 1;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    cursor: default;
}

.main-svg {
    width: 100%;
    height: 100%;
    max-width: 1000px; /* Constrain for realism */
    max-height: 800px;
}

/* Controls Panel (Right Sidebar) */
.controls-panel {
    width: 300px;
    height: 100%;
    background: rgba(10, 14, 25, 0.85);
    backdrop-filter: blur(20px);
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
    gap: 1.5rem;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: absolute;
    right: 0;
    top: 0;
    z-index: 100;
}

.controls-panel.collapsed {
    transform: translateX(100%);
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    color: #fff;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    padding-bottom: 1rem;
}

.control-group {
    background: rgba(255, 255, 255, 0.05);
    padding: 1rem;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.05);
}

.control-group label {
    display: block;
    color: var(--primary-glow, #00d4ff);
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.btn-primary.small {
    padding: 6px 12px;
    font-size: 0.85rem;
    flex: 1;
}

.button-row {
    display: flex;
    gap: 10px;
}

.data-row {
    display: flex;
    justify-content: space-between;
    color: #fff;
    font-family: monospace;
    font-size: 1.1rem;
}

.hint {
    font-size: 0.8rem;
    color: #888;
    margin-top: 0.5rem;
    font-style: italic;
}

.btn-toggle {
    width: 100%;
    padding: 10px;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    color: white;
    border-radius: 8px;
    cursor: pointer;
    transition: 0.2s;
}

.btn-toggle:hover {
    background: rgba(255,255,255,0.2);
}

.tool-btn {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.2);
    color: white;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    transition: 0.2s;
}

.tool-btn:hover {
    background: rgba(255,255,255,0.1);
    border-color: var(--primary-glow);
    color: var(--primary-glow);
}
</style>
