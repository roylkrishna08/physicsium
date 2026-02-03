<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'

const props = defineProps({
  showFormula: {
    type: Boolean,
    default: false
  },
  showGrid: {
    type: Boolean,
    default: true
  },
  zoom: {
    type: Number,
    default: 1
  },
  showPotential: Boolean,
  showFieldLines: Boolean
})

const canvasRef = ref(null)
const width = ref(800)
const height = ref(600)

// Physics Constants
const K = 9e9 // 9 x 10^9
const UNIT_Q = 1e-6 // 1 microColoumb
const PIXELS_PER_METER = 200 // 200px = 1m

// State - stored as offsets from center (dx, dy)
const charges = ref([
    { x: -50, y: 0, q: 2, dragging: false },
    { x: 350, y: 0, q: -2, dragging: false }
])
const isDragging = ref(false)

// Calculated Values
const distance = computed(() => {
    // Distance calculation works with offsets same as absolute pixels
    const dx = charges.value[1].x - charges.value[0].x
    const dy = charges.value[1].y - charges.value[0].y
    return Math.sqrt(dx*dx + dy*dy)
})

const forceValue = computed(() => {
    const r = distance.value / PIXELS_PER_METER
    if (r < 0.05) return 0 // Singularity protection
    const q1 = Math.abs(charges.value[0].q) * UNIT_Q
    const q2 = Math.abs(charges.value[1].q) * UNIT_Q
    return (K * q1 * q2) / (r * r)
})

const potentialEnergy = computed(() => {
    const r = distance.value / PIXELS_PER_METER
    if (r < 0.05) return 0
    const q1 = charges.value[0].q * UNIT_Q
    const q2 = charges.value[1].q * UNIT_Q
    return (K * q1 * q2) / r
})

onMounted(() => {
    if (canvasRef.value) {
        // Initial setup
        let rect = canvasRef.value.getBoundingClientRect()
        width.value = rect.width
        height.value = rect.height
        
        canvasRef.value.width = width.value
        canvasRef.value.height = height.value

        const resizeObserver = new ResizeObserver(() => {
             if (canvasRef.value) {
                const newRect = canvasRef.value.getBoundingClientRect()
                width.value = newRect.width
                height.value = newRect.height
                
                canvasRef.value.width = width.value
                canvasRef.value.height = height.value
                animate()
             }
        })
        resizeObserver.observe(canvasRef.value)
        
        animate()
        return () => resizeObserver.disconnect()
    }
})

// --- Interaction Logic ---
// Mouse pos needs to be relative to center
const getMousePos = (e) => {
    const rect = canvasRef.value.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    
    // Position within canvas (top-left origin)
    const xCanvas = clientX - rect.left
    const yCanvas = clientY - rect.top
    
    const cx = width.value / 2
    const cy = height.value / 2
    
    // Zoom transform:
    // ViewX = (WorldX * Zoom) + CX
    // WorldX = (ViewX - CX) / Zoom
    
    // Here WorldX is our relative offset
    // But wait, our drawing logic will be:
    // translate(cx, cy) -> scale(zoom) -> draw(x, y)
    // Screen = (x * zoom) + cx
    // x = (Screen - cx) / zoom
    
    const x = (xCanvas - cx) / props.zoom
    const y = (yCanvas - cy) / props.zoom
    
    return { x, y }
}

const handleStart = (e) => {
    const { x, y } = getMousePos(e)
    charges.value.forEach(c => {
        const dx = x - c.x
        const dy = y - c.y
        if (dx*dx + dy*dy < 900) { // 30px radius hit (adjust for logic scale)
            c.dragging = true
            isDragging.value = true
        }
    })
}

const handleMove = (e) => {
    if (!isDragging.value) return
    const { x, y } = getMousePos(e)
    
    charges.value.forEach(c => {
        if (c.dragging) {
            c.x = x
            c.y = y
        }
    })
}

const handleEnd = () => {
    isDragging.value = false
    charges.value.forEach(c => c.dragging = false)
}

const setCharge = (index, val) => {
    if (charges.value[index]) {
        charges.value[index].q = val
    }
}

defineExpose({
    
    setCharge
})

