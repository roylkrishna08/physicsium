<script setup>
import { ref, computed, inject } from 'vue'

const isRightSidebarCollapsed = inject('isRightSidebarCollapsed')

// --- Physics State ---
const radius = ref(0.5) // Capillary radius in mm
const surfaceTension = ref(0.072) // Water ~0.072 N/m
const density = ref(1000) // Water ~1000 kg/m^3
const angle = ref(0) // Contact angle in degrees
const gravity = 9.8

// --- Calculations ---
const height = computed(() => {
    // h = (2 * T * cos(theta)) / (r * rho * g)
    // Convert units to SI first
    const r = radius.value * 1e-3 // m
    const T = surfaceTension.value
    const rho = density.value
    const thetaRad = angle.value * Math.PI / 180
    
    if (r <= 0) return 0
    const h = (2 * T * Math.cos(thetaRad)) / (r * rho * gravity)
    return h * 100 // return in cm for display
})

// Visual scale: 1 cm = 40 pixels
const scale = 40 
const listHeight = computed(() => height.value * scale)

const resetSim = () => {
    radius.value = 0.5
    surfaceTension.value = 0.072
    density.value = 1000
    angle.value = 0
}
</script>

<template>
  <div class="sim-container">
    <div class="canvas-area">
        <svg class="main-svg" viewBox="0 0 800 600">
             <!-- Beaker -->
             <defs>
                <linearGradient id="water-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:rgba(100, 200, 255, 0.4)" />
                    <stop offset="100%" style="stop-color:rgba(50, 150, 255, 0.6)" />
                </linearGradient>
            </defs>
            
            <rect x="250" y="300" width="300" height="200" fill="url(#water-grad)" stroke="#fff" stroke-width="2" rx="10" />
            <line x1="250" y1="300" x2="550" y2="300" stroke="rgba(255,255,255,0.5)" stroke-width="1" />
            
            <!-- Capillary Tube -->
            <g transform="translate(400, 100)">
                <!-- Tube Walls -->
                <rect :x="-radius * 20" y="0" :width="radius * 40" height="400" fill="rgba(255,255,255,0.1)" stroke="#aaa" stroke-width="1" />
                
                <!-- Liquid in Tube -->
                <!-- Base level is at y=200 (relative to group translated at 100 => 300 global) -->
                <!-- Rise is upward from 200 -->
                <rect 
                    :x="-radius * 20 + 1" 
                    :y="200 - listHeight" 
                    :width="radius * 40 - 2" 
                    :height="listHeight + 100" 
                    fill="rgba(100, 220, 255, 0.7)" 
                />
                
                <!-- Meniscus -->
                <path 
                    :d="`M ${-radius*20+1} ${200 - listHeight} Q 0 ${200 - listHeight + 5} ${radius*20-1} ${200 - listHeight}`" 
                    fill="none" 
                    stroke="white" 
                    stroke-width="1.5" 
                />
            </g>
            
            <!-- Ruler for measurement -->
            <g transform="translate(500, 100)">
                 <rect x="0" y="0" width="40" height="400" fill="#ddd" />
                 <!-- Ticks -->
                 <g v-for="i in 20" :key="i">
                     <line x1="0" :y1="i*20" x2="10" :y2="i*20" stroke="#000" stroke-width="1" />
                     <text x="15" :y="i*20 + 4" font-size="10" fill="#000" v-if="i % 5 === 0">{{ 20 - i }}</text>
                 </g>
                 <!-- Zero mark aligned with water level -->
                 <line x1="0" y1="200" x2="40" y2="200" stroke="red" stroke-width="2" />
            </g>

        </svg>
    </div>

    <!-- Controls Panel -->
    <aside class="controls-panel glass-panel" :class="{ 'collapsed': isRightSidebarCollapsed }">
        <div class="header">
            <h3>Surface Tension</h3>
            <button class="tool-btn" @click="resetSim">↻</button>
        </div>
        
        <div class="control-group">
            <label>Capillary Radius (r)</label>
            <input type="range" v-model.number="radius" min="0.1" max="2.0" step="0.1" />
            <div class="val-display">{{ radius }} mm</div>
        </div>
        
        <div class="control-group">
            <label>Surface Tension (T)</label>
            <// Select preset or slider -->
            <input type="range" v-model.number="surfaceTension" min="0.01" max="0.1" step="0.001" />
            <div class="val-display">{{ surfaceTension.toFixed(3) }} N/m</div>
        </div>
        
        <div class="control-group">
            <label>Liquid Density (ρ)</label>
            <input type="range" v-model.number="density" min="500" max="2000" step="10" />
            <div class="val-display">{{ density }} kg/m³</div>
        </div>

         <div class="control-group highlight">
             <label>Results</label>
             <div class="data-row">
                 <span>Height (h):</span>
                 <span class="val">{{ height.toFixed(2) }} cm</span>
             </div>
        </div>
        
        <div class="control-group">
             <label>Formula</label>
             <div class="formula-box">
                 h = 2Tcosθ / rρg
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
    max-width: 800px;
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
