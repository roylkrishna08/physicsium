<script setup>
import { ref, computed, inject, watch, onUnmounted } from 'vue'

const isRightSidebarCollapsed = inject('isRightSidebarCollapsed')

// --- Physics State ---
const frequency = ref(512) // Hz (Tuning fork)
const waterLevel = ref(0) // Distance from top (L) in cm
const speedOfSound = ref(34300) // cm/s at 20C
const tubeRadius = 2.0 // cm

const isStriking = ref(false)
const vibrationAmplitude = ref(0) // Visual amplitude

// --- Calculations ---
// Wavelength lambda = v / f
const wavelength = computed(() => speedOfSound.value / frequency.value)

// Resonance lengths (theoretical)
// End correction e = 0.6 * r
const endCorrection = 0.6 * tubeRadius

// First harmonic: L1 + e = lambda/4  => L1 = lambda/4 - e
const L1 = computed(() => (wavelength.value / 4) - endCorrection)

// Second harmonic: L2 + e = 3*lambda/4 => L2 = 3*lambda/4 - e
const L2 = computed(() => (3 * wavelength.value / 4) - endCorrection)

// Intensity (Loudness) calculation based on proximity to resonance
const loudness = computed(() => {
    if (!isStriking.value) return 0
    
    // Gaussian-like curve distinct around L1 and L2
    // Width of resonance peak approx 2cm
    const sigma = 2.0 
    
    const bell1 = Math.exp(-0.5 * Math.pow((waterLevel.value - L1.value) / sigma, 2))
    const bell2 = Math.exp(-0.5 * Math.pow((waterLevel.value - L2.value) / sigma, 2)) * 0.8 // 2nd harmonic quieter
    
    return (bell1 + bell2)
})

// --- Animation ---
let animationId = null
const wavePhase = ref(0)

const animate = () => {
    wavePhase.value += 0.2
    
    if (isStriking.value) {
        // Decay vibration slowly
        if (vibrationAmplitude.value > 0.01) {
            vibrationAmplitude.value *= 0.995 
        } else {
            isStriking.value = false
            vibrationAmplitude.value = 0
        }
    }
    
    animationId = requestAnimationFrame(animate)
}

const strikeFork = () => {
    isStriking.value = true
    vibrationAmplitude.value = 1.0
    if (!animationId) animate()
}

// Generate standing wave path for visualization inside tube
const wavePath = computed(() => {
    if (!isStriking.value && loudness.value < 0.01) return ''
    
    const amp = loudness.value * vibrationAmplitude.value * 15 // Max width 15px
    const steps = 50
    const dy = waterLevel.value * 4 / steps // 4px per cm scale
    
    let pathLeft = `M 380 50`
    let pathRight = `M 420 50`
    
    // Draw standing wave
    // Node at water surface (y = 50 + L*4)
    // Antinode at open end (y = 50 - correction*4 roughly)
    
    for (let i = 0; i <= steps; i++) {
        const y = 50 + i * dy
        const xPos = i / steps // 0 to 1 (top to bottom)
        
        // Standing wave Shape: sin(k*x) * cos(omega*t)
        // Boundary condition: displacement node at closed end (water), antinode at open
        // Wait, displacement node is at closed end.
        
        // Visual approximation:
        // Envelope is cos(pi/2 * (L-y)/L_effective) ... simplifying for visual only
        
        // We just want to visualize "Sound".
        // Let's draw a sine wave that fits L.
        
        const spatialFreq = (Math.PI * 0.5) / (waterLevel.value * 4) // simple quarter wave visual attempt? No.
        
        // Actual standing wave k = 2pi / lambda
        const k = (2 * Math.PI) / (wavelength.value * 4) // scaled
        
        // Distance d from water surface (closed end, node)
        const d = (waterLevel.value * 4) - (i * dy) 
        
        // Displacement = A * sin(k*d) * cos(wt)
        const displacement = amp * Math.sin(k * d) * Math.cos(wavePhase.value)
        
        pathLeft += ` L ${380 + displacement} ${y}`
        pathRight += ` L ${420 - displacement} ${y}`
    }
    
    return pathLeft + pathRight
})

onUnmounted(() => {
    cancelAnimationFrame(animationId)
})

// Auto start animation loop for phase
if (!animationId) animate()

</script>

