<script setup>
import { ref, computed, onMounted, onUnmounted, watch, inject } from 'vue'
import { usePinchZoom } from '../../composables/usePinchZoom'

const canvasRef = ref(null)
const animationId = ref(null)

// Physics Parameters
const length = ref(1.0) // meters
const gravity = ref(9.8) // m/s^2
const mass = ref(1.0) // kg (visual size only)
const initialAngle = ref(30) // degrees
const dampingCoeff = ref(0.02) // Natural air resistance approx



// Mobile Panel State - use injected state from Lab.vue
const isPanelCollapsed = inject('isRightSidebarCollapsed', ref(true))

// State
let theta = (initialAngle.value * Math.PI) / 180
let omega = 0
let time = 0
const isRunning = ref(false)
const showTrace = ref(false)

// Stopwatch
const stopwatchTime = ref(0)
const isStopwatchRunning = ref(false)
let stopwatchInterval = null

// Graph State
const showGraph = ref(false)
const graphData = ref([])
let prevOmega = 0

const containerRef = ref(null)

// --- Zoom State ---
const zoomLevel = ref(1)
const panX = ref(0)
const panY = ref(0)

usePinchZoom(containerRef, {
    onPinch: ({ deltaScale }) => {
        zoomLevel.value = Math.max(0.5, Math.min(zoomLevel.value * deltaScale, 3))
    },
    onPan: ({ deltaX, deltaY }) => {
        panX.value += deltaX / zoomLevel.value
        panY.value += deltaY / zoomLevel.value
    }
})

// Canvas dimensions
let width = 600
let height = 400
let origin = { x: 300, y: 50 }
let scale = 250 // pixels per meter

const reset = () => {
    theta = (initialAngle.value * Math.PI) / 180
    omega = 0
    prevOmega = 0
    time = 0
    graphData.value = [] // Clear graph
    isRunning.value = false
    draw()
}

const toggleSimulation = () => {
    isRunning.value = !isRunning.value
}

const physicsStep = (dt) => {
    // Semi-implicit Euler integration (more stable)
    
    // Gravitational acceleration: -(g/L) * sin(theta)
    let alpha = -(gravity.value / length.value) * Math.sin(theta)
    
    // Damping acceleration: -(b/m) * omega
    // b is dampingCoeff, m is mass
    const dampingAlpha = -(dampingCoeff.value / mass.value) * omega
    alpha += dampingAlpha
    
    // Update velocity
    omega += alpha * dt
    
    // Peak Detection for Graph (Velocity zero-crossing)
    if (prevOmega * omega < 0 && time > 0.1) {
        // Turning point found. Amplitude is current theta (approx)
        const amp = Math.abs(theta * 180 / Math.PI) // Convert to degrees for easier reading? Or keep steps? 
        // Request says "square of amplitude". Let's use degrees squared for readable scale or rads?
        // Degrees is friendlier.
        const ampSq = amp * amp
        graphData.value.push({ t: time, y: ampSq })
    }
    prevOmega = omega
    
    // Update position using new velocity
    theta += omega * dt
    
    time += dt
}

