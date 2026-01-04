<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'

const props = defineProps({
  showGrid: {
    type: Boolean,
    default: true
  },
  zoom: {
    type: Number,
    default: 1
  },
  forceMode: {
    type: String,
    default: 'resultant'
  }
})

const canvasRef = ref(null)
const width = ref(800)
const height = ref(600)

// Physics Constants
const K = 9e9 
const UNIT_Q = 1e-6 
const PIXELS_PER_METER = 200 

// State - stored as offsets from center (dx, dy)
// Initial state: 3 charges spread out
const charges = ref([
    { id: 1, x: -50, y: 120, q: 2, dragging: false },
    { id: 2, x: 350, y: 120, q: -2, dragging: false },
    { id: 3, x: 150, y: -130, q: 1, dragging: false }
])
const isDragging = ref(false)
const selectedChargeId = ref(null)
const selectedNetForce = ref(0)
const currentShape = ref(null) // 'square', 'rectangle', 'triangle'
const showComponentsMap = ref(new Map()) // chargeId -> boolean

let nextId = 4

// --- Physics Logic ---
const calculateNetForce = (targetCharge) => {
    let Fx = 0
    let Fy = 0
    
    charges.value.forEach(source => {
        if (source.id === targetCharge.id) return
        
        const dx = targetCharge.x - source.x
        const dy = targetCharge.y - source.y
        const dist = Math.sqrt(dx*dx + dy*dy)
        const r = dist / PIXELS_PER_METER
        
        if (r < 0.05) return // Singularity protection
        
        // F = K * q1 * q2 / r^2
        // Unit vector components: dx/dist, dy/dist
        // Force magnitude
        const q1 = targetCharge.q * UNIT_Q
        const q2 = source.q * UNIT_Q
        const F = (K * q1 * q2) / (r * r)
        
        // Direction:
        // If q1*q2 > 0 (repulsive), force on q1 is AWAY from q2.
        // Vector (target - source) points AWAY from source.
        // So simple projection works.
        
        Fx += F * (dx / dist)
        Fy += F * (dy / dist)
    })
    
    return { fx: Fx, fy: Fy, mag: Math.sqrt(Fx*Fx + Fy*Fy) }
}

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

// --- Interaction ---
const getMousePos = (e) => {
    const rect = canvasRef.value.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    
    const xCanvas = clientX - rect.left
    const yCanvas = clientY - rect.top
    const cx = width.value / 2
    const cy = height.value / 2
    
    const x = (xCanvas - cx) / props.zoom
    const y = (yCanvas - cy) / props.zoom
    return { x, y }
}



