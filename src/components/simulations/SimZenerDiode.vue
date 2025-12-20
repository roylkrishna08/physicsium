<script setup>
import { ref, computed, inject, watch } from 'vue'

const isRightSidebarCollapsed = inject('isRightSidebarCollapsed')

// --- Physics State ---
const voltageSource = ref(0) // Input Voltage (Vi)
const seriesResistor = ref(500) // Ohms (Rs)
const loadResistor = ref(1000) // Ohms (Rl) - Optional load for regulation demo

const zenerVoltage = ref(5.6) // Vz (Typical Zener)
const zenerWattage = 1 // Watt

// --- Calculations ---
// Circuit: Vi -> Rs -> (Vz || Rl)
// If Vi is low, Zener is OFF (Open), output is divider Rl/(Rs+Rl) * Vi
// If Vi is high enough, Zener clamps voltage to Vz.

const outputVoltage = computed(() => {
    const Vi = voltageSource.value
    const Rs = seriesResistor.value
    const Rl = loadResistor.value
    
    // Voltage if Zener were open:
    const V_open = Vi * (Rl / (Rs + Rl))
    
    // If V_open < Vz, Zener is OFF.
    // If V_open >= Vz, Zener Breakdown -> V_out = Vz
    
    if (V_open >= zenerVoltage.value) {
        return zenerVoltage.value
    } else {
        return V_open
    }
})

const zenerCurrent = computed(() => {
    const Vi = voltageSource.value
    const Rs = seriesResistor.value
    const Rl = loadResistor.value
    const Vout = outputVoltage.value
    
    // Total Current I_s = (Vi - Vout) / Rs
    const I_s = (Vi - Vout) / Rs
    
    // Load Current I_l = Vout / Rl
    const I_l = Vout / Rl
    
    // Zener Current I_z = I_s - I_l
    const I_z = I_s - I_l
    
    if (I_z < 0) return 0 // Should be covered by logic, but safety
    return I_z
})

// --- Data Plotting ---
const readings = ref([])

const recordReading = () => {
    readings.value.push({
        vi: voltageSource.value,
        vo: outputVoltage.value,
        iz: zenerCurrent.value
    })
}

// Graph Points
// Plot V_out vs V_in (Regulation Curve)
// Plot I_z vs V_out (Characteristic Curve)

const reset = () => {
    readings.value = []
    voltageSource.value = 0
}

</script>

