<script setup>
import { ref, computed, inject } from 'vue'

const isRightSidebarCollapsed = inject('isRightSidebarCollapsed')

// --- Physics State ---
const knownResistance = ref(2) // Ohms (R)
const unknownResistance = ref(3.5) // Ohms (S) - Hidden target
const jockeyPosition = ref(50) // cm (l)

const batteryVoltage = 5 // V

// --- Calculations ---
// Wheatstone bridge principle
// Bridge legs:
// 1. R and length l (Resistance P = rho * l / A)
// 2. S and length 100-l (Resistance Q = rho * (100-l) / A)
// Ratio P/Q = l / (100-l)
// Condition for Null: R/S = l / (100-l)
// Deflection is proportional to potential difference Vg.
// Vg approx proportional to (R/(R+S) - l/100) * V_battery
// This is a simplified model for galvanometer deflection.

const deflection = computed(() => {
    const l_ratio = jockeyPosition.value / 100
    const r_ratio = knownResistance.value / (knownResistance.value + unknownResistance.value)
    
    // Difference implies potential difference
    const diff = (l_ratio - r_ratio)
    
    // Scale for visual needle (clamp between -90 and 90)
    let angle = diff * 300 // Gain
    if (angle > 45) angle = 45 
    if (angle < -45) angle = -45
    return angle
})

// --- Interaction ---
const isDragging = ref(false)

const startDrag = (e) => {
    isDragging.value = true
    updateJockey(e)
}

const onDrag = (e) => {
    if (!isDragging.value) return
    updateJockey(e)
}

const stopDrag = () => {
    isDragging.value = false
}

const updateJockey = (e) => {
    // Need to map mouse X to cm 0-100
    // Wire visual starts at x=100, ends at x=700 (width 600px)
    // 600px = 100cm => 6px/cm
    const rect = e.target.closest('.canvas-area').getBoundingClientRect()
    const x = e.clientX - rect.left
    
    // Map x from range [100, 700] to [0, 100]
    let l = (x - 100) / 6
    if (l < 0) l = 0
    if (l > 100) l = 100
    
    jockeyPosition.value = l
}

</script>

