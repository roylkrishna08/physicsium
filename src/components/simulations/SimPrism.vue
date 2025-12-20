<script setup>
import { ref, computed, inject, onMounted } from 'vue'

const isRightSidebarCollapsed = inject('isRightSidebarCollapsed')

// --- Physics State ---
const angleOfPrism = ref(60) // A (degrees)
const angleOfIncidence = ref(45) // i (degrees)
const refractiveIndex = ref(1.5) // mu (Glass)

// --- Optics Calculations ---
// Snell's Law: n1 sin(i) = n2 sin(r)
// 1. First Surface (Air -> Glass)
// sin(i) = mu * sin(r1)  => r1 = asin(sin(i)/mu)
const r1 = computed(() => {
    const iRad = angleOfIncidence.value * Math.PI / 180
    return Math.asin(Math.sin(iRad) / refractiveIndex.value)
})

// 2. Geometry: r1 + r2 = A
const r2 = computed(() => {
    const A_rad = angleOfPrism.value * Math.PI / 180
    return A_rad - r1.value
})

// 3. Second Surface (Glass -> Air)
// mu * sin(r2) = sin(e) => e = asin(mu * sin(r2))
// Check for TIR (Total Internal Reflection)
const angleOfEmergence = computed(() => {
    const sinE = refractiveIndex.value * Math.sin(r2.value)
    if (Math.abs(sinE) > 1) return null // TIR
    return Math.asin(sinE)
})

// 4. Deviation delta = i + e - A
const angleOfDeviation = computed(() => {
    if (angleOfEmergence.value === null) return null
    const i = angleOfIncidence.value
    const e = angleOfEmergence.value * 180 / Math.PI
    const A = angleOfPrism.value
    return i + e - A
})

// --- Data Plotting ---
const readings = ref([])

const recordReading = () => {
    if (angleOfDeviation.value === null) return
    readings.value.push({
        i: angleOfIncidence.value,
        d: angleOfDeviation.value
    })
}

// Generate Ray Path for SVG
const rayPath = computed(() => {
    // Prism Apex at (400, 100), Base width 200 => (300, 300) to (500, 300) for Equilateral approx
    // Center of base (400, 300). Height = 200*sin(60) ~ 173.
    // Apex (400, 400-173) = (400, 127)
    
    const cx = 400, cy = 300
    // Simplified visuals: Equilateral prism shape fixed for rendering, logic follows numbers
    const p1 = { x: 400, y: 150 }
    const p2 = { x: 300, y: 350 }
    const p3 = { x: 500, y: 350 }
    
    // Incident Ray
    // Hit left face. Left face equation.
    // Incident angle i is with Normal.
    
    // For visualization simplicity, let's fix the incidence point on the left face
    const hitX = 350, hitY = 250 // Arbitrary point on left face
    
    // Normal angle on left face?
    // Face angle is 60 deg with horizontal? No, base is horiz.
    // Left face slope: (350-150)/(300-400) = 200/-100 = -2. 120 deg (ish) 
    // Normal is perpendicular to face.
    // Let's assume standard orientation.
    
    // Visualization Approach:
    // Just draw the schematic lines based on angles relative to normals, centered in view.
    
    // Origin (Hit point 1)
    const O = { x: 350, y: 300 } 
    
    // Normal 1 (Left face vertical-ish?)
    // Let's rotate the prism so base is down.
    // Left face angle = 60 deg to base. Normal angle = 150 deg (standard) or -30.
    
    // OK, let's just abstract the drawing.
    
    return '' // TODO: Complex logic for exact ray tracing visual, using simplified schematic below
})

const reset = () => {
    readings.value = []
    angleOfIncidence.value = 45
}

</script>

