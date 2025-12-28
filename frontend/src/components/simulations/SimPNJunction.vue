<script setup>
import { ref, computed, inject, watch } from 'vue'

const isRightSidebarCollapsed = inject('isRightSidebarCollapsed')

// --- Physics State ---
const biasMode = ref('forward') // 'forward' or 'reverse'
const voltageSource = ref(0) // 0-5V for Fwd, 0-30V for Rev
const seriesResistor = ref(100) // Ohms

// Diode Parameters
// Is: Saturation current ~ 1e-12 A (Si)
// Vt: Thermal voltage ~ 0.026 V
// n: Ideality factor ~ 1.5
const Is = 1e-12
const Vt = 0.026
const n = 1.5

// Breakdown Voltage (Reverse)
const Vbr = 50 // Not reached in typical lab exp usually limited to 30V

// --- Calculations ---
// Circuit: V_source = V_diode + I * R
// I = Is * (exp(V_diode / (n*Vt)) - 1)
// We have a transcendental equation.
// Simplified approach:
// Forward: Diode ON (approx 0.7V drop).
// I = (V_source - 0.7) / R (if V > 0.7) approx.
// Better: Iterative solution or Lambert W function approximation.
// Let's use Newton-Raphson for robust finding of V_diode.

const solveDiodeVoltage = (Vs, R, isFwd) => {
    let Vd = isFwd ? 0.7 : -Vs // Initial guess
    
    // If Vs small forward, Vd small.
    if (isFwd && Vs < 0.5) Vd = Vs 
    
    // Iteration
    for(let i=0; i<10; i++) {
        // Current I(Vd)
        let I_d = 0
        let dI_dV = 0
        
        if (isFwd) {
             // Forward current
             const expTerm = Math.exp(Vd / (n * Vt))
             I_d = Is * (expTerm - 1)
             dI_dV = (Is / (n * Vt)) * expTerm
        } else {
             // Reverse current
             // I approx -Is + breakdown term
             // Simplified: just leakage -Is (very small)
             // For sim visualization, let's add some "leakage slope"
             // I = -Is - Vd/R_leak
             const R_leak = 1e8 // 100 MOhm
             I_d = -Is + Vd/R_leak
             dI_dV = 1/R_leak
        }

        // F(Vd) = Vd + I_d * R - Vs = 0
        const F = Vd + I_d * R - Vs
        const dF = 1 + dI_dV * R
        
        Vd = Vd - F/dF
    }
    return Vd
}

const diodeVoltage = computed(() => {
    // If forward bias: Source positive connected to Anode
    // If reverse bias: Source positive connected to Cathode (so Vs is effectively negative in standard model)
    const Vs = voltageSource.value
    // Our solver assumes Vs is magnitude applied in the loop
    
    // Actually in lab:
    // Forward: Battery+ -> p-side -> n-side -> R -> Battery-
    // Reverse: Battery+ -> n-side -> p-side -> R -> Battery-
    
    // Solver returns magnitude of drop across diode
    return solveDiodeVoltage(Vs, seriesResistor.value, biasMode.value === 'forward')
})

const diodeCurrent = computed(() => {
    const Vs = voltageSource.value
    const Vd = diodeVoltage.value
    return (Vs - Vd) / seriesResistor.value
})

// --- Data Plotting ---
const readings = ref([])

const recordReading = () => {
    readings.value.push({
        v: diodeVoltage.value,
        i: diodeCurrent.value,
        mode: biasMode.value
    })
}