<template>
  <div class="sim-container" @mousemove="onDrag" @mouseup="stopDrag" @mouseleave="stopDrag">
    <div class="canvas-area">
        <svg class="main-svg" viewBox="0 0 800 600">
             <!-- Board -->
             <rect x="50" y="50" width="700" height="400" fill="#222" rx="10" stroke="#444" stroke-width="2" />
             
             <!-- Resistance Box (R) -->
             <g transform="translate(150, 100)">
                 <rect x="0" y="0" width="80" height="60" fill="#333" stroke="#888" />
                 <text x="40" y="35" fill="#fff" text-anchor="middle" font-family="monospace">R={{ knownResistance }}Ω</text>
                 <line x1="40" y1="60" x2="40" y2="150" stroke="#d4af37" stroke-width="3" />
             </g>
             
             <!-- Unknown Resistance (S) -->
             <g transform="translate(550, 100)">
                 <rect x="0" y="0" width="80" height="60" fill="#111" stroke="#888" stroke-dasharray="4,2" />
                 <text x="40" y="35" fill="#aaa" text-anchor="middle" font-family="monospace">Unknown S</text>
                 <line x1="40" y1="60" x2="40" y2="150" stroke="#d4af37" stroke-width="3" />
             </g>
             
             <!-- Metre Scale -->
             <g transform="translate(100, 260)">
                <rect x="0" y="0" width="600" height="30" fill="#ddd" />
                <g v-for="i in 11" :key="i">
                    <!-- 0 to 100 cm marks -->
                    <line :x1="(i-1)*60" y1="0" :x2="(i-1)*60" y2="15" stroke="#000" />
                    <text :x="(i-1)*60" y="25" font-size="10" text-anchor="middle" fill="#000">{{ (i-1)*10 }}</text>
                </g>
             </g>
             
             <!-- Wire 0-100cm -->
             <line x1="100" y1="250" x2="700" y2="250" stroke="#e0e0e0" stroke-width="2" />
             
             <!-- Connections -->
             <!-- Left Gap -->
             <polyline points="100,250 100,150 150,150" fill="none" stroke="#d4af37" stroke-width="4" />
             <!-- Middle Gap -->
             <polyline points="230,150 300,150 500,150 550,150" fill="none" stroke="#d4af37" stroke-width="4" />
             <!-- Right Gap -->
             <polyline points="630,150 700,150 700,250" fill="none" stroke="#d4af37" stroke-width="4" />
             
             <!-- Galvanometer connected to middle -->
             <g transform="translate(400, 150)">
                 <line x1="0" y1="0" x2="0" y2="100" stroke="#000" stroke-width="2" />
                 <!-- G Device -->
                 <circle cx="0" cy="50" r="30" fill="#eee" stroke="#333" stroke-width="3" />
                 <text x="0" y="85" font-size="10" text-anchor="middle" font-weight="bold">G</text>
                 <!-- Needle -->
                 <line x1="0" y1="50" x2="0" y2="30" stroke="red" stroke-width="2" :transform="`rotate(${deflection}, 0, 50)`" />
                 <path d="M -20 40 Q 0 30 20 40" fill="none" stroke="#aaa" stroke-width="1" />
             </g>
             
             <!-- Jockey connection -->
             <!-- Wire from G to Jockey -->
             <line x1="400" y1="210" :x2="100 + jockeyPosition * 6" y2="250" stroke="#fa0" stroke-width="2" />
             
             <!-- Jockey (Draggable) -->
             <g :transform="`translate(${100 + jockeyPosition * 6}, 250)`" 
                @mousedown="startDrag"
                style="cursor: grab;"
             >
                 <circle cx="0" cy="0" r="10" fill="#fff" stroke="#000" />
                 <line x1="0" y1="-10" x2="0" y2="-20" stroke="#000" stroke-width="2" />
                 <rect x="-5" y="-30" width="10" height="10" fill="#333" />
             </g>

        </svg>
    </div>

    <!-- Controls Panel -->
    <aside class="controls-panel glass-panel" :class="{ 'collapsed': isRightSidebarCollapsed }">
        <div class="header">
            <h3>Metre Bridge</h3>
            <button class="tool-btn" @click="jockeyPosition = 50">Reset Jockey</button>
        </div>
        
        <div class="control-group">
            <label>Known Resistance (R)</label>
            <input type="range" v-model.number="knownResistance" min="1" max="10" step="0.5" />
            <div class="val-display">{{ knownResistance }} Ω</div>
        </div>
        
        <div class="control-group">
            <label>Readings</label>
            <div class="data-row">
                <span>Length (l):</span>
                <span class="val">{{ jockeyPosition.toFixed(1) }} cm</span>
            </div>
            <div class="data-row">
                <span>100 - l:</span>
                <span class="val">{{ (100 - jockeyPosition).toFixed(1) }} cm</span>
            </div>
            <div class="data-row">
                <span>Galvanometer:</span>
                <span class="val" :style="{ color: Math.abs(deflection) < 2 ? '#0f0' : '#fff' }">
                    {{ Math.abs(deflection) < 2 ? 'NULL POINT' : (deflection > 0 ? 'Right' : 'Left') }}
                </span>
            </div>
        </div>
        
        <div class="control-group highlight" v-if="Math.abs(deflection) < 1">
             <label>Calculated S</label>
             <p style="font-size:0.9rem; color:#ccc;">At Null Point: S = R(100-l)/l</p>
             <div class="data-row">
                 <span>Unknown S:</span>
                 <span class="val" style="color: #0d0;">{{ (knownResistance * (100-jockeyPosition)/jockeyPosition).toFixed(2) }} Ω</span>
             </div>
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
    display: flex;
    justify-content: center;
    align-items: center;
}

.main-svg {
    width: 100%;
    height: 100%;
    background: linear-gradient(to bottom, #111521 0%, #05070a 100%);
}

/* Controls Panel Styling (Reused) */
.controls-panel {
    width: 300px;
    height: 100%;
    background: rgba(10, 14, 25, 0.85);
    backdrop-filter: blur(20px);
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
    gap: 1.2rem;
    position: absolute;
    right: 0;
    top: 0;
    z-index: 100;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.controls-panel.collapsed {
    transform: translateX(100%);
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
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

.control-group.highlight {
    background: rgba(0, 212, 255, 0.05);
    border-color: rgba(0, 212, 255, 0.2);
}

.control-group label {
    display: block;
    color: var(--primary-glow, #00d4ff);
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
}

input[type="range"] {
    width: 100%;
    margin-bottom: 0.5rem;
}

.val-display {
    text-align: right;
    color: #fff;
    font-family: monospace;
    font-size: 0.9rem;
}

.data-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.4rem;
    color: #ccc;
    font-size: 0.9rem;
}

.data-row .val {
    color: #fff;
    font-weight: bold;
    font-family: monospace;
}

.tool-btn {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    color: white;
    height: 36px;
    padding: 0 1rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    justify-content: center;
}
.tool-btn:hover {
    background: var(--primary-glow);
    color: #000;
}
</style>