// --- Formula Interaction ---
const formulaPos = ref({ x: 20, y: 20 })
const formulaScale = ref(1)
const isFormulaDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

const startFormulaDrag = (e) => {
    isFormulaDragging.value = true
    dragStart.value = {
        x: e.clientX - formulaPos.value.x,
        y: e.clientY - formulaPos.value.y
    }
    window.addEventListener('mousemove', onFormulaDrag)
    window.addEventListener('mouseup', stopFormulaDrag)
}

const onFormulaDrag = (e) => {
    if (!isFormulaDragging.value) return
    formulaPos.value = {
        x: e.clientX - dragStart.value.x,
        y: e.clientY - dragStart.value.y
    }
}

const stopFormulaDrag = () => {
    isFormulaDragging.value = false
    window.removeEventListener('mousemove', onFormulaDrag)
    window.removeEventListener('mouseup', stopFormulaDrag)
}

const handleFormulaZoom = (e) => {
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const newScale = Math.max(0.5, Math.min(3, formulaScale.value + delta))
    formulaScale.value = newScale
}

// --- Drawing ---
const draw = () => {
    const ctx = canvasRef.value?.getContext('2d')
    if (!ctx) return

    // Clear Screen
    ctx.clearRect(0, 0, width.value, height.value)
    
    const cx = width.value / 2
    const cy = height.value / 2

    // Apply Center-Relative Zoom Transform
    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(props.zoom, props.zoom)
    // Do NOT translate back. We want (0,0) to be the center.
    // Charges are stored as relative offsets.
    
    // Grid now needs to be drawn large enough to cover the screen
    // logic: top-left in world coords is (-cx/zoom, -cy/zoom)
    if (props.showGrid) {
        drawGrid(ctx, -cx/props.zoom, -cy/props.zoom, width.value/props.zoom, height.value/props.zoom)
    }
    
    // Draw everything else
    // ... drawing functions access charges which are already offsets ...
    
    
    if (props.showPotential) {
        drawPotentialHeatmap(ctx, -cx/props.zoom, -cy/props.zoom, width.value/props.zoom, height.value/props.zoom)
    }

    drawDistance(ctx)
    if (props.showFieldLines) {
        drawFieldLines(ctx)
    }
    charges.value.forEach(drawCharge)
    drawForces(ctx)

    ctx.restore()
}

function getPotentialAt(x, y) {
    let V = 0
    for (const c of charges.value) {
        const dx = x - c.x; const dy = y - c.y
        const r = Math.sqrt(dx*dx + dy*dy)
        if (r < 5) return c.q > 0 ? 1000 : -1000
        V += (c.q * 100) / r
    }
    return V
}

function getFieldAt(x, y) {
    let Ex = 0, Ey = 0
    for (const c of charges.value) {
        const dx = x - c.x; const dy = y - c.y
        const r2 = dx*dx + dy*dy
        const r = Math.sqrt(r2)
        if (r < 20) return { Ex: 0, Ey: 0, hit: true }
        const E = c.q / r2
        Ex += E * (dx/r); Ey += E * (dy/r)
    }
    return { Ex, Ey, hit: false }
}

let offscreenCanvas = null
let offscreenCtx = null

function drawPotentialHeatmap(ctx, minX, minY, w, h) {
    if (!offscreenCanvas) {
        offscreenCanvas = document.createElement('canvas')
        offscreenCtx = offscreenCanvas.getContext('2d')
    }
    const rect = canvasRef.value.getBoundingClientRect()
    const scale = 0.1
    const ow = Math.ceil(rect.width * scale)
    const oh = Math.ceil(rect.height * scale)
    if (offscreenCanvas.width !== ow || offscreenCanvas.height !== oh) {
        offscreenCanvas.width = ow; offscreenCanvas.height = oh
    }
    const imgData = offscreenCtx.createImageData(ow, oh)
    const data = imgData.data
    for (let py = 0; py < oh; py++) {
        for (let px = 0; px < ow; px++) {
            const worldX = (px / scale - rect.width/2) / props.zoom
            const worldY = (py / scale - rect.height/2) / props.zoom
            const V = getPotentialAt(worldX, worldY)
            const idx = (py * ow + px) * 4
            const alpha = Math.min(Math.abs(V) * 0.5, 0.4) * 255
            if (V > 0) {
                data[idx] = 239; data[idx+1] = 68; data[idx+2] = 68; data[idx+3] = alpha
            } else {
                data[idx] = 59; data[idx+1] = 130; data[idx+2] = 246; data[idx+3] = alpha
            }
        }
    }
    offscreenCtx.putImageData(imgData, 0, 0)
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalCompositeOperation = 'screen'
    ctx.drawImage(offscreenCanvas, 0, 0, rect.width, rect.height)
    ctx.restore()
}

