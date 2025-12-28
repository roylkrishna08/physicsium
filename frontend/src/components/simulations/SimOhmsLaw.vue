<script setup>
import { ref, computed, inject, watch } from 'vue'

const isRightSidebarCollapsed = inject('isRightSidebarCollapsed')

// --- Physics State ---
const batteryVoltage = ref(5) // Volts
const resistance = ref(10) // Ohms (Fixed resistor)
const rheostatValue = ref(0) // Ohms (Variable)
const switchClosed = ref(false)

// Rheostat Range
const rheostatMax = 20

// Calculations
// Total R = R_fixed + R_rheostat
// I = V / R_total
const current = computed(() => {
    if (!switchClosed.value) return 0
    return batteryVoltage.value / (resistance.value + rheostatValue.value)
})

// Voltmeter reads across Fixed Resistor
// V_r = I * R_fixed
const voltmeterReading = computed(() => {
    return current.value * resistance.value
})

// Ammeter reads I
const ammeterReading = computed(() => current.value)


// --- Data Plotting ---
const readings = ref([])

const recordReading = () => {
    if (!switchClosed.value) return
    readings.value.push({
        v: voltmeterReading.value,
        i: ammeterReading.value
    })
}

const clearReadings = () => {
    readings.value = []
}

// Generate SVG Graph Points
const graphPoints = computed(() => {
    if (readings.value.length === 0) return ''
    
    // Scale: V (0-5V) -> X (0-300px), I (0-0.5A) -> Y (0-200px inverted)
    // Max V approx 5V, Max I approx 0.5A (5V / 10R)
    
    return readings.value.map(p => {
        const x = (p.v / 5) * 300
        const y = 200 - (p.i / 0.5) * 200
        return `${x},${y}`
    }).join(' ')
})

const resetSim = () => {
    switchClosed.value = false
    rheostatValue.value = 0
    readings.value = []
}

</script>

