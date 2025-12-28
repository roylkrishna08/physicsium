<script setup>
import { ref, computed, onMounted, onUnmounted, watch, inject } from 'vue'

const isRightSidebarCollapsed = inject('isRightSidebarCollapsed')

// --- Physics State ---
const velocity = ref(30) // Initial Velocity (u) in m/s
const angle = ref(45) // Angle (theta) in degrees
const gravity = ref(9.8) // g in m/s^2
const height = ref(0) // Initial height (h) in m
const time = ref(0) // Current simulation time
const isRunning = ref(false)
const simulationSpeed = ref(1)

// --- Canvas System ---
// 1 meter = 10 pixels roughly for visualization
const scale = ref(10) 
const canvasWidth = 800
const canvasHeight = 600
const groundY = 500 // Y coordinate of ground

let animationId = null

// --- Physics Calculations (JEE/NEET Formulas) ---

const rad = computed(() => angle.value * Math.PI / 180)
const ux = computed(() => velocity.value * Math.cos(rad.value))
const uy = computed(() => velocity.value * Math.sin(rad.value))

// Time of Flight (T)
// Formula for ground-to-ground: T = 2u*sin(theta)/g
// General formula solving: h + uy*t - 0.5*g*t^2 = 0 (solving for t when y=0)
const timeOfFlight = computed(() => {
    // If h=0: 2*uy / g
    if (height.value === 0) return (2 * uy.value) / gravity.value
    
    // Quadratic formula: 0.5*g*t^2 - uy*t - h = 0
    // t = (uy + sqrt(uy^2 + 2*g*h)) / g
    const discriminant = Math.sqrt(uy.value ** 2 + 2 * gravity.value * height.value)
    return (uy.value + discriminant) / gravity.value
})

// Max Height (H) from ground
// H = h + (u*sin(theta))^2 / (2g)
const maxHeight = computed(() => {
    return height.value + (uy.value ** 2) / (2 * gravity.value)
})

// Horizontal Range (R)
// R = ux * T
const range = computed(() => {
    return ux.value * timeOfFlight.value
})

// Instantaneous Values
const currentX = computed(() => ux.value * time.value)
const currentY = computed(() => {
    return height.value + (uy.value * time.value) - (0.5 * gravity.value * time.value ** 2)
})

const currentVx = computed(() => ux.value)
const currentVy = computed(() => uy.value - gravity.value * time.value)
const currentV = computed(() => Math.sqrt(currentVx.value ** 2 + currentVy.value ** 2))
const currentAngle = computed(() => Math.atan2(currentVy.value, currentVx.value) * 180 / Math.PI)

// --- Animation ---
const play = () => {
    if (isRunning.value) return
    isRunning.value = true
    lastFrameTime = performance.now()
    animate()
}

const pause = () => {
    isRunning.value = false
    cancelAnimationFrame(animationId)
}

const reset = () => {
    pause()
    time.value = 0
}

let lastFrameTime = 0
const animate = (timestamp) => {
    if (!isRunning.value) return
    
    // Delta time in seconds
    const dt = (timestamp - lastFrameTime) / 1000
    lastFrameTime = timestamp
    
    // Advance time
    if (time.value < timeOfFlight.value) {
        time.value += dt * simulationSpeed.value
        
        // Clamp to end
        if (time.value > timeOfFlight.value) {
            time.value = timeOfFlight.value
            pause()
        }
        
        animationId = requestAnimationFrame(animate)
    } else {
        pause()
    }
}

// Generate Trajectory Path for SVG
const trajectoryPath = computed(() => {
    let path = `M 0 ${groundY - height.value * scale.value}`
    const steps = 100
    const dt = timeOfFlight.value / steps
    
    for (let i = 0; i <= steps; i++) {
        const t = i * dt
        if (t > time.value && isRunning.value) break // Don't draw future if running? Actually draw fading future line
        
        const x = ux.value * t
        const y = height.value + (uy.value * t) - (0.5 * gravity.value * t ** 2)
        
        const canvasX = x * scale.value
        const canvasY = groundY - y * scale.value
        
        path += ` L ${canvasX} ${canvasY}`
    }
    return path
})


// Full Trajectory (Ghost line)
const fullTrajectoryPath = computed(() => {
    let path = `M 0 ${groundY - height.value * scale.value}`
    const steps = 50
    const dt = timeOfFlight.value / steps
    
    for (let i = 1; i <= steps; i++) {
        const t = i * dt
        const x = ux.value * t
        const y = height.value + (uy.value * t) - (0.5 * gravity.value * t ** 2)
        
        const canvasX = x * scale.value
        const canvasY = groundY - y * scale.value
        
        path += ` L ${canvasX} ${canvasY}`
    }
    return path
})
</script>