function drawFieldLines(ctx) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.lineWidth = 1.5
    charges.value.forEach(c => {
        const count = 16
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2
            let cx = c.x + Math.cos(angle) * 25
            let cy = c.y + Math.sin(angle) * 25
            ctx.beginPath()
            ctx.moveTo(cx, cy)
            const ds = 10 * (c.q > 0 ? 1 : -1)
            for (let step = 0; step < 200; step++) {
                const f = getFieldAt(cx, cy)
                if (f.hit) break
                const Emod = Math.sqrt(f.Ex*f.Ex + f.Ey*f.Ey)
                if (Emod < 1e-4) break
                cx += (f.Ex / Emod) * ds
                cy += (f.Ey / Emod) * ds
                ctx.lineTo(cx, cy)
                if (Math.abs(cx) > 2000 || Math.abs(cy) > 2000) break
            }
            ctx.stroke()
        }
    })
}

const drawGrid = (ctx, minX, minY, w, h) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
    ctx.lineWidth = 1
    const gridSize = 50
    
    // Calculate start/end based on view bounds
    // Align to grid size
    const startX = Math.floor(minX / gridSize) * gridSize
    const startY = Math.floor(minY / gridSize) * gridSize
    const endX = minX + w
    const endY = minY + h
    
    ctx.beginPath()
    for (let x = startX; x <= endX; x += gridSize) {
        ctx.moveTo(x, minY); ctx.lineTo(x, endY)
    }
    for (let y = startY; y <= endY; y += gridSize) {
        ctx.moveTo(minX, y); ctx.lineTo(endX, y)
    }
    ctx.stroke()
    
    // Draw Axes (optional)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(minX, 0); ctx.lineTo(endX, 0) // X-axis
    ctx.moveTo(0, minY); ctx.lineTo(0, endY) // Y-axis
    ctx.stroke()
}

const drawDistance = (ctx) => {
    const c1 = charges.value[0]
    const c2 = charges.value[1]
    
    ctx.beginPath()
    ctx.setLineDash([5, 5])
    ctx.moveTo(c1.x, c1.y)
    ctx.lineTo(c2.x, c2.y)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.setLineDash([])
    
    // Distance Label
    const midX = (c1.x + c2.x) / 2
    const midY = (c1.y + c2.y) / 2
    const rMeters = distance.value / PIXELS_PER_METER
    
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 16px "Segoe UI", sans-serif'
    ctx.textAlign = 'center'
    // Add background for calc
    const text = `${rMeters.toFixed(2)} m`
    const metrics = ctx.measureText(text)
    
    const labelYOffset = -45 // Move higher to avoid force overlap
    
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.fillRect(midX - metrics.width/2 - 6, midY + labelYOffset - 14, metrics.width + 12, 22)
    
    ctx.fillStyle = '#e2e8f0'
    ctx.fillText(text, midX, midY + labelYOffset)
}

const drawCharge = (c) => {
    const ctx = canvasRef.value?.getContext('2d')
    if (!ctx) return
    
    // Glow
    const gradient = ctx.createRadialGradient(c.x, c.y, 5, c.x, c.y, 50)
    if (c.q > 0) {
        gradient.addColorStop(0, 'rgba(255, 0, 85, 0.6)')
        gradient.addColorStop(1, 'rgba(255, 0, 85, 0)')
    } else {
        gradient.addColorStop(0, 'rgba(0, 212, 255, 0.6)')
        gradient.addColorStop(1, 'rgba(0, 212, 255, 0)')
    }
    ctx.fillStyle = gradient
    ctx.beginPath(); ctx.arc(c.x, c.y, 50, 0, Math.PI*2); ctx.fill()
    
    // Core
    ctx.beginPath()
    ctx.arc(c.x, c.y, 20, 0, Math.PI * 2)
    ctx.fillStyle = c.q > 0 ? '#ff0055' : '#00d4ff'
    ctx.shadowColor = c.q > 0 ? '#ff0055' : '#00d4ff'
    ctx.shadowBlur = 15
    ctx.fill()
    ctx.shadowBlur = 0
    
    // Label
    ctx.fillStyle = 'white'
    ctx.font = 'bold 18px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(c.q > 0 ? `+${c.q}` : c.q, c.x, c.y)
}

