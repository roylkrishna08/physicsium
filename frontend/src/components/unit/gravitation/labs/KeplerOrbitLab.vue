<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
    mode: {
        type: String,
        default: 'combined' // 'law1', 'law2', 'combined'
    }
})

// --- State ---
const isRunning = ref(true)
const eccentricity = ref(0.6) 
const showSweptAreas = ref(false)
const showOrbitDetails = ref(true)
const animationSpeed = ref(0.5)

// Configure based on mode
onMounted(() => {
    if (props.mode === 'law1') {
        showSweptAreas.value = false
        showOrbitDetails.value = true
        eccentricity.value = 0.5 // Start with a clear ellipse
    } else if (props.mode === 'law2') {
        showSweptAreas.value = true
        showOrbitDetails.value = true // Orbit path needed context
        eccentricity.value = 0.6 // Higher e makes 2nd law more obvious
    }
})

// ... physics ...

const width = 800
const height = 500
const center = { x: width / 2, y: height / 2 }
const a = 200 // Semi-major axis in pixels
const numOrbitPoints = 100

// --- Physics Engine ---
const time = ref(0)
let animationFrameId = null

// Kepler's Equation Solver: M = E - e sin(E)
// We need E given M. Solve using Newton-Raphson.
const solveKepler = (M, e) => {
    let E = M
    for (let i = 0; i < 10; i++) {
        E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E))
    }
    return E
}

// Get position (x,y) for a given mean anomaly M
const getPosition = (M, e) => {
    const E = solveKepler(M, e)
    // True Anomaly (nu)
    const P = a * (1 - e*e) // Semi-latus rectum (wrong formula context? Use standard parametric)
    // Standard parametric ellipse equations relative to center:
    // x = a * cos(E)
    // y = b * sin(E)
    // But Sun is at focus. Focus offset c = a * e.
    // If center of ellipse is (0,0), Sun is at (c, 0) or (-c, 0).
    // Let's put Sun at (0,0) for easy view? No, usually ellipse center is center.
    // Let's put Ellipse Center at (width/2, height/2).
    
    const b = a * Math.sqrt(1 - e * e)
    const c = a * e
    
    // Position relative to Ellipse Center
    const x_ellipse = a * Math.cos(E)
    const y_ellipse = -b * Math.sin(E) // negative to flip y for screen coords (up is down)
    
    // Shift so Sun (focus) is at the center of visualization or fixed point?
    // Let's keep the Ellipse centered on screen.
    // Sun is at (-c, 0) relative to Ellipse Center.
    
    return {
        x: center.x + x_ellipse,
        y: center.y + y_ellipse,
        x_rel: x_ellipse,
        y_rel: y_ellipse
    }
}

// --- Computed ---

// --- Computed ---

// Sun Position (Fixed at Center)
const sunPos = computed(() => {
    return {
        x: center.x, 
        y: center.y
    }
})

// Star/Ellipse Logic
// We want the Sun to be the "primary" focus.
// Standard Ellipse: Center (0,0), Foci at (+/- ae, 0).
// Let's place the Sun (Focus 1) at (center.x, center.y).
// The Ellipse Center will be shifted relative to the Sun.
// If Sun is the Right Focus (+ae relative to geometric center):
// Geometric Center = SunPos - ae.
// If Sun is Left Focus (-ae relative to geometric center):
// Geometric Center = SunPos + ae.
// Let's make Sun the Right Focus so Perihelion is to the Right for E=0? 
// In previous logic: x = a(cosE - e). E=0 => x=a(1-e) (Pos). E=PI => x=-a(1+e) (Neg).
// This math E=0 at Perihelion implies Sun is at Origin, Orbit Center is at (-ae, 0).
// So Ellipse Center is shifted LEFT of Sun.

const ellipseCenterPos = computed(() => {
    const ae = a * eccentricity.value
    return {
        x: center.x - ae,
        y: center.y
    }
})

// Empty Focus Position (Focus 2)
// Symmetrical to Sun across Ellipse Center.
// Distance from Sun to Focus 2 is 2*ae.
// Since Ellipse Center is Left of Sun, Focus 2 is Left of Ellipse Center.
// Focus 2 x = Sun x - 2ae.
const emptyFocusPos = computed(() => {
    const ae2 = 2 * a * eccentricity.value
    return {
        x: center.x - ae2,
        y: center.y
    }
})

