<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  mode: {
    type: String, // 'pen', 'laser', 'eraser', 'select', 'rect', 'circle', 'arrow', 'line'
    default: 'pen'
  },
  color: {
    type: String,
    default: '#00d4ff'
  },
  thickness: {
    type: Number,
    default: 3
  },
  active: {
    type: Boolean,
    default: false
  }
})

const canvasRef = ref(null)
const laserCanvasRef = ref(null)
const ctx = ref(null)
const laserCtx = ref(null)
const isDrawing = ref(false)
const lastPos = ref({ x: 0, y: 0 })

// Object storage & Selection
const shapes = ref([]) // { type, x, y, w, h, x2, y2, color, thickness }
const selectedShapeIndex = ref(-1)
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const resizeHandle = ref(null) // 'tl', 'tr', 'bl', 'br', 'start', 'end'

// Laser trail state
const laserPoints = ref([])
const laserActive = ref(false)

// Smooth Drawing State
const drawPoints = ref([])
const paths = ref([]) // Persistent pen paths

const setupCanvas = () => {
  if (!canvasRef.value) return
  const canvas = canvasRef.value
  const laserCanvas = laserCanvasRef.value
  
  // Only resize (which clears canvas) if dimensions have changed
  if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    laserCanvas.width = window.innerWidth
    laserCanvas.height = window.innerHeight
    
    ctx.value = canvas.getContext('2d')
    laserCtx.value = laserCanvas.getContext('2d')
    
    ctx.value.lineCap = 'round'
    ctx.value.lineJoin = 'round'
    laserCtx.value.lineCap = 'round'
    laserCtx.value.lineJoin = 'round'
  }
}

const getPos = (e) => {
  const rect = canvasRef.value.getBoundingClientRect()
  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  const clientY = e.touches ? e.touches[0].clientY : e.clientY
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  }
}

const hitTest = (pos) => {
    for (let i = shapes.value.length - 1; i >= 0; i--) {
        const s = shapes.value[i]
        if (s.type === 'rect') {
            const rx = s.w < 0 ? s.x + s.w : s.x
            const ry = s.h < 0 ? s.y + s.h : s.y
            const rw = Math.abs(s.w)
            const rh = Math.abs(s.h)
            if (pos.x >= rx && pos.x <= rx + rw && pos.y >= ry && pos.y <= ry + rh) return i
        } else if (s.type === 'circle') {
            const dx = pos.x - (s.x + s.w/2); const dy = pos.y - (s.y + s.h/2)
            if (Math.hypot(dx, dy) <= Math.abs(s.w/2)) return i
        } else if (s.type === 'line' || s.type === 'arrow') {
            const d = distToSegment(pos, { x: s.x, y: s.y }, { x: s.x2, y: s.y2 })
            if (d < 10) return i
        }
    }
    return -1
}

const distToSegment = (p, v, w) => {
  const l2 = (v.x - w.x)**2 + (v.y - w.y)**2
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y)
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)))
}

const emit = defineEmits(['selectionChanged'])

const startDrawing = (e) => {
  if (!props.active) return
  const pos = getPos(e)
  lastPos.value = pos
  drawPoints.value = [pos] // Start smooth path

  if (props.mode === 'select') {
      if (selectedShapeIndex.value !== -1) {
          resizeHandle.value = getHandleAt(pos, shapes.value[selectedShapeIndex.value])
          if (resizeHandle.value) { isDragging.value = true; return }
      }
      const index = hitTest(pos)
      selectedShapeIndex.value = index
      emit('selectionChanged', index !== -1)
      if (index !== -1) {
          isDragging.value = true
          const s = shapes.value[index]
          dragOffset.value = { x: pos.x - s.x, y: pos.y - s.y }
      }
      return
  }
  
  // Deselect if drawing new shape
  if (selectedShapeIndex.value !== -1) {
    selectedShapeIndex.value = -1
    emit('selectionChanged', false)
  }
  
  isDrawing.value = true
  if (['rect', 'circle', 'arrow', 'line'].includes(props.mode)) {
      shapes.value.push({
          type: props.mode, x: pos.x, y: pos.y, w: 0, h: 0, x2: pos.x, y2: pos.y,
          color: props.color, thickness: props.thickness
      })
      selectedShapeIndex.value = shapes.value.length - 1
      // Auto-select the new shape? Maybe not immediately for resizing, but usually yes.
      // But standard behavior is just draw.
  } else if (props.mode === 'laser') {
    laserActive.value = true
    laserPoints.value = [{ ...pos, age: 0 }]
  }
}

