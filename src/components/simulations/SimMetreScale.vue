<script setup>
import { ref, onMounted, onUnmounted, watch, computed, inject } from 'vue'
import { usePinchZoom } from '../../composables/usePinchZoom'

const canvasRef = ref(null)
const animationId = ref(null)

// Injected State
const isPanelCollapsed = inject('isRightSidebarCollapsed', ref(true))

// Physics Parameters
const fulcrumPos = ref(50.0) // cm
const scaleMass = ref(100) // grams (mass of the ruler itself)
// Weights: { id, mass (g), pos (cm), type: 'known'|'unknown', color }
const weights = ref([
    { id: 1, mass: 50, pos: 10, type: 'known', color: '#00d4ff' },
    { id: 2, mass: 100, pos: 90, type: 'known', color: '#ff0055' }
])
const unknownMass = ref(Math.floor(Math.random() * 50) + 50) // Random 50-100g

// Simulation State
let currentAngle = 0 // degrees
let targetAngle = 0
let angularVelocity = 0

// Drag State
const isDragging = ref(false)
const dragId = ref(null) // weight ID
const dragMode = ref('weight') // 'weight' or 'magnifier'
let dragStartPos = 0 // cm
let dragStartX = 0 // pixels
let magDragStartX = 0
let magDragStartY = 0

// Tool State
const showMagnifier = ref(false)
const mousePos = ref({ x: 0, y: 0 })
const containerRef = ref(null)

// --- Zoom State ---
const zoomLevel = ref(1)
const panX = ref(0)
const panY = ref(0)

const { isZooming } = usePinchZoom(containerRef, {
    onPinch: ({ deltaScale }) => {
        zoomLevel.value = Math.max(0.5, Math.min(zoomLevel.value * deltaScale, 3))
    },
    onPan: ({ deltaX, deltaY }) => {
        if (isDragging.value && dragMode.value === 'magnifier') return
        panX.value += deltaX / zoomLevel.value
        panY.value += deltaY / zoomLevel.value
    }
})

// Canvas Dimensions
let width = 600
let height = 400
let scale = 1 // pixels per cm (will be calculated)

const reset = () => {
    fulcrumPos.value = 50.0
    weights.value = [
        { id: 1, mass: 50, pos: 10, type: 'known', color: '#00d4ff' },
        { id: 2, mass: 100, pos: 90, type: 'known', color: '#ff0055' }
    ]
    currentAngle = 0
    angularVelocity = 0
    draw()
}

const addUnknownWeight = () => {
    const unknown = Math.floor(Math.random() * 50) + 50
    weights.value.push({ 
        id: Date.now(), 
        mass: unknown, 
        pos: 80, 
        type: 'unknown', 
        color: '#ffd700' 
    })
    updatePhysics()
    draw()
}

const removeWeight = (index) => {
    weights.value.splice(index, 1)
    updatePhysics()
    draw()
}

const updatePhysics = () => {
    // Net Torque = Σ τ
    // τ = (pos - fulcrum) * mass * g
    // Taking counter-clockwise as positive (weights on left push down -> positive angle? No, standard physics:
    // Right side down = negative angle (clockwise).
    // Let's say Angle > 0 is Right Side Down (Clockwise).
    // Then Torque > 0 should assume standard convention.
    // Let's standard: CCW +ve (Left Down), CW -ve (Right Down).
    
    let netTorque = 0
    
    // 1. Torque from Weights
    weights.value.forEach(w => {
        // arm = (fulcrum - pos) -> if pos < fulcrum (left), arm is +ve.
        // Force is down.
        // If mass is on left, it tries to rotate CCW (+ve).
        const arm = fulcrumPos.value - w.pos
        netTorque += arm * w.mass
    })
    
    // 2. Torque from Scale Mass (acts at 50cm)
    const scaleArm = fulcrumPos.value - 50.0
    netTorque += scaleArm * scaleMass.value
    
    // Determine Target Angle
    const k = 0.5 // Stiffness/Sensitivity
    if (Math.abs(netTorque) < 50) {
        targetAngle = 0 // Balanced
    } else {
        targetAngle = Math.sign(netTorque) * 15 // Max tilt 15 degrees
    }
    
    // Smooth Transition
    currentAngle += (targetAngle - currentAngle) * 0.1
}

