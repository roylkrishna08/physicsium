<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { scenarios } from './scenarios.js'

const props = defineProps({
  mode: { type: String, default: '1d' }, // '1d', 'rain', 'river', 'min-distance'
  v1: { type: Number, default: 5 },
  v2: { type: Number, default: 2 },
  angle1: { type: Number, default: 0 },
  angle2: { type: Number, default: 0 },
  observerFrame: { type: String, default: 'ground' }, // 'ground', 'obj1', 'obj2'
  visualTheme: { type: String, default: 'ball' }, // 'ball', 'car'
  showVectors: { type: Boolean, default: true },
  showGrid: { type: Boolean, default: true },
  zoom: { type: Number, default: 1 },
  objects: { type: Array, default: () => [] },
  selectedObjectId: { type: [String, Number, null], default: null },
  // Rain Props
  rainSpeed: { type: Number, default: 10 }, 
  manualUmbrella: { type: Boolean, default: false },
  umbrellaAngle: { type: Number, default: 0 },
  showTheta: { type: Boolean, default: true }
})

const emit = defineEmits(['update:zoom', 'update:objects', 'update:selectedObjectId'])

const canvasRef = ref(null)
let animationId = null

// Interaction State
const isDragging = ref(false)
const draggedObj = ref(null) // 'obj1', 'obj2', or 'panning'
const panOffset = ref({ x: 0, y: 0 })
const lastMousePos = ref({ x: 0, y: 0 })

// Overlay Dragging State
const overlayPos = ref({ top: 20, right: 20 })
const isDraggingOverlay = ref(false)
const vectorPos = ref({ x: 100, y: 150, scale: 1.0 }) // Screen Coords + Scale for Vector Diagram
const vectorPos2 = ref({ x: 400, y: 150, scale: 1.0 }) // Screen Coords + Scale for Component Diagram
const dragStartMouse = ref({ x: 0, y: 0 })

// Simulation State
const objects = computed({
    get: () => props.objects,
    set: (val) => emit('update:objects', val)
})
const trails = ref({}) // Map of object.id -> array of points
const time = ref(0)
const minDistance = ref(Infinity)

// UI / Selection State
const selectedObjectId = computed({
    get: () => props.selectedObjectId,
    set: (val) => emit('update:selectedObjectId', val)
})
const selectedObject = computed(() => objects.value.find(o => o.id === selectedObjectId.value))

// Current Scenario Helper
const currentScenario = computed(() => scenarios[props.mode] || scenarios['1d'])

// Modular Stats Helper
const activeStats = computed(() => {
    if (currentScenario.value.getStats) {
        return currentScenario.value.getStats(objects, props, minDistance.value)
    }
    return []
})

// Coordinate Transformation Helpers
const getFocalPoint = () => {
    const trackedObj = objects.value.find(o => {
        const id = o.id
        const target = (props.observerFrame === 'obj1' ? ['A', 'Man', 'Boat', 'Plane'] : (props.observerFrame === 'obj2' ? ['B', 'Rain', 'Wind', 'River'] : [props.observerFrame]))
        return target.includes(id)
    })

    if (props.observerFrame !== 'ground' && trackedObj) {
        return { x: trackedObj.x, y: trackedObj.y }
    } else {
        return { 
            x: -panOffset.value.x / props.zoom, 
            y: -panOffset.value.y / props.zoom 
        }
    }
}

const toSimCoords = (mx, my) => {
    const canvas = canvasRef.value
    if (!canvas) return { x: 0, y: 0 }
    
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const focal = getFocalPoint()

    return {
        x: (mx - centerX) / props.zoom + focal.x,
        y: (my - centerY) / props.zoom + focal.y
    }
}

const handleMouseDown = (e) => {
    const canvas = canvasRef.value
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    
    lastMousePos.value = { x: mx, y: my }
    const simPos = toSimCoords(mx, my)

    // Check if clicking an object
    let clickedId = null
    for (const obj of objects.value) {
        const d = Math.sqrt((simPos.x - obj.x)**2 + (simPos.y - obj.y)**2)
        if (d < 30) {
            clickedId = obj.id
            break
        }
    }

    if (['rain', 'river'].includes(props.mode) && props.showVectors) {
        // --- Diagram 1 (Originals / River Addition) ---
        const v1 = vectorPos.value
        
        const isRiver = props.mode === 'river'
        const size1 = (isRiver ? 180 : 150) * v1.scale
        const boxX = isRiver ? v1.x - 70 : v1.x - 10
        const boxY = isRiver ? v1.y - 15 : v1.y - 10
        const boxW = isRiver ? size1 + 110 : size1 + 20
        const boxH = isRiver ? size1 + 110 : size1 + 20

        // Resize Zone (Bottom Right Corner)
        if (mx >= boxX + boxW - 25 && mx <= boxX + boxW + 5 &&
            my >= boxY + boxH - 25 && my <= boxY + boxH + 5) {
            draggedObj.value = 'vector-resize'
            isDragging.value = true
            lastMousePos.value = { x: mx, y: my }
            return
        }
        // Drag Zone
        if (mx >= boxX && mx <= boxX + boxW &&
            my >= boxY && my <= boxY + boxH) {
            draggedObj.value = 'vector'
            isDragging.value = true
            lastMousePos.value = { x: mx, y: my }
            return
        }
        
        // --- Diagram 2 (Resultant - Rain Only) ---
        if (props.mode === 'rain') {
            const v2 = vectorPos2.value
            const size2 = 150 * v2.scale
            if (mx >= v2.x + size2 - 20 && mx <= v2.x + size2 + 10 &&
                my >= v2.y + size2 - 20 && my <= v2.y + size2 + 10) {
                draggedObj.value = 'vector2-resize'
                isDragging.value = true
                lastMousePos.value = { x: mx, y: my }
                return
            }
            if (mx >= v2.x - 20 && mx <= v2.x + size2 &&
                my >= v2.y - 20 && my <= v2.y + size2) {
                draggedObj.value = 'vector2'
                isDragging.value = true
                lastMousePos.value = { x: mx, y: my }
                return
            }
        }
    }

    if (clickedId) {
        draggedObj.value = clickedId
        selectedObjectId.value = clickedId
    } else {
        draggedObj.value = 'panning'
        selectedObjectId.value = null
    }
    isDragging.value = true
    lastMousePos.value = { x: mx, y: my }
}

const handleMouseMove = (e) => {
    if (!isDragging.value) return
    const canvas = canvasRef.value
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    
    const dx = mx - lastMousePos.value.x
    const dy = my - lastMousePos.value.y
    
    if (draggedObj.value === 'panning') {
        panOffset.value.x += dx
        panOffset.value.y += dy
    } else if (draggedObj.value === 'vector') { // Drag Vector Diagram
        vectorPos.value.x += dx
        vectorPos.value.y += dy
    } else if (draggedObj.value === 'vector-resize') { // Resize Vector Diagram
        // Sensitivity factor
        const scaleDelta = (dx + dy) * 0.005
        vectorPos.value.scale = Math.max(0.5, Math.min(3.0, vectorPos.value.scale + scaleDelta))
    } else if (draggedObj.value === 'vector2') { // Drag Component Diagram
        vectorPos2.value.x += dx
        vectorPos2.value.y += dy
    } else if (draggedObj.value === 'vector2-resize') { // Resize Component Diagram
        const scaleDelta = (dx + dy) * 0.005
        vectorPos2.value.scale = Math.max(0.5, Math.min(3.0, vectorPos2.value.scale + scaleDelta))
    } else {
        const simPos = toSimCoords(mx, my)
        const obj = objects.value.find(o => o.id === draggedObj.value)
        if (obj) {
            obj.x = simPos.x
            obj.y = simPos.y
            if (trails.value[obj.id]) trails.value[obj.id] = []
            if (obj.path) obj.path = [] // Clear scenario-specific path (e.g. river boat)
        }
    }
    
    lastMousePos.value = { x: mx, y: my }
}


const handleMouseUp = () => {
    isDragging.value = false
    draggedObj.value = null
}

// Overlay Dragging Handlers
const onOverlayDrag = (e) => {
    if (!isDraggingOverlay.value) return
    const dx = e.clientX - dragStartMouse.value.x
    const dy = e.clientY - dragStartMouse.value.y
    
    overlayPos.value.right -= dx
    overlayPos.value.top += dy
    
    dragStartMouse.value = { x: e.clientX, y: e.clientY }
}

const stopOverlayDrag = () => {
    isDraggingOverlay.value = false
    window.removeEventListener('mousemove', onOverlayDrag)
    window.removeEventListener('mouseup', stopOverlayDrag)
}

const startOverlayDrag = (e) => {
    isDraggingOverlay.value = true
    dragStartMouse.value = { x: e.clientX, y: e.clientY }
    window.addEventListener('mousemove', onOverlayDrag)
    window.addEventListener('mouseup', stopOverlayDrag)
}

const addObject = (x = 0, y = 0) => {
    const id = (objects.value.length + 1).toString()
    const newObj = {
        id,
        x,
        y,
        vx: 2 + Math.random() * 5,
        vy: (Math.random() - 0.5) * 4,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
        label: `Ball ${id}`,
        type: 'ball'
    }
    objects.value.push(newObj)
    selectedObjectId.value = id
}

const removeObject = (id) => {
    const index = objects.value.findIndex(o => o.id === id)
    if (index !== -1) {
        objects.value.splice(index, 1)
        if (selectedObjectId.value === id) selectedObjectId.value = null
        delete trails.value[id]
    }
}

const initSimulation = () => {
  time.value = 0
  minDistance.value = Infinity
  trails.value = {}
  panOffset.value = { x: 0, y: 0 } 
  selectedObjectId.value = null
  
  // Delegate initialization to active scenario
  if (currentScenario.value.init) {
    currentScenario.value.init(objects, 0, 0, props)
  }
}

const update = (canvas) => {
  const dt = 0.05
  const hw = canvas.width / (2 * props.zoom) + 100
  const hh = canvas.height / (2 * props.zoom) + 100

  const wrap = (obj) => {
    if (obj.x > hw) obj.x = -hw
    else if (obj.x < -hw) obj.x = hw
    if (obj.y > hh) obj.y = -hh
    else if (obj.y < -hh) obj.y = hh
  }
  
  // Delegate physics update to active scenario
  if (currentScenario.value.update) {
    currentScenario.value.update(objects, dt, props)
  }
  
  objects.value.forEach(obj => {
      wrap(obj)
      
      // Update Trails
      if (!trails.value[obj.id]) trails.value[obj.id] = []
      trails.value[obj.id].push({ x: obj.x, y: obj.y })
      if (trails.value[obj.id].length > 30) trails.value[obj.id].shift()
  })

  // Update minDistance (Only for the first two primary objects if they exist)
  if (objects.value.length >= 2) {
      const o1 = objects.value[0]
      const o2 = objects.value[1]
      const dx = o1.x - o2.x
      const dy = o1.y - o2.y
      const d = Math.sqrt(dx*dx + dy*dy)
      if (d < minDistance.value) minDistance.value = d
  }

  time.value += dt
}