// Planet Position
const planetPos = computed(() => {
    const E = solveKepler(time.value, eccentricity.value)
    const e = eccentricity.value
    const b = a * Math.sqrt(1 - e * e)
    
    // Position relative to Sun (Focus at 0,0)
    // Formula: x = a(cos E - e), y = b sin E
    // (Note: y sign depends on coordinate system, usually y up. SVG y down.)
    
    const x_rel = a * (Math.cos(E) - e)
    const y_rel = -b * Math.sin(E) // y-flip for SVG
    
    return {
        x: center.x + x_rel,
        y: center.y + y_rel 
    }
})

// Orbit Path (Geometric properties for SVG)
const orbitPath = computed(() => {
    const e = eccentricity.value
    const b = a * Math.sqrt(1 - e * e)
    return { 
        rx: a, 
        ry: b, 
        cx: ellipseCenterPos.value.x, 
        cy: ellipseCenterPos.value.y 
    }
})

// Swept Areas (Law 2)
const sweptSectors = ref([])

// Logic to accumulate sectors
watch(time, (newTime) => {
    if (!showSweptAreas.value) {
        if (sweptSectors.value.length > 0) sweptSectors.value = []
        return
    }
    
    const count = 12
    const dt = (2 * Math.PI) / count
    const sectors = []
    
    for (let i = 0; i < count; i += 2) {
        const t1 = i * dt
        const t2 = (i + 1) * dt
        
        // Helper to get pos at arbitrary t
        const getP = (M) => {
             const E = solveKepler(M, eccentricity.value)
             const e = eccentricity.value
             const b = a * Math.sqrt(1 - e * e)
             return {
                 x: center.x + a * (Math.cos(E) - e),
                 y: center.y - b * Math.sin(E)
             }
        }

        const p1 = getP(t1)
        
        // Build path
        let pathStr = `M ${sunPos.value.x} ${sunPos.value.y} L ${p1.x} ${p1.y}`
        
        const steps = 10
        for(let j=1; j<=steps; j++) {
            const t = t1 + (t2 - t1) * (j/steps)
            const p = getP(t)
            pathStr += ` L ${p.x} ${p.y}`
        }
        
        pathStr += ` L ${sunPos.value.x} ${sunPos.value.y} Z`
        sectors.push(pathStr)
    }
    sweptSectors.value = sectors
}, { immediate: true }) // Re-run when e changes effectively? No, need to watch e too.

watch(eccentricity, () => {
    // Trigger update of sectors
    const t = time.value
    time.value = t + 0.0001 // Force watcher trigger hack or extract logic
})

// --- Animation Loop ---
const animate = () => {
    if (isRunning.value) {
        time.value += 0.02 * animationSpeed.value
        if (time.value > 2 * Math.PI) {
            time.value -= 2 * Math.PI
        }
    }
    animationFrameId = requestAnimationFrame(animate)
}

onMounted(() => {
    animationFrameId = requestAnimationFrame(animate)
})

onUnmounted(() => {
    cancelAnimationFrame(animationFrameId)
})

</script>