const draw = () => {
    const canvas = canvasRef.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    
    // Clear
    ctx.clearRect(0, 0, width, height)
    
    ctx.save()
    // Global Camera Transform
    const cx = width / 2
    const cy = height / 2
    ctx.translate(cx + panX.value * zoomLevel.value, cy + panY.value * zoomLevel.value)
    ctx.scale(zoomLevel.value, zoomLevel.value)
    ctx.translate(-cx, -cy)

    // Draw Grid (Technical Background)
    ctx.save()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.lineWidth = 1
    const gridSize = 50
    // Vertical lines
    for(let x = origin.x % gridSize; x < width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
    }
    // Horizontal lines
    for(let y = origin.y % gridSize; y < height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
    }
    ctx.restore()
    
    // Draw Support Bar
    ctx.save()
    ctx.shadowColor = 'black'
    ctx.shadowBlur = 10
    ctx.fillStyle = '#444'
    ctx.fillRect(origin.x - 60, origin.y - 4, 120, 8)
    // Highlight
    ctx.fillStyle = '#666'
    ctx.fillRect(origin.x - 60, origin.y - 4, 120, 2)
    ctx.restore()
    
    // Calculate Bob Position
    const bobX = origin.x + length.value * scale * Math.sin(theta)
    const bobY = origin.y + length.value * scale * Math.cos(theta)
    
    // Draw String
    ctx.beginPath()
    ctx.moveTo(origin.x, origin.y)
    ctx.lineTo(bobX, bobY)
    ctx.lineWidth = 1.5
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.stroke()
    
    // Draw Bob (Metallic)
    const bobRadius = 15 * Math.sqrt(mass.value)
    
    // Shadow
    ctx.save()
    ctx.beginPath()
    ctx.arc(bobX, bobY, bobRadius, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.shadowColor = 'black'
    ctx.shadowBlur = 15
    ctx.fill()
    ctx.restore()
    
    // Metallic Bob Gradient
    const gradient = ctx.createRadialGradient(
        bobX - bobRadius * 0.3, bobY - bobRadius * 0.3, bobRadius * 0.1,
        bobX, bobY, bobRadius
    )
    gradient.addColorStop(0, '#eef')
    gradient.addColorStop(0.3, '#00d4ff')
    gradient.addColorStop(1, '#005f7f')
    
    ctx.beginPath()
    ctx.arc(bobX, bobY, bobRadius, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()
    
    // Rim highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 1
    ctx.stroke()
    
    // Draw Trace (optional feature)
    if (showTrace.value) {
        // Implementation for trace would go here
    }
    
    ctx.restore() // Pop Camera
}


const animate = () => {
    if (isRunning.value) {
        // Run physics loop closer to 60fps
        const dt = 1/60
        physicsStep(dt)
        draw()
    }
    animationId.value = requestAnimationFrame(animate)
}

// Watchers for controls to update visuals immediately when paused
watch([length, mass, initialAngle], () => {
    if (!isRunning.value) {
        theta = (initialAngle.value * Math.PI) / 180
        draw()
    }
})

onMounted(() => {
    const canvas = canvasRef.value
    if (!canvas || !canvas.parentElement) return

    const updateDimensions = () => {
        width = canvas.parentElement.clientWidth
        height = canvas.parentElement.clientHeight
        canvas.width = width
        canvas.height = height
        origin = { x: width / 2, y: 50 }
        
        // Responsive Scaling
        if (width < 600) {
            scale = 180 // Smaller scale for mobile
        } else {
            scale = 250 // Standard scale for desktop
        }
        
        draw()
    }

    // Initial draw
    updateDimensions()
    animate()
    
    // Use ResizeObserver for robust tracking of container size changes
    const resizeObserver = new ResizeObserver(() => {
        updateDimensions()
    })
    
    resizeObserver.observe(canvas.parentElement)
    
    // Store observer to cleanup
    canvas._resizeObserver = resizeObserver
})

onUnmounted(() => {
    cancelAnimationFrame(animationId.value)
    clearInterval(stopwatchInterval)
    if (canvasRef.value && canvasRef.value._resizeObserver) {
        canvasRef.value._resizeObserver.disconnect()
    }
})

// Stopwatch Logic
const laps = ref([])

const toggleStopwatch = () => {
    if (isStopwatchRunning.value) {
        clearInterval(stopwatchInterval)
        isStopwatchRunning.value = false
    } else {
        isStopwatchRunning.value = true
        const startTime = Date.now() - stopwatchTime.value
        stopwatchInterval = setInterval(() => {
            stopwatchTime.value = Date.now() - startTime
        }, 10)
    }
}

const recordLap = () => {
    if (stopwatchTime.value > 0) {
        laps.value.unshift({
            id: laps.value.length + 1,
            time: stopwatchTime.value,
            formatted: formatTime(stopwatchTime.value)
        })
    }
}

const resetStopwatch = () => {
    clearInterval(stopwatchInterval)
    isStopwatchRunning.value = false
    stopwatchTime.value = 0
    laps.value = []
}

const formatTime = (ms) => {
    const s = Math.floor(ms / 1000)
    const m = Math.floor(ms % 1000 / 10)
    return `${s}.${m.toString().padStart(2, '0')}s`
}

// Graph Computeds
const maxTime = computed(() => {
    if (graphData.value.length === 0) return 10
    return Math.max(10, graphData.value[graphData.value.length - 1].t)
})

const maxAmpSq = computed(() => {
    // Fixed max range based on initial angle squared? Or dynamic?
    // Dynamic is better for small angles.
    if (graphData.value.length === 0) return initialAngle.value * initialAngle.value
    // Should scale to initial max?
    return Math.max(1, graphData.value[0]?.y || 100)
})

const scaledGraphPoints = computed(() => {
    const margin = 50
    const w = 600 - margin * 2 // 500
    const h = 400 - margin * 2 // 300
    
    return graphData.value.map(p => ({
        x: margin + (p.t / maxTime.value) * w, // Time X
        y: 350 - (p.y / maxAmpSq.value) * h    // Amp^2 Y (Inverted)
    }))
})

const graphPath = computed(() => {
    if (scaledGraphPoints.value.length === 0) return ''
    return 'M ' + scaledGraphPoints.value.map(p => `${p.x} ${p.y}`).join(' L ')
})

const decayEquation = computed(() => {
    // A^2(t) = A0^2 * e^(-(b/m)t)
    const A0sq = (initialAngle.value * initialAngle.value).toFixed(0)
    const exponent = (dampingCoeff.value / mass.value).toFixed(3)
    return `A²(t) ≈ ${A0sq} • e^(-${exponent}t)`
})

const xAxisTicks = computed(() => {
    const ticks = []
    const margin = 50
    const w = 600 - margin * 2
    // 5 ticks
    for (let i = 0; i <= 5; i++) {
        const val = (maxTime.value * i) / 5
        const x = margin + (val / maxTime.value) * w
        ticks.push({ x, val: val.toFixed(1) })
    }
    return ticks
})

const yAxisTicks = computed(() => {
    const ticks = []
    const margin = 50
    const h = 400 - margin * 2
    // 5 ticks
    for (let i = 0; i <= 5; i++) {
        const val = (maxAmpSq.value * i) / 5
        const y = 350 - (val / maxAmpSq.value) * h
        ticks.push({ y, val: Math.round(val) }) // Round for cleaner display
    }
    return ticks
})
</script>

<template>
  <div class="sim-container">
    <div class="canvas-area" ref="containerRef">
        <canvas ref="canvasRef"></canvas>
        
        <!-- Graph Overlay -->
        <div v-if="showGraph" class="graph-overlay">
            <svg width="100%" height="100%" viewBox="0 0 600 400" preserveAspectRatio="none">
                <!-- Grid & Axes -->
                <line x1="50" y1="350" x2="580" y2="350" stroke="#fff" stroke-width="2" /> <!-- X Axis (Time) -->
                <line x1="50" y1="350" x2="50" y2="50" stroke="#fff" stroke-width="2" /> <!-- Y Axis (Amp^2) -->
                
                <!-- Labels -->
                <text x="300" y="390" fill="#fff" text-anchor="middle" font-size="14">Time (s)</text>
                <text x="20" y="200" fill="#fff" text-anchor="middle" font-size="14" transform="rotate(-90, 20, 200)">Amplitude² (deg²)</text>
                
                <!-- Concept Note -->
                <text x="80" y="30" fill="#aaa" font-size="12" font-style="italic">Energy (E) ∝ A²</text>
                
                <!-- Equation Display -->
                <text x="580" y="30" fill="#00d4ff" text-anchor="end" font-size="16" font-family="monospace" font-weight="bold">{{ decayEquation }}</text>
                
                <!-- X Axis Ticks -->
                <g v-for="(tick, i) in xAxisTicks" :key="'x'+i">
                    <line :x1="tick.x" y1="350" :x2="tick.x" y2="355" stroke="#fff" stroke-width="1" />
                    <text :x="tick.x" y="370" fill="#ccc" text-anchor="middle" font-size="10">{{ tick.val }}</text>
                </g>

                <!-- Y Axis Ticks -->
                <g v-for="(tick, i) in yAxisTicks" :key="'y'+i">
                    <line x1="45" :y1="tick.y" x2="50" :y2="tick.y" stroke="#fff" stroke-width="1" />
                    <text x="40" :y="tick.y + 4" fill="#ccc" text-anchor="end" font-size="10">{{ tick.val }}</text>
                </g>
                
                <!-- Data Path -->
                <path :d="graphPath" fill="none" stroke="#00d4ff" stroke-width="2" />
                
                <!-- Points -->
                <circle v-for="(p, i) in scaledGraphPoints" :key="i" :cx="p.x" :cy="p.y" r="3" fill="#ffd700" />
            </svg>
            <div class="graph-bg"></div>
        </div>
    </div>
    
    <aside class="controls-panel glass-panel" :class="{ 'collapsed': isPanelCollapsed }">
        <!-- Floating Stopwatch (Now part of Controls Panel Top) -->
        <div class="top-stopwatch glass-inset">
            <div class="label-row">
                <label>⏱️ Stopwatch</label>
                <span class="value timer-display">{{ formatTime(stopwatchTime) }}</span>
            </div>
            <div class="btn-group">
                <button @click="toggleStopwatch" :class="{ active: isStopwatchRunning }">
                    {{ isStopwatchRunning ? 'Pause' : 'Start' }}
                </button>
                <button @click="recordLap" :disabled="stopwatchTime === 0">Lap</button>
                <button @click="resetStopwatch">Reset</button>
            </div>
            
            <!-- Laps List (Conditional/Compact) -->
            <div v-if="laps.length > 0" class="laps-list scroll-shadow">
                <div v-for="lap in laps" :key="lap.id" class="lap-item">
                    <span class="lap-num">L{{ lap.id }}</span>
                    <span class="lap-time">{{ lap.formatted }}</span>
                </div>
            </div>
        </div>

        <div class="header">
            <h3>Controls</h3>
            <div class="main-actions" @click.stop>
                <button class="play-btn" @click="toggleSimulation">
                    {{ isRunning ? '⏸' : '▶' }}
                </button>
                <button class="reset-btn" @click="reset" title="Reset Simulation">
                    ↺
                </button>
            </div>
        </div>
        
        <div class="scroll-content">
            
            <div class="control-group">
                <div class="label-row">
                    <label>Length (L)</label>
                    <span class="value">{{ length }} m</span>
                </div>
                <div class="slider-container">
                    <input type="range" v-model.number="length" min="0.1" max="2.0" step="0.1">
                    <div class="slider-track" :style="{ width: ((length - 0.1) / (2.0 - 0.1)) * 100 + '%' }"></div>
                </div>
            </div>
            
            <div class="control-group">
                <div class="label-row">
                     <label>Mass (m)</label>
                     <span class="value">{{ mass }} kg</span>
                </div>
                <div class="slider-container">
                    <input type="range" v-model.number="mass" min="0.5" max="5.0" step="0.5">
                     <div class="slider-track" :style="{ width: ((mass - 0.5) / (5.0 - 0.5)) * 100 + '%' }"></div>
                </div>
            </div>
            
            <div class="control-group">
                <div class="label-row">
                    <label>Gravity (g)</label>
                    <span class="value">{{ gravity }} m/s²</span>
                </div>
                <div class="slider-container">
                    <input type="range" v-model.number="gravity" min="1.6" max="20.0" step="0.1">
                     <div class="slider-track" :style="{ width: ((gravity - 1.6) / (20.0 - 1.6)) * 100 + '%' }"></div>
                </div>
            </div>
            
             <div class="control-group">
                <div class="label-row">
                    <label>Initial Angle</label>
                    <span class="value">{{ initialAngle }}°</span>
                </div>
                <div class="slider-container">
                    <input type="range" v-model.number="initialAngle" min="5" max="90" step="5" :disabled="isRunning">
                     <div class="slider-track" :style="{ width: ((initialAngle - 5) / (90 - 5)) * 100 + '%' }"></div>
                </div>
            </div>

            <div class="control-group">
                <div class="label-row">
                    <label>Dissipation (Damping)</label>
                    <span class="value">{{ dampingCoeff }}</span>
                </div>
                <div class="slider-container">
                    <input type="range" v-model.number="dampingCoeff" min="0" max="0.5" step="0.01">
                     <div class="slider-track" :style="{ width: (dampingCoeff / 0.5) * 100 + '%' }"></div>
                </div>
            </div>
            
            <div class="info-box glass-inset">
                 <h4>Physics Data</h4>
                 <div class="data-row">
                    <span>Period (T):</span>
                    <span class="highlight">≈ {{ (2 * Math.PI * Math.sqrt(length/gravity)).toFixed(2) }}s</span>
                 </div>
                 <div class="formula">T = 2π√(L/g)</div>
            </div>

            <!-- Graph Toggle (Bottom) -->
            <div class="control-group">
                <button class="btn-primary" @click="showGraph = !showGraph" style="background: var(--primary-glow); color:#000;">
                    {{ showGraph ? 'Hide Graph' : 'Show Energy Graph' }}
                </button>
            </div>
        </div>
    </aside>
  </div>
</template>

<style scoped>

/* Main Container Gradient */
.sim-container {
    display: flex;
    flex-direction: row;
    height: 100%;
    width: 100%;
    overflow: hidden;
    background: linear-gradient(135deg, #050505 0%, #0a0a10 100%);
}

.canvas-area {
    flex: 1;
    position: relative;
    background: radial-gradient(circle at center, #151525 0%, #000 100%);
    overflow: hidden;
    cursor: crosshair;
}

.controls-panel {
    width: 320px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    background: rgba(15, 23, 42, 0.9); /* Match Exp 2 Darker Blue-Slate */
    backdrop-filter: blur(20px);
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    transition: transform 0.3s ease, width 0.3s ease;
    z-index: 20;
}

.controls-panel.collapsed {
    width: 0;
    overflow: hidden;
    border: none;
}

.header {
    padding: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid rgba(255,255,255,0.08);
}

.header h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    letter-spacing: 0.5px;
    color: #fff;
}

.main-actions {
    display: flex;
    gap: 0.8rem;
}

.play-btn, .reset-btn {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.play-btn {
    background: var(--primary-glow, #00d4ff);
    color: #000;
    box-shadow: 0 0 15px rgba(0, 212, 255, 0.3);
}

.play-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
}

.reset-btn {
    background: rgba(255,255,255,0.1);
    color: #fff;
}

.reset-btn:hover {
    background: rgba(255,255,255,0.2);
    transform: rotate(180deg);
}

.scroll-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

/* Custom Scrollbar */
.scroll-content::-webkit-scrollbar {
    width: 6px;
}
.scroll-content::-webkit-scrollbar-track {
    background: transparent;
}
.scroll-content::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.1);
    border-radius: 3px;
}

.control-group {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
}

.label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9rem;
    color: var(--text-secondary, #aaa);
}

.label-row .value {
    color: #fff;
    font-family: monospace;
    background: rgba(255,255,255,0.1);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.85rem;
}

/* Premium Technical Range Slider */
.slider-container {
    position: relative;
    height: 8px; /* Slightly thicker for premium feel */
    background: rgba(255, 255, 255, 0.05);
    border-radius: 4px;
    display: flex;
    align-items: center;
    border: 1px solid rgba(255, 255, 255, 0.03);
}

.slider-track {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background: linear-gradient(90deg, rgba(0, 212, 255, 0.3), rgba(0, 212, 255, 0.8));
    border-radius: 4px;
    pointer-events: none;
    box-shadow: 0 0 12px rgba(0, 212, 255, 0.2);
}

input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 100%;
    background: transparent;
    position: absolute;
    left: 0;
    top: 0;
    margin: 0;
    z-index: 5;
    cursor: pointer;
}

input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 24px;
    background: #fff;
    border: 2px solid var(--primary-glow);
    border-radius: 4px;
    cursor: pointer;
    box-shadow: 0 0 15px rgba(0, 212, 255, 0.4);
    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

input[type="range"]::-webkit-slider-thumb:hover {
    transform: scaleX(1.1) scaleY(1.05);
    background: var(--primary-glow);
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.6);
}