const drawScene = (ctx, width, height, isMagnified = false) => {
    // Center constants
    const cx = width / 2
    const cy = height / 2
    
    const pxPerCm = width / 120
    const rulerHeight = 40 
    
    // 0. Background Grid (Magnified with scene)
    ctx.save()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)' // Slightly clearer
    ctx.lineWidth = 1
    const gridSize = 50
    const offsetX = (width / 2) % gridSize
    // Draw relative to center since we are translated?
    // No, grid should be screen-space but magnified.
    // If we are in drawScene, we are translated to cx, cy.
    // We should draw grid in screen coordinates... but 'ctx' is already translated?
    // Wait, drawScene starts with: ctx.translate(cx, cy).
    // So (0,0) is center.
    // Let's draw grid covering a large area relative to center.
    const gridW = width * (isMagnified ? 2 : 1) // cover enough area
    const gridH = height * (isMagnified ? 2 : 1)
    
    for(let x = -gridW; x < gridW; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, -gridH); ctx.lineTo(x, gridH); ctx.stroke();
    }
    for(let y = -gridH; y < gridH; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(-gridW, y); ctx.lineTo(gridW, y); ctx.stroke();
    }
    ctx.restore()

    ctx.save()
    ctx.translate(cx, cy)
    
    // --- FULCRUM ---
    const fcSize = 25
    ctx.save()
    ctx.translate(0, 20) 
    
    // Prism
    const fGrad = ctx.createLinearGradient(-fcSize, 0, fcSize, fcSize)
    fGrad.addColorStop(0, '#1e293b') // Slate 800
    fGrad.addColorStop(0.5, '#475569') // Slate 600
    fGrad.addColorStop(1, '#1e293b')
    
    ctx.beginPath()
    ctx.moveTo(0, 0) // Point
    ctx.lineTo(-fcSize, fcSize * 1.5)
    ctx.lineTo(fcSize, fcSize * 1.5)
    ctx.closePath()
    ctx.fillStyle = fGrad
    ctx.fill()
    // Edge highlight
    ctx.strokeStyle = '#38bdf8' // Sky blue
    ctx.lineWidth = 2
    ctx.stroke()
    // Pivot Dot
    ctx.beginPath()
    ctx.arc(0, 0, 3, 0, Math.PI*2)
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.restore()
    
    // --- RULER TRANSFORM ---
    ctx.rotate(-currentAngle * Math.PI / 180) 
    
    // Shift calculations
    const shiftX = (50 - fulcrumPos.value) * pxPerCm
    ctx.translate(shiftX, -20) 
    
    // --- DRAW WEIGHTS ---
    const drawWeight = (w) => {
        const wx = (w.pos - 50) * pxPerCm
        const wy = 0 
        
        ctx.save()
        ctx.translate(wx, wy)
        
        // String
        ctx.strokeStyle = '#e2e8f0' // Always bright
        ctx.lineWidth = 4 

        ctx.beginPath()
        ctx.moveTo(0, 5) 
        ctx.lineTo(0, 50)
        ctx.stroke()
        
        // Weight Body - Even Larger
        const size = 25 + Math.sqrt(w.mass) * 1.0
        const topY = 50
        const hexSize = size * 0.8
        
        ctx.beginPath()
        for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3
            const x = Math.cos(angle) * hexSize
            const y = topY + hexSize + Math.sin(angle) * hexSize
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
        }
        ctx.closePath()
        
        ctx.fillStyle = w.type === 'unknown' ? '#f59e0b' : '#3b82f6'
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.stroke()
        
        // Label inside
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 11px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(w.type === 'unknown' ? '?' : w.mass, 0, topY + hexSize)
        
        ctx.restore()
    }
    weights.value.forEach(drawWeight)
    
    // --- STEEL RULER BODY ---
    // Extend ends by margin
    const margin = 1 * pxPerCm // 1cm margin on visual ruler
    const rLeft = -50 * pxPerCm - margin
    const rW = 100 * pxPerCm + (margin * 2)
    const rH = rulerHeight
    
    // Gradient (Lighter for contrast)
    const scaleGrad = ctx.createLinearGradient(0, -rH, 0, 0)
    scaleGrad.addColorStop(0, '#f8fafc')     // White-ish
    scaleGrad.addColorStop(0.5, '#e2e8f0')   // Light Grey
    scaleGrad.addColorStop(1, '#cbd5e1')     // Shadowy bottom
    
    // Shadow
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 20
    ctx.shadowOffsetY = 10
    ctx.fillStyle = scaleGrad
    ctx.fillRect(rLeft, -rH, rW, rH)
    ctx.restore()
    
    // Border for definition
    ctx.strokeStyle = '#64748b'
    ctx.lineWidth = 1
    ctx.strokeRect(rLeft, -rH, rW, rH)
    
    // --- TICKS & NUMBERS (Shifted to Down Side) ---
    ctx.fillStyle = '#000000' 
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom' // Text sits on baseline
    ctx.font = isMagnified ? 'bold 14px Inter, sans-serif' : 'bold 12px Inter, sans-serif'
    
    // Draw 0-100
    for(let i=0; i<=100; i++) {
        const x = (i - 50) * pxPerCm
        let tickH = 6
        let lineWidth = 1
        
        if (i % 5 === 0) {
            tickH = 10
            lineWidth = 1.5
        }
        if (i % 10 === 0) {
            tickH = 15
            lineWidth = 2
        }
        
        // Ticks drawn from BOTTOM edge UP
        // Ruler bottom is at 0 (relative to rect starting at -rH)
        ctx.fillRect(x - (lineWidth/2), 0 - tickH, lineWidth, tickH)
        
        // Number: Above the ticks (Higher up on the ruler face)
        if (i % 10 === 0) {
            // Position: Just above the tallest tick (-15)
            // Baseline bottom, so y = -18
            ctx.fillText(i, x, -18)
        }
    }
    
    ctx.restore()
    ctx.restore()
}

