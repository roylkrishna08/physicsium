<script setup>
import { ref, computed, inject, watch } from 'vue'

const isRightSidebarCollapsed = inject('isRightSidebarCollapsed')

// --- Physics State ---
const refractiveIndex = ref(1.5) // Glass (mu)
const slabThickness = ref(50) // mm (Real Depth)
const microscopeFocus = ref(0) // mm (0 is table surface)

// Three Readings:
// R1: Focus on Ink Mark (on table, without slab) -> Should be 0
// R2: Focus on Ink Mark (through slab) -> Apparent Depth = Real / mu
//     Apparent shift = Real - Apparent = t ( 1 - 1/mu )
//     So R2 = t(1 - 1/mu) (Vertical shift upwards)
// R3: Focus on Lycopodium powder (top of slab) -> Should be t
//     R3 = slabThickness

const r1 = ref(null)
const r2 = ref(null)
const r3 = ref(null)

// Visual logic
// Microscope View circle showing "blur" or "sharp"
const isFocusSharp = computed(() => {
    // Determine what we are looking at
    // Scenarios rely on user setup (which we simplify here)
    
    // Mode Selection needed
    return false
})

const mode = ref('no_slab') // 'no_slab', 'slab_mark', 'slab_top'

const targetFocus = computed(() => {
    if (mode.value === 'no_slab') return 0 // Table surface
    if (mode.value === 'slab_mark') {
        const apparentDepth = slabThickness.value / refractiveIndex.value // Depth from top surface?
        // No, absolute height from table.
        // Image of mark raised by shift = t(1 - 1/mu)
        return slabThickness.value * (1 - 1/refractiveIndex.value)
    }
    if (mode.value === 'slab_top') return slabThickness.value
    return 0
})

const blurAmount = computed(() => {
    const diff = Math.abs(microscopeFocus.value - targetFocus.value)
    // 0 diff = 0 blur. 10mm diff = max blur.
    let b = diff * 2 
    if (b > 20) b = 20
    return b
})

const recordReading = () => {
    if (mode.value === 'no_slab') r1.value = microscopeFocus.value
    if (mode.value === 'slab_mark') r2.value = microscopeFocus.value
    if (mode.value === 'slab_top') r3.value = microscopeFocus.value
}

const calculatedMu = computed(() => {
    if (r1.value === null || r2.value === null || r3.value === null) return 0
    // Real Depth = R3 - R1
    // Apparent Depth = R3 - R2
    
    const real = r3.value - r1.value
    const app = r3.value - r2.value
    if (app === 0) return 0
    return real / app
})

const reset = () => {
    r1.value = null
    r2.value = null
    r3.value = null
    microscopeFocus.value = 0
    mode.value = 'no_slab'
}

</script>