<template>
  <div class="kepler-lab glass-panel">
    <div class="controls-header">
        <div class="title-group">
            <h3 v-if="mode === 'law1'">Interactive: Law of Orbits</h3>
            <h3 v-else-if="mode === 'law2'">Interactive: Law of Areas</h3>
            <h3 v-else>Orbital Mechanics Simulator</h3>
            <p class="subtitle" v-if="mode === 'law1'">Change eccentricity to see orbit shape.</p>
            <p class="subtitle" v-else-if="mode === 'law2'">Observe the planet's speed and swept areas.</p>
        </div>
        
        <div class="controls-row">
            <div class="control-item" v-if="mode !== 'law2'">
                <label>Eccentricity (e): {{ eccentricity.toFixed(2) }}</label>
                <input type="range" v-model.number="eccentricity" min="0" max="0.85" step="0.01" class="slider" />
            </div>
            
            <!-- Law 2 Controls: Speed only? Or allow e change too? User said separate. Usually Law 2 is best shown with fixed high e. But interactive e is nice. Let's keep e slider for Law 2 but maybe optional. User said "according to physics", which allows e change. I will keep it but emphasizes areas. -->
            
            <div class="control-item toggles">
                <!-- Law 1 Toggles -->
                <button v-if="mode === 'law1' || mode === 'combined'" @click="showOrbitDetails = !showOrbitDetails" :class="{ active: showOrbitDetails }">
                    {{ showOrbitDetails ? 'Hide Details' : 'Show Focus & Axis' }}
                </button>
                
                <!-- Law 2 Toggles -->
                <button v-if="mode === 'law2' || mode === 'combined'" @click="showSweptAreas = !showSweptAreas" :class="{ active: showSweptAreas }">
                    {{ showSweptAreas ? 'Hide Swept Areas' : 'Show Swept Areas' }}
                </button>

                <button @click="isRunning = !isRunning" class="icon-btn">
                    {{ isRunning ? '⏸' : '▶' }}
                </button>
            </div>
        </div>
    </div>

    <div class="canvas-wrapper">
        <svg :viewBox="`0 0 ${width} ${height}`" class="interactive-svg">
            <!-- Defs for Glows and Gradients -->
            <defs>
                <filter id="glow-blur" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                
                <radialGradient id="sunGradient">
                    <stop offset="0%" stop-color="#fff" />
                    <stop offset="20%" stop-color="#fbbf24" />
                    <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.8" />
                </radialGradient>

                <radialGradient id="planetGradient" cx="30%" cy="30%">
                    <stop offset="0%" stop-color="#60a5fa" />
                    <stop offset="100%" stop-color="#2563eb" />
                </radialGradient>
                
                <!-- Starry Background Pattern (Simulated) -->
                <pattern id="starField" width="200" height="200" patternUnits="userSpaceOnUse">
                    <circle cx="10" cy="10" r="1" fill="rgba(255,255,255,0.3)" />
                    <circle cx="50" cy="80" r="0.8" fill="rgba(255,255,255,0.2)" />
                    <circle cx="130" cy="40" r="1.2" fill="rgba(255,255,255,0.4)" />
                    <circle cx="160" cy="150" r="0.9" fill="rgba(255,255,255,0.2)" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="#0f172a" /> <!-- Deep space blue-black -->
            <rect width="100%" height="100%" fill="url(#starField)" />

            <!-- Orbit Path (1st Law) -->
            <g v-if="showOrbitDetails || true"> 
                <!-- Base faint path -->
                <ellipse 
                    :cx="orbitPath.cx" 
                    :cy="orbitPath.cy" 
                    :rx="orbitPath.rx" 
                    :ry="orbitPath.ry"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.1)"
                    stroke-width="1"
                />
                <!-- Glowing Orbital Rail -->
                <ellipse 
                    :cx="orbitPath.cx" 
                    :cy="orbitPath.cy" 
                    :rx="orbitPath.rx" 
                    :ry="orbitPath.ry"
                    fill="none"
                    stroke="#38bdf8"
                    stroke-width="2"
                    stroke-dasharray="0"
                    filter="url(#glow-blur)"
                    opacity="0.6"
                />
                
                <!-- Major Axis Line -->
                <line v-if="showOrbitDetails && mode === 'law1'"
                    :x1="center.x - a" :y1="center.y" 
                    :x2="center.x + a" :y2="center.y" 
                    stroke="rgba(255,255,255,0.2)" 
                    stroke-width="1"
                    stroke-dasharray="4,4"
                />

                <!-- Sun (Focus 1) - ALWAYS VISIBLE -->
                <g :transform="`translate(${sunPos.x}, ${sunPos.y})`">
                    <circle r="20" fill="url(#sunGradient)" filter="url(#glow-blur)" opacity="0.8" />
                    <circle r="12" fill="url(#sunGradient)" />
                </g>

                <!-- Empty Focus (Focus 2) -->
                <g v-if="showOrbitDetails && mode === 'law1' && eccentricity > 0.05" :transform="`translate(${emptyFocusPos.x}, ${emptyFocusPos.y})`">
                    <circle r="3" fill="rgba(255,255,255,0.3)" />
                    <text y="15" fill="rgba(255,255,255,0.3)" font-size="10" text-anchor="middle">Focus 2</text>
                </g>
            </g>

            <!-- Swept Areas (Law 2) -->
            <g v-if="showSweptAreas">
                <path v-for="(d, i) in sweptSectors" :key="i" :d="d" fill="rgba(52, 211, 153, 0.15)" stroke="rgba(52, 211, 153, 0.3)" stroke-width="1" />
            </g>

            <!-- Planet -->
            <g :transform="`translate(${planetPos.x}, ${planetPos.y})`">
                <circle r="10" fill="url(#planetGradient)" filter="url(#glow-blur)" />
                <!-- Subtle trail or glow? -->
            </g>
            
            <!-- Radius Vector (Sun to Planet) -->
            <line 
                :x1="sunPos.x" :y1="sunPos.y"
                :x2="planetPos.x" :y2="planetPos.y"
                stroke="rgba(255,255,255,0.2)"
                stroke-width="1"
            />

        </svg>
        
        <!-- Overlay Info -->
        <div class="info-overlay">
            <div class="info-item">
                <span class="label">Velocity</span>
                <!-- Velocity roughly proportional to 1/r in visualization sense (Vis-viva equation: v^2 ~ 2/r - 1/a) -->
                <div class="bar-container">
                    <div class="bar" :style="{ width: `${(1/Math.sqrt(Math.pow(planetPos.x-sunPos.x,2)+Math.pow(planetPos.y-sunPos.y,2))) * 10000}px`, maxWidth: '100px' }"></div>
                </div>
            </div>
            <div class="info-item" v-if="showSweptAreas">
                <small class="hint">Equal areas swept in equal time intervals</small>
            </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