input[type="range"]:active::-webkit-slider-thumb {
    transform: scale(0.95);
    background: #fff;
}

/* ... (other slider styles) ... */

/* New Stopwatch Styles - Premium Polish */
.timer-display {
    font-family: 'JetBrains Mono', monospace;
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--primary-glow);
    background: rgba(0,0,0,0.4) !important;
    min-width: 120px;
    text-align: center;
    padding: 8px 12px !important;
    border: 1px solid rgba(0, 212, 255, 0.15);
    border-radius: 8px;
    text-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
    letter-spacing: 1px;
}

.btn-group {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0.6rem;
    margin-top: 1rem;
}

.btn-group button {
    padding: 0.5rem;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-radius: 6px;
    transition: all 0.2s ease;
    border: 1px solid transparent;
}

/* Primary Action (Start/Pause) */
.btn-group button:first-child {
    background: rgba(0, 212, 255, 0.1);
    color: #00d4ff;
    border-color: rgba(0, 212, 255, 0.2);
}

.btn-group button:first-child.active {
    background: rgba(255, 200, 0, 0.15);
    color: #ffd700;
    border-color: rgba(255, 200, 0, 0.3);
}

/* Secondary Actions */
.btn-group button:not(:first-child) {
    background: rgba(255, 255, 255, 0.05);
    color: #aaa;
}