const draw = () => {
  if (!canvasRef.value) return
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Calculate Focal Point and Center
  const canvasFullWidth = canvas.width
  const canvasFullHeight = canvas.height
  const focal = getFocalPoint()

  ctx.save()
  // 1. Move to screen center
  ctx.translate(canvasFullWidth / 2, canvasFullHeight / 2)
  // 2. Apply Zoom
  ctx.scale(props.zoom, props.zoom)
  // 3. Move to focal point in sim space
  ctx.translate(-focal.x, -focal.y)

  // Draw Grid (Global background grid - disabled for river to use clipped river-only grid)
  if (props.showGrid && props.mode !== 'river') {
      drawGrid(ctx, canvas)
  }

  if (props.visualTheme === 'car' && (props.mode === '1d' || props.mode === 'angular-velocity' || props.mode === 'min-distance')) {
      const obj1 = objects.value[0]
      const obj2 = objects.value[1]
      if (obj1) {
          drawRoad(ctx, canvas, obj1.y)
          if (obj2 && Math.abs(obj1.y - obj2.y) > 50) {
              drawRoad(ctx, canvas, obj2.y)
          }
      }
  }

  // Draw Trails in Minimalist Mode
  if (props.visualTheme === 'ball') {
      objects.value.forEach(obj => {
          if (trails.value[obj.id]) {
              drawTrail(ctx, trails.value[obj.id], obj.color)
          }
      })
  }

  // Package utilities for the scenario
  const utils = {
    drawObj, drawCar, drawRoad, drawRiver, drawMan, drawRain, 
    drawVector, drawSky, drawManWithFlag, drawAngular,
    drawBoat, drawSwimmer, drawPlane, drawRainSource, drawRainVectorDiagram, 
    drawGrid, time
  }

  // Delegate drawing to the active scenario
  if (currentScenario.value.draw) {
    currentScenario.value.draw(ctx, canvas, objects, props, utils)
  }

  // Draw Selection Highlight
  if (selectedObjectId.value) {
      const obj = objects.value.find(o => o.id === selectedObjectId.value)
      if (obj) {
          ctx.beginPath()
          ctx.strokeStyle = '#fff'
          ctx.setLineDash([2, 4])
          ctx.arc(obj.x, obj.y, 40, 0, Math.PI * 2)
          ctx.stroke()
          ctx.setLineDash([])
      }
  }

  ctx.restore()
  
  // Draw Screen-Space UI Elements (Vector Diagram)
  // Draw Screen-Space UI Elements (Vector Diagram)
  if (props.mode === 'rain' && props.showVectors) {
      const v1 = vectorPos.value
      const size1 = 150 * v1.scale
      const v2 = vectorPos2.value
      const size2 = 150 * v2.scale

      // Panel 1
      ctx.save()
      ctx.fillStyle = 'rgba(2, 6, 23, 0.92)'
      ctx.beginPath()
      if (ctx.roundRect) ctx.roundRect(v1.x - 10, v1.y - 10, size1 + 20, size1 + 20, 10)
      else ctx.rect(v1.x - 10, v1.y - 10, size1 + 20, size1 + 20)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.restore()
      
      drawRainVectorDiagram(ctx, v1.x, v1.y, v1.scale)
      
      // Resize Handle 1
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.beginPath()
      ctx.moveTo(v1.x + size1 + 10, v1.y + size1 + 10)
      ctx.lineTo(v1.x + size1 + 10, v1.y + size1 - 2)
      ctx.lineTo(v1.x + size1 - 2, v1.y + size1 + 10)
      ctx.fill()
      
      // Panel 2
      ctx.save()
      ctx.fillStyle = 'rgba(2, 6, 23, 0.92)'
      ctx.beginPath()
      if (ctx.roundRect) ctx.roundRect(v2.x - 10, v2.y - 10, size2 + 20, size2 + 20, 10)
      else ctx.rect(v2.x - 10, v2.y - 10, size2 + 20, size2 + 20)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.restore()
      
      drawRainComponentDiagram(ctx, v2.x, v2.y, v2.scale)
      
      // Resize Handle 2
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.beginPath()
      ctx.moveTo(v2.x + size2 + 10, v2.y + size2 + 10)
      ctx.lineTo(v2.x + size2 + 10, v2.y + size2 - 2)
      ctx.lineTo(v2.x + size2 - 2, v2.y + size2 + 10)
      ctx.fill()
  }

  // Draw River Vector Diagram (Screen-Space)
  if (props.mode === 'river' && props.showVectors) {
      const v = vectorPos.value
      const size = 180 * v.scale
      const boxX = v.x - 70
      const boxY = v.y - 15
      const boxW = size + 110
      const boxH = size + 110

      // High Contrast Glass Panel
      ctx.save()
      ctx.fillStyle = 'rgba(2, 6, 23, 0.92)' // Ultra dark slate
      ctx.shadowBlur = 15
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.beginPath()
      if (ctx.roundRect) {
          ctx.roundRect(boxX, boxY, boxW, boxH, 12)
      } else {
          ctx.rect(boxX, boxY, boxW, boxH)
      }
      ctx.fill()
      
      // Glass Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.restore()

      drawRiverVectorDiagram(ctx, v.x, v.y, v.scale)
      
      // Resize Handle Triangle
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.beginPath()
      ctx.moveTo(boxX + boxW, boxY + boxH)
      ctx.lineTo(boxX + boxW, boxY + boxH - 12)
      ctx.lineTo(boxX + boxW - 12, boxY + boxH)
      ctx.fill()
  }
  
  update(canvas)
  animationId = requestAnimationFrame(draw)
}

const drawGrid = (ctx, canvas) => {
    ctx.save()
    const limit = 5000
    
    // Minor Grid Lines (Every 25px)
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)' // Boosted from 0.05
    ctx.lineWidth = 1
    const minorSize = 25
    for(let x = -limit; x < limit; x += minorSize) {
        ctx.moveTo(x, -limit)
        ctx.lineTo(x, limit)
    }
    for(let y = -limit; y < limit; y += minorSize) {
        ctx.moveTo(-limit, y)
        ctx.lineTo(limit, y)
    }
    ctx.stroke()

    // Major Grid Lines (Every 125px)
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)' // Boosted from 0.15 and slightly brighter
    ctx.lineWidth = 1.5
    const majorSize = 125
    for(let x = -limit; x < limit; x += majorSize) {
        ctx.moveTo(x, -limit)
        ctx.lineTo(x, limit)
    }
    for(let y = -limit; y < limit; y += majorSize) {
        ctx.moveTo(-limit, y)
        ctx.lineTo(limit, y)
    }
    ctx.stroke()

    // Coordinate Axes (X & Y)
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 2
    ctx.moveTo(-limit, 0)
    ctx.lineTo(limit, 0)
    ctx.moveTo(0, -limit)
    ctx.lineTo(0, limit)
    ctx.stroke()

    // Adding Axis Arrows
    const arrowSize = 10
    // X Axis Arrow
    ctx.beginPath()
    ctx.moveTo(limit - 10, -5)
    ctx.lineTo(limit, 0)
    ctx.lineTo(limit - 10, 5)
    ctx.stroke()
    // Y Axis Arrow
    ctx.beginPath()
    ctx.moveTo(-5, -(limit - 10))
    ctx.lineTo(0, -limit)
    ctx.lineTo(5, -(limit - 10))
    ctx.stroke()

    ctx.restore()
}

const drawTrail = (ctx, points, color) => {
    if (points.length < 2) return
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
        const dx = Math.abs(points[i].x - points[i-1].x)
        const dy = Math.abs(points[i].y - points[i-1].y)
        // If segment is too long, it's a wrap-around, so move instead of drawing a line
        if (dx > 500 || dy > 500) {
            ctx.moveTo(points[i].x, points[i].y)
        } else {
            ctx.lineTo(points[i].x, points[i].y)
        }
    }
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    // Trail Bloom
    ctx.shadowBlur = 10
    ctx.shadowColor = color
    
    // Gradient fade (more modern solid-ish trail)
    ctx.globalAlpha = 0.4
    ctx.stroke()
    ctx.restore()
}