.kepler-lab {
    display: flex;
    flex-direction: column;
    padding: 0 !important;
    overflow: hidden;
    background: rgba(0,0,0,0.3);
}

.controls-header {
    padding: 1.5rem;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    background: rgba(0,0,0,0.2);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
}

.title-group h3 {
    margin: 0;
    font-size: 1.25rem;
    color: white;
}

.subtitle {
    margin: 0;
    color: #94a3b8;
    font-size: 0.85rem;
}

.controls-row {
    display: flex;
    gap: 2rem;
    align-items: center;
}

.control-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.control-item label {
    font-size: 0.9rem;
    color: #e2e8f0;
}

.toggles {
    flex-direction: row;
}

button {
    padding: 0.5rem 1rem;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.1);
    color: white;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.9rem;
}

button:hover {
    background: rgba(255,255,255,0.2);
}

button.active {
    background: rgba(52, 211, 153, 0.2);
    border-color: #34d399;
    color: #34d399;
}

.icon-btn {
    width: 36px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.slider {
    width: 150px;
    height: 6px;
    background: rgba(255,255,255,0.1);
    border-radius: 3px;
    outline: none;
    -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    background: #60a5fa;
    border-radius: 50%;
    cursor: pointer;
}

.canvas-wrapper {
    position: relative;
    width: 100%;
    height: 400px;
    background: radial-gradient(circle at center, rgba(30, 41, 59, 0.5), rgba(15, 23, 42, 0.8));
}

.interactive-svg {
    width: 100%;
    height: 100%;
}

.sun-glow {
    filter: blur(5px);
    opacity: 0.6;
}

.info-overlay {
    position: absolute;
    bottom: 1rem;
    left: 1rem;
    background: rgba(0,0,0,0.5);
    padding: 0.8rem;
    border-radius: 8px;
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255,255,255,0.1);
}

.info-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.5rem;
}

.label {
    color: #94a3b8;
    font-size: 0.8rem;
    width: 50px;
}

.bar-container {
    width: 100px;
    height: 6px;
    background: rgba(255,255,255,0.1);
    border-radius: 3px;
    overflow: hidden;
}

.bar {
    height: 100%;
    background: #60a5fa;
    transition: width 0.1s;
}

.hint {
    color: #34d399;
    font-style: italic;
}

@media (max-width: 600px) {
    .controls-header {
        flex-direction: column;
        align-items: flex-start;
    }
    
    .controls-row {
        flex-wrap: wrap;
        width: 100%;
        justify-content: space-between;
    }
}
</style>
