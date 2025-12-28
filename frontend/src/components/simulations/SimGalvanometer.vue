<script setup>
import { ref, computed, inject } from 'vue'

const isRightSidebarCollapsed = inject('isRightSidebarCollapsed')

// --- Physics State ---
const batteryVoltage = 2 // Volts (E)
const resistanceBoxR = ref(2000) // Ohms (High resistance)
const shuntResistanceS = ref(0) // Ohms (Shunt)
const galvResistanceG = 100 // Ohms (Internal G)
const fullScaleDivisions = 30 // Divisions on scale
const currentSensitivity = 20e-6 // Amps per division (k * division) roughly

const switchK1 = ref(false) // Battery switch
const switchK2 = ref(false) // Shunt switch

// --- Calculations ---
// Case 1: K1 Closed, K2 Open (Circuit: E, R, G in series)
// I = E / (R + G)
// Deflection theta = I / k (assume linear)

// Case 2: K1 Closed, K2 Closed (Circuit: E, R, (G || S))
// Total Resistance = R + (GS / (G+S))
// Total Current I_tot = E / R_tot
// Current through G (I_g) = I_tot * (S / (G+S))

const currentThroughG = computed(() => {
    if (!switchK1.value) return 0
    
    if (!switchK2.value) {
        // Only R and G
        return batteryVoltage / (resistanceBoxR.value + galvResistanceG)
    } else {
        // With Shunt
        // Parallel combo Rp = (G*S)/(G+S)
        // Avoid division by zero if S=0 (short circuit across G)
        if (shuntResistanceS.value <= 1e-6) return 0 // Current bypasses G entirely
        
        const Rp = (galvResistanceG * shuntResistanceS.value) / (galvResistanceG + shuntResistanceS.value)
        const Itot = batteryVoltage / (resistanceBoxR.value + Rp)
        
        // Current divider rule: Ig = Itot * (S / (G+S))
        return Itot * (shuntResistanceS.value / (galvResistanceG + shuntResistanceS.value))
    }
})

// Deflection = I_g / k (where k is current per unit deflection)
// Let's calibrate k such that max current gives 30 divisions
// Max current approx E/R_min = 2/2000 = 1mA = 1000uA
// If sensitivity is 20uA/div, then 1000uA = 50 div (Too much)
// Adjust k dynamically or fix for simulation
const k_sim = 2e-6 // 2 uA per division seems reasonable for sensitive G
const deflection = computed(() => {
    const theta = currentThroughG.value / k_sim
    if (theta > 35) return 35 // Pegged
    if (theta < -35) return -35
    return theta
})

// Experimental Values to calculate
// Half Deflection Method:
// 1. Adjust R to get theta (say 30)
// 2. Close K2, Adjust S to get theta/2 (15)
// Then G ~= S (if R >> G, which it is 2000 vs 100)
// Figure of Merit k = E / ((R+G) * theta)

const calculatedFigureOfMerit = computed(() => {
    if (deflection.value === 0) return 0
    // k = I / theta = (E/(R+G)) / theta
    return batteryVoltage / ((resistanceBoxR.value + galvResistanceG) * deflection.value)
})

</script>