<template>
  <div class="sim-container">
    <div class="canvas-area">
        <svg class="main-svg" viewBox="0 0 800 600">
             <!-- Board -->
             <rect x="50" y="50" width="700" height="400" fill="#202530" rx="10" stroke="#444" />
             
             <!-- Components -->
             <!-- Zener Diode (Reverse Biased) -->
             <g transform="translate(450, 250)">
                 <rect x="-30" y="-15" width="60" height="30" fill="#111" stroke="#888" />
                 <line x1="-40" y1="0" x2="-30" y2="0" stroke="#d4af37" stroke-width="3" />
                 <line x1="30" y1="0" x2="40" y2="0" stroke="#d4af37" stroke-width="3" />
                 <!-- Zener Symbol -->
                 <path d="M -10 -10 L -10 10 L 10 0 Z" fill="#eee" transform="rotate(180)" /> <!-- Pointing left (Cathode left) -->
                 <!-- Z shape cathode -->
                 <path d="M 6 -10 L 10 -10 L 10 10 L 14 10" stroke="#eee" stroke-width="2" fill="none" transform="rotate(180)" />
                 
                 <text x="0" y="30" fill="#aaa" font-size="10" text-anchor="middle">Vz = {{ zenerVoltage }}V</text>
             </g>
             
             <!-- DC Supply -->
             <g transform="translate(150, 350)">
                 <rect x="-40" y="-30" width="80" height="60" fill="#333" stroke="#666" />
                 <text x="0" y="5" fill="#fff" text-anchor="middle">Input Vi</text>
                 <text x="0" y="25" fill="#0f0" text-anchor="middle">{{ voltageSource.toFixed(1) }}V</text>
             </g>
             
             <!-- Series Resistor (Rs) -->
             <g transform="translate(250, 250)">
                 <rect x="-25" y="-10" width="50" height="20" fill="#555" />
                 <text x="0" y="-15" fill="#aaa" text-anchor="middle" font-size="10">Rs = {{ seriesResistor }}Ω</text>
             </g>
             
             <!-- Load Resistor (Rl) -->
             <g transform="translate(600, 250)">
                 <rect x="-10" y="-25" width="20" height="50" fill="#555" /> <!-- Vertical -->
                 <text x="30" y="0" fill="#aaa" font-size="10">Rl = {{ loadResistor }}Ω</text>
             </g>
             
             <!-- Meters -->
             <!-- Voltmeter (Output) -->
             <g transform="translate(600, 100)">
                 <circle cx="0" cy="0" r="30" fill="#222" stroke="#fa0" />
                 <text x="0" y="5" fill="#fff" font-weight="bold">V_out</text>
                 <text x="0" y="45" fill="#fa0" font-family="monospace" text-anchor="middle">{{ outputVoltage.toFixed(2) }}V</text>
                 
                 <!-- Leads -->
                 <path d="M -30 0 C -50 0 -50 100 -50 100" fill="none" stroke="#fa0" />
                 <path d="M 30 0 C 50 0 50 100 50 100" fill="none" stroke="#fa0" />
             </g>
             
             <!-- Ammeter (Zener Current) -->
             <g transform="translate(450, 150)">
                 <circle cx="0" cy="0" r="25" fill="#222" stroke="#0af" />
                 <text x="0" y="5" fill="#fff" font-weight="bold" font-size="12">Iz</text>
                 <text x="0" y="40" fill="#0af" font-family="monospace" text-anchor="middle" font-size="10">{{ (zenerCurrent*1000).toFixed(1) }}mA</text>
             </g>
             
             <!-- Wiring -->
             <g fill="none" stroke="#d4af37" stroke-width="3">
                 <!-- Loop -->
                 <polyline points="150,320 150,250 225,250" /> <!-- Vi to Rs -->
                 <polyline points="275,250 410,250" /> <!-- Rs to Node Zener -->
                 <polyline points="450,235 450,175" /> <!-- Zener to Ammeter -->
                 <polyline points="450,125 450,100" /> <!-- Ammeter ... wait, Ammeter is in SERIES with Zener path? Yes -->
                 <!-- Wait, schematic visual: Zener path vertical usually -->
                 
                 <!-- Redraw wiring for cleaner layout -->
                 <!-- Vi+ -> Rs -> Node A -->
                 <!-- Node A -> Zener -> Gnd -->
                 <!-- Node A -> Rl -> Gnd -->
                 
                 
             </g>
             
             <!-- Proper Schematic Wiring -->
             <g fill="none" stroke="#d4af37" stroke-width="3">
                 <line x1="150" y1="320" x2="150" y2="250" />
                 <line x1="150" y1="250" x2="225" y2="250" /> <!-- To Rs -->
                 <line x1="275" y1="250" x2="450" y2="250" /> <!-- Rs to Node A -->
                 
                 <line x1="450" y1="250" x2="600" y2="250" /> <!-- Node A to Rl top -->
                 <line x1="600" y1="250" x2="600" y2="225" />
                 
                 <line x1="450" y1="250" x2="450" y2="235" /> <!-- Node A to Zener Top -->
                 
                 <!-- Ground Return -->
                 <line x1="150" y1="380" x2="150" y2="420" />
                 <line x1="150" y1="420" x2="600" y2="420" />
                 <line x1="450" y1="265" x2="450" y2="420" /> <!-- Zener Bot to Gnd -->
                 <line x1="600" y1="275" x2="600" y2="420" /> <!-- Rl Bot to Gnd -->
             </g>
             
             <!-- Graphs -->
             <g transform="translate(100, 480)">
                 <rect x="0" y="0" width="300" height="100" fill="#111" stroke="#333" />
                 <text x="150" y="-10" fill="#fff" text-anchor="middle">Regulation (Vi vs Vo)</text>
                 
                 <!-- Axes -->
                 <line x1="0" y1="100" x2="300" y2="100" stroke="#555" /> 
                 <line x1="0" y1="0" x2="0" y2="100" stroke="#555" />
                 
                 <text x="290" y="90" fill="#aaa" font-size="10">Vi(20V)</text>
                 <text x="10" y="10" fill="#aaa" font-size="10">Vo(10V)</text>
                 
                 <circle v-for="(p, i) in readings" :key="i"
                    :cx="(p.vi / 20) * 300"
                    :cy="100 - (p.vo / 10) * 100"
                    r="2" fill="#0f0"
                 />
                 
                 <!-- Breakdown Ideal Line -->
                 <line v-if="readings.length > 1" :x1="0" :y1="100 - (zenerVoltage/10)*100" :x2="300" :y2="100 - (zenerVoltage/10)*100" stroke="red" stroke-dasharray="2,2" opacity="0.5" />
             </g>
             
             <g transform="translate(450, 480)">
                 <rect x="0" y="0" width="250" height="100" fill="#111" stroke="#333" />
                 <text x="125" y="-10" fill="#fff" text-anchor="middle">Characteristic (Vo vs Iz)</text>
                 <!-- Plotting Iz vs Vo actually? Or IV curve -->
                 <!-- IV Curve: V (reverse voltage) on X, I (reverse current) on Y -->
                 
                  <text x="240" y="90" fill="#aaa" font-size="10">V(10V)</text>
                  <text x="10" y="10" fill="#aaa" font-size="10">I(50mA)</text>
                 
                  <circle v-for="(p, i) in readings" :key="i"
                    :cx="(p.vo / 10) * 250"
                    :cy="100 - (p.iz * 1000 / 50) * 100"
                    r="2" fill="#fa0"
                 />
             </g>


        </svg>
    </div>

    <!-- Controls Panel -->
    <aside class="controls-panel glass-panel" :class="{ 'collapsed': isRightSidebarCollapsed }">
        <div class="header">
            <h3>Zener Diode</h3>
            <button class="tool-btn" @click="reset">↻</button>
        </div>
        
        <div class="control-group">
            <label>Input Voltage (Vi)</label>
            <input type="range" v-model.number="voltageSource" min="0" max="20" step="0.1" />
            <div class="val-display">{{ voltageSource.toFixed(1) }} V</div>
        </div>
        
        <div class="control-group">
            <label>Zener Voltage (Vz)</label>
            <input type="range" v-model.number="zenerVoltage" min="3" max="12" step="0.1" />
            <div class="val-display">{{ zenerVoltage.toFixed(1) }} V</div>
        </div>
        
        <div class="control-group highlight">
             <label>Output</label>
             <div class="data-row">
                 <span>V_out:</span>
                 <span class="val" :style="{ color: outputVoltage >= zenerVoltage ? '#fa0' : '#fff' }">
                     {{ outputVoltage.toFixed(2) }} V
                 </span>
             </div>
             <p class="hint" v-if="Math.abs(outputVoltage - zenerVoltage) < 0.1">REGULATING</p>
             
             <div class="data-row">
                 <span>Zener Current (Iz):</span>
                 <span class="val">{{ (zenerCurrent*1000).toFixed(1) }} mA</span>
             </div>
        </div>
        
        <div class="control-group">
             <button class="btn-primary" @click="recordReading">Record Point</button>
             <p class="hint">Plot regulation curve</p>
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
    padding: 10px;
    color: white;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
    width: 100%;
}

.hint {
    font-size: 0.8rem;
    color: #aaa;
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
