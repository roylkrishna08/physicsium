<script setup>
import { ref, computed, inject, watch } from 'vue'

const isRightSidebarCollapsed = inject('isRightSidebarCollapsed')

// --- Physics State ---
// Materials
const materials = {
    'copper': { name: 'Copper', c: 385, color: '#e76f51', density: 8960 },
    'aluminum': { name: 'Aluminum', c: 900, color: '#a8dadc', density: 2700 },
    'iron': { name: 'Iron', c: 450, color: '#6d6875', density: 7870 }
}

const selectedMaterial = ref('copper')
const solidMass = ref(0.05) // kg (50g)
const waterMass = ref(0.1) // kg (100g) of water
const waterTemp = ref(25) // Initial water temp (C)
const solidTemp = ref(95) // Initial solid temp (C) - Heated
const calMass = 0.05 // kg Calorimeter mass
const calC = 385 // Copper calorimeter

// Process State
const step = ref(0) // 0: Setup, 1: Heating, 2: Transferring, 3: Mixing (Equilibrium)
const currentWaterTemp = ref(25)
const currentSolidTemp = ref(25)
const showSolid = ref(true) // Solid visibility (in heater or water)
const solidY = ref(100)
const solidX = ref(200)

let animationId = null

// --- Physics Calculation ---
// Equilibrium Temp T = (m1c1T1 + m2c2T2) / (m1c1 + m2c2)
// Group 1 (Hot): Solid
// Group 2 (Cold): Water + Calorimeter
const equilibriumTemp = computed(() => {
    const m1 = solidMass.value
    const c1 = materials[selectedMaterial.value].c
    const T1 = solidTemp.value
    
    const m2 = waterMass.value
    const c_water = 4186
    const T2 = waterTemp.value
    
    const m3 = calMass
    const c3 = calC
    // T2 is same for cal
    
    const numerator = (m1 * c1 * T1) + (m2 * c_water * T2) + (m3 * c3 * T2)
    const denominator = (m1 * c1) + (m2 * c_water) + (m3 * c3)
    
    return numerator / denominator
})

// --- Animation Controls ---
const heatSolid = () => {
    step.value = 1
    currentSolidTemp.value = 25
    solidX.value = 200 // Heater pos
    solidY.value = 200
    
    // Animate heating
    let t = 25
    const target = solidTemp.value
    const heatAnim = () => {
        if (t < target) {
            t += 1
            currentSolidTemp.value = t
            requestAnimationFrame(heatAnim)
        } else {
            // Hot
        }
    }
    heatAnim()
}

const transferSolid = () => {
    if (step.value !== 1) return
    step.value = 2 // Moving
    
    // Animate move to calorimeter
    let x = 200
    let y = 200
    const targetX = 500 // Calorimeter pos
    const targetY = 350
    
    const moveAnim = () => {
        if (x < targetX) {
            x += 5
            if (x > 350 && y < targetY) y += 2 // Arckish path
            solidX.value = x
            solidY.value = y
            requestAnimationFrame(moveAnim)
        } else {
            step.value = 3
            mix()
        }
    }
    moveAnim()
}

const mix = () => {
    // Animate temp rise to Equilibrium
    const target = equilibriumTemp.value
    let t = currentWaterTemp.value
    
    const mixAnim = () => {
        if (t < target) {
            t += 0.1
            currentWaterTemp.value = t
            currentSolidTemp.value = t // Solid cools to water temp fast in sim
            requestAnimationFrame(mixAnim)
        }
    }
    mixAnim()
}

const reset = () => {
    step.value = 0
    currentWaterTemp.value = waterTemp.value
    currentSolidTemp.value = 25
    solidX.value = 200
    solidY.value = 100 // Shelf
}

// Watch inputs to update initial display
watch([waterTemp], () => { if (step.value === 0) currentWaterTemp.value = waterTemp.value })

</script>