const drawForces = (ctx) => {
    const c1 = charges.value[0]
    const c2 = charges.value[1]
    const r = distance.value
    if (r < 10) return
    
    const dx = c2.x - c1.x
    const dy = c2.y - c1.y
    const angle = Math.atan2(dy, dx)
    
    const isRepulsive = (c1.q * c2.q) > 0
    
    // Magnified scaling: F=0.04N -> 120px
    const vecLen = Math.min(forceValue.value * 3500, 250) 
    const arrowStartOffset = 25 // Start outside the sphere
    
    const drawVec = (start, dirAngle) => {
        // Start from edge of sphere
        const startX = start.x + Math.cos(dirAngle) * arrowStartOffset
        const startY = start.y + Math.sin(dirAngle) * arrowStartOffset
        
        const endX = startX + Math.cos(dirAngle) * vecLen
        const endY = startY + Math.sin(dirAngle) * vecLen
        
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.strokeStyle = '#fbbf24' // Amber
        ctx.lineWidth = 5
        ctx.lineCap = 'round'
        ctx.stroke()
        
        // Arrowhead
        const headLen = 15
        ctx.beginPath()
        ctx.moveTo(endX, endY)
        ctx.lineTo(
            endX - Math.cos(dirAngle - Math.PI/6)*headLen, 
            endY - Math.sin(dirAngle - Math.PI/6)*headLen
        )
        ctx.lineTo(
            endX - Math.cos(dirAngle + Math.PI/6)*headLen, 
            endY - Math.sin(dirAngle + Math.PI/6)*headLen
        )
        ctx.fillStyle = '#fbbf24'
        ctx.fill()
        
        // Value Layout
        ctx.textAlign = 'left' // Reset alignment for sequential drawing
        ctx.textBaseline = 'alphabetic'
        const expStr = forceValue.value.toExponential(2)
        const [base, exponent] = expStr.split('e')
        
        // Parts
        const mantissa = `${base} × 10`
        const pow = parseInt(exponent).toString() // Remove leading + or 0
        const unit = ' N'

        // Font settings
        const mainFont = 'bold 16px "Courier New", monospace'
        const supFont = 'bold 12px "Courier New", monospace'
        
        // Offset text consistently "below" the arrow
        const textOffset = 25
        
        let perpX = Math.cos(dirAngle + Math.PI/2)
        let perpY = Math.sin(dirAngle + Math.PI/2)
        
        if (perpY < 0) { perpX = -perpX; perpY = -perpY }
        
        // Starting Position
        let cursorX = endX - Math.cos(dirAngle)*10 + perpX * textOffset
        let cursorY = endY - Math.sin(dirAngle)*10 + perpY * textOffset
        
        // Adjust starting X slightly to center the whole block visually? 
        // A bit complex without pre-measuring. Let's just anchor left for now at the calculated point.
        // Actually, centering would be better.
        ctx.font = mainFont
        const w1 = ctx.measureText(mantissa).width
        const w3 = ctx.measureText(unit).width
        ctx.font = supFont
        const w2 = ctx.measureText(pow).width
        const totalW = w1 + w2 + w3
        
        cursorX -= totalW / 2 // Center horizontally relative to anchor point
        
        // Helper to draw stroked text
        const drawPart = (text, font, x, y) => {
            ctx.font = font
            ctx.fillStyle = '#fbbf24'
            ctx.lineWidth = 3
            ctx.strokeStyle = 'rgba(0,0,0,0.8)'
            ctx.strokeText(text, x, y)
            ctx.fillText(text, x, y)
        }
        
        // Draw Mantissa
        drawPart(mantissa, mainFont, cursorX, cursorY)
        cursorX += w1
        
        // Draw Exponent (Superscript)
        drawPart(pow, supFont, cursorX, cursorY - 6)
        cursorX += w2
        
        // Draw Unit
        drawPart(unit, mainFont, cursorX, cursorY)
    }
    
    if (isRepulsive) {
        drawVec(c1, angle + Math.PI)
        drawVec(c2, angle)
    } else {
        drawVec(c1, angle)
        drawVec(c2, angle + Math.PI)
    }
}