<template>
  <div class="sim-container">
    <div class="canvas-area">
        <svg class="main-svg" viewBox="0 0 800 600">
             <!-- Circuit Board -->
             <rect x="50" y="50" width="700" height="500" fill="#151921" rx="10" stroke="#333" />
             
             <!-- Wires -->
             <g stroke="#d4af37" stroke-width="4" fill="none">
                 <!-- Battery to Rheostat -->
                 <line x1="100" y1="300" x2="100" y2="450" />
                 <line x1="100" y1="450" x2="300" y2="450" />
                 
                 <!-- Resistance -->
                 <line x1="100" y1="200" x2="100" y2="100" />
                 <line x1="100" y1="100" x2="300" y2="100" />
                 
                 <!-- Ammeter in series -->
                 <line x1="300" y1="100" x2="500" y2="100" />
                 
                 <!-- Switch in series -->
                 <line x1="300" y1="450" x2="500" y2="450" />
                 
                 <!-- Return -->
                 <line x1="700" y1="100" x2="700" y2="450" />
                 <line x1="500" y1="450" x2="700" y2="450" />
                 <line x1="500" y1="100" x2="700" y2="100" />
             </g>

             <!-- Battery -->
             <g transform="translate(100, 250)">
                 <line x1="0" y1="-30" x2="0" y2="30" stroke="#aaa" stroke-width="4" />
                 <line x1="-15" y1="-15" x2="15" y2="-15" stroke="#fff" stroke-width="2" /> <!-- + -->
                 <line x1="-15" y1="15" x2="15" y2="15" stroke="#fff" stroke-width="2" /> <!-- - (Actually symbol is long/short lines) -->
                 
                 <!-- Proper symbol -->
                 <line x1="-15" y1="-10" x2="15" y2="-10" stroke="#fff" stroke-width="4" />
                 <line x1="-8" y1="10" x2="8" y2="10" stroke="#fff" stroke-width="4" />
                 
                 <text x="-30" y="5" fill="#aaa" font-size="12">{{ batteryVoltage }}V</text>
             </g>
             
             <!-- Resistor (Fixed) -->
             <g transform="translate(200, 100)">
                 <rect x="-30" y="-10" width="60" height="20" fill="#555" stroke="#888" />
                 <!-- Bands -->
                 <rect x="-20" y="-10" width="5" height="20" fill="brown" />
                 <rect x="-10" y="-10" width="5" height="20" fill="black" />
                 <rect x="0" y="-10" width="5" height="20" fill="black" />
                 <text x="-15" y="-20" fill="#fff" font-size="12">R = {{ resistance }}Ω</text>
                 
                 <!-- Voltmeter parallel connection points -->
                 <circle cx="-40" cy="0" r="4" fill="#000" stroke="#d4af37" />
                 <circle cx="40" cy="0" r="4" fill="#000" stroke="#d4af37" />
             </g>
             
             <!-- Voltmeter (Parallel to Resistor) -->
             <g transform="translate(200, 200)">
                 <path d="M -40 -100 L -40 0 L 40 0 L 40 -100" fill="none" stroke="#fa0" stroke-width="2" />
                 <circle cx="0" cy="0" r="30" fill="#222" stroke="#fa0" stroke-width="2" />
                 <text x="0" y="5" fill="#fff" text-anchor="middle" font-weight="bold">V</text>
                 <text x="0" y="20" fill="#0f0" text-anchor="middle" font-size="10" font-family="monospace">{{ voltmeterReading.toFixed(2) }}V</text>
             </g>
             
             <!-- Ammeter -->
             <g transform="translate(500, 100)">
                 <circle cx="0" cy="0" r="30" fill="#222" stroke="#0af" stroke-width="2" />
                 <text x="0" y="5" fill="#fff" text-anchor="middle" font-weight="bold">A</text>
                  <text x="0" y="20" fill="#0f0" text-anchor="middle" font-size="10" font-family="monospace">{{ ammeterReading.toFixed(3) }}A</text>
             </g>
             
             <!-- Rheostat -->
             <g transform="translate(300, 450)">
                 <rect x="0" y="-15" width="100" height="30" fill="#333" stroke="#666" rx="5" />
                 <!-- Coil texture -->
                 <path d="M 5 -15 L 5 15 M 15 -15 L 15 15 M 25 -15 L 25 15 M 35 -15 L 35 15 M 45 -15 L 45 15 M 55 -15 L 55 15 M 65 -15 L 65 15 M 75 -15 L 75 15 M 85 -15 L 85 15 M 95 -15 L 95 15" stroke="#555" stroke-width="2" />
                 
                 <!-- Slider -->
                 <path d="M 0 -25 L 10 -15 L -10 -15 Z" fill="#fff" :transform="`translate(${rheostatValue/rheostatMax * 100}, 0)`" />
                 <text x="50" y="40" fill="#aaa" text-anchor="middle" font-size="10">Rheostat</text>
             </g>
             
             <!-- Switch Key -->
             <g transform="translate(600, 450)" @click="switchClosed = !switchClosed" style="cursor: pointer;">
                 <circle cx="0" cy="0" r="15" fill="#444" stroke="#fff" />
                 <circle v-if="switchClosed" cx="0" cy="0" r="6" fill="#fff" />
                 <text x="0" y="30" fill="#fff" text-anchor="middle" font-size="12">{{ switchClosed ? 'Closed (ON)' : 'Open (OFF)' }}</text>
             </g>
             
             <!-- Graph on Board -->
             <g transform="translate(450, 200)">
                 <rect x="0" y="0" width="300" height="200" fill="#000" stroke="#333" />
                 <text x="150" y="-10" fill="#fff" text-anchor="middle">V vs I Graph</text>
                 
                 <!-- Axes -->
                 <line x1="0" y1="200" x2="300" y2="200" stroke="#555" />
                 <line x1="0" y1="0" x2="0" y2="200" stroke="#555" />
                 
                 <text x="290" y="190" fill="#aaa" font-size="10">V</text>
                 <text x="10" y="10" fill="#aaa" font-size="10">I</text>
                 
                 <!-- Points -->
                 <polyline :points="graphPoints" fill="none" stroke="#00d4ff" stroke-width="2" />
                 <circle v-for="(p, i) in readings" :key="i" :cx="(p.v/5)*300" :cy="200-(p.i/0.5)*200" r="3" fill="#fff" />
             </g>

        </svg>
    </div>

    <!-- Controls Panel -->
    <aside class="controls-panel glass-panel" :class="{ 'collapsed': isRightSidebarCollapsed }">
        <div class="header">
            <h3>Ohm's Law</h3>
            <button class="tool-btn" @click="resetSim">↻</button>
        </div>
        
        <div class="control-group">
            <label>Rheostat Resistance</label>
            <input type="range" v-model.number="rheostatValue" min="0" :max="rheostatMax" step="0.1" :disabled="!switchClosed" />
            <div class="val-display">{{ rheostatValue.toFixed(1) }} Ω</div>
        </div>
        
        <div class="control-group highlight">
             <label>Readings</label>
             <div class="data-row">
                 <span>Voltmeter (V):</span>
                 <span class="val">{{ voltmeterReading.toFixed(2) }} V</span>
             </div>
             <div class="data-row">
                 <span>Ammeter (I):</span>
                 <span class="val">{{ ammeterReading.toFixed(3) }} A</span>
             </div>
        </div>
        
        <div class="control-group">
            <label>Verification</label>
            <div class="button-row">
                <button class="btn-primary" @click="recordReading" :disabled="!switchClosed">Record Point</button>
                <button class="tool-btn" @click="clearReadings">Clear</button>
            </div>
             <div class="data-row" style="margin-top:10px; border-top:1px solid #444; padding-top:5px;">
                 <span>Calc R (V/I):</span>
                 <span class="val">{{ ammeterReading > 0 ? (voltmeterReading/ammeterReading).toFixed(2) : '--' }} Ω</span>
             </div>
             <p class="hint">Actual R = {{ resistance }} Ω</p>
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
    max-width: 900px;
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
    overflow-y: auto;
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

.btn-primary {
    background: linear-gradient(90deg, #00d4ff, #0055ff);
    border: none;
    padding: 8px 16px;
    color: white;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
    flex: 1;
}
.btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: #444;
}

.button-row {
    display: flex;
    gap: 10px;
}

.hint {
    font-size: 0.8rem;
    color: #888;
    text-align: center;
    margin-top: 5px;
}

.tool-btn {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    color: white;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
}
.tool-btn:hover {
    background: var(--primary-glow);
    color: #000;
}
</style>