const getHandleAt = (pos, s) => {
    const size = 15
    if (s.type === 'rect' || s.type === 'circle') {
        if (Math.hypot(pos.x - s.x, pos.y - s.y) < size) return 'tl'
        if (Math.hypot(pos.x - (s.x + s.w), pos.y - s.y) < size) return 'tr'
        if (Math.hypot(pos.x - s.x, pos.y - (s.y + s.h)) < size) return 'bl'
        if (Math.hypot(pos.x - (s.x + s.w), pos.y - (s.y + s.h)) < size) return 'br'
    } else {
        if (Math.hypot(pos.x - s.x, pos.y - s.y) < size) return 'start'
        if (Math.hypot(pos.x - s.x2, pos.y - s.y2) < size) return 'end'
    }
    return null
}

const draw = (e) => {
  if (!props.active || (!isDrawing.value && !isDragging.value)) {
      if (props.mode === 'laser') lastPos.value = getPos(e)
      return
  }
  const currentPos = getPos(e)
  
  if (props.mode === 'select' && isDragging.value && selectedShapeIndex.value !== -1) {
      const s = shapes.value[selectedShapeIndex.value]
      if (resizeHandle.value) {
          if (resizeHandle.value === 'br') { s.w = currentPos.x - s.x; s.h = currentPos.y - s.y }
          else if (resizeHandle.value === 'tl') { s.w += s.x - currentPos.x; s.h += s.y - currentPos.y; s.x = currentPos.x; s.y = currentPos.y }
          else if (resizeHandle.value === 'tr') { s.w = currentPos.x - s.x; s.h += s.y - currentPos.y; s.y = currentPos.y }
          else if (resizeHandle.value === 'bl') { s.w += s.x - currentPos.x; s.x = currentPos.x; s.h = currentPos.y - s.y }
          else if (resizeHandle.value === 'start') { s.x = currentPos.x; s.y = currentPos.y }
          else if (resizeHandle.value === 'end') { s.x2 = currentPos.x; s.y2 = currentPos.y }
      } else {
          const dx = currentPos.x - dragOffset.value.x - s.x
          const dy = currentPos.y - dragOffset.value.y - s.y
          s.x += dx; s.y += dy
          if (s.x2 !== undefined) { s.x2 += dx; s.y2 += dy }
      }
  } else if (isDrawing.value) {
      if (props.mode === 'pen' || props.mode === 'eraser') {
        drawPoints.value.push(currentPos)
      } else if (['rect', 'circle', 'arrow', 'line'].includes(props.mode)) {
          const s = shapes.value[selectedShapeIndex.value]
          s.w = currentPos.x - s.x; s.h = currentPos.y - s.y
          s.x2 = currentPos.x; s.y2 = currentPos.y
      } else if (props.mode === 'laser') {
        laserPoints.value.push({ x: currentPos.x, y: currentPos.y, age: 0 })
      }
  }
  lastPos.value = currentPos
}

const stopDrawing = () => {
  if (isDrawing.value && (props.mode === 'pen' || props.mode === 'eraser') && drawPoints.value.length > 0) {
      paths.value.push({
          points: [...drawPoints.value],
          color: props.color,
          thickness: props.thickness,
          mode: props.mode
      })
  }
  isDrawing.value = false
  isDragging.value = false
  resizeHandle.value = null
  drawPoints.value = []
}