// Graph Points
// Forward Quadrant (Top Right): V (0-1V), I (mA)
// Reverse Quadrant (Bottom Left): V (0-30V), I (uA)
// We need two graphs or a combined view?
// Lab exams usually ask for separate graphs or combined.
// Let's show separate depending on mode, or toggle.

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
             <!-- Diode -->
             <g transform="translate(400, 200)">
                 <rect x="-30" y="-15" width="60" height="30" fill="#111" stroke="#888" />
                 <line x1="-40" y1="0" x2="-30" y2="0" stroke="#d4af37" stroke-width="3" />
                 <line x1="30" y1="0" x2="40" y2="0" stroke="#d4af37" stroke-width="3" />
                 <!-- Symbol -->
                 <path d="M -10 -10 L -10 10 L 10 0 Z" fill="#ccc" :transform="biasMode === 'reverse' ? 'rotate(180)' : ''" />
                 <line x1="10" y1="-10" x2="10" y2="10" stroke="#ccc" stroke-width="2" :transform="biasMode === 'reverse' ? 'rotate(180)' : ''" />
             </g>
             
             <!-- Battery (Variable DC) -->
             <g transform="translate(150, 350)">
                 <rect x="-40" y="-30" width="80" height="60" fill="#333" stroke="#666" />
                 <text x="0" y="5" fill="#fff" text-anchor="middle">DC Supply</text>
                 <text x="0" y="25" fill="#0f0" text-anchor="middle">{{ voltageSource.toFixed(2) }}V</text>
             </g>
             
             <!-- Resistor -->
             <g transform="translate(400, 350)">
                 <rect x="-30" y="-10" width="60" height="20" fill="#555" />
                 <text x="0" y="25" fill="#aaa" text-anchor="middle" font-size="10">R={{seriesResistor}}Ω</text>
             </g>
             
             <!-- Meters -->
             <!-- Ammeter (Series) -->
             <g transform="translate(600, 200)">
                 <circle cx="0" cy="0" r="30" fill="#222" stroke="#0af" />
                 <text x="0" y="5" fill="#fff" font-weight="bold">A</text>
                 <text x="0" y="45" fill="#0af" font-family="monospace" text-anchor="middle">
                     {{ biasMode === 'forward' ? (diodeCurrent*1000).toFixed(2) + ' mA' : (diodeCurrent*1e6).toFixed(2) + ' µA' }}
                 </text>
             </g>
             
             <!-- Voltmeter (Parallel to Diode) -->
             <g transform="translate(400, 100)">
                 <circle cx="0" cy="0" r="30" fill="#222" stroke="#fa0" />
                 <text x="0" y="5" fill="#fff" font-weight="bold">V</text>
                 <text x="0" y="45" fill="#fa0" font-family="monospace" text-anchor="middle">{{ diodeVoltage.toFixed(3) }}V</text>
                 
                 <!-- Leads -->
                 <path d="M -30 0 C -50 0 -50 100 -50 100" fill="none" stroke="#fa0" />
                 <path d="M 30 0 C 50 0 50 100 50 100" fill="none" stroke="#fa0" />
             </g>
             
             <!-- Wiring -->
             <g fill="none" stroke="#d4af37" stroke-width="3">
                 <polyline points="150,320 150,200 360,200" /> <!-- Batt to Diode -->
                 <polyline points="440,200 570,200" /> <!-- Diode to Ammeter -->
                 <polyline points="630,200 650,200 650,350 430,350" /> <!-- Ammeter to Resistor -->
                 <polyline points="370,350 190,350" /> <!-- Resistor to Batt -->
             </g>
             
             <!-- Graph (Dynamic) -->
             <g transform="translate(100, 480)">
                 <rect x="0" y="0" width="600" height="100" fill="#111" stroke="#333" />
                 <text x="300" y="-10" fill="#fff" text-anchor="middle">I-V Characteristics</text>
                 
                 <g v-if="biasMode === 'forward'">
                     <!-- Fwd Graph: X(0-1V), Y(0-20mA) -->
                     <text x="590" y="90" fill="#aaa" font-size="10">V (1V)</text>
                     <text x="10" y="10" fill="#aaa" font-size="10">I (mA)</text>
                     
                     <circle 
                        v-for="(p, i) in readings.filter(r => r.mode === 'forward')" :key="i"
                        :cx="(p.v / 1.0) * 600"
                        :cy="100 - (p.i * 1000 / 20) * 100"
                        r="3" fill="#0f0"
                     />
                 </g>
                 <g v-else>
                     <!-- Rev Graph: X(0-30V), Y(0-1uA) -->
                     <text x="590" y="90" fill="#aaa" font-size="10">V (30V)</text>
                     <text x="10" y="10" fill="#aaa" font-size="10">I (µA)</text>
                     
                      <circle 
                        v-for="(p, i) in readings.filter(r => r.mode === 'reverse')" :key="i"
                        :cx="(p.v / 30.0) * 600"
                        :cy="(p.i * 1e6 / 1) * 100" 
                        r="3" fill="#fa0"
                     />
                     <!-- Note: Rev current is plotted down usually, here plotting magnitude down from top 0? No, let's keep std +y up for mag -->
                     <!-- Actually Rev curve is usually 3rd quadrant. Here we plot magnitude vs magnitude -->
                 </g>
             </g>

        </svg>
    </div>

    <!-- Controls Panel -->
    <aside class="controls-panel glass-panel" :class="{ 'collapsed': isRightSidebarCollapsed }">
        <div class="header">
            <h3>PN Junction</h3>
            <button class="tool-btn" @click="reset">↻</button>
        </div>
        
        <div class="control-group">
            <label>Bias Mode</label>
            <div class="button-row">
                <button class="btn-toggle" :class="{ active: biasMode === 'forward' }" @click="biasMode = 'forward'; voltageSource = 0;">Forward Bias</button>
                <button class="btn-toggle" :class="{ active: biasMode === 'reverse' }" @click="biasMode = 'reverse'; voltageSource = 0;">Reverse Bias</button>
            </div>
        </div>
        
        <div class="control-group">
            <label>Voltage Source</label>
            <input type="range" v-model.number="voltageSource" min="0" :max="biasMode === 'forward' ? 2 : 30" step="0.01" />
            <div class="val-display">{{ voltageSource.toFixed(2) }} V</div>
        </div>
        
        <div class="control-group highlight">
             <label>Readings</label>
             <div class="data-row">
                 <span>Diode Voltage (V):</span>
                 <span class="val">{{ diodeVoltage.toFixed(3) }} V</span>
             </div>
             <div class="data-row">
                 <span>Diode Current (I):</span>
                 <span class="val">{{ biasMode === 'forward' ? (diodeCurrent*1000).toFixed(2) + ' mA' : (diodeCurrent*1e6).toFixed(2) + ' µA' }}</span>
             </div>
        </div>
        
        <div class="control-group">
             <button class="btn-primary" @click="recordReading">Record Point</button>
             <p class="hint">Plot points to see the curve (Knee voltage ≈ 0.7V)</p>
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

.button-row {
    display: flex;
    gap: 10px;
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