<template>
  <div class="sim-container">
    <div class="canvas-area">
        <svg class="main-svg" viewBox="0 0 800 600">
             <!-- Table -->
             <rect x="100" y="400" width="600" height="20" fill="#333" />
             
             <!-- Heater -->
             <g transform="translate(150, 300)">
                 <rect x="0" y="0" width="100" height="100" fill="#222" stroke="#555" />
                 <text x="50" y="120" fill="#aaa" text-anchor="middle">Heater (95°C)</text>
                 <!-- Coils -->
                 <path d="M 10 20 Q 20 10 30 20 T 50 20 T 70 20 T 90 20" stroke="red" stroke-width="3" fill="none" opacity="0.6" />
                 <path d="M 10 50 Q 20 40 30 50 T 50 50 T 70 50 T 90 50" stroke="red" stroke-width="3" fill="none" opacity="0.6" />
                 <path d="M 10 80 Q 20 70 30 80 T 50 80 T 70 80 T 90 80" stroke="red" stroke-width="3" fill="none" opacity="0.6" />
             </g>
             
             <!-- Calorimeter -->
             <g transform="translate(450, 250)">
                 <!-- Outer Jacket -->
                 <rect x="-10" y="-10" width="120" height="160" fill="#444" rx="5" />
                 <!-- Insulation -->
                 <rect x="0" y="0" width="100" height="150" fill="#ddd" />
                 <!-- Copper Vessel -->
                 <rect x="10" y="10" width="80" height="130" fill="#b87333" />
                 <!-- Water -->
                 <rect x="12" y="50" width="76" height="90" fill="rgba(100, 200, 255, 0.5)" />
                 
                 <!-- Thermometer -->
                 <g transform="translate(80, -50)">
                     <rect x="0" y="0" width="6" height="200" fill="#eee" stroke="#aaa" />
                     <rect x="2" :y="200 - (currentWaterTemp * 1.5)" width="2" :height="currentWaterTemp * 1.5" fill="red" />
                     <circle cx="3" cy="200" r="5" fill="red" />
                     
                     <g v-for="i in 10" :key="i">
                         <line x1="0" :y1="i*20" x2="6" :y2="i*20" stroke="#000" stroke-width="0.5" />
                     </g>
                 </g>
                 
                 <text x="50" y="170" fill="#aaa" text-anchor="middle">Calorimeter</text>
                 <text x="120" y="50" fill="#fff" font-size="14">{{ currentWaterTemp.toFixed(1) }}°C</text>
             </g>
             
             <!-- Solid Object -->
             <!-- Moved dynamically -->
             <circle 
                v-if="showSolid"
                :cx="solidX" 
                :cy="solidY" 
                :r="15 + solidMass * 100"  
                :fill="materials[selectedMaterial].color"
                stroke="#fff"
                stroke-width="1"
             />
             
             <text :x="solidX" :y="solidY - 30" fill="#fff" text-anchor="middle" font-size="12">
                 {{ step === 0 ? 'Solid' : currentSolidTemp.toFixed(0) + '°C' }}
             </text>
        </svg>
    </div>

    <!-- Controls Panel -->
    <aside class="controls-panel glass-panel" :class="{ 'collapsed': isRightSidebarCollapsed }">
        <div class="header">
            <h3>Specific Heat</h3>
            <button class="tool-btn" @click="reset">↻</button>
        </div>
        
        <div class="control-group">
            <label>Material</label>
            <div class="button-row">
                <button 
                    v-for="(mat, key) in materials" 
                    :key="key"
                    class="btn-select"
                    :class="{ active: selectedMaterial === key }"
                    @click="selectedMaterial = key"
                    :disabled="step > 0"
                >
                    {{ mat.name }}
                </button>
            </div>
        </div>
        
        <div class="control-group">
            <label>Mass Calculation</label>
            <div class="data-row">
                <span>Solid Mass:</span>
                <span>{{ (solidMass * 1000).toFixed(0) }} g</span>
            </div>
            <div class="data-row">
                <span>Water Mass:</span>
                <span>{{ (waterMass * 1000).toFixed(0) }} g</span>
            </div>
        </div>
        
        <div class="control-group highlight">
             <label>Process (Step {{ step }})</label>
             <div class="button-row vertical">
                 <button class="btn-primary" @click="heatSolid" :disabled="step !== 0">
                     1. Heat Solid (to 95°C)
                 </button>
                 <button class="btn-primary" @click="transferSolid" :disabled="step !== 1">
                     2. Drop into Water
                 </button>
             </div>
        </div>
        
        <div class="control-group" v-if="step === 3">
             <label>Result</label>
             <div class="data-row">
                 <span>Final Temp:</span>
                 <span class="val" style="color: #0f0; font-size: 1.2rem;">{{ currentWaterTemp.toFixed(2) }}°C</span>
             </div>
             <div class="formula-box">
                 Theoretical: {{ equilibriumTemp.toFixed(2) }}°C
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

.btn-select {
    flex: 1;
    background: #222;
    border: 1px solid #444;
    color: #aaa;
    padding: 5px;
    cursor: pointer;
    border-radius: 4px;
}
.btn-select.active {
    background: var(--primary-glow);
    color: #000;
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
}
.btn-primary:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    background: #444;
}

.button-row {
    display: flex;
    gap: 5px;
}
.button-row.vertical {
    flex-direction: column;
    gap: 10px;
}

.val, .formula-box {
    margin-top: 0.5rem;
    font-family: monospace;
    color: #fff;
}

.data-row {
     display: flex;
    justify-content: space-between;
    margin-bottom: 0.4rem;
    color: #ccc;
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
</style>