const draw = () => {
    const canvas = canvasRef.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    
    // Clear & Background
    ctx.clearRect(0, 0, width, height)
    
    
    // Background Grid - Moved to drawScene
    
    // Draw Main Scene
    // Draw Main Scene
    ctx.save()
    // Global Camera Transform
    const cx = width / 2
    const cy = height / 2
    ctx.translate(cx + panX.value * zoomLevel.value, cy + panY.value * zoomLevel.value)
    ctx.scale(zoomLevel.value, zoomLevel.value)
    ctx.translate(-cx, -cy)

    drawScene(ctx, width, height, false)
    ctx.restore()
    
    // Draw Magnifier
    if (showMagnifier.value) {
        const { x, y } = mousePos.value
        // Ensure mousePos is valid
        if (x !== 0 && y !== 0) {
            const r = 80 // Radius
            
            ctx.save()
            // Clip circle
            ctx.beginPath()
            ctx.arc(x, y, r, 0, Math.PI * 2)
            ctx.clip()
            
            // Background for glass (Dark to match lab)
            ctx.fillStyle = '#1e293b' 
            ctx.fill()
            
            // Transform for Zoom
            // Move to center of magnifier (mouse pos), Scale, Translate back
            ctx.translate(x, y)
            ctx.scale(2, 2)
            ctx.translate(-x, -y)
            
            // Draw scene again
            drawScene(ctx, width, height, true)
            
            ctx.restore()
            
            // Glass Rim/Refine
            ctx.save()
            ctx.beginPath()
            ctx.arc(x, y, r, 0, Math.PI * 2)
            ctx.strokeStyle = '#cbd5e1'
            ctx.lineWidth = 8
            ctx.stroke()
            ctx.strokeStyle = '#94a3b8'
            ctx.lineWidth = 2
            ctx.stroke()
            
            // Shine
            ctx.beginPath()
            ctx.arc(x, y, r - 5, -0.5, 1.0)
            ctx.strokeStyle = 'rgba(255,255,255,0.4)'
            ctx.lineWidth = 4
            ctx.stroke()
            
            // Crosshair
            ctx.strokeStyle = 'rgba(255,0,0,0.3)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(x, y - 20); ctx.lineTo(x, y + 20)
            ctx.moveTo(x - 20, y); ctx.lineTo(x + 20, y)
            ctx.stroke()
            
            ctx.restore()
        }
    }
}