.btn-group button:hover {
    transform: translateY(-1px);
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
}

.laps-list {
    margin-top: 1.2rem;
    max-height: 140px;
    overflow-y: auto;
    padding: 0.6rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    background: rgba(0,0,0,0.3);
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.05);
}

/* Custom Scrollbar for Laps */
.laps-list::-webkit-scrollbar {
    width: 4px;
}
.laps-list::-webkit-scrollbar-track {
    background: rgba(0,0,0,0.1);
}
.laps-list::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.15);
    border-radius: 2px;
}

.lap-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.85rem;
    padding: 0.6rem 0.8rem;
    border-radius: 6px;
    background: rgba(255,255,255,0.02);
    border-left: 2px solid transparent;
    transition: background 0.2s;
}

.lap-item:hover {
    background: rgba(255,255,255,0.05);
}

.lap-item:first-child {
    background: linear-gradient(90deg, rgba(0, 212, 255, 0.1), transparent);
    border-left: 2px solid var(--primary-glow);
}

.lap-num {
    color: #666;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
}

.lap-time {
    font-family: 'JetBrains Mono', monospace;
    color: #eee;
    font-weight: 500;
}

/* Mobile Tweaks */
@media (max-width: 768px) {
    .btn-group button {
        padding: 0.6rem 0.2rem;
        font-size: 0.7rem;
    }
}