<template>
  <div class="sim-container">
    <div class="canvas-area">
        <svg class="main-svg" viewBox="0 0 800 600">
             <!-- Paper Sheet -->
             <rect x="100" y="50" width="600" height="500" fill="#fff" opacity="0.1" />
             
             <!-- Prism (Equilateral Visual) -->
             <path d="M 400 150 L 300 350 L 500 350 Z" fill="rgba(200, 230, 255, 0.2)" stroke="#fff" stroke-width="2" />
             
             <!-- Normal 1 (Left Face) -->
             <!-- Face slope is -2. Normal slope is 0.5. Angle atan(0.5) ~ 26.5 deg -->
             <!-- Line passing through (350, 250) -->
             <line x1="310" y1="230" x2="390" y2="270" stroke="#aaa" stroke-dasharray="4,4" />
             
             <!-- Incident Ray -->
             <!-- Angle i with Normal -->
             <!-- vector approx -->
             <g transform="translate(350, 250)">
                  <line x1="-100" y1="0" x2="0" y2="0" stroke="red" stroke-width="2" :transform="`rotate(${26.5 + angleOfIncidence})`" />
                  <text x="-120" y="0" fill="red" font-size="12">Incident</text>
             </g>
             
             <!-- Refracted Ray (Inside) -->
             <!-- Angle r1 with Normal -->
             <g transform="translate(350, 250)">
                 <line x1="0" y1="0" x2="100" y2="0" stroke="yellow" stroke-width="2" :transform="`rotate(${26.5 + (r1 * 180/Math.PI)})`" />
             </g>
             
             <!-- We need exact intersection with right face to draw properly -->
             <!-- For sim purposes, we show schematic angles -->
             
             <!-- Schematic View -->
             <g transform="translate(650, 150)">
                 <rect x="-80" y="-20" width="160" height="180" fill="#222" stroke="#555" />
                 <text x="0" y="0" fill="#fff" text-anchor="middle" font-weight="bold">Angles</text>
                 <text x="-60" y="30" fill="#fa0" font-family="monospace">i  = {{ angleOfIncidence.toFixed(1) }}°</text>
                 <text x="-60" y="50" fill="#ff0" font-family="monospace">r1 = {{ (r1 * 180/Math.PI).toFixed(1) }}°</text>
                 <text x="-60" y="70" fill="#ff0" font-family="monospace">r2 = {{ (r2 * 180/Math.PI).toFixed(1) }}°</text>
                 <text x="-60" y="90" fill="#0af" font-family="monospace">e  = {{ angleOfEmergence ? (angleOfEmergence * 180/Math.PI).toFixed(1) : 'TIR' }}°</text>
                 
                 <line x1="-70" y1="110" x2="70" y2="110" stroke="#444" />
                 
                 <text x="0" y="130" fill="#0f0" text-anchor="middle" font-weight="bold" font-size="18">δ = {{ angleOfDeviation ? angleOfDeviation.toFixed(1) : '--' }}°</text>
             </g>
             
             <!-- i-delta Graph -->
             <g transform="translate(200, 450)">
                 <rect x="0" y="0" width="400" height="120" fill="#111" stroke="#333" />
                 <text x="200" y="-10" fill="#fff" text-anchor="middle">Angle of Deviation vs Incidence</text>
                 
                 <!-- Axes -->
                 <line x1="0" y1="120" x2="400" y2="120" stroke="#555" />
                 <line x1="0" y1="0" x2="0" y2="120" stroke="#555" />
                 
                 <text x="390" y="110" fill="#aaa" font-size="10">i (30-90)</text>
                 <text x="10" y="10" fill="#aaa" font-size="10">δ</text>
                 
                 <!-- Data Points -->
                 <!-- Scale i: 30-90 (60 range) -> 400px -->
                 <!-- Scale d: 30-60 (30 range) -> 120px -->
                 <circle 
                    v-for="(p, idx) in readings" 
                    :key="idx" 
                    :cx="(p.i - 30) * (400/60)" 
                    :cy="120 - (p.d - 30) * (120/30)" 
                    r="3" 
                    fill="#0f0" 
                 />
                 
                 <!-- Current Point -->
                  <circle 
                    v-if="angleOfDeviation"
                    :cx="(angleOfIncidence - 30) * (400/60)" 
                    :cy="120 - (angleOfDeviation - 30) * (120/30)" 
                    r="5" 
                    fill="#fff"
                    stroke="red" 
                 />
             </g>

        </svg>
    </div>

    <!-- Controls Panel -->
    <aside class="controls-panel glass-panel" :class="{ 'collapsed': isRightSidebarCollapsed }">
        <div class="header">
            <h3>Prism</h3>
            <button class="tool-btn" @click="reset">↻</button>
        </div>
        
        <div class="control-group">
            <label>Angle of Incidence (i)</label>
            <input type="range" v-model.number="angleOfIncidence" min="30" max="90" step="1" />
            <div class="val-display">{{ angleOfIncidence }}°</div>
        </div>
        
        <div class="control-group">
            <label>Prism Angle (A)</label>
             <input type="range" v-model.number="angleOfPrism" min="45" max="75" step="5" />
             <div class="val-display">{{ angleOfPrism }}°</div>
        </div>
        
        <div class="control-group">
             <label>Refractive Index (μ)</label>
             <input type="range" v-model.number="refractiveIndex" min="1.3" max="1.8" step="0.01" />
             <div class="val-display">{{ refractiveIndex }}</div>
        </div>
        
        <div class="control-group highlight">
             <label>Results</label>
             <div class="data-row">
                 <span>Deviation (δ):</span>
                 <span class="val">{{ angleOfDeviation ? angleOfDeviation.toFixed(2) : 'TIR' }}°</span>
             </div>
        </div>
        
        <div class="control-group">
             <label>Graph Plotting</label>
             <button class="btn-primary" @click="recordReading">Record Point</button>
             <p class="hint">Find Minimum Deviation (δm)</p>
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