const animate = () => {
    updatePhysics()
    draw()
    animationId.value = requestAnimationFrame(animate)
}

onMounted(() => {
    const canvas = canvasRef.value
    if (!canvas) return
    
    // Resize Observer
    const ro = new ResizeObserver(() => {
        width = canvas.parentElement.clientWidth
        height = canvas.parentElement.clientHeight
        canvas.width = width
        canvas.height = height
        draw()
    })
    ro.observe(canvas.parentElement)
    
    animate()
})

onUnmounted(() => {
    cancelAnimationFrame(animationId.value)
})

// Interaction Handlers
const getEventPos = (e) => {
    const rect = canvasRef.value.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    }
}

// Watch magnifier toggle to center it initially
watch(showMagnifier, (val) => {
    if (val && canvasRef.value) {
        // Only if not already set to something valid
        if (mousePos.value.x === 0 && mousePos.value.y === 0) {
            const rect = canvasRef.value.getBoundingClientRect()
            mousePos.value = { x: rect.width / 2, y: rect.height / 2 }
        }
    }
})

const handleStart = (e) => {
    // Ignore pinch start or active zoom
    if ((e.touches && e.touches.length > 1) || isZooming.value) return

    e.preventDefault() // Prevent scroll on touch
    
    // Reset Drag State
    isDragging.value = false
    dragMode.value = null
    dragId.value = null

    const { x, y } = getEventPos(e)
    
    // Check Magnifier Hit first (if visible)
    if (showMagnifier.value) {
        const mx = mousePos.value.x
        const my = mousePos.value.y
        const dist = Math.sqrt((x - mx) ** 2 + (y - my) ** 2)
        if (dist < 80) { // Radius 80
            isDragging.value = true
            dragMode.value = 'magnifier'
            magDragStartX = x - mx
            magDragStartY = y - my
            return
        }
    }

    // Transform Screen to World
    const cx = width / 2
    const cy = height / 2
    
    // Reverse Transform:
    // Screen = (World - Center) * Zoom + Center + Pan*Zoom
    // World - Center = (Screen - Center - Pan*Zoom) / Zoom
    // World = ((Screen - Center) / Zoom) - Pan + Center
    
    // Note: My draw logic used: translate(cx + pan*z, cy + pan*z) -> scale(z) -> translate(-cx, -cy)
    // Point P_world -> P_screen:
    // P_screen = (P_world - (cx,cy)) * z + (cx,cy) + (pan*z, pan*z)
    // Let's verify: P_world at center (cx,cy) -> ends at cx + pan*z. Correct.
    
    // Inverse:
    // P_screen - (cx,cy) - (pan*z, pan*z) = (P_world - (cx,cy)) * z
    // (P_world - (cx,cy)) = (P_screen - cx - pan*z) / z
    // P_world = ((P_screen - cx)/z) - pan + cx
    
    const worldX = ((x - cx) / zoomLevel.value) - panX.value + cx
    const worldY = ((y - cy) / zoomLevel.value) - panY.value + cy
    
    // Hit Test logic duplicates draw logic transform
    const pxPerCm = width / 120
    
    // Approximate hit test (ignoring rotation for selection ease, valid for small angles)
    // Scale Center X (where 50cm mark is)
    const shiftX = (50 - fulcrumPos.value) * pxPerCm
    const scaleCenterX = cx + shiftX
    
    // Check Weights
    // Weight X visual = scaleCenterX + (w.pos - 50) * pxPerCm
    // Weight Y visual = cy + rulerHeight/2 + String(40) + Radius
    // Let's simplified hit box: X +/- 15px, Y > cy
    
    for (const w of weights.value) {
        const wVisualX = scaleCenterX + (w.pos - 50) * pxPerCm
        
        // Simple distance check
        // Wider hit box for easier dragging on touch/mouse
        if (Math.abs(worldX - wVisualX) < 55 && worldY > cy - 20 && worldY < cy + 180) {
            isDragging.value = true
            dragId.value = w.id
            dragMode.value = 'weight'
            // We store drag START visual pos.
            // On Move, we calculate Delta World X.
            dragStartX = worldX
            dragStartPos = w.pos
            return
        }
    }
}