<template>
  <div class="sim-container">
    <div class="canvas-area">
        <svg class="main-svg" viewBox="0 0 800 600">
             <!-- Stand -->
             <rect x="300" y="500" width="200" height="20" fill="#333" />
             <rect x="390" y="50" width="20" height="450" fill="#444" />
             
             <!-- Glass Tube -->
             <defs>
                 <linearGradient id="glass-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                     <stop offset="0%" style="stop-color:rgba(255,255,255,0.1)" />
                     <stop offset="20%" style="stop-color:rgba(255,255,255,0.2)" />
                     <stop offset="80%" style="stop-color:rgba(255,255,255,0.2)" />
                     <stop offset="100%" style="stop-color:rgba(255,255,255,0.1)" />
                 </linearGradient>
             </defs>
             
             <!-- Tube Body (Outer) -->
             <rect x="380" y="50" width="40" height="400" fill="url(#glass-grad)" stroke="#aaa" stroke-width="1" />
             
             <!-- Water Level -->
             <!-- Total tube length 100cm visual = 400px -->
             <!-- waterLevel value is length of AIR column from top -->
             <!-- So water starts at y = 50 + waterLevel * 4 -->
             <rect 
                x="381" 
                :y="50 + waterLevel * 4" 
                width="38" 
                :height="400 - waterLevel * 4" 
                fill="rgba(100, 200, 255, 0.6)" 
             />
             
             <!-- Scale/Ruler -->
             <g transform="translate(340, 50)">
                 <rect x="0" y="0" width="30" height="400" fill="#ddd" />
                 <g v-for="i in 21" :key="i">
                     <line x1="20" :y1="(i-1)*20" x2="30" :y2="(i-1)*20" stroke="#000" />
                     <text x="15" :y="(i-1)*20 + 4" font-size="10" text-anchor="end" fill="#000">{{ (i-1)*5 }}</text>
                 </g>
             </g>
             
             <!-- Tuning Fork -->
             <g transform="translate(360, 10)">
                 <!-- Handle -->
                 <rect x="35" y="0" width="10" height="20" fill="#888" />
                 <!-- U shape -->
                 <path d="M 40 20 Q 40 40 20 40 L 20 0 M 40 20 Q 40 40 60 40 L 60 0" 
                    fill="none" stroke="#ccc" stroke-width="6" 
                    :style="{ transform: isStriking ? `translateX(${Math.sin(wavePhase*5)*2}px)` : '' }"
                 />
             </g>
             
             <!-- Sound Waves Visual (Particle displacement) -->
             <path :d="wavePath" stroke="rgba(255,255,255,0.5)" stroke-width="1" fill="none" />
             
             <!-- Loudness Meter -->
             <g transform="translate(500, 100)">
                 <text x="0" y="-10" fill="#fff">Volume</text>
                 <rect x="0" y="0" width="20" height="200" fill="#222" stroke="#555" />
                 <rect x="2" :y="200 - loudness * 200" width="16" :height="loudness * 200" fill="#0f0" />
             </g>

        </svg>
    </div>

    <!-- Controls Panel -->
    <aside class="controls-panel glass-panel" :class="{ 'collapsed': isRightSidebarCollapsed }">
        <div class="header">
            <h3>Resonance Tube</h3>
            <div class="main-actions" style="gap: 10px;">
                <button class="tool-btn" @click="strikeFork">Strike (🔊)</button>
            </div>
        </div>
        
        <div class="control-group">
            <label>Tuning Fork Freq (f)</label>
            <input type="range" v-model.number="frequency" min="256" max="1024" step="16" />
            <div class="val-display">{{ frequency }} Hz</div>
        </div>
        
        <div class="control-group">
             <label>Air Column Length (L)</label>
             <input type="range" v-model.number="waterLevel" min="0" max="100" step="0.1" />
             <div class="val-display">{{ waterLevel.toFixed(1) }} cm</div>
        </div>
        
        <div class="control-group highlight">
             <label>Resonance Check</label>
             <div class="data-row">
                 <span>Loudness:</span>
                 <span :style="{ color: loudness > 0.8 ? '#0f0' : '#888' }">{{ (loudness * 100).toFixed(0) }}%</span>
             </div>
             <p class="hint" v-if="loudness > 0.8">Resonance Detected!</p>
        </div>
        
        <div class="control-group">
             <label>Theoretical Resonance</label>
             <div class="data-row">
                 <span>L1 (approx):</span>
                 <span class="val">{{ L1.toFixed(1) }} cm</span>
             </div>
             <div class="data-row">
                 <span>L2 (approx):</span>
                 <span class="val">{{ L2.toFixed(1) }} cm</span>
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

.hint {
    color: #0f0;
    font-size: 0.8rem;
    text-align: center;
    font-weight: bold;
}

.tool-btn {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    color: white;
    height: 36px;
    padding: 0 1rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
}
.tool-btn:hover {
    background: var(--primary-glow);
    color: #000;
}
</style>