// Animation Loop
let frameId
const animate = () => {
    draw()
    frameId = requestAnimationFrame(animate)
}

// Resize Observer
const containerRef = ref(null)
onMounted(() => {
    if (containerRef.value) {
        const resize = () => {
            width.value = containerRef.value.clientWidth
            height.value = containerRef.value.clientHeight
        }
        window.addEventListener('resize', resize)
        resize()
    }
    animate()
})

onUnmounted(() => {
    cancelAnimationFrame(frameId)
})
</script>

<template>
    <div class="coulomb-lab" ref="containerRef">
        <canvas 
            ref="canvasRef" 
            :width="width" 
            :height="height"
            @mousedown="handleStart"
            @mousemove="handleMove"
            @mouseup="handleEnd"
            @touchstart.prevent="handleStart"
            @touchmove.prevent="handleMove"
            @touchend="handleEnd"
        ></canvas>
        
        <!-- Formula Overlay -->
        <transition name="fade">
            <div 
                class="formula-card" 
                v-if="showFormula"
                :style="{ 
                    transform: `translate(${formulaPos.x}px, ${formulaPos.y}px) scale(${formulaScale})`,
                    cursor: isFormulaDragging ? 'grabbing' : 'grab'
                }"
                @mousedown.stop="startFormulaDrag"
                @wheel.prevent.stop="handleFormulaZoom"
            >
                <h3>Coulomb's Law</h3>
                <div class="equation-display">
                    <span class="symbol">F</span> = 
                    <span class="constant">k</span> 
                    <div class="fraction">
                        <span class="numerator">|q₁q₂|</span>
                        <span class="denominator">r²</span>
                    </div>
                </div>
                
                <div class="calculation-steps">
                    <div class="step">
                        <span class="label">k = </span> 9.00 × 10⁹ N⋅m²/C²
                    </div>
                    <div class="step">
                        <span class="label">q₁ = </span> {{ Math.abs(charges[0].q) }} µC
                    </div>
                    <div class="step">
                        <span class="label">q₂ = </span> {{ Math.abs(charges[1].q) }} µC
                    </div>
                    <div class="step">
                        <span class="label">r = </span> {{ (distance/200).toFixed(2) }} m
                    </div>
                    <div class="result">
                        F = {{ forceValue.toExponential(2) }} N
                    </div>
                    <div class="result" style="color: #10b981; border-top: none; padding-top: 0;">
                        U = {{ potentialEnergy.toExponential(2) }} J
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<style scoped>
.coulomb-lab {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    cursor: grab;
}
canvas {
    width: 100%;
    height: 100%;
    display: block;
}
.coulomb-lab:active {
    cursor: grabbing;
}

.formula-card {
    position: absolute;
    top: 2rem;
    left: 2rem;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 1.5rem;
    color: white;
    min-width: 280px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.formula-card h3 {
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    color: #38bdf8;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    padding-bottom: 0.5rem;
}

.equation-display {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    font-family: 'Times New Roman', serif;
    margin-bottom: 1.5rem;
}

.fraction {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-left: 0.5rem;
}

.numerator {
    border-bottom: 1px solid white;
    padding-bottom: 2px;
}

.constant {
    color: #fbbf24;
    margin-right: 4px;
}

.calculation-steps {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-family: monospace;
    font-size: 0.95rem;
    color: #cbd5e1;
}

.step {
    display: flex;
    justify-content: space-between;
}

.step .label {
    color: #94a3b8;
}

.result {
    margin-top: 0.8rem;
    padding-top: 0.8rem;
    border-top: 1px dashed rgba(255,255,255,0.2);
    font-weight: bold;
    color: #fbbf24;
    font-size: 1.1rem;
    text-align: right;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