const drawShape = (c, s, isSelected) => {
    c.beginPath()
    c.strokeStyle = s.color
    c.lineWidth = s.thickness
    c.globalCompositeOperation = 'source-over'
    
    if (s.type === 'rect') c.strokeRect(s.x, s.y, s.w, s.h)
    else if (s.type === 'circle') {
        c.beginPath(); c.arc(s.x + s.w/2, s.y + s.h/2, Math.abs(s.w/2), 0, Math.PI * 2)
        c.stroke()
    } else if (s.type === 'line' || s.type === 'arrow') {
        c.moveTo(s.x, s.y); c.lineTo(s.x2, s.y2); c.stroke()
        if (s.type === 'arrow') {
            const angle = Math.atan2(s.y2 - s.y, s.x2 - s.x); const len = 15
            c.lineTo(s.x2 - len * Math.cos(angle - Math.PI/6), s.y2 - len * Math.sin(angle - Math.PI/6))
            c.moveTo(s.x2, s.y2); c.lineTo(s.x2 - len * Math.cos(angle + Math.PI/6), s.y2 - len * Math.sin(angle + Math.PI/6))
            c.stroke()
        }
    }

    if (isSelected) {
        c.setLineDash([5, 5]); c.strokeStyle = '#fff'; c.lineWidth = 1
        if (s.type === 'rect' || s.type === 'circle') c.strokeRect(s.x - 2, s.y - 2, s.w + 4, s.h + 4)
        c.setLineDash([]); const hs = 8; c.fillStyle = '#fff'
        if (s.type === 'rect' || s.type === 'circle') {
            [[s.x, s.y], [s.x+s.w, s.y], [s.x, s.y+s.h], [s.x+s.w, s.y+s.h]].forEach(([hx, hy]) => c.fillRect(hx-hs/2, hy-hs/2, hs, hs))
        } else { [[s.x, s.y], [s.x2, s.y2]].forEach(([hx, hy]) => c.fillRect(hx-hs/2, hy-hs/2, hs, hs)) }
    }
}

const drawPath = (c, p) => {
    if (p.points.length === 0) return
    c.beginPath()
    c.lineCap = 'round'
    c.lineJoin = 'round'
    
    if (p.mode === 'eraser') {
        c.globalCompositeOperation = 'destination-out'
        c.lineWidth = p.thickness * 5
    } else {
        c.globalCompositeOperation = 'source-over'
        c.strokeStyle = p.color
        c.lineWidth = p.thickness
    }

    const points = p.points
    if (points.length === 1) {
        c.moveTo(points[0].x, points[0].y)
        c.lineTo(points[0].x, points[0].y)
    } else {
        c.moveTo(points[0].x, points[0].y)
        for (let i = 1; i < points.length; i++) {
            const mid = { x: (points[i-1].x + points[i].x) / 2, y: (points[i-1].y + points[i].y) / 2 }
            c.quadraticCurveTo(points[i-1].x, points[i-1].y, mid.x, mid.y)
        }
        // Connect to final point
        const last = points[points.length - 1]
        c.lineTo(last.x, last.y)
    }
    c.stroke()
}

// Laser Animation Loop
let animationFrame
const animateLaser = () => {
    if (!laserCtx.value || !ctx.value) return
    laserCtx.value.clearRect(0, 0, laserCanvasRef.value.width, laserCanvasRef.value.height)
    ctx.value.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
    
    // Draw Static Paths (Bottom Canvas)
    paths.value.forEach(p => drawPath(ctx.value, p))
    
    // Draw current active path
    if (isDrawing.value && (props.mode === 'pen' || props.mode === 'eraser')) {
        drawPath(ctx.value, {
            points: drawPoints.value,
            color: props.color,
            thickness: props.thickness,
            mode: props.mode
        })
    }

    // Draw Shapes (Top Canvas)
    shapes.value.forEach((s, idx) => {
        drawShape(laserCtx.value, s, selectedShapeIndex.value === idx && props.mode === 'select')
    })

    if (props.mode === 'laser' && props.active) {
        if (laserPoints.value.length > 1) {
            laserCtx.value.beginPath()
            laserCtx.value.moveTo(laserPoints.value[0].x, laserPoints.value[0].y)
            laserPoints.value.forEach(p => laserCtx.value.lineTo(p.x, p.y))
            laserCtx.value.strokeStyle = '#ff0055'; laserCtx.value.lineWidth = 4
            laserCtx.value.shadowBlur = 15; laserCtx.value.shadowColor = '#ff0055'; laserCtx.value.stroke()
            laserCtx.value.strokeStyle = '#fff'; laserCtx.value.lineWidth = 2; laserCtx.value.shadowBlur = 0; laserCtx.value.stroke()
        }
        if (lastPos.value.x !== 0) {
            laserCtx.value.beginPath(); laserCtx.value.arc(lastPos.value.x, lastPos.value.y, 6, 0, Math.PI * 2)
            laserCtx.value.fillStyle = '#ff0055'; laserCtx.value.shadowBlur = 20; laserCtx.value.shadowColor = '#ff0055'; laserCtx.value.fill()
            laserCtx.value.beginPath(); laserCtx.value.arc(lastPos.value.x, lastPos.value.y, 2, 0, Math.PI * 2)
            laserCtx.value.fillStyle = '#fff'; laserCtx.value.fill()
        }
    }
    
    // Aging/Fading
    const MAX_LASER_POINTS = 120
    if (laserPoints.value.length > 0) {
        if (!isDrawing.value) { if (Math.random() > 0.5) laserPoints.value.shift() }
        else if (laserPoints.value.length > MAX_LASER_POINTS) { laserPoints.value.shift() }
    }
    animationFrame = requestAnimationFrame(animateLaser)
}