const handleMove = (e) => {
    const { x, y } = getEventPos(e)
    
    // If zooming active, abort drag
    if (isZooming.value) {
        isDragging.value = false
        dragId.value = null
        return
    }

    if (!isDragging.value) return
    
    if (dragMode.value === 'magnifier') {
        mousePos.value = {
            x: x - magDragStartX,
            y: y - magDragStartY
        }
        return
    }

    if (dragMode.value === 'weight' && dragId.value) {
        // Convert current X to World X using same logic as handleStart
        const cx = width / 2
        const worldX = ((x - cx) / zoomLevel.value) - panX.value + cx
        
        const dx = worldX - dragStartX
        const pxPerCm = width / 120
        
        // Convert px delta to cm delta
        const dPos = dx / pxPerCm
        
        // Update position
        const weight = weights.value.find(w => w.id === dragId.value)
        if (weight) {
            let newPos = dragStartPos + dPos
            // Clamp
            newPos = Math.max(0, Math.min(100, newPos))
            weight.pos = Math.round(newPos * 2) / 2 // Snap to 0.5cm
            updatePhysics()
        }
    }
}

const handleEnd = () => {
    isDragging.value = false
    dragId.value = null
}
</script>

<template>
  <div class="sim-container" 
       @mousemove="handleMove" @touchmove="handleMove" 
       @mouseup="handleEnd" @touchend="handleEnd" 
       @mouseleave="handleEnd">
    <div class="canvas-area" ref="containerRef" 
         @mousedown="handleStart" @touchstart="handleStart">
        <canvas ref="canvasRef"></canvas>
    </div>
    
    <aside class="controls-panel glass-panel" :class="{ 'collapsed': isPanelCollapsed }">
        <div class="header">
            <h3>Principle of Moments</h3>
            <div class="main-actions" style="gap: 10px;">
                <button class="tool-btn" @click="showMagnifier = !showMagnifier" :class="{ active: showMagnifier }">
                    🔍 Magnify
                </button>
                <button class="reset-btn" @click="reset" title="Reset Simulation">↺</button>
            </div>
        </div>
        
        <div class="scroll-content">
            <!-- Fulcrum Control -->
            <div class="control-group">
                <div class="label-row">
                    <label>Fulcrum Position</label>
                    <span class="value">{{ fulcrumPos.toFixed(1) }} cm</span>
                </div>
                <div class="slider-container">
                    <input type="range" v-model.number="fulcrumPos" min="10" max="90" step="0.5">
                    <div class="slider-track" :style="{ width: ((fulcrumPos - 10)/80)*100 + '%' }"></div>
                </div>
            </div>
            
            <!-- Weights List -->
            <div class="control-group" v-for="(w, index) in weights" :key="w.id">
                <div class="label-row" style="margin-bottom: -5px;">
                    <label :style="{color: w.color}">{{ w.type === 'unknown' ? 'Unknown Object' : `Weight ${index + 1}` }}</label>
                    <button v-if="weights.length > 2" @click="removeWeight(index)" class="close-btn">×</button>
                </div>
                
                <!-- Mass Control (Only for known) -->
                <div v-if="w.type === 'known'" class="sub-control">
                    <div class="label-row small">
                        <span>Mass (g)</span>
                        <input type="number" v-model.number="w.mass" class="value-input" min="10" max="500">
                    </div>
                    <div class="slider-container">
                        <input type="range" v-model.number="w.mass" min="10" max="200" step="1">
                        <div class="slider-track" :style="{ width: ((w.mass - 10)/190)*100 + '%' }"></div>
                    </div>
                </div>

                <!-- Position Control -->
                <div class="sub-control">
                    <div class="label-row small">
                        <span>Position (Drag on Scale)</span>
                        <span class="value">{{ w.pos }} cm</span>
                    </div>
                </div>
            </div>
            
            <button class="btn-secondary" @click="addUnknownWeight" :disabled="weights.length >= 4">
                + Add Unknown Mass
            </button>
            
            <div class="info-box glass-inset">
                <h4>Balance Condition</h4>
                <div class="formula">Σ (Force × Distance) = 0</div>
                <div class="data-row">
                    <span>Net Torque:</span>
                    <span class="highlight" :style="{color: currentAngle===0?'#0f0':'#f00'}">
                        {{ Math.abs(currentAngle) < 1 ? 'Balanced' : 'Unbalanced' }}
                    </span>
                </div>
            </div>
        </div>
    </aside>
  </div>
