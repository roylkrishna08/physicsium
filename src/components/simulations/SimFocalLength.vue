<script setup>
import { ref, computed, inject } from 'vue'

const isRightSidebarCollapsed = inject('isRightSidebarCollapsed')

// --- Physics State ---
// Optical Bench 0-100cm
const lensPosition = ref(50) // Fixed usually at center
const objectPosition = ref(20) // u depends on this (neg)
const imageNeedlePosition = ref(80) // User moves this to find v

const focalLength = ref(15) // f = 15cm (Convex Lens)

// Object Height
const h_o = 2 // cm

// Real Image Calculation (Thin Lens Formula)
// 1/v - 1/u = 1/f  => 1/v = 1/f + 1/u (remember sign convention!)
// u is negative (object left of lens)
// v is positive (real image right of lens)
const calculateRealImagePos = () => {
    const u = objectPosition.value - lensPosition.value // e.g. 20 - 50 = -30 cm
    if (u >= 0) return null // Virtual object? No.
    if (Math.abs(u) < focalLength.value) return null // Virtual image (same side) - handling separately
    
    // 1/v = 1/f + 1/u
    const inv_v = (1 / focalLength.value) + (1 / u)
    if (inv_v <= 0) return null // Parallel or virtual
    
    const v = 1 / inv_v
    return lensPosition.value + v
}

// Visual Parallax State
// Observer is looking from right end (say 100cm) towards the lens.
// They see:
// 1. The Image Needle (at imageNeedlePosition)
// 2. The Real Image of the Object Needle (at calculatedRealImagePos)
// If they are not at the same depth, changing eye position (left/right) causes relative shift.

const eyeOffset = ref(0) // -10 to 10 (Observer moving head left/right)

const realImagePos = computed(() => calculateRealImagePos())

// Parallax Shift Calculation
// Shift = distance_from_eye * tan(angle) approx
// Relative shift visually proportional to depth difference * eyeOffset
const parallaxError = computed(() => {
    if (!realImagePos.value) return 0
    // Depth difference
    const d1 = 100 - imageNeedlePosition.value // Dist to needle
    const d2 = 100 - realImagePos.value // Dist to real image
    
    // If d1=d2 (coincident), no relative shift.
    // Relative shift (in pixels)
    return (d1 - d2) * eyeOffset.value * 0.5
})

// Dragging Logic
const draggingId = ref(null)

const startDrag = (id, e) => { draggingId.value = id }
const onDrag = (e) => {
    if (!draggingId.value) return
    const rect = e.target.closest('.canvas-area').getBoundingClientRect()
    const x = e.clientX - rect.left
    const val = (x - 50) / 7 // Scale map
    
    if (draggingId.value === 'object') {
        if (val < 0) objectPosition.value = 0
        else if (val > lensPosition.value - 5) objectPosition.value = lensPosition.value - 5
        else objectPosition.value = val
    }
    else if (draggingId.value === 'image') {
        if (val < lensPosition.value + 5) imageNeedlePosition.value = lensPosition.value + 5
        else if (val > 100) imageNeedlePosition.value = 100
        else imageNeedlePosition.value = val
    }
}
const stopDrag = () => { draggingId.value = null }

</script>