const deleteSelectedShape = () => {
  if (selectedShapeIndex.value !== -1) {
    shapes.value.splice(selectedShapeIndex.value, 1)
    selectedShapeIndex.value = -1
    emit('selectionChanged', false)
    stopDrawing() // reset drag states
  }
}

const handleKeyDown = (e) => {
  if (props.active && (e.key === 'Delete' || e.key === 'Backspace')) {
    deleteSelectedShape()
  }
}

watch(() => props.active, (val) => {
    if (val) {
        setupCanvas()
        window.addEventListener('keydown', handleKeyDown)
    } else {
        window.removeEventListener('keydown', handleKeyDown)
    }
})

const clearAll = () => {
  ctx.value?.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  shapes.value = []
  paths.value = []
  selectedShapeIndex.value = -1
  emit('selectionChanged', false)
}

defineExpose({ clearAll, deleteSelectedShape })

onMounted(() => {
  setupCanvas()
  animateLaser()
  window.addEventListener('resize', setupCanvas)
  window.addEventListener('mousemove', handleGlobalMouseMove)
})

onUnmounted(() => {
  window.removeEventListener('resize', setupCanvas)
  window.removeEventListener('mousemove', handleGlobalMouseMove)
  cancelAnimationFrame(animationFrame)
})

const handleGlobalMouseMove = (e) => {
    if (props.active && !isDrawing.value) {
        if (['laser', 'pen', 'eraser'].includes(props.mode)) {
            lastPos.value = getPos(e)
        }
    }
}
</script>

<template>
  <div class="drawing-container" :class="{ 
    'active': active, 
    'pen-cursor': mode === 'pen', 
    'eraser-cursor': mode === 'eraser', 
    'laser-cursor': mode === 'laser',
    'select-mode': mode === 'select'
  }">
    <canvas
      ref="canvasRef"
      class="drawing-canvas"
      @mousedown="startDrawing"
      @mousemove="draw"
      @mouseup="stopDrawing"
      @mouseleave="stopDrawing"
      @touchstart.prevent="startDrawing"
      @touchmove.prevent="draw"
      @touchend="stopDrawing"
    ></canvas>
    
    <canvas
      ref="laserCanvasRef"
      class="laser-canvas"
    ></canvas>
    
    <!-- Custom Cursor -->
    <Teleport to="body">
      <div 
        v-if="active && ['pen', 'eraser'].includes(mode)"
        class="custom-cursor" 
        :style="{ 
          left: lastPos.x + 'px', 
          top: lastPos.y + 'px',
          width: thickness + 'px',
          height: thickness + 'px',
          backgroundColor: mode === 'eraser' ? 'rgba(255,255,255,0.5)' : color,
          border: mode === 'eraser' ? '1px solid #000' : 'none',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999
        }"
      ></div>
    </Teleport>
  </div>
</template>

<style scoped>
.drawing-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 90;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

.drawing-container.active {
  pointer-events: all;
  opacity: 1;
  visibility: visible;
}

.drawing-canvas, .laser-canvas {
  display: block;
  position: absolute;
  top: 0;
  left: 0;
}

.laser-canvas {
    pointer-events: none;
}

.pen-cursor, .eraser-cursor { cursor: none; }
.laser-cursor { cursor: none; }
.select-mode { cursor: default; }

.custom-cursor {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  z-index: 9999;
  box-shadow: 0 0 2px rgba(0,0,0,0.5);
}

</style>