</template>

<style scoped>
/* Standard Layout (Match Exp 2 & 3) */
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
    background: radial-gradient(circle at center, #1e293b 0%, #000 100%);
    overflow: hidden;
    cursor: grab;
}
.canvas-area:active {
    cursor: grabbing;
}

.controls-panel {
    width: 320px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    background: rgba(15, 23, 42, 0.9);
    backdrop-filter: blur(20px);
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    transition: width 0.3s ease;
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
    color: #fff;
}

.scroll-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.control-group {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
}

.label-row {
    display: flex;
    justify-content: space-between;
    color: #aaa;
    font-size: 0.9rem;
}

.value {
    color: #fff;
    font-family: monospace;
    background: rgba(255,255,255,0.1);
    padding: 2px 6px;
    border-radius: 4px;
}

/* Slider */
.slider-container {
    position: relative;
    height: 6px;
    background: rgba(255,255,255,0.1);
    border-radius: 3px;
    display: flex;
    align-items: center;
}
.slider-track {
    position: absolute;
    left: 0;
    height: 100%;
    background: var(--primary-glow, #00d4ff);
    border-radius: 3px;
    pointer-events: none;
}
input[type=range] {
    -webkit-appearance: none;
    width: 100%;
    height: 100%;
    background: transparent;
    position: absolute;
    z-index: 2;
    cursor: pointer;
}
input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: #fff;
    cursor: pointer;
    box-shadow: 0 0 10px rgba(0,0,0,0.5);
    margin-top: 0; /* Align center */
}

/* Reset Button */
.reset-btn {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: none;
    background: rgba(255,255,255,0.1);
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}
.reset-btn:hover {
    background: rgba(255,255,255,0.2);
}

.tool-btn {
    padding: 6px 12px;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.05);
    color: #ccc;
    cursor: pointer;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;
}
.tool-btn:hover {
    background: rgba(255,255,255,0.1);
    color: #fff;
}
.tool-btn.active {
    background: rgba(59, 130, 246, 0.3); /* Blue tint */
    border-color: #3b82f6;
    color: #fff;
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.2);
}

.info-box {
    background: rgba(255,255,255,0.03);
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.05);
}
.info-box h4 {
    margin: 0 0 0.5rem 0;
    font-size: 0.9rem;
    color: #ccc;
}
.highlight {
    font-weight: bold;
}

.close-btn {
    background: none;
    border: none;
    color: #f55;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0 5px;
}

.sub-control {
    background: rgba(255,255,255,0.03);
    padding: 8px;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.label-row.small {
    font-size: 0.8rem;
    color: #889;
    align-items: center;
}

.value-input {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    color: #fff;
    border-radius: 4px;
    padding: 2px 6px;
    width: 60px;
    font-family: monospace;
    font-size: 0.9rem;
    text-align: right;
}
.value-input:focus {
    outline: none;
    border-color: var(--primary-glow);
    background: rgba(255,255,255,0.15);
}

.btn-secondary {
    padding: 0.8rem;
    background: rgba(255,215,0,0.1);
    color: #ffd700;
    border: 1px solid rgba(255,215,0,0.3);
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
}
.btn-secondary:hover {
    background: rgba(255,215,0,0.2);
}
.btn-secondary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Mobile Split */
@media (max-width: 768px) {
    .sim-container {
        flex-direction: column;
    }
    .canvas-area {
        height: 55%;
        flex: none;
    }
    .controls-panel {
        width: 100%;
        height: 45%;
        border-left: none;
        border-top: 1px solid rgba(255,255,255,0.1);
    }
    .controls-panel.collapsed {
        height: 0;
        width: 100%;
    }
}
</style>