<template>
  <div class="sim-container" @mousemove="onDrag" @mouseup="stopDrag" @mouseleave="stopDrag">
    <div class="canvas-area">
        <svg class="main-svg" viewBox="0 0 800 600">
             <!-- Optical Bench -->
             <rect x="50" y="300" width="700" height="20" fill="#444" />
             <!-- Scale -->
             <g transform="translate(50, 320)">
                 <g v-for="i in 11" :key="i">
                     <line :x1="(i-1)*70" y1="0" :x2="(i-1)*70" y2="10" stroke="#aaa" />
                     <text :x="(i-1)*70" y="25" fill="#aaa" font-size="10" text-anchor="middle">{{ (i-1)*10 }}</text>
                 </g>
             </g>
             
             <!-- Lens (Fixed at 50cm usually for sim simplicity, but represented) -->
             <g :transform="`translate(${50 + lensPosition * 7}, 250)`">
                 <text x="0" y="-60" fill="#fff" text-anchor="middle" font-size="12">Lens (f={{focalLength}})</text>
                 <!-- Lens Shape -->
                 <ellipse cx="0" cy="50" rx="5" ry="50" fill="rgba(100, 200, 255, 0.3)" stroke="#fff" />
                 <line x1="0" y1="50" x2="0" y2="100" stroke="#888" stroke-width="2" /> <!-- Stand -->
             </g>
             
             <!-- Object Needle (O) -->
             <g :transform="`translate(${50 + objectPosition * 7}, 270)`"
                @mousedown="startDrag('object', $event)" style="cursor: grab"
             >
                 <text x="0" y="-40" fill="#fa0" text-anchor="middle" font-size="12">Obj (u)</text>
                 <line x1="0" y1="-30" x2="0" y2="30" stroke="#fa0" stroke-width="3" /> <!-- Needle UP -->
                 <circle cx="0" cy="30" r="5" fill="#fa0" /> <!-- Base -->
             </g>
             
             <!-- Image Needle (I) -->
             <g :transform="`translate(${50 + imageNeedlePosition * 7}, 270)`"
                @mousedown="startDrag('image', $event)" style="cursor: grab"
             >
                 <text x="0" y="-40" fill="#0af" text-anchor="middle" font-size="12">Img Needle (v)</text>
                 <line x1="0" y1="-30" x2="0" y2="30" stroke="#0af" stroke-width="3" /> <!-- Needle UP -->
                 <circle cx="0" cy="30" r="5" fill="#0af" /> <!-- Base -->
             </g>
             
             <!-- Ray Diagram (Simplified) -->
             <g opacity="0.4" stroke="#fff" stroke-width="1" fill="none" v-if="realImagePos">
                 <!-- Parallel Ray -->
                 <path :d="`M ${50 + objectPosition * 7} ${240} L ${50 + lensPosition * 7} ${240} L ${50 + realImagePos * 7} ${300}`" /> <!-- Inverted image top is at y=300 approx scale -->
                 <!-- Optical Center Ray -->
                 <path :d="`M ${50 + objectPosition * 7} ${240} L ${50 + lensPosition * 7} ${300} L ${50 + realImagePos * 7} ${360}`" stroke-dasharray="4,4" /> <!-- Just rough projection -->
             </g>
             
             <!-- Parallax View (Eye View) at Top Right -->
             <g transform="translate(600, 50)">
                 <rect x="-100" y="0" width="200" height="150" fill="#111" stroke="#fff" />
                 <text x="0" y="20" fill="#fff" text-anchor="middle">View from Right End</text>
                 <mask id="viewMask">
                     <rect x="-98" y="2" width="196" height="146" fill="#fff" />
                 </mask>
                 
                 <g mask="url(#viewMask)">
                     <!-- Real Image (Inverted) -->
                     <g v-if="realImagePos" :transform="`translate(${parallaxError}, 0)`">
                         <line x1="0" y1="50" x2="0" y2="100" stroke="#fa0" stroke-width="4" opacity="0.6" /> <!-- Inverted hanging down -->
                         <text x="0" y="120" fill="#fa0" text-anchor="middle" font-size="10">Real Img</text>
                     </g>
                     
                     <!-- Image Needle (Upright) -->
                     <g>
                         <line x1="0" y1="130" x2="0" y2="80" stroke="#0af" stroke-width="4" /> <!-- Upright -->
                         <text x="0" y="70" fill="#0af" text-anchor="middle" font-size="10">Needle</text>
                     </g>
                 </g>
                 
                 <!-- Alignment text -->
                 <text x="0" y="140" fill="#0f0" text-anchor="middle" font-size="10" v-if="Math.abs(realImagePos - imageNeedlePosition) < 0.5"> NO PARALLAX (Aligned)</text>
             </g>

        </svg>
    </div>

    <!-- Controls Panel -->
    <aside class="controls-panel glass-panel" :class="{ 'collapsed': isRightSidebarCollapsed }">
        <div class="header">
            <h3>Focal Length</h3>
            <button class="tool-btn" @click="resetSim">↻</button>
        </div>
        
        <div class="control-group">
            <label>Positions (cm)</label>
            <div class="data-row">
                <span>Object (u):</span>
                <span class="val">{{ (lensPosition - objectPosition).toFixed(1) }} cm</span>
            </div>
            <div class="data-row">
                <span>Img Needle (v):</span>
                <span class="val">{{ (imageNeedlePosition - lensPosition).toFixed(1) }} cm</span>
            </div>
             <p class="hint">Move Obj/Img needles to align in View</p>
        </div>
        
        <div class="control-group">
            <label>Parallax Check</label>
            <p style="font-size:0.8rem; color:#aaa; margin-bottom:5px;">Move eye left/right to check alignment:</p>
            <input type="range" v-model.number="eyeOffset" min="-20" max="20" />
        </div>
        
        <div class="control-group highlight" v-if="Math.abs(realImagePos - imageNeedlePosition) < 1">
             <label>Result</label>
             <div class="data-row">
                 <span>Calculated f:</span>
                 <!-- f = uv / (u+v) -->
                 <span class="val" style="color: #0d0;">
                     {{ ( ((lensPosition - objectPosition) * (imageNeedlePosition - lensPosition)) / ((lensPosition - objectPosition) + (imageNeedlePosition - lensPosition)) ).toFixed(2) }} cm
                 </span>
             </div>
             <p class="hint">Actual f = {{ focalLength }} cm</p>
        </div>
        
        <div class="control-group">
             <label>Lens Properties</label>
             <div class="data-row">
                 <span>Focal Length:</span>
                 <input style="width:50px" type="number" v-model.number="focalLength" />
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
