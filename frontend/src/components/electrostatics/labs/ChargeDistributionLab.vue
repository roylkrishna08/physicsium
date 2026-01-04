<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

const props = defineProps({
    showGrid: { type: Boolean, default: false },
    zoom: { type: Number, default: 1 }
})

const emit = defineEmits(['select'])

const canvasRef = ref(null)
const width = ref(800)
const height = ref(600)

// State
const spheres = ref([
    { id: 1, x: -100, y: 0, r: 40, q: 2, dragging: false },
    { id: 2, x: 100, y: 0, r: 40, q: -10, dragging: false }
])
let nextId = 3
const isDragging = ref(false)
const selectedSphereId = ref(null)

// Get mouse position in world coordinates
const getMousePos = (e) => {
    const rect = canvasRef.value.getBoundingClientRect()
    const cx = width.value / 2
    const cy = height.value / 2
    
    let xCanvas, yCanvas
    if (e.touches && e.touches.length > 0) {
        xCanvas = e.touches[0].clientX - rect.left
        yCanvas = e.touches[0].clientY - rect.top
    } else {
        xCanvas = e.clientX - rect.left
        yCanvas = e.clientY - rect.top
    }
    
    const x = (xCanvas - cx) / props.zoom
    const y = (yCanvas - cy) / props.zoom
    return { x, y }
}

// Collision detection and charge redistribution
const checkAndRedistribute = () => {
    for (let i = 0; i < spheres.value.length; i++) {
        for (let j = i + 1; j < spheres.value.length; j++) {
            const s1 = spheres.value[i]
            const s2 = spheres.value[j]
            
            const dx = s2.x - s1.x
            const dy = s2.y - s1.y
            const distance = Math.sqrt(dx*dx + dy*dy)
            
            // Check if touching
            if (distance < s1.r + s2.r && distance > 0) {
                // Redistribute charge based on capacitance (proportional to radius)
                const totalCharge = s1.q + s2.q
                const totalCapacitance = s1.r + s2.r
                
                s1.q = totalCharge * (s1.r / totalCapacitance)
                s2.q = totalCharge * (s2.r / totalCapacitance)
                
                // Separate spheres slightly to prevent continuous redistribution
                const separationDistance = s1.r + s2.r + 5 // Small gap
                const angle = Math.atan2(dy, dx)
                const midX = (s1.x + s2.x) / 2
                const midY = (s1.y + s2.y) / 2
                
                s1.x = midX - Math.cos(angle) * separationDistance / 2
                s1.y = midY - Math.sin(angle) * separationDistance / 2
                s2.x = midX + Math.cos(angle) * separationDistance / 2
                s2.y = midY + Math.sin(angle) * separationDistance / 2
            }
        }
    }
}

// Event handlers
const handleStart = (e) => {
    isDragging.value = true
    const { x, y } = getMousePos(e)
    
    let hit = false
    spheres.value.forEach(s => {
        const dx = x - s.x
        const dy = y - s.y
        if (dx*dx + dy*dy < s.r*s.r) {
            s.dragging = true
            selectedSphereId.value = s.id
            hit = true
        }
    })
    
    if (!hit) {
        selectedSphereId.value = null
    }
    
    emit('select')
}

const handleMove = (e) => {
    if (!isDragging.value) return
    const { x, y } = getMousePos(e)
    
    spheres.value.forEach(s => {
        if (s.dragging) {
            s.x = x
            s.y = y
            checkAndRedistribute()
        }
    })
}

const handleEnd = () => {
    isDragging.value = false
    spheres.value.forEach(s => s.dragging = false)
}

// API for parent
const addSphere = () => {
    spheres.value.push({
        id: nextId++,
        x: (Math.random() - 0.5) * 200,
        y: (Math.random() - 0.5) * 200,
        r: 40,
        q: 0,
        dragging: false
    })
}

const updateSelectedRadius = (val) => {
    if (selectedSphereId.value) {
        const s = spheres.value.find(s => s.id === selectedSphereId.value)
        if (s) {
            s.r = val
            emit('select')
        }
    }
}

const updateSelectedCharge = (val) => {
    if (selectedSphereId.value) {
        const s = spheres.value.find(s => s.id === selectedSphereId.value)
        if (s) {
            s.q = val
            emit('select')
        }
    }
}

const removeSelected = () => {
    if (selectedSphereId.value) {
        spheres.value = spheres.value.filter(s => s.id !== selectedSphereId.value)
        selectedSphereId.value = null
    }
}

const getSelectedSphere = () => spheres.value.find(s => s.id === selectedSphereId.value)

defineExpose({
    addSphere,
    updateSelectedRadius,
    updateSelectedCharge,
    removeSelected,
    selectedSphereId,
    getSelectedSphere
})

// Drawing
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

const drawSphere = (ctx, s) => {
    const isSelected = s.id === selectedSphereId.value
    
    // Get color based on charge
    let color
    if (s.q > 0) {
        const intensity = Math.min(Math.abs(s.q) / 10, 1)
        color = `rgba(239, 68, 68, ${0.3 + intensity * 0.4})`
    } else if (s.q < 0) {
        const intensity = Math.min(Math.abs(s.q) / 10, 1)
        color = `rgba(59, 130, 246, ${0.3 + intensity * 0.4})`
    } else {
        color = 'rgba(148, 163, 184, 0.5)'
    }
    
    // Draw sphere
    ctx.beginPath()
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
    
    // Border
    if (isSelected) {
        ctx.strokeStyle = '#fbbf24'
        ctx.lineWidth = 3
    } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.lineWidth = 2
    }
    ctx.stroke()
    
    // Label (charge value)
    ctx.fillStyle = 'white'
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = 'black'
    ctx.shadowBlur = 4
    ctx.fillText(`${s.q.toFixed(1)} µC`, s.x, s.y)
    ctx.shadowBlur = 0
    
    // Radius label
    ctx.font = '12px Arial'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.fillText(`r=${s.r}`, s.x, s.y + s.r + 15)
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
    
    spheres.value.forEach(s => drawSphere(ctx, s))
    
    ctx.restore()
}

let frameId
const animate = () => {
    draw()
    frameId = requestAnimationFrame(animate)
}

onMounted(() => {
    if (canvasRef.value) {
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

onUnmounted(() => {
    cancelAnimationFrame(frameId)
})
</script>

<template>
    <div class="charge-distribution-lab" ref="containerRef">
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
        <div class="hint-overlay" v-if="spheres.length === 0">
            Click "Add Sphere" to begin
        </div>
    </div>
</template>

<style scoped>
.charge-distribution-lab {
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
.charge-distribution-lab:active {
    cursor: grabbing;
}
.hint-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 1.2rem;
    color: rgba(255, 255, 255, 0.3);
    pointer-events: none;
}
</style>