const handleStart = (e) => {
    isDragging.value = true // MouseDown
    const { x, y } = getMousePos(e)
    
    // Check Force Arrow Clicks
    let arrowClicked = false
    charges.value.forEach(c => {
        const { mag } = calculateNetForce(c)
        if (mag > 1e-10) {
           const forceScale = 2000
           const arrowLen = Math.min(mag * forceScale, 300)
           const { fx, fy } = calculateNetForce(c)
           const angle = Math.atan2(fy, fx)
           const startX = c.x + Math.cos(angle) * 25
           const startY = c.y + Math.sin(angle) * 25
           const endX = startX + Math.cos(angle) * arrowLen
           const endY = startY + Math.sin(angle) * arrowLen
           
           const dist = pointToLineDistance(x, y, startX, startY, endX, endY)
           if (dist < 10) {
               const val = showComponentsMap.value.get(c.id)
               showComponentsMap.value.set(c.id, !val)
               arrowClicked = true
           }
        }
    })
    if (arrowClicked) {
        isDragging.value = false // Cancel generic drag
        return
    }

    charges.value.forEach(c => {
        const dx = x - c.x
        const dy = y - c.y
        if (dx*dx + dy*dy < 25*25) {
            c.dragging = true
            isDragging.value = true
            selectedChargeId.value = c.id
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

// --- API exposed to Parent ---
const addCharge = (amount) => {
    charges.value.push({
        id: nextId++,
        x: (Math.random() - 0.5) * 100, // Near center
        y: (Math.random() - 0.5) * 100,
        q: amount,
        dragging: false
    })
}

const updateSelectedCharge = (val) => {
    if (selectedChargeId.value) {
        const c = charges.value.find(c => c.id === selectedChargeId.value)
        if (c) c.q = val
    }
}

const removeSelectedCharge = () => {
    if (selectedChargeId.value) {
        charges.value = charges.value.filter(c => c.id !== selectedChargeId.value)
        selectedChargeId.value = null
    }
}

defineExpose({
    addCharge,
    updateSelectedCharge,
    removeSelectedCharge,
    selectedChargeId,
    selectedNetForce,
    getSelectedCharge: () => charges.value.find(c => c.id === selectedChargeId.value),
    setShape: (type, params) => {
        charges.value = []
        currentShape.value = type
        showComponentsMap.value.clear()
        
        if (type === 'square') {
            const s = params.side
            const half = s / 2
            charges.value = [
                { id: nextId++, x: -half, y: -half, q: 1, dragging: false },
                { id: nextId++, x: half, y: -half, q: -1, dragging: false },
                { id: nextId++, x: half, y: half, q: 1, dragging: false },
                { id: nextId++, x: -half, y: half, q: -1, dragging: false }
            ]
        } else if (type === 'rectangle') {
            const w = params.width / 2
            const h = params.height / 2
            charges.value = [
                { id: nextId++, x: -w, y: -h, q: 1, dragging: false },
                { id: nextId++, x: w, y: -h, q: -1, dragging: false },
                { id: nextId++, x: w, y: h, q: 1, dragging: false },
                { id: nextId++, x: -w, y: h, q: -1, dragging: false }
            ]
        } else if (type === 'triangle') {
            const a = params.a
            const b = params.b
            const angleRad = (params.angle * Math.PI) / 180
            
            // P1 at origin
            const p1 = { x: 0, y: 0 }
            // P2 along X
            const p2 = { x: a, y: 0 }
            // P3 at angle
            const p3 = { x: b * Math.cos(angleRad), y: b * Math.sin(angleRad) }
            
            // Centroid
            const cx = (p1.x + p2.x + p3.x) / 3
            const cy = (p1.y + p2.y + p3.y) / 3
            
            charges.value = [
                { id: nextId++, x: p1.x - cx, y: -(p1.y - cy), q: 1, dragging: false },
                { id: nextId++, x: p2.x - cx, y: -(p2.y - cy), q: -1, dragging: false },
                { id: nextId++, x: p3.x - cx, y: -(p3.y - cy), q: 1, dragging: false }
            ]
        }
    }
})

// --- Drawing ---
const drawGrid = (ctx, minX, minY, w, h) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
    ctx.lineWidth = 1
    const gridSize = 50
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
}

const drawCharge = (ctx, c) => {
    const isSelected = c.id === selectedChargeId.value
    
    // Glow
    const gradient = ctx.createRadialGradient(c.x, c.y, 10, c.x, c.y, 40)
    if (c.q > 0) {
        gradient.addColorStop(0, 'rgba(255, 0, 85, 0.6)')
        gradient.addColorStop(1, 'rgba(255, 0, 85, 0)')
    } else if (c.q < 0) {
        gradient.addColorStop(0, 'rgba(0, 212, 255, 0.6)')
        gradient.addColorStop(1, 'rgba(0, 212, 255, 0)')
    } else {
        gradient.addColorStop(0, 'rgba(148, 163, 184, 0.6)')
        gradient.addColorStop(1, 'rgba(148, 163, 184, 0)')
    }
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(c.x, c.y, 40, 0, Math.PI * 2)
    ctx.fill()
    
    // Sphere Body
    ctx.beginPath()
    ctx.arc(c.x, c.y, 20, 0, Math.PI * 2)
    ctx.fillStyle = c.q > 0 ? '#ff0055' : (c.q < 0 ? '#00d4ff' : '#94a3b8')
    ctx.fill()
    
    // Selection Ring
    if (isSelected) {
        ctx.strokeStyle = '#fbbf24'
        ctx.lineWidth = 3
        ctx.stroke()
    }
    
    // Label (A, B, C...)
    ctx.fillStyle = 'white'
    ctx.font = 'bold 18px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    // id mapping? Or index mapping?
    // Using index in array for A, B, C is unstable if we remove charges.
    // Better to use a stable property or just index if that's acceptable.
    // User asked "name charges as A,B...". Simple index is fine.
    const index = charges.value.findIndex(ch => ch.id === c.id)
    const label = String.fromCharCode(65 + (index % 26)) // A, B, C...
    ctx.fillText(label, c.x, c.y)
    
    // Charge Value Label below
    ctx.font = '12px monospace'
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.fillText(`${c.q} µC`, c.x, c.y + 35)
}

const drawForceVector = (ctx, c) => {
    const { fx, fy, mag } = calculateNetForce(c)
    if (mag < 1e-10) return

    const forceScale = 2000 
    const arrowLen = Math.min(mag * forceScale, 300)
    
    if (props.forceMode === 'components') {
        // Mode 2: Show X and Y components for ALL charges (global)
        if (Math.abs(fx) > 1e-10) {
            drawArrow(ctx, c.x, c.y, fx, 0, Math.abs(fx)*forceScale, '#ef4444') // Red for X
        }
        if (Math.abs(fy) > 1e-10) {
            drawArrow(ctx, c.x, c.y, 0, fy, Math.abs(fy)*forceScale, '#3b82f6') // Blue for Y
        }
    } else if (props.forceMode === 'pairwise') {
        // Mode 3: Show individual forces between every pair
        drawPairwiseForces(ctx, c)
    } else {
        // Mode 1: Resultant (with optional click-to-expand for individual charge)
        if (showComponentsMap.value.get(c.id)) {
            // Expanded: show components
            if (Math.abs(fx) > 1e-10) {
                drawArrow(ctx, c.x, c.y, fx, 0, Math.abs(fx)*forceScale, '#ef4444')
            }
            if (Math.abs(fy) > 1e-10) {
                drawArrow(ctx, c.x, c.y, 0, fy, Math.abs(fy)*forceScale, '#3b82f6')
            }
        } else {
            // Default: Net Force (Yellow)
            const angle = Math.atan2(fy, fx)
            drawArrow(ctx, c.x, c.y, fx, fy, arrowLen, '#fbbf24')
        }
    }
}

const drawPairwiseForces = (ctx, targetCharge) => {
    const forceScale = 2000
    const chargeIndex = charges.value.findIndex(ch => ch.id === targetCharge.id)
    const targetLabel = String.fromCharCode(65 + (chargeIndex % 26))
    
    charges.value.forEach((sourceCharge, sourceIndex) => {
        if (sourceCharge.id === targetCharge.id) return
        
        const dx = targetCharge.x - sourceCharge.x
        const dy = targetCharge.y - sourceCharge.y
        const r2 = dx*dx + dy*dy
        if (r2 < 1e-10) return
        
        const r = Math.sqrt(r2)
        const F = (K * Math.abs(targetCharge.q * sourceCharge.q)) / r2
        const sameSign = (targetCharge.q * sourceCharge.q) > 0
        const direction = sameSign ? 1 : -1
        
        const fx = direction * F * (dx / r)
        const fy = direction * F * (dy / r)
        const mag = Math.sqrt(fx*fx + fy*fy)
        
        if (mag < 1e-10) return
        
        const arrowLen = Math.min(mag * forceScale, 150)
        const angle = Math.atan2(fy, fx)
        
        // Draw arrow in green for pairwise
        const startX = targetCharge.x + Math.cos(angle) * 25
        const startY = targetCharge.y + Math.sin(angle) * 25
        const endX = startX + Math.cos(angle) * arrowLen
        const endY = startY + Math.sin(angle) * arrowLen
        
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.strokeStyle = '#10b981' // Green
        ctx.lineWidth = 3
        ctx.stroke()
        
        // Arrowhead
        const headLen = 12
        ctx.beginPath()
        ctx.moveTo(endX, endY)
        ctx.lineTo(endX - headLen * Math.cos(angle - Math.PI/6), endY - headLen * Math.sin(angle - Math.PI/6))
        ctx.lineTo(endX - headLen * Math.cos(angle + Math.PI/6), endY - headLen * Math.sin(angle + Math.PI/6))
        ctx.fillStyle = '#10b981'
        ctx.fill()
        
        // Label (Fab, Fac, etc.)
        const sourceLabel = String.fromCharCode(65 + (sourceIndex % 26))
        const label = `F${targetLabel}${sourceLabel}`
        
        ctx.font = 'bold 11px Arial'
        ctx.fillStyle = '#10b981'
        ctx.shadowColor = 'black'
        ctx.shadowBlur = 3
        ctx.fillText(label, endX + 5, endY - 5)
        ctx.shadowBlur = 0
    })
}

const drawArrow = (ctx, cx, cy, dirX, dirY, len, color) => {
    const angle = Math.atan2(dirY, dirX)
    const startX = cx + Math.cos(angle) * 25
    const startY = cy + Math.sin(angle) * 25
    const endX = startX + Math.cos(angle) * len
    const endY = startY + Math.sin(angle) * len

    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.lineTo(endX, endY)
    ctx.strokeStyle = color
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.stroke()
    
    const headLen = 15
    ctx.beginPath()
    ctx.moveTo(endX, endY)
    ctx.lineTo(endX - headLen * Math.cos(angle - Math.PI/6), endY - headLen * Math.sin(angle - Math.PI/6))
    ctx.lineTo(endX - headLen * Math.cos(angle + Math.PI/6), endY - headLen * Math.sin(angle + Math.PI/6))
    ctx.fillStyle = color
    ctx.fill()
}

const drawShapePerimeter = (ctx) => {
    if (!currentShape.value || charges.value.length < 3) return
    
    ctx.save()
    ctx.setLineDash([5, 5])
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 2
    ctx.beginPath()
    
    if (currentShape.value === 'square' || currentShape.value === 'rectangle') {
        // Assuming order 0,1,2,3 from setShape is: TL, TR, BR, BL?
        // setShape: (-w,-h), (w,-h), (w,h), (-w,h) -> 0->1->2->3->0
        ctx.moveTo(charges.value[0].x, charges.value[0].y)
        ctx.lineTo(charges.value[1].x, charges.value[1].y)
        ctx.lineTo(charges.value[2].x, charges.value[2].y)
        ctx.lineTo(charges.value[3].x, charges.value[3].y)
        ctx.closePath()
    } else if (currentShape.value === 'triangle') {
        // 0,1,2
        ctx.moveTo(charges.value[0].x, charges.value[0].y)
        ctx.lineTo(charges.value[1].x, charges.value[1].y)
        ctx.lineTo(charges.value[2].x, charges.value[2].y)
        ctx.closePath()
    }
    
    ctx.stroke()
    ctx.restore()
}

// Helper for click detection
const pointToLineDistance = (px, py, x1, y1, x2, y2) => {
    const A = px - x1
    const B = py - y1
    const C = x2 - x1
    const D = y2 - y1

    const dot = A * C + B * D
    const lenSq = C * C + D * D
    let param = -1
    if (lenSq !== 0) param = dot / lenSq

    let xx, yy
    if (param < 0) {
        xx = x1
        yy = y1
    } else if (param > 1) {
        xx = x2
        yy = y2
    } else {
        xx = x1 + param * C
        yy = y1 + param * D
    }

    const dx = px - xx
    const dy = py - yy
    return Math.sqrt(dx * dx + dy * dy)
}

const draw = () => {
    const ctx = canvasRef.value?.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, width.value, height.value)
    
    const cx = width.value / 2
    const cy = height.value / 2
    
    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(props.zoom, props.zoom)
    
    if (props.showGrid) {
        drawGrid(ctx, -cx/props.zoom, -cy/props.zoom, width.value/props.zoom, height.value/props.zoom)
    }
    
    charges.value.forEach(c => drawCharge(ctx, c))
    drawShapePerimeter(ctx)
    charges.value.forEach(c => drawForceVector(ctx, c))
    
    charges.value.forEach(c => {
        if (c.id === selectedChargeId.value) {
            const { mag } = calculateNetForce(c)
            selectedNetForce.value = mag
        }
    })
    
    ctx.restore()
}

let frameId
const animate = () => {
    draw()
    frameId = requestAnimationFrame(animate)
}

onUnmounted(() => {
    cancelAnimationFrame(frameId)
})
</script>

<template>
    <div class="multiple-forces-lab" ref="containerRef">
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
        <div class="hint-overlay" v-if="charges.length === 0">
            Click "Add Charge" to begin
        </div>
    </div>
</template>

<style scoped>
.multiple-forces-lab {
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
.multiple-forces-lab:active {
    cursor: grabbing;
}
.hint-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: rgba(255,255,255,0.5);
    font-size: 1.5rem;
    pointer-events: none;
}
</style>