const drawObj = (ctx, x, y, color, label) => {
    if (props.visualTheme === 'car') {
        drawCar(ctx, x, y, color, label)
    } else {
        ctx.save()
        // Outer Glow Layers
        ctx.shadowBlur = 20
        ctx.shadowColor = color
        
        // Layer 1: Base Bloom
        ctx.beginPath()
        ctx.arc(x, y, 15, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.fill()
        
        // Layer 2: Radial Gradient Core
        const gradient = ctx.createRadialGradient(x - 5, y - 5, 2, x, y, 15)
        gradient.addColorStop(0, '#fff')
        gradient.addColorStop(0.3, color)
        gradient.addColorStop(1, 'rgba(0,0,0,0.5)')
        
        ctx.beginPath()
        ctx.arc(x, y, 15, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()
        
        // Layer 3: Sharp Border/Stroke
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.stroke()

        // Atomic Nucleus (Stylized)
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, Math.PI * 2)
        ctx.fillStyle = '#fff'
        ctx.fill()
        ctx.shadowBlur = 10
        ctx.shadowColor = '#fff'
        ctx.stroke()
        
        // Text Label (Floating above)
        ctx.shadowBlur = 0
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 14px Inter'
        ctx.textAlign = 'center'
        ctx.fillText(label, x, y - 25)
        
        ctx.restore()
    }
}

const drawCar = (ctx, x, y, color, label) => {
    ctx.save()
    ctx.translate(x, y)
    
    // Add Shadow
    ctx.shadowBlur = 10
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowOffsetY = 5

    // Car Body (Top down perspective)
    const gradient = ctx.createLinearGradient(-25, 0, 25, 0)
    gradient.addColorStop(0, color)
    gradient.addColorStop(0.5, '#fff')
    gradient.addColorStop(1, color)
    
    // Main Chassis
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.roundRect(-30, -15, 60, 30, 8)
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'
    ctx.stroke()

    // Roof/Windows
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)'
    ctx.beginPath()
    ctx.roundRect(-15, -12, 35, 24, 4)
    ctx.fill()
    
    // Windshield highlights
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(15, -10)
    ctx.lineTo(20, -10)
    ctx.moveTo(15, 10)
    ctx.lineTo(20, 10)
    ctx.stroke()

    // Headlights
    ctx.fillStyle = '#fff'
    ctx.shadowBlur = 15
    ctx.shadowColor = '#fff'
    ctx.beginPath()
    ctx.arc(28, -10, 3, 0, Math.PI * 2)
    ctx.arc(28, 10, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    // Taillights
    ctx.fillStyle = '#ff0033'
    ctx.beginPath()
    ctx.fillRect(-30, -12, 3, 6)
    ctx.fillRect(-30, 6, 3, 6)
    ctx.fill()

    // Wheels
    ctx.fillStyle = '#111'
    ctx.fillRect(-22, -18, 12, 5)
    ctx.fillRect(10, -18, 12, 5)
    ctx.fillRect(-22, 13, 12, 5)
    ctx.fillRect(10, 13, 12, 5)

    // Identity Label (Floating above)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 12px Inter'
    ctx.textAlign = 'center'
    ctx.fillText(label, 0, -25)
    
    ctx.restore()
}

const drawSwimmer = (ctx, x, y, color, label, atBank = false) => {
    ctx.save()
    ctx.translate(x, y)
    
    // Physics-based Heading
    const heading = atBank ? 0 : -(props.angle1 * Math.PI) / 180
    ctx.rotate(heading)
    
    // Animation constants
    const speedScale = props.v1 / 5 
    const strokeCycle = time.value * 8 * Math.max(0.5, speedScale)
    const celebrationWave = Math.sin(time.value * 10) 
    const stroke = atBank ? 0 : Math.sin(strokeCycle)
    const bodyRoll = atBank ? 0 : Math.sin(strokeCycle) * 0.25
    
    // Breathing Cycle (every ~3.5 strokes)
    const breathCycle = (strokeCycle / (Math.PI * 2)) % 3.5
    const breathing = !atBank && breathCycle < 0.5 // Breathing phase
    const headTurn = breathing ? Math.min(breathCycle * 2, 1) * 0.6 : 0 // Turn head to side
    
    // 0. Environmental Displacement (Bow Wave & Wake)
    if (!atBank && props.v1 > 0.5) {
        ctx.save()
        ctx.globalAlpha = 0.15
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        
        // Bow Wave (around head)
        ctx.beginPath()
        ctx.arc(15, 0, 10 + Math.sin(time.value * 5) * 2, -Math.PI/2, Math.PI/2)
        ctx.stroke()
        
        // V-Wake (trailing)
        ctx.setLineDash([10, 20])
        ctx.beginPath()
        ctx.moveTo(10, 0)
        ctx.lineTo(-60, -30)
        ctx.moveTo(10, 0)
        ctx.lineTo(-60, 30)
        ctx.stroke()
        ctx.restore()
    }

    // 1. Water Disturbance (Bust/Shoulders)
    ctx.save()
    ctx.globalAlpha = 0.2
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.ellipse(5, 0, 18, 14, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // 2. Anatomical Body & Lighting (Torso)
    const lightAngle = bodyRoll * 30 // lighting shift based on roll
    const torsoGrad = ctx.createLinearGradient(-10, -10, 10, 10)
    torsoGrad.addColorStop(0, '#be185d') // Dark
    torsoGrad.addColorStop(0.5 + bodyRoll * 0.3, '#ec4899') // Dynamic highlight
    torsoGrad.addColorStop(1, '#be185d') 
    
    ctx.save()
    ctx.rotate(bodyRoll) 
    
    // Torso Shape with Straps
    ctx.fillStyle = torsoGrad
    ctx.beginPath()
    ctx.moveTo(10, -7)
    ctx.bezierCurveTo(15, -7, 15, 7, 10, 7)
    ctx.lineTo(-12, 6)
    ctx.bezierCurveTo(-18, 5, -18, -5, -12, -6)
    ctx.closePath()
    ctx.fill()
    
    // Swimsuit Straps & Detail
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(8, -6); ctx.lineTo(12, -4)
    ctx.moveTo(8, 6); ctx.lineTo(12, 4)
    ctx.stroke()
    ctx.restore()
    
    // 3. Head & Gear
    ctx.save()
    ctx.rotate((bodyRoll + headTurn) * 0.5) // Head rolls with body AND turns for breath
    // Neck
    ctx.fillStyle = '#FDBA74' 
    ctx.fillRect(8, -2, 5, 4)
    // Head/Swim Cap with Highlight
    const capGrad = ctx.createRadialGradient(13 + (bodyRoll + headTurn) * 5, -2, 1, 13, 0, 7)
    capGrad.addColorStop(0, '#fff') 
    capGrad.addColorStop(1, '#1e293b') 
    ctx.fillStyle = capGrad
    ctx.beginPath()
    ctx.arc(14, 0, 6.5, 0, Math.PI * 2)
    ctx.fill()
    
    // Mouth (open during breathing)
    if(breathing) {
        ctx.fillStyle = '#dc2626'
        ctx.beginPath()
        ctx.ellipse(18, 0, 2, 1.5, 0, 0, Math.PI * 2)
        ctx.fill()
    }
    
    // Goggles (Reflective)
    const gogColor = `hsla(200, 100%, ${70 + bodyRoll * 20}%, 0.8)`
    ctx.fillStyle = gogColor
    ctx.beginPath()
    ctx.arc(17, -2.5, 2.2, 0, Math.PI * 2)
    ctx.arc(17, 2.5, 2.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // 4. Arms (Hands with Fingers)
    const drawLimb = (isRight) => {
        const side = isRight ? 1 : -1
        const phaseOffset = isRight ? Math.PI : 0
        const armCycle = strokeCycle + phaseOffset
        const armStroke = Math.sin(armCycle)
        const armReach = Math.cos(armCycle)
        
        ctx.save()
        // Skin Shading
        const skinGrad = ctx.createLinearGradient(0, -5, 0, 5)
        skinGrad.addColorStop(0, '#fde68a') // Highlighted skin
        skinGrad.addColorStop(1, '#FDBA74')
        ctx.strokeStyle = skinGrad
        ctx.lineWidth = 4.5
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        ctx.beginPath()
        ctx.moveTo(5, side * 7) 
        
        let handX, handY;
        if (atBank) {
            // Static standing pose - arms relaxed at sides
            const elbowX = 2
            const elbowY = side * 12
            handX = -5
            handY = side * 18
            ctx.lineTo(elbowX, elbowY)
            ctx.lineTo(handX, handY)
        } else if (armStroke > 0) {
            const elbowX = 8 + armReach * 6
            const elbowY = side * (14 + armStroke * 10)
            handX = 20 + armReach * 10
            handY = side * 6
            ctx.lineTo(elbowX, elbowY)
            ctx.lineTo(handX, handY)
            
            // Splash at entry
            if (armStroke > 0.7) {
                ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.5
                for(let i=0; i<4; i++) { ctx.beginPath(); ctx.arc(handX + Math.random()*8, handY + side*Math.random()*5, 1.2, 0, Math.PI*2); ctx.fill() }
            }
        } else {
            ctx.globalAlpha = 0.7
            const reach = -armStroke * 18
            handX = -reach; handY = side * 12
            ctx.quadraticCurveTo(5, side * 18, handX, handY)
            
            // Bubbles trail
            ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.3
            ctx.beginPath(); ctx.arc(handX - 6, handY, 1.8, 0, Math.PI*2); ctx.fill()
        }
        ctx.stroke()
        
        // Detailed Hand (Fingers) - only when swimming
        if (!atBank) {
            ctx.save()
            ctx.translate(handX, handY)
            ctx.rotate(isRight ? -Math.PI/4 : Math.PI/4)
            ctx.lineWidth = 1.2
            for(let i=-2; i<=2; i++) {
                ctx.beginPath(); ctx.moveTo(0, i*1.2); ctx.lineTo(4, i*0.8); ctx.stroke()
            }
            ctx.restore()
        }
        ctx.restore()
    }
    
    drawLimb(false) 
    drawLimb(true)  

    // 5. Legs (Feet with Toes)
    const kickCycle = time.value * 22 * Math.max(0.3, speedScale)
    const drawLeg = (isRight) => {
        const side = isRight ? 1 : -1
        const phase = isRight ? 0 : Math.PI
        const kick = atBank ? 0 : Math.sin(kickCycle + phase) * 8 // No kick when at bank
        
        ctx.save()
        ctx.strokeStyle = '#FDBA74'
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.moveTo(-12, side * 5) 
        let footX, footY;
        if (atBank) {
            // Static standing position - legs straight
            footX = -30; footY = side * 10
            ctx.lineTo(footX, footY)
        } else {
            footX = -35; footY = side * 8 + kick
            ctx.quadraticCurveTo(-22, side * 7 + kick * 0.5, footX, footY)
        }
        ctx.stroke()
        
        // Detailed Foot (Toes/Arch) - only when swimming
        if (!atBank) {
            ctx.save()
            ctx.translate(footX, footY)
            ctx.rotate(kick * 0.05)
            ctx.lineWidth = 1
            for(let i=-1.5; i<=1.5; i++) {
                ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(-3, i*0.7); ctx.stroke()
            }
            ctx.restore()
        }
        ctx.restore()
    }
    drawLeg(false)
    drawLeg(true)

    // 6. Label
    ctx.restore()
    ctx.save()
    ctx.translate(x, y)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 13px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(label, 0, -32)
    ctx.restore()
}

const drawBoat = (ctx, x, y, color, label) => {
    // 0. Water Interaction: Soft shadow & reflection (Screenspace-ish but in Sim coords)
    ctx.save()
    ctx.translate(x, y + 5) // Offset for reflection
    ctx.scale(1, -0.4) // Squashed vertical reflection
    ctx.globalAlpha = 0.2
    
    // Simplified reflection hull
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(-30, -10)
    ctx.lineTo(15, -10)
    ctx.quadraticCurveTo(35, 0, 15, 10)
    ctx.lineTo(-30, 10)
    ctx.closePath()
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.translate(x, y)
    
    // Boat Heading: points in direction of V_BW (props.angle1)
    const heading = -(props.angle1 * Math.PI) / 180
    ctx.rotate(heading)
    
    // 1. Wake Effect (Behind boat)
    ctx.save()
    ctx.globalAlpha = 0.3 * (0.5 + 0.5 * Math.sin(time.value * 10))
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1.5
    ctx.setLineDash([5, 10])
    ctx.beginPath()
    ctx.moveTo(-30, 0)
    ctx.lineTo(-60, -15)
    ctx.moveTo(-30, 0)
    ctx.lineTo(-60, 15)
    ctx.stroke()
    ctx.restore()

    // 2. Hull Shadow
    ctx.shadowBlur = 10
    ctx.shadowColor = 'rgba(0,0,0,0.4)'
    ctx.shadowOffsetY = 4

    // 3. Main Hull (Realistic Pointed Shape)
    const hullGradient = ctx.createLinearGradient(0, -15, 0, 15)
    hullGradient.addColorStop(0, '#334155') // Slated dark blue
    hullGradient.addColorStop(0.5, '#475569')
    hullGradient.addColorStop(1, '#1e293b')

    ctx.fillStyle = hullGradient
    ctx.strokeStyle = color // Neon accent from scenario
    ctx.lineWidth = 2
    
    ctx.beginPath()
    ctx.moveTo(-30, -12) // Stern Left
    ctx.lineTo(15, -12)  // Mid Right
    ctx.quadraticCurveTo(40, 0, 15, 12) // Bow tip curve
    ctx.lineTo(-30, 12)  // Stern Right
    ctx.bezierCurveTo(-35, 12, -35, -12, -30, -12) // Stern back curve
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // 4. Deck Detail
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.beginPath()
    ctx.roundRect(-20, -8, 30, 16, 4)
    ctx.fill()
    
    // 5. Cockpit/Windshield
    ctx.fillStyle = 'rgba(148, 163, 184, 0.8)'
    ctx.beginPath()
    ctx.moveTo(5, -6)
    ctx.lineTo(15, -6)
    ctx.lineTo(20, 0)
    ctx.lineTo(15, 6)
    ctx.lineTo(5, 6)
    ctx.fill()
    
    // 6. Navigation Lights
    ctx.shadowBlur = 5
    ctx.shadowColor = '#f00' // Red (Port)
    ctx.fillStyle = '#f00'
    ctx.beginPath()
    ctx.arc(-25, -8, 2, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.shadowColor = '#0f0' // Green (Starboard)
    ctx.fillStyle = '#0f0'
    ctx.beginPath()
    ctx.arc(-25, 8, 2, 0, Math.PI * 2)
    ctx.fill()

    // 7. Identity Label (Floating, Un-rotated)
    ctx.restore()
    ctx.save()
    ctx.translate(x, y)
    ctx.shadowBlur = 0
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 13px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(label, 0, -35)
    ctx.restore()
}

const drawPlane = (ctx, x, y, color, label) => {
    ctx.save()
    ctx.translate(x, y)
    
    // Glow
    ctx.shadowBlur = 15
    ctx.shadowColor = color
    
    // Fuselage
    ctx.fillStyle = '#f8fafc'
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.ellipse(0, 0, 25, 6, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    
    // Wings
    ctx.beginPath()
    ctx.moveTo(-5, 0)
    ctx.lineTo(-15, -20)
    ctx.lineTo(5, -20)
    ctx.lineTo(5, 0)
    ctx.fill()
    ctx.stroke()
    
    ctx.beginPath()
    ctx.moveTo(-5, 0)
    ctx.lineTo(-15, 20)
    ctx.lineTo(5, 20)
    ctx.lineTo(5, 0)
    ctx.fill()
    ctx.stroke()
    
    // Label
    ctx.shadowBlur = 0
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 12px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(label, 0, -30)
    
    ctx.restore()
}

const drawRoad = (ctx, canvas, y) => {
    const width = 10000 // Massive road for long panning
    const height = 120
    
    // Asphalt Texture
    const asphaltGrad = ctx.createLinearGradient(0, y - height/2, 0, y + height/2)
    asphaltGrad.addColorStop(0, '#1a1a1a')
    asphaltGrad.addColorStop(0.5, '#262626')
    asphaltGrad.addColorStop(1, '#1a1a1a')
    
    ctx.fillStyle = asphaltGrad
    ctx.fillRect(-width/2, y - height/2, width, height)
    
    // Side curbs / Dirt
    ctx.fillStyle = '#334155'
    ctx.fillRect(-width/2, y - height/2 - 5, width, 5)
    ctx.fillRect(-width/2, y + height/2, width, 5)

    // Realistic Lane markings
    // Center double yellow line
    ctx.strokeStyle = '#facc15'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(-width/2, y - 2)
    ctx.lineTo(width/2, y - 2)
    ctx.moveTo(-width/2, y + 2)
    ctx.lineTo(width/2, y + 2)
    ctx.stroke()

    // White dashed side lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.setLineDash([30, 40])
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(-width/2, y - 40)
    ctx.lineTo(width/2, y - 40)
    ctx.moveTo(-width/2, y + 40)
    ctx.lineTo(width/2, y + 40)
    ctx.stroke()
    ctx.setLineDash([])
    
    // Road grain/noise (subtle)
    ctx.strokeStyle = 'rgba(255,255,255,0.02)'
    for(let i = 0; i < 5; i++) {
        ctx.beginPath()
        ctx.moveTo(-width/2, y - height/2 + i * 25)
        ctx.lineTo(width/2, y - height/2 + i * 25)
        ctx.stroke()
    }
}

const drawRiver = (ctx, canvas) => {
    const width = 10000
    const height = 400
    const yStart = -50
    const bankHeight = 200 // Define early since it's used in sky calculations
    
    // ===== 0. SKY & ATMOSPHERE =====
    const skyHeight = 300
    const skyGrad = ctx.createLinearGradient(0, yStart - bankHeight - skyHeight, 0, yStart - bankHeight)
    skyGrad.addColorStop(0, '#1e3a8a') // Deep blue at top
    skyGrad.addColorStop(0.6, '#60a5fa') // Mid blue
    skyGrad.addColorStop(1, '#93c5fd') // Light blue near horizon
    ctx.fillStyle = skyGrad
    ctx.fillRect(-width/2, yStart - bankHeight - skyHeight, width, skyHeight)
    
    // Sun Position
    const sunX = -800 + Math.sin(time.value * 0.1) * 200
    const sunY = yStart - bankHeight - 200
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 60)
    sunGrad.addColorStop(0, '#fef3c7')
    sunGrad.addColorStop(0.3, '#fde68a')
    sunGrad.addColorStop(1, 'rgba(253, 230, 138, 0)')
    ctx.fillStyle = sunGrad
    ctx.fillRect(sunX - 60, sunY - 60, 120, 120)
    
    // Procedural Clouds
    const drawCloud = (x, y, size, speed) => {
        const offsetX = (time.value * speed * 5) % (width * 1.5) - width/2
        ctx.save()
        ctx.globalAlpha = 0.7
        ctx.fillStyle = '#fff'
        for(let i=0; i<5; i++) {
            ctx.beginPath()
            ctx.arc(x + offsetX + i*size*0.4, y + Math.sin(i) * size*0.2, size * (0.5 + i*0.1), 0, Math.PI*2)
            ctx.fill()
        }
        ctx.restore()
    }
    
    drawCloud(-1000, yStart - bankHeight - 220, 25, 0.3)
    drawCloud(-200, yStart - bankHeight - 260, 30, 0.2)
    drawCloud(400, yStart - bankHeight - 200, 20, 0.4)
    drawCloud(1000, yStart - bankHeight - 240, 35, 0.15)
    
    // ===== 1. BANKS WITH ENHANCED DETAILS =====
    
    // Upper Bank
    const upperGrad = ctx.createLinearGradient(0, yStart - bankHeight, 0, yStart)
    upperGrad.addColorStop(0, '#064e3b')
    upperGrad.addColorStop(0.7, '#14532d')
    upperGrad.addColorStop(1, '#22c55e') // Brighter grass
    ctx.fillStyle = upperGrad
    ctx.fillRect(-width/2, yStart - bankHeight, width, bankHeight)
    
    // Lower Bank
    const lowerGrad = ctx.createLinearGradient(0, yStart + height, 0, yStart + height + bankHeight)
    lowerGrad.addColorStop(0, '#22c55e')
    lowerGrad.addColorStop(0.3, '#14532d')
    lowerGrad.addColorStop(1, '#064e3b')
    ctx.fillStyle = lowerGrad
    ctx.fillRect(-width/2, yStart + height, width, bankHeight)
    
    // Individual Grass Blades (swaying)
    ctx.save()
    ctx.strokeStyle = '#15803d'
    ctx.lineWidth = 1
    for(let x = -2000; x < 2000; x += 15) {
        for(let bank of [-1, 1]) {
            const baseY = bank === -1 ? yStart - 30 : yStart + height + 30
            const sway = Math.sin(time.value * 2 + x * 0.1) * 3
            ctx.beginPath()
            ctx.moveTo(x, baseY)
            ctx.quadraticCurveTo(x + sway, baseY - 10, x + sway * 1.5, baseY - 15)
            ctx.stroke()
        }
    }
    ctx.restore()
    
    // Wildflowers
    const drawFlower = (x, y, color) => {
        ctx.fillStyle = color
        for(let i=0; i<5; i++) {
            const angle = (i / 5) * Math.PI * 2
            ctx.beginPath()
            ctx.arc(x + Math.cos(angle)*3, y + Math.sin(angle)*3, 2, 0, Math.PI*2)
            ctx.fill()
        }
        ctx.fillStyle = '#fbbf24'
        ctx.beginPath()
        ctx.arc(x, y, 1.5, 0, Math.PI*2)
        ctx.fill()
    }
    
    for(let x = -2000; x < 2000; x += 180) {
        const flowerSeed = Math.abs(Math.sin(x * 0.5))
        if(flowerSeed > 0.6) {
            drawFlower(x + 30, yStart - 25, '#a855f7') // Purple
            drawFlower(x - 20, yStart + height + 25, '#fbbf24') // Yellow
        }
    }
    
    // Sandy Shoreline
    const sandGrad = ctx.createLinearGradient(0, yStart - 5, 0, yStart + 5)
    sandGrad.addColorStop(0, '#f59e0b')
    sandGrad.addColorStop(1, '#fde68a')
    ctx.fillStyle = sandGrad
    ctx.fillRect(-width/2, yStart - 5, width, 10)
    ctx.fillRect(-width/2, yStart + height - 5, width, 10)
    
    // ===== 2. WATER WITH CAUSTICS & REFLECTIONS =====
    const waterGrad = ctx.createLinearGradient(0, yStart, 0, yStart + height)
    waterGrad.addColorStop(0, '#0c4a6e')
    waterGrad.addColorStop(0.3, '#0369a1')
    waterGrad.addColorStop(0.7, '#0284c7')
    waterGrad.addColorStop(1, '#0c4a6e')
    ctx.fillStyle = waterGrad
    ctx.fillRect(-width/2, yStart, width, height)
    
    // Caustics (animated light patterns)
    ctx.save()
    ctx.globalAlpha = 0.1
    ctx.strokeStyle = '#7dd3fc'
    ctx.lineWidth = 2
    for(let i=0; i<15; i++) {
        const y = yStart + (i * 30)
        const offset = Math.sin(time.value * 3 + i) * 40
        ctx.beginPath()
        ctx.moveTo(-width/2, y)
        for(let x=-width/2; x<width/2; x+=100) {
            ctx.quadraticCurveTo(
                x + 50 + offset, 
                y + Math.sin(x * 0.01 + time.value * 2) * 10,
                x + 100, 
                y
            )
        }
        ctx.stroke()
    }
    ctx.restore()
    
    // Sky reflection in water
    ctx.save()
    ctx.globalAlpha = 0.15
    ctx.fillStyle = '#93c5fd'
    ctx.fillRect(-width/2, yStart + 50, width, 100)
    ctx.restore()
    
    // ===== 3. BANK DECORATIONS =====
    const drawDecoration = (x, y, type) => {
        ctx.save()
        ctx.translate(x, y)
        if (type === 'tree') {
            ctx.fillStyle = '#713f12'
            ctx.fillRect(-4, 0, 8, 20)
            ctx.fillStyle = '#15803d'
            ctx.beginPath()
            ctx.moveTo(0, -30)
            ctx.lineTo(-18, 0)
            ctx.lineTo(18, 0)
            ctx.fill()
            ctx.beginPath()
            ctx.moveTo(0, -40)
            ctx.lineTo(-14, -12)
            ctx.lineTo(14, -12)
            ctx.fill()
        } else if (type === 'rock') {
            const rockGrad = ctx.createRadialGradient(-3, -2, 2, 0, 0, 12)
            rockGrad.addColorStop(0, '#94a3b8')
            rockGrad.addColorStop(1, '#475569')
            ctx.fillStyle = rockGrad
            ctx.beginPath()
            ctx.ellipse(0, 0, 16, 9, Math.PI/4, 0, Math.PI * 2)
            ctx.fill()
        } else if (type === 'bush') {
            ctx.fillStyle = '#166534'
            for(let i=0; i<3; i++) {
                ctx.beginPath()
                ctx.arc(-10 + i*10, -i*3, 12, 0, Math.PI * 2)
                ctx.fill()
            }
        }
        ctx.restore()
    }
    
    for (let x = -2000; x < 2000; x += 250) {
        const seedUpper = Math.abs(Math.sin(x))
        if (seedUpper > 0.6) drawDecoration(x, yStart - 50, 'tree')
        else if (seedUpper > 0.3) drawDecoration(x + 50, yStart - 25, 'bush')
        
        const seedLower = Math.abs(Math.cos(x * 0.7))
        if (seedLower > 0.7) drawDecoration(x + 100, yStart + height + 25, 'rock')
        else if (seedLower > 0.4) drawDecoration(x - 80, yStart + height + 40, 'bush')
    }
    
    // ===== 4. ENVIRONMENTAL LIFE =====
    // Flying Birds
    const drawBird = (x, y, wingPhase) => {
        ctx.save()
        ctx.translate(x, y)
        ctx.strokeStyle = '#1f2937'
        ctx.lineWidth = 1.5
        const wingY = Math.sin(wingPhase) * 4
        ctx.beginPath()
        ctx.moveTo(-6, wingY)
        ctx.lineTo(0, 0)
        ctx.lineTo(6, wingY)
        ctx.stroke()
        ctx.restore()
    }
    
    const bird1X = (-1500 + time.value * 30) % 3000 - 1500
    const bird2X = (-800 + time.value * 25) % 3000 - 1500
    const bird3X = (200 + time.value * 35) % 3000 - 1500
    drawBird(bird1X, yStart - bankHeight - 150, time.value * 8)
    drawBird(bird2X, yStart - bankHeight - 180, time.value * 8 + Math.PI)
    drawBird(bird3X, yStart - bankHeight - 120, time.value * 8 + Math.PI/2)
    
    // Jumping Fish
    const fishJump = Math.sin(time.value * 2) > 0.95
    if(fishJump) {
        const fishX = Math.sin(time.value * 0.5) * 800
        const splashY = yStart + height/2
        ctx.save()
        ctx.fillStyle = '#cbd5e1'
        ctx.beginPath()
        ctx.arc(fishX, splashY - 15, 4, 0, Math.PI * 2)
        ctx.fill()
        // Splash
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 1
        for(let i=0; i<6; i++) {
            const angle = (i/6) * Math.PI * 2
            ctx.beginPath()
            ctx.moveTo(fishX, splashY)
            ctx.lineTo(fishX + Math.cos(angle)*8, splashY + Math.sin(angle)*8)
            ctx.stroke()
        }
        ctx.restore()
    }
    
    // Dragonflies
    const drawDragonfly = (x, y, phase) => {
        ctx.save()
        ctx.translate(x, y)
        const hover = Math.sin(phase) * 3
        ctx.strokeStyle = '#0ea5e9'
        ctx.lineWidth = 0.5
        ctx.beginPath()
        ctx.moveTo(0, hover)
        ctx.lineTo(4, hover - 1)
        ctx.moveTo(0, hover)
        ctx.lineTo(4, hover + 1)
        ctx.stroke()
        ctx.fillStyle = '#0369a1'
        ctx.fillRect(-1, hover - 0.5, 3, 1)
        ctx.restore()
    }
    
    drawDragonfly(-600 + Math.sin(time.value) * 50, yStart - 15, time.value * 20)
    drawDragonfly(400 + Math.cos(time.value * 0.7) * 60, yStart + height + 15, time.value * 20 + Math.PI)
    
    // Floating Debris (Leaves)
    const drawLeaf = (x, y) => {
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(Math.sin(time.value + x) * 0.3)
        ctx.fillStyle = '#84cc16'
        ctx.beginPath()
        ctx.ellipse(0, 0, 5, 3, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
    }
    
    for(let i=0; i<8; i++) {
        const leafX = ((i * 400 - 1600) + time.value * (props.v2 || 1) * 15) % 3200 - 1600
        const leafY = yStart + height * (0.3 + (i % 3) * 0.2)
        drawLeaf(leafX, leafY)
    }
    
    // 4. Animated Water Current Lines (Hozizontal scrolling)
    ctx.save()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1.5
    ctx.setLineDash([40, 60])
    
    // The offset scrolls with the river speed v2
    const flowOffset = (time.value * props.v2 * 10) % 100
    
    for (let i = 0; i < 20; i++) {
        const rowY = yStart + (i * 20) + 10
        ctx.beginPath()
        ctx.lineDashOffset = -flowOffset * (1 + (i % 3) * 0.2) // Varied speeds for layers
        ctx.moveTo(-width/2, rowY)
        ctx.lineTo(width/2, rowY)
        ctx.stroke()
    }
    ctx.restore()

    // 5. Water Surface Glare (Shimmer)
    ctx.globalAlpha = 0.05
    ctx.fillStyle = '#fff'
    for(let i = 0; i < 10; i++) {
        const x = ((time.value * 50 + i * 400) % 2000) - 1000
        const y = yStart + (Math.sin(i + time.value) * 150 + 200)
        ctx.beginPath()
        ctx.ellipse(x, y, 100, 2, 0, 0, Math.PI * 2)
        ctx.fill()
    }
    ctx.globalAlpha = 1.0

    // Banks Sharp Edges
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(-width/2, yStart)
    ctx.lineTo(width/2, yStart)
    ctx.moveTo(-width/2, yStart + height)
    ctx.lineTo(width/2, yStart + height)
    ctx.stroke()
}

const drawMan = (ctx, x, y) => {
    // Physics calculations for umbrella
    // Rain falls vertically relative to air mass. V_rain_horizontal = Air Speed (v2).
    const v_rain_x = props.v2 
    const v_rain_y = props.rainSpeed     // User controlled vertical falling speed
    
    // Animation parameters
    // Stop animation completely when speed is zero
    const t = props.v1 === 0 ? 0 : time.value * (5 + Math.abs(props.v1) * 0.8)
    const facing = Math.sign(props.v1) || 1

    // Umbrella blocks rain from relative direction: V_rel = V_man - V_rain
    // Angle = atan2(V_man - V_rain_x, V_rain_y)
    // If Manual Mode, use props.umbrellaAngle (converted to radians)
    // CORRECTION: Because we ctx.scale(facing, 1), the X-axis is flipped when facing Left.
    // A calculated angle 'theta' needs to be flipped (multiplied by facing) so that 
    // "Forward" tilt remains Forward in the flipped context.
    
    let umbrellaAngle
    
    // Calculate Optimal logic first for both usage
    const v_rel_x = props.v1 - v_rain_x
    const optimalAngleRad = Math.atan2(v_rel_x, v_rain_y)
    
    if (props.manualUmbrella) {
        umbrellaAngle = (props.umbrellaAngle * Math.PI / 180) * facing
    } else {
        umbrellaAngle = optimalAngleRad * facing
    }
    
    const optimalAngleDeg = optimalAngleRad * 180 / Math.PI
    
    let protectionDiff = 0
    if (props.manualUmbrella) {
        let a1 = props.umbrellaAngle
        let a2 = optimalAngleDeg
        protectionDiff = Math.abs(a1 - a2)
    }

    const isProtective = !props.manualUmbrella || protectionDiff < 15
    const isDancing = props.manualUmbrella && isProtective
    
    // Body bobbing (hips move up/down twice per cycle)
    // If Dancing: Fast bob
    const bob = isDancing ? Math.abs(Math.sin(time.value * 15)) * 5 : Math.abs(Math.cos(t)) * 2
    
    // Joint calculations (Local coordinates, relative to x,y)
    const hipX = 0
    const hipY = -28 + bob
    
    const torsoTopX = 0
    const torsoTopY = -55 + bob
    
    const headX = 0
    const headY = -65 + bob
    
    // Leg kinematics - CORRECTED PHASE
    // Forward Swing: sin increasing (-1 to 1). Knee should bend (cos > 0)
    
    // Left Leg (Phase 0)
    const legL_ThighAngle = Math.sin(t) * 0.6
    // Knee bends when leg swings forward (cos > 0)
    const legL_KneeAngle = (Math.cos(t) > 0) ? -Math.cos(t) * 1.2 : 0
    
    // Right Leg (Phase PI)
    const legR_ThighAngle = Math.sin(t + Math.PI) * 0.6
    const legR_KneeAngle = (Math.cos(t + Math.PI) > 0) ? -Math.cos(t + Math.PI) * 1.2 : 0
    
    // Arm Kinematics (Contra-lateral: Right Arm swings with Left Leg)
    // If Dancing: Wave arm wildly
    const armR_ShoulderAngle = isDancing 
        ? Math.sin(time.value * 15) * 2.5  // WILD WAVE
        : Math.sin(t) * 0.5
    
    const armR_ElbowAngle = isDancing ? 1.0 : 0.3 // Slight constant bend
    
    // Umbrella Arm (Left) - Holding position
    // Adjusted to hold umbrella IN FRONT (Forward-Down shoulder, Forward-Up forearm)
    const armL_ShoulderAngle = 0.5 + Math.cos(t) * 0.05
    const armL_ElbowAngle = 2.2 
    
    // Draw functions
    const drawLimb = (x1, y1, angle, len, width, color) => {
        const x2 = x1 + Math.sin(angle) * len
        const y2 = y1 + Math.cos(angle) * len
        ctx.strokeStyle = color
        ctx.lineWidth = width
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
        return { x: x2, y: y2 }
    }
    
    const drawShoe = (bx, by, color) => {
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.ellipse(bx + 2, by + 1, 6, 3, 0, 0, Math.PI * 2)
        ctx.fill()
    }
    
    ctx.save()
    ctx.translate(x, y) // Move to man position
    ctx.scale(facing, 1) // Flip if moving left
    
    // 1. Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
    ctx.beginPath()
    ctx.ellipse(0, 2, 14, 4, 0, 0, Math.PI * 2)
    ctx.fill()
    
    // 2. Far Arm (Right - Swinging)
    const shoulderX = torsoTopX
    const shoulderY = torsoTopY + 5
    
    const elbowR = drawLimb(shoulderX, shoulderY, armR_ShoulderAngle, 13, 4.5, '#b91c1c') 
    drawLimb(elbowR.x, elbowR.y, armR_ShoulderAngle + armR_ElbowAngle, 11, 3.5, '#fcd34d')
    
    // 3. Far Leg (Right)
    const kneeR = drawLimb(hipX, hipY, legR_ThighAngle, 15, 5, '#1bf') 
    const footR = drawLimb(kneeR.x, kneeR.y, legR_ThighAngle + legR_KneeAngle, 15, 4, '#1bf')
    drawShoe(footR.x, footR.y, '#333')
    
    // 4. Torso
    ctx.strokeStyle = '#dc2626'
    ctx.lineWidth = 11
    ctx.lineCap = 'butt'
    ctx.beginPath()
    ctx.moveTo(hipX, hipY)
    ctx.lineTo(torsoTopX, torsoTopY)
    ctx.stroke()
    
    // 5. Head
    ctx.fillStyle = '#fcd34d'
    ctx.beginPath()
    ctx.arc(headX, headY, 7, 0, Math.PI * 2)
    ctx.fill()
    // Hair
    ctx.fillStyle = '#333'
    ctx.beginPath()
    ctx.arc(headX, headY - 1, 7.2, Math.PI, 0)
    ctx.fill()
    ctx.fill()
    // Face (Eye) - Direction aware
    ctx.fillStyle = '#111'
    ctx.beginPath()
    ctx.arc(headX + 3, headY - 1, 1.2, 0, Math.PI * 2)
    ctx.fill()
    
    // Mouth (Smile or Frown)
    ctx.strokeStyle = '#111'
    ctx.lineWidth = 1
    ctx.beginPath()
    if (isProtective) {
        // Smile
        ctx.arc(headX + 3, headY + 2, 2.5, 0, Math.PI, false)
    } else {
        // Frown
        ctx.arc(headX + 3, headY + 4, 2.5, Math.PI, 0, false)
        
        // Tears (Blue drops)
        if (Math.random() > 0.8) {
             ctx.fillStyle = '#0ea5e9'
             ctx.beginPath()
             ctx.arc(headX + 4, headY + 2, 1, 0, Math.PI*2)
             ctx.fill()
        }
    }
    ctx.stroke()
    
    // 6. Near Leg (Left)
    const kneeL = drawLimb(hipX, hipY, legL_ThighAngle, 15, 5, '#1e40af')
    const footL = drawLimb(kneeL.x, kneeL.y, legL_ThighAngle + legL_KneeAngle, 15, 4, '#1e40af')
    drawShoe(footL.x, footL.y, '#1f2937')
    
    // 7. Near Arm (Left - Holding Umbrella)
    const elbowL = drawLimb(shoulderX, shoulderY, armL_ShoulderAngle, 12, 4.5, '#dc2626')
    const handL = drawLimb(elbowL.x, elbowL.y, armL_ShoulderAngle + armL_ElbowAngle, 11, 3.5, '#fcd34d')
    
    ctx.restore() // Restore global coords
    
    // Calculate Global Hand Position for Umbrella
    // x + (localHandX * facing)
    const globalHandX = x + (handL.x * facing)
    const globalHandY = y + handL.y
    
    // Umbrella
    ctx.save()
    ctx.translate(globalHandX, globalHandY)
    ctx.rotate(umbrellaAngle)
    
    // Handle/Shaft
    ctx.strokeStyle = '#78716c'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(0, 8) 
    ctx.lineTo(0, -35)
    ctx.stroke()
    
    const r = 40
    const bottomY = -35
    const topY = -55
    
    // Canopy
    ctx.beginPath()
    ctx.moveTo(-r, bottomY)
    ctx.bezierCurveTo(-r, topY - 15, r, topY - 15, r, bottomY)
    
    const segments = 4
    const segmentWidth = (r * 2) / segments
    for (let i = 0; i < segments; i++) {
        const xStart = r - (i * segmentWidth)
        const xEnd = r - ((i + 1) * segmentWidth)
        ctx.quadraticCurveTo((xStart + xEnd) / 2, bottomY - 6, xEnd, bottomY)
    }
    
    const canopyGrad = ctx.createRadialGradient(0, topY + 10, 5, 0, bottomY, 50)
    canopyGrad.addColorStop(0, '#ef4444')
    canopyGrad.addColorStop(0.5, '#dc2626')
    canopyGrad.addColorStop(1, '#991b1b')
    ctx.fillStyle = canopyGrad
    ctx.fill()
    
    // Outline
    ctx.strokeStyle = '#7f1d1d'
    ctx.lineWidth = 1.5
    ctx.lineJoin = 'round'
    ctx.stroke()
    
    // Ribs
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = 1; i < segments; i++) {
        const xPos = r - (i * segmentWidth)
        ctx.moveTo(xPos, bottomY)
        ctx.quadraticCurveTo(xPos * 0.5, topY + 5, 0, topY)
    }
    ctx.stroke()
    
    // Cap
    ctx.fillStyle = '#78716c'
    ctx.beginPath()
    ctx.arc(0, topY, 2.5, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fill()
    
    ctx.restore()
    // Draw Thought Bubble (Imagination)
    if (props.manualUmbrella) {
        const bubbleX = x + (60 * facing)
        const bubbleY = y - 100
        
        ctx.save()
        // Determine Bubble Style
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.shadowBlur = 10
        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)'
        
        // Draw trailing dots
        for(let i=1; i<=3; i++) {
            ctx.beginPath()
            ctx.arc(x + (15*i*facing), y - 70 - (i*5), 3 + i, 0, Math.PI*2)
            ctx.fill()
        }
        
        // Main Bubble
        ctx.beginPath()
        ctx.ellipse(bubbleX, bubbleY, 35, 25, 0, 0, Math.PI*2)
        ctx.fill()
        
        // Content
        ctx.save() // Inner save for clipping
        ctx.beginPath()
        ctx.ellipse(bubbleX, bubbleY, 35, 25, 0, 0, Math.PI*2)
        ctx.clip() // Clip to bubble
        
        if (isProtective) {
            // Happy Thoughts: Dancing / Music
            ctx.font = '30px Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText('🕺', bubbleX, bubbleY)
        } else {
            // Sad Thoughts: Rain Cloud / Wet
            ctx.font = '30px Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText('😭', bubbleX - 10, bubbleY)
            ctx.fillText('🌧️', bubbleX + 10, bubbleY + 5)
        }
        ctx.restore() // Undo Clip
        
        ctx.restore()
    }
}

const drawRiverVectorDiagram = (ctx, x, y, userScale = 1.0) => {
    ctx.save()
    ctx.translate(x, y + 50) // Shift down to avoid border overlap
    ctx.scale(userScale, userScale)

    const s = 15 // Scale factor for visibility
    const angleRad = (props.angle1 * Math.PI) / 180
    
    // 1. Boat/Swimmer Velocity rel. Water (V_BW / V_SW)
    const vbw = { x: props.v1 * Math.cos(angleRad) * s, y: -props.v1 * Math.sin(angleRad) * s }
    
    // 2. River Velocity rel. Ground (V_RG) - Applied at the tip of V_BW
    const vrg = { x: props.v2 * s, y: 0 }
    
    // 3. Resultant Ground Velocity (V_BG)
    const vbg = { x: vbw.x + vrg.x, y: vbw.y }

    // Helper: Draw Arrow
    const drawArrow = (from, to, color, label, lOffset = {x: 0, y: 0}) => {
        ctx.save()
        // Added glow effect to vectors
        ctx.shadowBlur = 6
        ctx.shadowColor = color
        
        ctx.beginPath()
        ctx.moveTo(from.x, from.y)
        ctx.lineTo(to.x, to.y)
        ctx.strokeStyle = color
        ctx.lineWidth = 3
        ctx.stroke()
        
        const angle = Math.atan2(to.y - from.y, to.x - from.x)
        const head = 10
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.moveTo(to.x, to.y)
        ctx.lineTo(to.x - head * Math.cos(angle - Math.PI/6), to.y - head * Math.sin(angle - Math.PI/6))
        ctx.lineTo(to.x - head * Math.cos(angle + Math.PI/6), to.y - head * Math.sin(angle + Math.PI/6))
        ctx.closePath()
        ctx.fill()
        ctx.restore()
        
        if (label) {
            ctx.save()
            ctx.font = 'bold 12px Inter'
            ctx.fillStyle = color
            // Text shadow for legibility
            ctx.shadowBlur = 4
            ctx.shadowColor = 'rgba(0,0,0,0.9)'
            ctx.fillText(label, (from.x + to.x)/2 + lOffset.x, (from.y + to.y)/2 + lOffset.y)
            ctx.restore()
        }
    }

    // Axes (Simplified)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.setLineDash([2, 5])
    ctx.beginPath(); ctx.moveTo(-50, 0); ctx.lineTo(150, 0); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, -50); ctx.lineTo(0, 50); ctx.stroke()
    ctx.setLineDash([])

    const labels = {
        main: props.visualTheme === 'swimmer' ? 'v_SW' : 'v_BW',
        ground: props.visualTheme === 'swimmer' ? 'v_SG' : 'v_BG'
    }

    // Draw Vector Triangle (Tip-to-Tail)
    drawArrow({x:0, y:0}, vbw, '#00ff9d', labels.main, {x: -30, y: -10})
    drawArrow(vbw, vbg, '#60a5fa', 'v_RG', {x: 0, y: -15})
    drawArrow({x:0, y:0}, vbg, '#fcd34d', labels.ground, {x: 0, y: 30})

    // Subtitle
    ctx.save()
    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px Inter'
    ctx.shadowBlur = 2
    ctx.shadowColor = '#000'
    ctx.fillText('Velocity Addition Diagram', -50, -60)
    ctx.fillText('(Tip-to-Tail method)', -50, -45)
    ctx.restore()

    ctx.restore()
}


const drawRain = (ctx, x, y) => {
    // Rain angle
    // Vertical is variable (props.rainSpeed). Horizontal is relative to the observer frame!
    // JEE Context: V_rain_ground = (v2, v_rain_y). V_man_ground = (v1, 0).
    const v_rain_y = props.rainSpeed
    const vx = (props.observerFrame === 'obj1' || props.observerFrame === 'Man') ? (props.v2 - props.v1) : props.v2
    const vy = v_rain_y
    
    // Correct rotation to align drop with vector(vx, vy)
    const dropAngle = -Math.atan2(vx, vy)

    
    // Draw drops
    const numDrops = 400
    
    // Canvas bounds - approximated large area
    const w = ctx.canvas.width / props.zoom + 2000
    const h = ctx.canvas.height / props.zoom + 2000
    
    // Total speed for scaling tail length
    const totalSpeed = Math.hypot(vx, vy)
    const speedScale = 40 

    for (let i = 0; i < numDrops; i++) {
        // Deterministic randomness based on index
        const r1 = ((i * 127.1 + i * i * 0.3) % 1000) / 1000
        const r2 = ((i * 311.7) % 1000) / 1000
        const r3 = ((i * 73.5) % 1000) / 1000
        
        // Move drops relative to ground, then relate to man's moving frame
        // Horizontal: initial pos + vx * time
        const initialX = (r1 * w) - w/2
        const dx = ((initialX + time.value * vx * speedScale) % w + w) % w - w/2
        
        // Continuous y falling
        const dy = ((r2 * h + time.value * vy * speedScale) % h) - h/3
        
        // Layering
        let size, alpha, color
        if (r3 < 0.33) {
            // Back
            size = 1.2; alpha = 0.3; color = '#94a3b8'
        } else if (r3 < 0.66) {
            // Mid
            size = 2.5; alpha = 0.65; color = '#f1f5f9'
        } else {
            // Front
            size = 4.0; alpha = 0.9; color = '#ffffff'
        }
        
        // Position relative to man
        const dropX = x + dx
        const dropY = y + dy
        
        // Don't draw if excessively far
        if (Math.abs(dropX - x) > 1500) continue
        
        ctx.save()
        ctx.translate(dropX, dropY)
        // Rotate to match velocity vector
        ctx.rotate(dropAngle)
        
        // Draw Teardrop Shape pointing DOWN
        ctx.fillStyle = color
        ctx.globalAlpha = alpha
        ctx.shadowBlur = 4
        ctx.shadowColor = color
        ctx.beginPath()
        // Head (top) - semicircle at top
        ctx.arc(0, 0, size / 2, Math.PI, 0, false)
        // Tail (tapering down) - point at bottom
        ctx.lineTo(0, size * (3 + totalSpeed * 0.5)) 
        ctx.lineTo(-size / 2, 0) // Close back to head
        ctx.fill()
        ctx.shadowBlur = 0
        
        ctx.restore()
        
        // Splash on ground
        if (dropY > y + 5 && dropY < y + 15 && Math.abs(dx) < 600) {
            if (r1 > 0.95) { // Occasional splash
                ctx.fillStyle = 'rgba(203, 213, 225, 0.4)'
                ctx.beginPath()
                ctx.ellipse(dropX, y + 15, size * 2, size * 0.5, 0, 0, Math.PI * 2)
                ctx.fill()
            }
        }
    }
}

const drawRainSource = (ctx, x, y, color, label) => {
    ctx.save()
    ctx.translate(x, y)
    
    // Draw a stylized cloud
    ctx.shadowBlur = 20
    ctx.shadowColor = color
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    
    ctx.beginPath()
    ctx.arc(-20, 0, 20, 0, Math.PI * 2)
    ctx.arc(0, -10, 25, 0, Math.PI * 2)
    ctx.arc(20, 0, 20, 0, Math.PI * 2)
    ctx.fill()
    
    // Add "Rain" label
    ctx.shadowBlur = 0
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 14px Inter'
    ctx.textAlign = 'center'
    ctx.fillText(label, 0, 35)
    
    ctx.restore()
    ctx.restore()
}

const drawRainVectorDiagram = (ctx, x, y, userScale = 1.0) => {
    ctx.save()
    // Position diagram at x, y (Screen Coordinates)
    ctx.translate(x, y)
    
    // Scale the entire diagram
    ctx.scale(userScale, userScale)
    
    const scale = 8 // pixel per unit base scale
    
    // Velocities
    const v_man_x = props.v1
    const v_man_y = 0
    const v_rain_x = props.v2 // Air Speed
    const v_rain_y = props.rainSpeed
    
    // 1. Draw Man Velocity (Red) - Side A
    drawVector(ctx, 0, 0, v_man_x, 0, '#f87171', '')
    
    // Calculate Man Tip
    const mx = v_man_x * 10 // drawVector uses * 10 internal scaling. 
    // Wait, drawVector logic: len = mag * 10. angle = -angleDeg.
    // If I pass raw components, drawVector expects polar.
    // I should create a helper for cartesian or just render manually.
    // Using manual rendering for precise triangle control.
    
    const s = 10 // Visual scale factor matching drawVector's internal *10? 
    // Actually drawVector takes Mag and AngleDeg.
    // Let's just draw lines manually to be safe and exact.
    
    const O = {x: 0, y: 0}
    const M = {x: v_man_x * s, y: 0}       // Man Vector (Horizontal)
    const R = {x: v_rain_x * s, y: v_rain_y * s} // Rain Vector (Vertical/Slanted)
    
    // Draw V_Man (Origin -> M)
    ctx.beginPath()
    ctx.moveTo(O.x, O.y)
    ctx.lineTo(M.x, M.y)
    ctx.strokeStyle = '#f87171' // Red
    ctx.lineWidth = 3
    ctx.stroke()
    
    // Draw V_Rain (Origin -> R) - Ground Frame
    ctx.beginPath()
    ctx.moveTo(O.x, O.y)
    ctx.lineTo(R.x, R.y)
    ctx.strokeStyle = '#60a5fa' // Blue
    ctx.lineWidth = 3
    ctx.stroke()
    
    // Arrow Heads
    const drawArrow = (from, to, color) => {
        const angle = Math.atan2(to.y - from.y, to.x - from.x)
        const head = 10
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.moveTo(to.x, to.y)
        ctx.lineTo(to.x - head * Math.cos(angle - Math.PI/6), to.y - head * Math.sin(angle - Math.PI/6))
        ctx.lineTo(to.x - head * Math.cos(angle + Math.PI/6), to.y - head * Math.sin(angle + Math.PI/6))
        ctx.closePath()
        ctx.fill()
    }
    
    drawArrow(O, M, '#f87171')
    drawArrow(O, R, '#60a5fa')

    // Labels with Shadow
    ctx.save()
    ctx.shadowBlur = 4
    ctx.shadowColor = 'black'
    
    ctx.fillStyle = '#f87171'
    ctx.font = 'bold 12px Inter'
    ctx.fillText('v_M', M.x/2, M.y - 10)
    
    ctx.fillStyle = '#60a5fa'
    ctx.fillText('v_R', R.x/2 - 20, R.y/2)
    
    // Label for the Diagram
    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px Inter'
    ctx.textAlign = 'left'
    ctx.fillText('Ground Frame (Originals)', -50, -20)
    ctx.restore()
    
    ctx.restore()
}


const drawRainComponentDiagram = (ctx, x, y, userScale = 1.0) => {
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(userScale, userScale)
    
    const s = 8 // Scale factor
    
    // Velocities
    const v_man_x = props.v1
    const v_rain_y = props.rainSpeed
    const v_rain_x = props.v2 // Wind/Air horizontal component
    
    // Component vectors
    const manVec = { x: v_man_x * s, y: 0 }
    const rainVec = { x: v_rain_x * s, y: v_rain_y * s }
    
    // Draw axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    // Crosshair axes
    ctx.beginPath(); ctx.moveTo(-50, 0); ctx.lineTo(150, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -50); ctx.lineTo(0, 150); ctx.stroke();
    ctx.setLineDash([])
    
    // Diagram Label
    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px Inter'
    ctx.textAlign = 'left'
    ctx.fillText('Relative Frame (Resultant)', -50, -20)
    
    // Draw V_Rain (Background/Original)
    ctx.strokeStyle = 'rgba(96, 165, 250, 0.5)' // Faint Blue
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(rainVec.x, rainVec.y)
    ctx.stroke()
    
    // Draw -V_Man (Reversed Man Vector) added to V_Rain
    // Start at V_Rain tip, go backwards by V_Man
    // -V_Man = {x: -manVec.x, y: 0}
    const endPoint = { x: rainVec.x - manVec.x, y: rainVec.y }
    
    ctx.strokeStyle = '#ef4444' // Red (Negative)
    ctx.lineWidth = 2
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(rainVec.x, rainVec.y)
    ctx.lineTo(endPoint.x, endPoint.y)
    ctx.stroke()
    ctx.setLineDash([])
    
    // Draw Resultant V_RM (Origin to EndPoint)
    // V_RM = V_R - V_M
    ctx.strokeStyle = '#fcd34d' // Yellow
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(endPoint.x, endPoint.y)
    ctx.stroke()
    
    // Arrow Helper
    const drawComponentArrow = (to, color, from = {x:0, y:0}) => {
        const angle = Math.atan2(to.y - from.y, to.x - from.x)
        const head = 8
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.moveTo(to.x, to.y)
        ctx.lineTo(to.x - head * Math.cos(angle - Math.PI/6), to.y - head * Math.sin(angle - Math.PI/6))
        ctx.lineTo(to.x - head * Math.cos(angle + Math.PI/6), to.y - head * Math.sin(angle + Math.PI/6))
        ctx.closePath()
        ctx.fill()
    }
    
    drawComponentArrow(rainVec, '#60a5fa')
    drawComponentArrow(endPoint, '#ef4444', rainVec) // -V_M arrow
    drawComponentArrow(endPoint, '#fcd34d') // Resultant Arrow
    
    // Labels with Shadow
    ctx.save()
    ctx.shadowBlur = 4
    ctx.shadowColor = 'black'
    ctx.font = 'bold 11px Inter'
    ctx.textAlign = 'center'
    
    ctx.fillStyle = '#60a5fa'
    ctx.fillText('v_R', rainVec.x/2 + 20, rainVec.y/2)
    
    ctx.fillStyle = '#ef4444'
    ctx.fillText('-v_M', (rainVec.x + endPoint.x)/2, endPoint.y - 10)
    
    ctx.textAlign = 'left'
    ctx.fillStyle = '#fcd34d'
    ctx.fillText('v_RM', endPoint.x/2 - 30, endPoint.y/2 + 20)
    ctx.restore()
    
    ctx.restore()
}

const drawVector = (ctx, x, y, mag, angleDeg, color, label) => {
    const angle = -angleDeg * Math.PI / 180
    const len = mag * 10
    const tx = x + Math.cos(angle) * len
    const ty = y + Math.sin(angle) * len

    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(tx, ty)
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.stroke()

    // Arrowhead
    const headLen = 8
    ctx.beginPath()
    ctx.moveTo(tx, ty)
    ctx.lineTo(tx - headLen * Math.cos(angle - Math.PI/6), ty - headLen * Math.sin(angle - Math.PI/6))
    ctx.lineTo(tx - headLen * Math.cos(angle + Math.PI/6), ty - headLen * Math.sin(angle + Math.PI/6))
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()

    ctx.fillStyle = color
    ctx.fillText(label, tx + 10, ty)
}

const drawSky = (ctx, canvas) => {
    const limit = 5000
    // Sky Gradient
    const skyGrad = ctx.createRadialGradient(0, 0, 100, 0, 0, limit)
    skyGrad.addColorStop(0, '#1e293b')
    skyGrad.addColorStop(1, '#020617')
    
    ctx.fillStyle = skyGrad
    ctx.fillRect(-limit, -limit, limit * 2, limit * 2)
    
    // Soft Clouds / Wind lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'
    ctx.lineWidth = 10
    ctx.lineCap = 'round'
    for(let i = 0; i < 30; i++) {
        const cloudX = (i * 500 + time.value * 50) % 10000 - 5000
        const cloudY = (i * 137) % 4000 - 2000
        ctx.beginPath()
        ctx.moveTo(cloudX, cloudY)
        ctx.lineTo(cloudX + 200, cloudY)
        ctx.stroke()
    }
}

const drawManWithFlag = (ctx, x, y) => {
    drawMan(ctx, x, y)
    
    // Relative wind for flag: v_relative = v_wind - v_man
    const vwx = props.v2 * Math.cos(props.angle2 * Math.PI / 180)
    const vwy = props.v2 * Math.sin(props.angle2 * Math.PI / 180)
    const v_rel_x = vwx - props.v1
    const v_rel_y = vwy - 0
    
    const flagAngle = Math.atan2(v_rel_y, v_rel_x)
    
    ctx.save()
    ctx.translate(x, y - 45) // Hand position roughly
    ctx.rotate(flagAngle)
    
    // Flag pole
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(0, 0) // No visible stick needed if it's fluttery? No, let's draw one
    ctx.lineTo(0, -5) 
    ctx.stroke()
    
    // Flag cloth
    const wave = Math.sin(time.value * 10) * 5
    ctx.fillStyle = '#ffcc00'
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(30, -10 + wave)
    ctx.lineTo(30, 10 + wave)
    ctx.lineTo(0, 0)
    ctx.fill()
    ctx.restore()
}

const drawAngular = (ctx, a, b) => {
    // Line joining A and B
    ctx.setLineDash([5, 5])
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
    ctx.setLineDash([])

    drawObj(ctx, a.x, a.y, '#00d4ff', 'A')
    drawObj(ctx, b.x, b.y, '#ff0055', 'B')

    // Relative Angular Velocity Logic
    const r = Math.sqrt((b.x - a.x)**2 + (b.y - a.y)**2)
    const v_rel_x = b.vx - a.vx
    const v_rel_y = b.vy - a.vy
    
    // Component of v_rel perpendicular to r
    const dx = b.x - a.x
    const dy = b.y - a.y
    const unit_r_x = dx / r
    const unit_r_y = dy / r
    const perp_r_x = -unit_r_y
    const perp_r_y = unit_r_x
    
    const v_perp = v_rel_x * perp_r_x + v_rel_y * perp_r_y
    const omega = v_perp / r
    
    // Display Omega
    ctx.fillStyle = '#ffcc00'
    ctx.font = 'bold 16px Inter'
    ctx.textAlign = 'center'
    ctx.fillText(`ω = ${omega.toFixed(3)} rad/s`, (a.x + b.x) / 2, (a.y + b.y) / 2 - 20)
}

onMounted(() => {
  const canvas = canvasRef.value
  
  const resize = () => {
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight
  }
  
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas)
  resize()

  // Attach Interaction Events
  canvas.addEventListener('mousedown', handleMouseDown)
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)

  initSimulation()
  draw()
  
  return () => {
    resizeObserver.disconnect()
    canvas.removeEventListener('mousedown', handleMouseDown)
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
  }
})

onUnmounted(() => {
  cancelAnimationFrame(animationId)
})

watch(() => props.mode, initSimulation)

watch([() => props.v1, () => props.v2, () => props.angle1, () => props.angle2], () => {
    // Handle both generic IDs (A, B) and scenario-specific IDs (Man, Rain)
    const objA = objects.value.find(o => o.id === 'A' || o.id === 'Man')
    const objB = objects.value.find(o => o.id === 'B' || o.id === 'Rain')
    
    if (objA) {
        if (props.mode === 'river' || props.mode === 'aeroplane' || props.mode === 'angular-velocity') {
            const a1 = (props.angle1 * Math.PI) / 180
            objA.vx = props.v1 * Math.cos(a1)
            objA.vy = -props.v1 * Math.sin(a1)
        } else {
            objA.vx = props.v1
        }
    }
    
    if (objB) {
        if (props.mode === 'rain') {
            objB.vx = props.v2
            objB.vy = 10
            // Reset position if too far from man for visual continuity
            const man = objects.value.find(o => o.id === 'Man')
            if (man && Math.abs(objB.x - man.x) > 1000) objB.x = man.x
        } else if (props.mode === 'aeroplane' || props.mode === 'angular-velocity' || props.mode === 'flag-flutter') {
            const a2 = (props.angle2 * Math.PI) / 180
            objB.vx = props.v2 * Math.cos(a2)
            objB.vy = (props.mode === 'flag-flutter') ? props.v2 * Math.sin(a2) : -props.v2 * Math.sin(a2)
        } else {
            objB.vx = props.v2
        }
    }
})

defineExpose({ reset: initSimulation, addObject, objects, selectedObjectId })
</script>

<template>
  <div class="lab-container">
    <canvas ref="canvasRef" class="lab-canvas"></canvas>
    
    <div class="overlay-stats glass-panel" v-if="activeStats.length > 0">
        <div class="stat-item" v-for="stat in activeStats" :key="stat.label">
            <span class="label">{{ stat.label }}:</span>
            <span class="value">{{ stat.value }}</span>
        </div>
    </div>
    
    <!-- Physics Logic Overlay for Rain Scenario -->
    <div 
        class="physics-overlay glass-panel" 
        v-if="mode === 'rain' && showTheta" 
        :style="{ 
            position: 'absolute', 
            top: overlayPos.top + 'px', 
            right: overlayPos.right + 'px', 
            textAlign: 'right', 
            cursor: isDraggingOverlay ? 'grabbing' : 'grab',
            padding: '15px',
            userSelect: 'none'
        }"
        @mousedown.stop="startOverlayDrag"
    >
        <div class="formula-block" style="display: flex; flex-direction: column; gap: 12px; font-family: 'Cambria Math', 'Times New Roman', serif;">
            <!-- Vr,g -->
            <div class="formula-row" style="color: #60a5fa; font-weight: bold; font-size: 1.1em; display: flex; justify-content: flex-end; align-items: center; gap: 8px;">
                <span style="font-size: 0.8em; opacity: 0.9; margin-right: 4px;">Rain:</span>
                <span style="position: relative; display: inline-block; margin-right: 2px;">
                    v
                    <span style="position: absolute; top: -0.5em; left: 0; right: 0; text-align: center; font-size: 0.8em;">→</span>
                </span>
                <sub>R</sub> = (<span class="val">{{ props.v2.toFixed(1) }}</span>, <span class="val">{{ props.rainSpeed.toFixed(1) }}</span>)
            </div>
            
            <!-- Vm,g -->
            <div class="formula-row" style="color: #f87171; font-weight: bold; font-size: 1.1em; display: flex; justify-content: flex-end; align-items: center; gap: 8px;">
                <span style="font-size: 0.8em; opacity: 0.9; margin-right: 4px;">Man:</span>
                <span style="position: relative; display: inline-block; margin-right: 2px;">
                    v
                    <span style="position: absolute; top: -0.5em; left: 0; right: 0; text-align: center; font-size: 0.8em;">→</span>
                </span>
                <sub>M</sub> = (<span class="val">{{ props.v1.toFixed(1) }}</span>, <span class="val">0.0</span>)
            </div>
            
            <!-- Vr,m -->
            <div class="formula-row" style="color: #fcd34d; font-weight: bold; font-size: 1.25em; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px; display: flex; justify-content: flex-end; align-items: center; gap: 8px;">
                <span style="font-size: 0.7em; opacity: 0.9; margin-right: 4px;">Relative:</span>
                <span style="position: relative; display: inline-block; margin-right: 2px;">
                    v
                    <span style="position: absolute; top: -0.5em; left: 0; right: 0; text-align: center; font-size: 0.8em;">→</span>
                </span>
                <sub>RM</sub> = (<span class="val">{{ (props.v2 - props.v1).toFixed(1) }}</span>, <span class="val">{{ props.rainSpeed.toFixed(1) }}</span>)
            </div>
            
            <div class="formula-divider" style="height: 1px; background: rgba(255,255,255,0.2); margin: 4px 0;"></div>
            
            <!-- Angle Calculation -->
            <div class="formula-row highlight" style="font-size: 1.3em; color: #fbbf24; display: flex; align-items: center; justify-content: flex-end; gap: 10px;">
                <span>tan(θ) = </span>
                <div style="display: inline-flex; flex-direction: column; align-items: center; font-size: 0.9em; vertical-align: middle;">
                    <span style="border-bottom: 2px solid #fff; padding: 0 5px; display: block; line-height: 1.2;">| v<sub>R,x</sub> - v<sub>M,x</sub> |</span>
                    <span style="display: block; line-height: 1.2;">v<sub>R,y</sub></span>
                </div>
                <span> = {{ Math.abs((props.v2 - props.v1) / props.rainSpeed).toFixed(2) }}</span>
            </div>
            
            <div style="font-size: 0.9rem; color: #94a3b8; font-style: italic; margin-top: 5px;">
                (θ is the angle with the vertical)
            </div>
        </div>
    </div>

    <div class="zoom-controls">
        <button class="zoom-btn" @click="emit('update:zoom', Math.min(2, zoom + 0.1))" title="Zoom In">+</button>
        <button class="zoom-btn reset" @click="emit('update:zoom', 1)" title="Reset Zoom">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <path d="M3 3v5h5"></path>
            </svg>
        </button>
        <button class="zoom-btn" @click="emit('update:zoom', Math.max(0.5, zoom - 0.1))" title="Zoom Out">-</button>
    </div>

    <!-- Floating Add Button -->
    <button class="add-particle-btn" v-if="mode === '1d'" @click="addObject(0, 0)" title="Add Ball">
        +
    </button>
  </div>