<template>
  <div class="sim-container">
    <div class="canvas-area">
        <svg class="main-svg" viewBox="0 0 800 600">
             <!-- Circuit Board -->
             <rect x="50" y="50" width="700" height="400" fill="#202530" rx="10" stroke="#444" />
             
             <!-- Components -->
             
             <!-- Galvanometer (G) -->
             <g transform="translate(400, 150)">
                 <circle cx="0" cy="0" r="60" fill="#eee" stroke="#333" stroke-width="4" />
                 <!-- Scale -->
                 <path d="M -50 0 A 50 50 0 0 1 50 0" fill="none" stroke="#888" stroke-width="2" />
                 <!-- Ticks -->
                 <g v-for="i in 7" :key="i">
                     <!-- -30 to 30 in steps of 10 -->
                     <line x1="0" y1="-50" x2="0" y2="-45" stroke="#000" :transform="`rotate(${(i-4)*20})`" />
                     <text x="0" y="-35" font-size="10" text-anchor="middle" :transform="`rotate(${(i-4)*20})`">{{ Math.abs((i-4)*10) }}</text>
                 </g>
                 
                 <text x="0" y="20" font-weight="bold" font-size="20" text-anchor="middle">G</text>
                 
                 <!-- Needle -->
                 <polygon points="-2,-10 2,-10 0,-55" fill="red" :transform="`rotate(${deflection * 2})`" />
                 
                 <circle cx="0" cy="0" r="5" fill="#333" />
             </g>
             
             <!-- High Resistance Box (R) -->
             <g transform="translate(150, 200)">
                 <rect x="-40" y="-30" width="80" height="60" fill="#111" stroke="#888" />
                 <text x="0" y="5" fill="#fff" text-anchor="middle">Box R</text>
                 <text x="0" y="25" fill="#0f0" text-anchor="middle" font-family="monospace">{{ resistanceBoxR }}Ω</text>
             </g>
             
             <!-- Shunt Resistance (S) -->
             <g transform="translate(650, 200)">
                 <rect x="-40" y="-30" width="80" height="60" fill="#111" stroke="#888" />
                 <text x="0" y="5" fill="#fff" text-anchor="middle">Shunt S</text>
                 <text x="0" y="25" fill="#0f0" text-anchor="middle" font-family="monospace">{{ shuntResistanceS }}Ω</text>
             </g>
             
             <!-- Battery (E) -->
             <g transform="translate(400, 400)">
                 <line x1="-20" y1="-10" x2="20" y2="-10" stroke="#fff" stroke-width="4" />
                 <line x1="-10" y1="10" x2="10" y2="10" stroke="#fff" stroke-width="4" />
                 <text x="0" y="30" fill="#aaa" text-anchor="middle">E = {{ batteryVoltage }}V</text>
             </g>
             
             <!-- Switches -->
             <!-- K1 (Main) -->
             <g transform="translate(250, 350)" @click="switchK1 = !switchK1" style="cursor: pointer;">
                 <text x="0" y="-15" fill="#aaa" text-anchor="middle">K1</text>
                 <circle cx="0" cy="0" r="10" fill="#444" stroke="#fff" />
                 <circle v-if="switchK1" cx="0" cy="0" r="4" fill="#0f0" />
             </g>
             
             <!-- K2 (Shunt) -->
             <g transform="translate(550, 350)" @click="switchK2 = !switchK2" style="cursor: pointer;">
                 <text x="0" y="-15" fill="#aaa" text-anchor="middle">K2</text>
                 <circle cx="0" cy="0" r="10" fill="#444" stroke="#fff" />
                 <circle v-if="switchK2" cx="0" cy="0" r="4" fill="#0f0" />
             </g>
             
             <!-- Wires -->
             <g fill="none" stroke="#d4af37" stroke-width="3" opacity="0.8">
                 <!-- Main Loop: E -> K1 -> R -> G -> E -->
                 <polyline points="380,400 250,400 250,360" /> <!-- E left to K1 -->
                 <polyline points="250,340 150,340 150,230" /> <!-- K1 to R -->
                 <polyline points="150,170 150,150 340,150" /> <!-- R to G -->
                 <polyline points="460,150 650,150 650,400 420,400" /> <!-- G to E right -->
                 
                 <!-- Shunt Loop: Parallel to G through K2 -->
                 <polyline points="340,150 340,280 550,280 550,340" /> <!-- G left to K2 -->
                 <polyline points="550,360 650,360 650,230" /> <!-- K2 to S -->
                 <polyline points="650,170 650,150" /> <!-- S to G right node -->
             </g>

        </svg>
    </div>

    <!-- Controls Panel -->
    <aside class="controls-panel glass-panel" :class="{ 'collapsed': isRightSidebarCollapsed }">
        <div class="header">
            <h3>Galvanometer</h3>
            <button class="tool-btn" @click="resistanceBoxR = 2000; shuntResistanceS = 0; switchK1 = false; switchK2 = false;">↻</button>
        </div>
        
        <div class="control-group">
            <label>High Resistance Box (R)</label>
            <!-- Logarithmic or large steps for R -->
            <input type="range" v-model.number="resistanceBoxR" min="1000" max="10000" step="100" />
            <div class="val-display">{{ resistanceBoxR }} Ω</div>
        </div>
        
        <div class="control-group">
            <label>Shunt Resistance (S)</label>
            <!-- S needs to be close to G (100) for half deflection -->
            <input type="range" v-model.number="shuntResistanceS" min="0" max="200" step="1" />
            <div class="val-display">{{ shuntResistanceS }} Ω</div>
        </div>
        
        <div class="control-group highlight">
             <label>Readings</label>
             <div class="data-row">
                 <span>Deflection (θ):</span>
                 <span class="val">{{ deflection.toFixed(1) }} div</span>
             </div>
             <p class="hint" v-if="Math.abs(deflection) >= 35">OUT OF SCALE</p>
        </div>
        
        <div class="control-group">
             <label>Calculated Figure of Merit (k)</label>
             <div class="data-row">
                 <span>E / ((R+G)θ):</span>
                 <span class="val">{{ (calculatedFigureOfMerit * 1e6).toFixed(2) }} µA/div</span>
             </div>
             <p class="hint">True k ≈ {{ (k_sim * 1e6).toFixed(2) }} µA/div</p>
        </div>
        
        <div class="control-group">
            <label>Switches</label>
            <div class="button-row">
                <button class="btn-toggle" :class="{ active: switchK1 }" @click="switchK1 = !switchK1">K1 (Main)</button>
                <button class="btn-toggle" :class="{ active: switchK2 }" @click="switchK2 = !switchK2">K2 (Shunt)</button>
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

.hint {
    font-size: 0.8rem;
    color: #aaa;
    text-align: center;
    margin-top: 5px;
}

.button-row {
    display: flex;
    gap: 10px;
}

.btn-toggle {
    flex: 1;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    color: white;
    padding: 8px;
    border-radius: 6px;
    cursor: pointer;
}
.btn-toggle.active {
    background: var(--primary-glow);
    color: black;
    border-color: var(--primary-glow);
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