/* Top Stopwatch (Fixed above controls) */
.top-stopwatch {
    padding: 1.5rem;
    background: rgba(10, 10, 15, 0.4);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    flex-shrink: 0;
}

.top-stopwatch .timer-display {
    font-size: 1.6rem;
    margin-bottom: 0.5rem;
}

.top-stopwatch .laps-list {
    margin-top: 1rem;
    max-height: 100px;
}

/* Medium Screens */
@media (max-width: 1024px) {
    .controls-panel {
        width: 260px;
    }
}

/* Mobile Screens - Vertical Split Layout (Match Exp 2) */
@media (max-width: 768px) {
    .sim-container {
        flex-direction: column;
        height: 100%;
        overflow: hidden;
    }
    
    .canvas-area {
        height: 55%;
        width: 100%;
        position: relative;
        flex: none;
        background: radial-gradient(circle at center, #1e293b 0%, #000 100%);
    }

    .controls-panel {
        width: 100%;
        height: 45%;
        max-height: none;
        border-left: none;
        border-top: 1px solid rgba(255,255,255,0.1);
        display: flex;
        flex-direction: column;
        background: rgba(10, 10, 15, 0.95);
        transform: none !important; /* Reset drawer transforms */
        position: static;
    }

    .controls-panel.collapsed {
        height: 0;
        width: 100%;
        overflow: hidden;
    }

    .top-stopwatch {
        padding: 1rem;
        background: rgba(0, 0, 0, 0.2);
    }

    .header {
        padding: 0.8rem 1.5rem;
    }
    
    .mobile-drag-handle {
        display: none; /* No dragging in split view */
    }

    .scroll-content {
        padding: 1.5rem;
        padding-bottom: 2rem;
    }
}

/* Graph Overlay Styles */
.graph-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 15;
    pointer-events: none; /* Let clicks pass through to canvas if needed, or maybe capture for tooltip? */
    display: flex;
    align-items: center;
    justify-content: center;
}

.graph-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.6);
    z-index: -1;
}
</style>