</template>

<style scoped>
.lab-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: radial-gradient(circle at center, #0f172a 0%, #020617 100%);
  overflow: hidden;
}

.lab-canvas {
  width: 100%;
  height: 100%;
  display: block;
  cursor: grab;
}

.lab-canvas:active {
  cursor: grabbing;
}

.overlay-stats {
    position: absolute;
    top: 20px;
    left: 20px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    pointer-events: none;
}

.stat-item {
    display: flex;
    gap: 10px;
}

.label { color: var(--text-secondary); font-size: 0.9rem; }
.value { color: var(--primary-glow); font-family: monospace; font-weight: bold; }

.glass-panel {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
}

.zoom-controls {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: row;
    gap: 12px;
    align-items: center;
    background: rgba(0, 0, 0, 0.4);
    padding: 8px 16px;
    border-radius: 100px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.zoom-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--primary-glow);
    font-size: 1.2rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.zoom-btn.reset {
    font-size: 0.9rem;
    color: var(--text-secondary);
}

.zoom-btn:hover {
    background: var(--primary-glow);
    color: #000;
    box-shadow: 0 0 15px rgba(0, 212, 255, 0.3);
}

/* Add Particle Button */
.add-particle-btn {
    position: absolute;
    bottom: 20px;
    right: 20px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: var(--primary-glow);
    color: #000;
    border: none;
    font-size: 2rem;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.4);
    transition: all 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.add-particle-btn:hover {
    transform: scale(1.1) rotate(90deg);
    box-shadow: 0 0 30px rgba(0, 212, 255, 0.6);
}

</style>