<template>
  <div class="sim-container">
    <div class="canvas-area">
        <svg class="main-svg" :viewBox="`0 0 ${canvasWidth} ${canvasHeight}`">
            <!-- Grid -->
            <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
                </pattern>
                <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L0,6 L9,3 z" fill="#00d4ff" />
                </marker>
                 <marker id="arrow-y" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                    <path d="M0,0 L0,6 L9,3 z" fill="#ff0055" />
                </marker>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            <!-- Ground -->
            <line x1="0" :y1="groundY" :x2="canvasWidth" :y2="groundY" stroke="#fff" stroke-width="2" />
            <text x="10" :y="groundY + 20" fill="#aaa" font-size="12">Ground (y=0)</text>

            <!-- Ghost Trajectory -->
            <path :d="fullTrajectoryPath" stroke="rgba(255,255,255,0.2)" stroke-width="2" fill="none" stroke-dasharray="5,5" />

            <!-- Active Trajectory -->
            <path :d="trajectoryPath" stroke="#00d4ff" stroke-width="3" fill="none" />

            <!-- Projectile -->
            <circle 
                :cx="currentX * scale" 
                :cy="groundY - currentY * scale" 
                r="6" 
                fill="#fff"
                stroke="#00d4ff"
                stroke-width="2"
            />
            
            <!-- Velocity Vectors -->
            <g :transform="`translate(${currentX * scale}, ${groundY - currentY * scale})`">
                <!-- Vx -->
                <line x1="0" y1="0" :x2="currentVx * 2" y2="0" stroke="#00d4ff" stroke-width="2" marker-end="url(#arrow)" />
                <!-- Vy -->
                <line x1="0" y1="0" x2="0" :y2="-currentVy * 2" stroke="#ff0055" stroke-width="2" marker-end="url(#arrow-y)" />
                <!-- Resultant V -->
                <!-- <line x1="0" y1="0" :x2="currentVx * 2" :y2="-currentVy * 2" stroke="#ffff00" stroke-width="2" stroke-dasharray="4,2" /> -->
            </g>
            
            <!-- Measurements Display on Canvas -->
            <g transform="translate(20, 40)">
                 <text fill="#fff" font-size="14">Time: {{ time.toFixed(2) }} s</text>
                 <text y="20" fill="#fff" font-size="14">Height: {{ currentY.toFixed(2) }} m</text>
                 <text y="40" fill="#fff" font-size="14">Distance: {{ currentX.toFixed(2) }} m</text>
                 <text y="60" fill="#fff" font-size="14">Velocity: {{ currentV.toFixed(2) }} m/s</text>
            </g>
        </svg>
    </div>

    <!-- Controls Panel -->
    <aside class="controls-panel glass-panel" :class="{ 'collapsed': isRightSidebarCollapsed }">
        <div class="header">
            <h3>Projectile Motion</h3>
            <div class="main-actions" style="gap: 10px;">
                 <button class="tool-btn" @click="isRunning ? pause() : play()">
                    {{ isRunning ? '⏸' : '▶' }}
                </button>
                <button class="tool-btn" @click="reset">↻</button>
            </div>
        </div>

        <div class="control-group">
            <label>Initial Velocity (u)</label>
            <input type="range" v-model.number="velocity" min="0" max="100" />
            <div class="val-display">{{ velocity }} m/s</div>
        </div>
        
        <div class="control-group">
            <label>Launch Angle (θ)</label>
            <input type="range" v-model.number="angle" min="0" max="90" />
            <div class="val-display">{{ angle }}°</div>
        </div>
        
        <div class="control-group">
            <label>Initial Height (h)</label>
            <input type="range" v-model.number="height" min="0" max="50" />
            <div class="val-display">{{ height }} m</div>
        </div>
        
        <div class="control-group">
            <label>Gravity (g)</label>
            <input type="range" v-model.number="gravity" min="1" max="20" step="0.1" />
            <div class="val-display">{{ gravity }} m/s²</div>
        </div>

        <!-- JEE/NEET Data Panel -->
        <div class="control-group highlight">
             <label>Calculated Values</label>
             <div class="data-row">
                 <span>Max Height (H):</span>
                 <span class="val">{{ maxHeight.toFixed(2) }} m</span>
             </div>
             <div class="data-row">
                 <span>Range (R):</span>
                 <span class="val">{{ range.toFixed(2) }} m</span>
             </div>
             <div class="data-row">
                 <span>Time of Flight (T):</span>
                 <span class="val">{{ timeOfFlight.toFixed(2) }} s</span>
             </div>
        </div>
        
        <div class="control-group">
             <label>Formulas</label>
             <div class="formula-box">
                 <div>R = u²sin(2θ)/g</div>
                 <div>H = u²sin²(θ)/2g</div>
                 <div>T = 2usin(θ)/g</div>
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
}

.canvas-area {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden; 
}

.main-svg {
    width: 100%;
    height: 100%;
    background: linear-gradient(to bottom, #111521 0%, #05070a 100%);
}

/* Controls Panel Styling (Reused) */
.controls-panel {
    width: 320px;
    height: 100%;
    background: rgba(10, 14, 25, 0.9);
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
    overflow-y: auto;
    transition: transform 0.3s ease;
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
    font-size: 0.85rem;
    line-height: 1.5;
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
