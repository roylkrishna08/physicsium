<script setup>
import { ref, computed, inject } from 'vue'

const isRightSidebarCollapsed = inject('isRightSidebarCollapsed')

// --- Physics State ---
const viscosity = ref(0.8) // Pa.s (Glycerin ~0.95)
const sphereRadius = ref(2) // mm
const sphereDensity = ref(7800) // Steel kg/m^3
const liquidDensity = ref(1260) // Glycerin kg/m^3
const gravity = 9.8

const isRunning = ref(false)
const ballY = ref(50) // Initial Y position in pixels
const time = ref(0)
let animationId = null

// --- Calculations ---
// Terminal Velocity: Vt = 2r^2(rho_s - rho_l)g / 9n
const terminalVelocity = computed(() => {
    const r = sphereRadius.value * 1e-3 // m
    const num = 2 * (r ** 2) * (sphereDensity.value - liquidDensity.value) * gravity
    const den = 9 * viscosity.value
    return num / den // m/s
})

// Visual Scale: 500px = 0.5m (Height of jar)
const scalePixelsPerMeter = 1000 
const jarHeightM = 0.4 // 40cm jar

// --- Animation ---
let lastTime = 0

const startSim = () => {
    if (isRunning.value) return
    isRunning.value = true
    lastTime = performance.now()
    animate()
}

const resetSim = () => {
    isRunning.value = false
    cancelAnimationFrame(animationId)
    ballY.value = 50
    time.value = 0
}

const animate = (timestamp) => {
    if (!isRunning.value) return
    
    // dt in seconds
    const dt = (timestamp - lastTime) / 1000
    lastTime = timestamp
    
    // Assuming terminal velocity reached almost instantly for simplicity in this lab context 
    // (or we can integrate forces, but Vt is the focus)
    // dy = v * dt
    const dy = terminalVelocity.value * dt * scalePixelsPerMeter
    
    ballY.value += dy
    time.value += dt
    
    // Stop at bottom (approx 450px)
    if (ballY.value >= 450) {
        ballY.value = 450
        isRunning.value = false
    } else {
        animationId = requestAnimationFrame(animate)
    }
}

// Ensure ballY doesn't persist weirdly if params change while stopped
// watch([viscosity, sphereRadius], resetSim)

</script>

<template>
  <div class="sim-container">
    <div class="canvas-area">
        <svg class="main-svg" viewBox="0 0 800 600">
             <!-- Lab Bench -->
             <rect x="0" y="500" width="800" height="100" fill="#222" />
             
             <!-- Glass Jar -->
             <defs>
                 <linearGradient id="liquid-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                     <stop offset="0%" style="stop-color:rgba(255, 200, 100, 0.2)" />
                     <stop offset="30%" style="stop-color:rgba(255, 200, 100, 0.4)" />
                     <stop offset="70%" style="stop-color:rgba(255, 200, 100, 0.4)" />
                     <stop offset="100%" style="stop-color:rgba(255, 200, 100, 0.2)" />
                 </linearGradient>
             </defs>
             
             <!-- Jar Body -->
             <rect x="350" y="50" width="100" height="450" fill="url(#liquid-grad)" stroke="rgba(255,255,255,0.3)" stroke-width="2" rx="5" />
             
             <!-- Marks on Jar -->
             <g transform="translate(450, 50)">
                 <line x1="0" y1="50" x2="10" y2="50" stroke="#fff" />
                 <text x="15" y="55" fill="#fff" font-size="12">Start</text>
                 
                 <line x1="0" y1="400" x2="10" y2="400" stroke="#fff" />
                 <text x="15" y="405" fill="#fff" font-size="12">End</text>
                 
                 <line x1="0" y1="50" x2="0" y2="400" stroke="rgba(255,255,255,0.2)" />
             </g>
             
             <!-- Sphere -->
             <circle 
                cx="400" 
                :cy="ballY" 
                :r="sphereRadius * 3" 
                fill="#888" 
                stroke="#fff" 
                stroke-width="1"
             />
             
             <!-- Stopwatch Display -->
             <g transform="translate(600, 100)">
                 <rect x="0" y="0" width="120" height="60" fill="#111" stroke="#333" rx="5" />
                 <text x="60" y="35" fill="#0f0" font-family="monospace" font-size="24" text-anchor="middle">
                     {{ time.toFixed(2) }}s
                 </text>
             </g>

        </svg>
    </div>

    <!-- Controls Panel -->
    <aside class="controls-panel glass-panel" :class="{ 'collapsed': isRightSidebarCollapsed }">
        <div class="header">
            <h3>Viscosity</h3>
            <div class="main-actions" style="gap: 10px;">
                <button class="tool-btn" @click="isRunning ? resetSim() : startSim()">
                    {{ isRunning ? '■' : '▶' }}
                </button>
                <button class="tool-btn" @click="resetSim">↻</button>
            </div>
        </div>
        
        <div class="control-group">
            <label>Viscosity (η)</label>
            <input type="range" v-model.number="viscosity" min="0.1" max="2.0" step="0.1" />
            <div class="val-display">{{ viscosity.toFixed(2) }} Pa.s</div>
        </div>
        
        <div class="control-group">
            <label>Sphere Radius (r)</label>
            <input type="range" v-model.number="sphereRadius" min="1" max="5" step="0.5" />
            <div class="val-display">{{ sphereRadius }} mm</div>
        </div>
        
        <div class="control-group highlight">
             <label>Calculations</label>
             <div class="data-row">
                 <span>Term. Vel (Vt):</span>
                 <span class="val">{{ terminalVelocity.toFixed(4) }} m/s</span>
             </div>
        </div>
        
        <div class="control-group">
             <label>Formula (Stokes)</label>
             <div class="formula-box">
                 Vt = 2r²(ρs-ρl)g / 9η
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

.formula-box {
    font-family: monospace;
    color: #aaa;
    font-size: 0.9rem;
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