<template>
  <div class="sim-container">
    <div class="canvas-area">
        <svg class="main-svg" viewBox="0 0 800 600">
             <!-- Table -->
             <rect x="100" y="450" width="600" height="20" fill="#333" />
             
             <!-- Ink Mark (Cross) -->
             <g transform="translate(400, 450)">
                 <line x1="-5" y1="-5" x2="5" y2="5" stroke="#fff" stroke-width="2" />
                 <line x1="-5" y1="5" x2="5" y2="-5" stroke="#fff" stroke-width="2" />
             </g>
             
             <!-- Glass Slab -->
             <g v-if="mode !== 'no_slab'" transform="translate(350, 450)">
                 <!-- Slab draws upwards from y=450 by thickness scale -->
                 <!-- Scale: 1mm = 3px -->
                 <rect x="0" :y="-slabThickness * 3" width="100" :height="slabThickness * 3" fill="rgba(200, 230, 255, 0.3)" stroke="#fff" />
                 
                 <!-- Lycopodium Powder on top -->
                 <g v-if="mode === 'slab_top'" :transform="`translate(0, ${-slabThickness * 3})`">
                     <circle cx="20" cy="0" r="1" fill="#ff0" opacity="0.8"/>
                     <circle cx="50" cy="0" r="1.5" fill="#ff0" opacity="0.8"/>
                     <circle cx="80" cy="0" r="1" fill="#ff0" opacity="0.8"/>
                 </g>
             </g>
             
             <!-- Microscope Objective -->
             <g :transform="`translate(400, ${450 - microscopeFocus * 3 - 50})`">
                 <!-- Tube -->
                 <rect x="-10" y="-100" width="20" height="100" fill="#444" stroke="#888" />
                 <!-- Lens Housing -->
                 <path d="M -15 0 L 15 0 L 10 20 L -10 20 Z" fill="#222" stroke="#888" />
                 <line x1="0" y1="-100" x2="0" y2="-400" stroke="#444" stroke-width="4" stroke-dasharray="4,4" /> <!-- Stand extension -->
             </g>
             
             <!-- Microscope View (Circle) -->
             <g transform="translate(600, 200)">
                 <text x="0" y="-110" fill="#fff" text-anchor="middle">Microscope View</text>
                 <circle cx="0" cy="0" r="100" fill="#000" stroke="#444" stroke-width="5" />
                 
                 <!-- Clip content to circle -->
                 <defs>
                     <clipPath id="microscope-clip">
                         <circle cx="0" cy="0" r="95" />
                     </clipPath>
                 </defs>
                 
                 <g clip-path="url(#microscope-clip)">
                     <rect x="-100" y="-100" width="200" height="200" fill="#eee" />
                     
                     <!-- Content depends on mode -->
                     <g :style="{ filter: `blur(${blurAmount}px)` }">
                         
                         <!-- Ink Mark -->
                          <g v-if="mode !== 'slab_top'">
                             <line x1="-30" y1="-30" x2="30" y2="30" stroke="#000" stroke-width="5" />
                             <line x1="-30" y1="30" x2="30" y2="-30" stroke="#000" stroke-width="5" />
                          </g>
                          
                          <!-- Powder -->
                          <g v-if="mode === 'slab_top'">
                              <circle v-for="i in 20" :key="i" 
                                :cx="(Math.random()-0.5)*150" 
                                :cy="(Math.random()-0.5)*150" 
                                :r="Math.random()*3 + 1" 
                                fill="#aa0" 
                              />
                          </g>
                     </g>
                 
                     <!-- Crosshair -->
                     <line x1="-100" y1="0" x2="100" y2="0" stroke="rgba(0,0,0,0.5)" stroke-width="1" />
                     <line x1="0" y1="-100" x2="0" y2="100" stroke="rgba(0,0,0,0.5)" stroke-width="1" />
                 </g>
             </g>

        </svg>
    </div>

    <!-- Controls Panel -->
    <aside class="controls-panel glass-panel" :class="{ 'collapsed': isRightSidebarCollapsed }">
        <div class="header">
            <h3>Glass Slab</h3>
            <button class="tool-btn" @click="reset">↻</button>
        </div>
        
        <div class="control-group">
            <label>Mode</label>
            <div class="button-row vertical">
                <button class="btn-select" :class="{ active: mode === 'no_slab' }" @click="mode = 'no_slab'">
                    1. Focus on Mark (No Slab)
                </button>
                <button class="btn-select" :class="{ active: mode === 'slab_mark' }" @click="mode = 'slab_mark'">
                    2. Focus on Mark (With Slab)
                </button>
                <button class="btn-select" :class="{ active: mode === 'slab_top' }" @click="mode = 'slab_top'">
                    3. Focus on Slab Top
                </button>
            </div>
        </div>
        
        <div class="control-group">
            <label>Microscope Focus (Height)</label>
            <input type="range" v-model.number="microscopeFocus" min="0" max="80" step="0.5" />
            <div class="val-display">{{ microscopeFocus.toFixed(1) }} mm</div>
            <div class="button-row" style="margin-top:10px;">
                <button class="btn-primary" @click="recordReading" :disabled="blurAmount > 2">
                    Record Reading ({{ mode === 'no_slab' ? 'R1' : (mode === 'slab_mark' ? 'R2' : 'R3') }})
                </button>
            </div>
            <p class="hint" v-if="blurAmount > 2">Image is blurry. Adjust focus.</p>
        </div>
        
        <div class="control-group highlight">
             <label>Readings</label>
             <div class="data-row">
                 <span>R1 (Table):</span>
                 <span class="val">{{ r1 !== null ? r1.toFixed(1) : '--' }} mm</span>
             </div>
             <div class="data-row">
                 <span>R2 (Apparent):</span>
                 <span class="val">{{ r2 !== null ? r2.toFixed(1) : '--' }} mm</span>
             </div>
             <div class="data-row">
                 <span>R3 (Top):</span>
                 <span class="val">{{ r3 !== null ? r3.toFixed(1) : '--' }} mm</span>
             </div>
        </div>
        
        <div class="control-group" v-if="r1!==null && r2!==null && r3!==null">
            <label>Calculated Refractive Index</label>
            <div class="data-row">
                 <span>Real Depth (R3-R1):</span>
                 <span class="val">{{ (r3-r1).toFixed(1) }} mm</span>
            </div>
            <div class="data-row">
                 <span>App. Depth (R3-R2):</span>
                 <span class="val">{{ (r3-r2).toFixed(1) }} mm</span>
            </div>
            <div class="data-row">
                 <span>μ (Real/App):</span>
                 <span class="val" style="color: #0d0; font-size:1.2rem;">{{ calculatedMu.toFixed(2) }}</span>
            </div>
             <p class="hint">Actual μ = {{ refractiveIndex }}</p>
        </div>
        
        <div class="control-group">
            <label>Slab Properties</label>
            <div class="data-row">
                <span>Thickness:</span>
                <input style="width:50px" type="number" v-model.number="slabThickness" />
                 <span>mm</span>
            </div>
            <div class="data-row">
                <span>Index (μ):</span>
                <input style="width:50px" type="number" v-model.number="refractiveIndex" step="0.1" />
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

.btn-select {
    width: 100%;
    background: #222;
    border: 1px solid #444;
    color: #aaa;
    padding: 8px;
    cursor: pointer;
    border-radius: 4px;
    text-align: left;
}
.btn-select.active {
    background: var(--primary-glow);
    color: #000;
    border-color: var(--primary-glow);
    font-weight: bold;
}

.btn-primary {
    background: linear-gradient(90deg, #00d4ff, #0055ff);
    border: none;
    padding: 8px;
    color: white;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
    width: 100%;
}
.btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: #444;
}

.button-row {
    display: flex;
    gap: 5px;
}
.button-row.vertical {
    flex-direction: column;
    gap: 5px;
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
