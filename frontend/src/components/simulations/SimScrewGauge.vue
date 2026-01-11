<script setup>
import { ref, computed, inject, onMounted, onUnmounted, watch } from 'vue'
import { usePinchZoom } from '../../composables/usePinchZoom'

// --- Constants ---
const PIXELS_PER_MM = 10 // Magnified for detail
const PITCH = 0.5 // 0.5mm per rotation (Standard)
const MAX_RANGE = 25 // 0-25mm
const SCALE_START_OFFSET = 15 // Space before zero

// --- State ---
const measurement = ref(0) // Total displacement in mm
const isDragging = ref(false)
const svgRef = ref(null)
const zeroError = ref(0) // Adjustable zero error
const showReading = ref(false)

// Layout State
const isPanelCollapsed = inject('isRightSidebarCollapsed', ref(true))

// --- Pan & Zoom State ---
const zoomLevel = ref(1)
const panX = ref(0)
const panY = ref(0)
const baseViewBox = { w: 800, h: 400 }
const dragMode = ref('screw') // 'screw', 'pan', 'object'
const divisionCount = ref(50) // Standard 50 divisions for 0.5mm pitch
const showMagnifier = ref(false)
const mouseX = ref(0)
const mouseY = ref(0)

// --- Audio Context for Realism ---
let audioCtx = null

const initAudio = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    }
}

const playRatchetSound = () => {
    if (!audioCtx) initAudio()
    if (audioCtx.state === 'suspended') audioCtx.resume()

    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    
    // Quick metallic click
    osc.type = 'square'
    osc.frequency.setValueAtTime(800, audioCtx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.05)
    
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05)
    
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    
    osc.start()
    osc.stop(audioCtx.currentTime + 0.05)
}

const playTickSound = () => {
     if (!audioCtx) initAudio()
     if (audioCtx.state === 'suspended') audioCtx.resume()

    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    
    // Very subtle tick
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(200, audioCtx.currentTime)
    
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03)
    
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    
    osc.start()
    osc.stop(audioCtx.currentTime + 0.03)
}

// --- Pinch Zoom Integration ---
const { isZooming } = usePinchZoom(svgRef, {
    onPinch: ({ deltaScale }) => {
        const newZoom = zoomLevel.value * deltaScale
        zoomLevel.value = Math.max(1, Math.min(newZoom, 5))
    },
    onPan: ({ deltaX, deltaY }) => {
        panX.value -= deltaX / zoomLevel.value
        panY.value -= deltaY / zoomLevel.value
    }
})

const LC = computed(() => PITCH / divisionCount.value)

// --- Movable Objects State ---
const spawnedObjects = ref([])
const activeObjectId = ref(null)
const selectedShape = ref('wire')
const objectSize = ref(2) // Default size (mm)
const availableShapes = [
    { value: 'wire', label: 'Wire', defaultSize: 2 },
    { value: 'sheet', label: 'Sheet', defaultSize: 1 },
    { value: 'shot', label: 'Lead Shot', defaultSize: 5 }
]

// Interaction Helpers
let dragStartX = 0
let dragStartY = 0
let initialPanX = 0
let initialPanY = 0
let objectDragStartX = 0
let objectDragStartY = 0
let magDragOffsetX = 0
let magDragOffsetY = 0
let initialMeasurement = 0

// --- Computed Properties ---
const viewBoxString = computed(() => {
    const w = baseViewBox.w / zoomLevel.value
    const h = baseViewBox.h / zoomLevel.value
    
    const maxX = (baseViewBox.w * (zoomLevel.value - 1)) / (2 * zoomLevel.value)
    const maxY = (baseViewBox.h * (zoomLevel.value - 1)) / (2 * zoomLevel.value)
    
    const margin = 2000 
    const clampedPanX = Math.max(-(maxX + margin), Math.min(panX.value, maxX + margin))
    const clampedPanY = Math.max(-(maxY + margin), Math.min(panY.value, maxY + margin))

    const x = (baseViewBox.w - w) / 2 + clampedPanX
    const y = (baseViewBox.h - h) / 2 + clampedPanY
    
    return `${x} ${y} ${w} ${h}`
})

const getSVGPoint = (clientX, clientY) => {
    if (!svgRef.value) return { x: 0, y: 0 }
    const pt = svgRef.value.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    return pt.matrixTransform(svgRef.value.getScreenCTM().inverse())
}

// --- Object Logic ---
const updateObjectDimensions = (obj) => {
    const sizeMM = objectSize.value
    
    if (obj.type === 'wire') {
        obj.width = sizeMM * PIXELS_PER_MM
        obj.height = 200 
    } else if (obj.type === 'sheet') {
        obj.width = sizeMM * PIXELS_PER_MM
        obj.height = 150
    } else if (obj.type === 'shot') {
        obj.radius = (sizeMM / 2) * PIXELS_PER_MM
        obj.width = sizeMM * PIXELS_PER_MM 
        obj.height = sizeMM * PIXELS_PER_MM
    }
}

const spawnObject = () => {
    spawnedObjects.value = [] // Single object mode
    const id = Date.now()
    const shapeType = selectedShape.value
    const defaultSize = availableShapes.find(s => s.value === shapeType)?.defaultSize || 1
    objectSize.value = defaultSize 
    
    let newObj = {
        id,
        type: shapeType,
        x: 100, 
        y: 190, 
        color: '#fbbf24',
        label: availableShapes.find(s => s.value === shapeType)?.label
    }
    
    updateObjectDimensions(newObj)
    
    // Snap to correct position (between anvil and spindle)
    // Anvil X = 100 + 20 (width) = 120
    // So object X should be 120 + some padding if we want, but visually 120 is the start of gap.
    // Actually, let's put it right at 120.
    newObj.x = 120
    
    if (shapeType === 'shot') {
        newObj.y = 200 // Center Y
        newObj.x = 120 + newObj.radius // Center X
    } else {
         newObj.y = 125 // Top of wire/sheet
    }

    spawnedObjects.value.push(newObj)
    activeObjectId.value = id
}

watch(objectSize, () => {
    if (spawnedObjects.value.length > 0) {
        // Find center before update
        const obj = spawnedObjects.value[0]
        updateObjectDimensions(obj)
        // Re-snap if needed?
        if (obj.type === 'shot') {
             obj.x = 120 + obj.radius
        }
    }
})

// --- Zoom Controls ---
const zoomIn = () => { if (zoomLevel.value < 5) zoomLevel.value += 0.5 }
const zoomOut = () => { if (zoomLevel.value > 1) zoomLevel.value -= 0.5 }
const resetZoom = () => { 
    zoomLevel.value = 1 
    panX.value = 0
    panY.value = 0
}
const totalReading = computed(() => {
    const raw = measurement.value + zeroError.value
    return Math.max(0, raw).toFixed(2)
})

const msr = computed(() => {
    // MSR is the largest main scale mark visible (including 0.5s)
    // Floor to nearest Pitch (0.5)
    return (Math.floor((measurement.value + zeroError.value + 0.00001) / PITCH) * PITCH).toFixed(1)
})
const circularReading = computed(() => {
    // Remaining fraction / LC
    const total = parseFloat(totalReading.value)
    // We use total directly. CSR = round((Total - MSR) / LC)
    const currentMsr = parseFloat(msr.value)
    const remainder = total - currentMsr
    // Avoid precision issues
    return Math.round(remainder / LC.value)
})

// --- Interaction ---
const startDrag = (e) => {
    if ((e.touches && e.touches.length > 1) || isZooming.value) return
    
    isDragging.value = false
    dragMode.value = null

    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    
    isDragging.value = true
    
    const target = e.target
    const isScrew = target.closest('.movable-screw') 
    const isObject = target.closest('.movable-object')
    const isRatchet = target.closest('.ratchet-handle')
    
    const svgPoint = getSVGPoint(clientX, clientY)
    
    // Magnifier Hit Test
    if (showMagnifier.value) {
        const dist = Math.sqrt((svgPoint.x - mouseX.value)**2 + (svgPoint.y - mouseY.value)**2)
        if (dist < 80) { 
            dragMode.value = 'magnifier'
            magDragOffsetX = svgPoint.x - mouseX.value
            magDragOffsetY = svgPoint.y - mouseY.value
            
            window.addEventListener('mousemove', onDrag)
            window.addEventListener('mouseup', stopDrag)
            window.addEventListener('touchmove', onDrag, { passive: false })
            window.addEventListener('touchend', stopDrag)
            return
        }
    }

    if (isObject) {
        dragMode.value = 'object'
        const objId = parseInt(isObject.dataset.id)
        activeObjectId.value = objId
        const obj = spawnedObjects.value.find(o => o.id === objId)
        if (obj) {
            objectDragStartX = svgPoint.x - obj.x
            objectDragStartY = svgPoint.y - obj.y
        }
    } else if (isRatchet) {
         dragMode.value = 'screw'
         dragStartY = clientY 
         initialMeasurement = measurement.value
         // Ratchet mode might just be same as screw but we play sound?
    } else if (isScrew) {
        dragMode.value = 'screw'
        dragStartY = clientY 
        initialMeasurement = measurement.value
    } else {
        dragMode.value = 'pan'
        dragStartX = svgPoint.x
        dragStartY = svgPoint.y 
        initialPanX = panX.value
        initialPanY = panY.value
    }
    
    window.addEventListener('mousemove', onDrag)
    window.addEventListener('mouseup', stopDrag)
    window.addEventListener('touchmove', onDrag, { passive: false })
    window.addEventListener('touchend', stopDrag)
}

const stopDrag = () => {
    isDragging.value = false
    window.removeEventListener('mousemove', onDrag)
    window.removeEventListener('mouseup', stopDrag)
    window.removeEventListener('touchmove', onDrag)
    window.removeEventListener('touchend', stopDrag)
}

const onDrag = (e) => {
    if (isZooming.value) {
        stopDrag()
        return
    }

    if (!isDragging.value || !svgRef.value) return
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    
    if (dragMode.value === 'screw') {
        const deltaY = dragStartY - clientY 
        const sensitivity = 200 
        const deltaMM = (deltaY / sensitivity) * PITCH
        
        let newVal = initialMeasurement + deltaMM

        // Collision Logic
        if (spawnedObjects.value.length > 0) {
            const obj = spawnedObjects.value[0]
            // Calculate object width in mm (approx)
            // obj.width is in pixels. mm = pixels / 10
            let objSizeMM = 0
            if (obj.type === 'shot') objSizeMM = (obj.radius * 2) / PIXELS_PER_MM
            else objSizeMM = obj.width / PIXELS_PER_MM
            
            // If dragging would go below object size
            if (newVal < objSizeMM) {
               newVal = objSizeMM
               playRatchetSound() // Click when hitting object
               // Vibrate if supported
               if (navigator.vibrate) navigator.vibrate(10)
            }
        }
        
        // Ratchet Sound on "Tick" (e.g. every division change)
        const oldTick = Math.floor((measurement.value % 1) / LC.value)
        const newTick = Math.floor((newVal % 1) / LC.value)
        if (oldTick !== newTick) {
            playTickSound()
        }

        measurement.value = Math.max(0, Math.min(newVal, MAX_RANGE))
        
    } else if (dragMode.value === 'object') {
        const currentPoint = getSVGPoint(clientX, clientY)
        const obj = spawnedObjects.value.find(o => o.id === activeObjectId.value)
        if (obj) {
            obj.x = currentPoint.x - objectDragStartX
            obj.y = currentPoint.y - objectDragStartY
        }
    } else if (dragMode.value === 'pan') {
        const currentPoint = getSVGPoint(clientX, clientY)
        const deltaX = currentPoint.x - dragStartX
        const deltaY = currentPoint.y - dragStartY 
        
        panX.value = initialPanX - deltaX
        panY.value = initialPanY - deltaY
    } else if (dragMode.value === 'magnifier') {
        const currentPoint = getSVGPoint(clientX, clientY)
        mouseX.value = currentPoint.x - magDragOffsetX
        mouseY.value = currentPoint.y - magDragOffsetY
    }
    
    if (e.cancelable) e.preventDefault()
}

watch(showMagnifier, (val) => {
    if (val && !mouseX.value && !mouseY.value) {
        mouseX.value = 400
        mouseY.value = 200
    }
})

// --- SVG Helpers ---
const mainScaleTicks = computed(() => {
    const ticks = []
    for (let i = 0; i <= MAX_RANGE; i++) {
        const xPos = SCALE_START_OFFSET + i * PIXELS_PER_MM
        ticks.push({ 
            x: xPos, 
            y1: 0, 
            y2: i === 0 ? -18 : -10, 
            label: i % 5 === 0 ? i : null,
            isZero: i === 0 
        })
        if (i < MAX_RANGE) {
            ticks.push({ x: xPos + 0.5 * PIXELS_PER_MM, y1: 0, y2: 8, label: null })
        }
    }
    return ticks
})

const thimbleTicks = computed(() => {
    const ticks = []
    const range = 12 
    const count = divisionCount.value
    
    for (let i = -range; i <= range; i++) {
        // Calculate division:
        // Logic: Open gap -> Measurement Increases -> Thimble rotates CCW -> Index moves to higher numbers.
        // Visually: Numbers 'below' index (i > 0) move UP to index.
        // So i > 0 corresponds to numbers LARGER than current index.
        const currentCS = circularReading.value
        const div = (currentCS + i + count) % count 
        
        // Note: Logic adjustment for displaying correctly.
        // We need to display `div` values that move UP as measurement increases (unthreading usually shows larger numbers?)
        // Standard screw gauge: 0 is ref. unscrew -> >0.
        // Usually scale wraps 0..99 or 0..49.
        
        const angle = (i / 20) * Math.PI 
        const y = Math.sin(angle) * 40
        const opacity = Math.cos(angle)
        
        let label = null
        const isMajor = div % 5 === 0
        if (isMajor) label = div
        
        ticks.push({ y, label, opacity, div, isMajor })
    }
    return ticks
})

</script>

<template>
  <div class="sim-container">
    <div class="canvas-area">
      <div class="svg-container">
        <!-- Zoom Controls -->
        <div class="zoom-controls">
            <button @click="zoomIn">＋</button>
            <button @click="resetZoom">⟲</button>
            <button @click="zoomOut">－</button>
        </div>

        <svg 
            ref="svgRef"
            :viewBox="viewBoxString"
            width="100%" 
            height="100%"
            preserveAspectRatio="xMidYMid meet"
            class="screw-gauge-svg"
            @mousedown="startDrag"
            @touchstart.prevent="startDrag"
        >
          <defs>
             <clipPath id="screw-mask">
                 <rect x="0" y="0" width="800" height="400" />
             </clipPath>
             
            <!-- Improved Realistic Gradients -->
            <linearGradient id="metalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#94a3b8" />
              <stop offset="10%" stop-color="#f8fafc" /> <!-- Highlight -->
              <stop offset="40%" stop-color="#cbd5e1" />
              <stop offset="60%" stop-color="#94a3b8" />
              <stop offset="90%" stop-color="#475569" /> <!-- Shadow -->
              <stop offset="100%" stop-color="#334155" />
            </linearGradient>
            
            <linearGradient id="frameGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#334155" />
              <stop offset="50%" stop-color="#1e293b" />
              <stop offset="100%" stop-color="#0f172a" />
            </linearGradient>
            
            <!-- Pattern for Knurling -->
            <pattern id="knurling" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
                 <rect width="4" height="4" fill="#64748b" opacity="0.3" />
                 <path d="M0 4L4 0M-1 1L1 -1M3 5L5 3" stroke="#000" stroke-width="0.5" opacity="0.2" />
            </pattern>

            <filter id="shadow">
                <feDropShadow dx="0" dy="8" stdDeviation="6" flood-opacity="0.6" />
            </filter>
            
            <filter id="inner-shadow">
               <feOffset dx="0" dy="2" />
               <feGaussianBlur stdDeviation="2" result="offset-blur" />
               <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
               <feFlood flood-color="black" flood-opacity="0.5" result="color" />
               <feComposite operator="in" in="color" in2="inverse" result="shadow" />
               <feComposite operator="over" in="shadow" in2="SourceGraphic" /> 
            </filter>
          </defs>

          <!-- Main Content Wrapper for Magnifier Reuse -->
          <g id="screw-content">
          
          <!-- U-Frame -->
          <path d="M 100 150 L 100 250 Q 100 320 170 320 L 320 320 Q 370 320 370 250 L 370 220" 
                fill="none" stroke="url(#frameGradient)" stroke-width="45" stroke-linecap="round" filter="url(#shadow)" />
          
          <!-- Anvil (Fixed Stud) -->
          <rect x="95" y="180" width="25" height="40" fill="url(#metalGradient)" stroke="#334155" />

          <!-- Main Sleeve (Fixed) -->
          <g transform="translate(370, 200)">
            <rect x="0" y="-25" width="280" height="50" fill="url(#metalGradient)" stroke="#475569" />
            
            <!-- Reference Line -->
            <line x1="0" y1="0" x2="260" y2="0" stroke="#0f172a" stroke-width="1.5" />
            
            <!-- Main Scale Ticks -->
            <g v-for="(tick, i) in mainScaleTicks" :key="'m'+i">
                <line :x1="tick.x" :y1="tick.y1" :x2="tick.x" :y2="tick.y2" stroke="#0f172a" :stroke-width="tick.isZero ? 2 : 1" />
                <text 
                    v-if="tick.label !== null" 
                    :x="tick.x + (tick.isZero ? -4 : 0)" 
                    y="-15" 
                    :text-anchor="tick.isZero ? 'end' : 'middle'" 
                    font-size="10" font-weight="bold" fill="#1e293b"
                >{{ tick.label }}</text>
            </g>
          </g>

          <!-- Spindle (Movable) -->
          <rect class="movable-screw" :x="120 + measurement * PIXELS_PER_MM" y="190" :width="250 - measurement * PIXELS_PER_MM" height="20" fill="#cbd5e1" stroke="#64748b" />

          <!-- Spawned Objects -->
          <g v-for="obj in spawnedObjects" :key="obj.id" 
               :transform="`translate(${obj.x}, ${obj.y})`"
               class="movable-object"
               :class="{ active: activeObjectId === obj.id }"
               :data-id="obj.id"
               style="cursor: move;"
          >
              <g filter="url(#shadow)">
                   <!-- Wire -->
                   <rect v-if="obj.type === 'wire'" :width="obj.width" :height="obj.height" fill="#fbbf24" stroke="rgba(255,255,255,0.6)" rx="2" />
                   
                   <!-- Sheet -->
                   <rect v-else-if="obj.type === 'sheet'" :width="obj.width" :height="obj.height" fill="#fbbf24" stroke="rgba(255,255,255,0.6)" rx="1" />
                   
                   <!-- Lead Shot -->
                   <circle v-else-if="obj.type === 'shot'" :r="obj.radius" fill="#475569" stroke="rgba(255,255,255,0.4)" stroke-width="1">
                        <animate attributeName="fill" values="#475569;#334155;#475569" dur="4s" repeatCount="indefinite" />
                   </circle>
              </g>
          </g>

          <!-- Thimble (Movable) -->
          <g class="movable-screw" :transform="`translate(${370 + SCALE_START_OFFSET + (measurement + zeroError) * PIXELS_PER_MM}, 200)`">
             <!-- Beveled edge -->
             <path d="M 0 -35 L 20 -40 L 20 40 L 0 35 Z" fill="url(#metalGradient)" stroke="#475569" />
             <!-- Thimble Body -->
             <rect x="20" y="-40" width="140" height="80" fill="url(#metalGradient)" stroke="#475569" />
             
             <!-- Knurling -->
             <rect x="80" y="-40" width="80" height="80" fill="url(#knurling)" />
             <rect x="80" y="-40" width="80" height="80" fill="url(#metalGradient)" style="mix-blend-mode: overlay;" />

             <!-- Circular Scale Ticks -->
             <g v-for="tick in thimbleTicks" :key="'t'+tick.div" :style="{ opacity: tick.opacity }">
                <line x1="2" :y1="tick.y" :x2="tick.isMajor ? 18 : 10" :y2="tick.y" stroke="#0f172a" stroke-width="1" />
                <text v-if="tick.label !== null" :x="22" :y="tick.y + 3" font-size="8" font-weight="bold" fill="#1e293b">{{ tick.label }}</text>
             </g>
          </g>

          <!-- Ratchet (Movable) -->
          <g class="ratchet-handle" :transform="`translate(${370 + SCALE_START_OFFSET + (measurement + zeroError) * PIXELS_PER_MM + 160}, 200)`" style="cursor: row-resize;">
             <rect x="0" y="-20" width="30" height="40" fill="#334155" rx="4" />
             <rect x="5" y="-18" width="20" height="36" fill="url(#knurling)" rx="2" opacity="0.5" />
             <line x1="0" y1="0" x2="-5" y2="0" stroke="#94a3b8" stroke-width="4" />
          </g>

          </g> <!-- End screw-content -->

          <!-- Magnifier Lens -->
          <g v-if="showMagnifier">
                <defs>
                    <clipPath id="lens-clip-sg">
                        <circle :cx="mouseX" :cy="mouseY" r="75" />
                    </clipPath>
                </defs>
                <g clip-path="url(#lens-clip-sg)">
                    <circle :cx="mouseX" :cy="mouseY" r="80" fill="#fbe7d1" /> 
                    <g transform="scale(2)" :transform-origin="`${mouseX} ${mouseY}`">
                        <use href="#screw-content" />
                    </g>
                    <!-- Cross Wires -->
                    <line :x1="mouseX - 75" :y1="mouseY" :x2="mouseX + 75" :y2="mouseY" stroke="rgba(255, 0, 0, 0.5)" stroke-width="0.5" />
                    <line :x1="mouseX" :y1="mouseY - 75" :x2="mouseX" :y2="mouseY + 75" stroke="rgba(255, 0, 0, 0.5)" stroke-width="0.5" />
                </g>
                <circle :cx="mouseX" :cy="mouseY" r="75" fill="none" stroke="#334155" stroke-width="3" filter="url(#shadow)" />
                <circle :cx="mouseX" :cy="mouseY" r="72" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2" />
          </g>

        </svg>


      </div>
    </div>

    <!-- Controls Panel -->
    <aside class="controls-panel glass-panel" :class="{ 'collapsed': isPanelCollapsed }">
        <div class="header">
            <h3>Parameters</h3>
        </div>
        
        <div class="scroll-content">
            <!-- Configuration -->
            <div class="info-box glass-inset">
                <h4 class="label-heading">Settings</h4>
                <div class="control-group">
                    <div class="label-row">
                        <label>Zero Error</label>
                        <span class="value">{{ zeroError > 0 ? '+' : '' }}{{ zeroError.toFixed(2) }} mm</span>
                    </div>
                    <input type="range" v-model.number="zeroError" min="-0.05" max="0.05" step="0.01" class="modern-slider">
                </div>
                <div class="control-group">
                    <button class="btn-secondary" @click="measurement = 0">Reset Screw</button>
                     <div class="label-row" style="margin-top:10px;">
                        <label>Divisions</label>
                        <input type="number" v-model.number="divisionCount" class="input-modern" style="width:100px;" min="50" max="100" step="50">
                    </div>
                </div>
                 <div class="control-group">
                    <button class="btn-secondary" @click="showMagnifier = !showMagnifier" :class="{ 'active-toggle': showMagnifier }">
                        {{ showMagnifier ? 'Hide Magnifier' : 'Show Magnifier' }}
                    </button>
                </div>
            </div>

            <!-- Movable Objects -->
            <div class="info-box glass-inset">
                 <h4 class="label-heading">Object</h4>
                 <div class="control-group">
                    <div style="display:flex; gap:10px;">
                        <select v-model="selectedShape" class="input-modern" style="flex:1;">
                            <option v-for="s in availableShapes" :key="s.value" :value="s.value">{{ s.label }}</option>
                        </select>
                        <button @click="spawnObject" class="btn-primary" style="width:auto; padding:0 1rem;">Add</button>
                    </div>
                 </div>
                 <div v-if="spawnedObjects.length > 0" class="control-group">
                     <label>Size (mm)</label>
                     <input type="range" v-model.number="objectSize" min="0.5" max="10" step="0.1" class="modern-slider">
                 </div>
            </div>

            <!-- Readings -->
            <div class="info-box glass-inset">
                <h4 class="label-heading">Measurement</h4>
                <div v-if="!showReading" class="quiz-mode">
                    <p>Read the scale and verify.</p>
                    <button class="btn-primary" @click="showReading = true">Reveal</button>
                </div>
                <div v-else class="reading-result">
                    <div class="total-display">
                        <span class="val">{{ totalReading }}</span>
                        <span class="unit">mm</span>
                    </div>
                    <div class="breakdown">
                        <div class="row"><span>MSR:</span> <span class="val">{{ msr }} mm</span></div>
                        <div class="row"><span>CS:</span> <span class="val">{{ circularReading }}</span></div>
                    </div>
                    <button class="btn-text" @click="showReading = false">Hide</button>
                </div>
            </div>
        </div>
    </aside>
  </div>
</template>

<style scoped>
/* Glassmorphism & UI */
.sim-container {
    display: flex;
    flex-direction: row;
    height: 100%;
    width: 100%;
    overflow: hidden;
    font-family: 'Inter', sans-serif;
}

.canvas-area {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    position: relative;
    background: radial-gradient(circle at center, #1e293b 0%, #000 100%);
    perspective: 1000px;
}

.svg-container {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
}

.movable-screw, .movable-object, .ratchet-handle {
    transition: none !important;
}

/* Icons/Buttons */
.zoom-controls {
    position: absolute;
    top: 20px;
    right: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 10;
}

.zoom-controls button {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #e2e8f0;
    font-size: 1.2rem;
    cursor: pointer;
    backdrop-filter: blur(4px);
    transition: all 0.2s;
}

.zoom-controls button:hover {
    background: #00d4ff;
    color: #0f172a;
    transform: scale(1.1);
}

.interaction-hint {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.85rem;
    pointer-events: none;
    text-transform: uppercase;
    letter-spacing: 1px;
}

/* Controls Panel */
.controls-panel {
    width: 320px;
    background: rgba(15, 23, 42, 0.85); /* Slightly transparent */
    backdrop-filter: blur(20px);
    border-left: 1px solid rgba(255,255,255,0.08);
    display: flex;
    flex-direction: column;
    z-index: 20;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.controls-panel.collapsed {
    width: 0;
    overflow: hidden;
    border: none;
}

.header {
    padding: 1.5rem;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header h3 {
    margin: 0;
    color: #e2e8f0;
    font-size: 1.1rem;
}

.btn-icon {
    background: rgba(255,255,255,0.1);
    border: none;
    color: white;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    cursor: pointer;
}

.scroll-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.info-box {
    padding: 1.25rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.03);
}

.label-heading {
    margin: 0 0 1rem 0;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: #94a3b8;
    font-weight: 600;
}

.control-group {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    margin-bottom: 1rem;
}

.label-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
    align-items: center;
}

.value { color: #00d4ff; font-weight: 600; font-family: 'Courier New', monospace; }

/* Modern Inputs */
.modern-slider {
    width: 100%;
    height: 4px;
    background: #334155;
    border-radius: 2px;
    accent-color: #00d4ff;
    cursor: pointer;
}

.input-modern {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #fff;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 0.9rem;
    outline: none;
}

.input-modern:focus { border-color: #00d4ff; }

.btn-primary {
    background: #00d4ff;
    color: #1e293b;
    border: none;
    padding: 10px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: 0.2s;
}

.btn-primary:hover {
    background: #38bdf8;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 212, 255, 0.2);
}

.btn-secondary {
    background: rgba(255, 255, 255, 0.05);
    color: #cbd5e1;
    border: 1px solid rgba(255, 255, 255, 0.05);
    padding: 8px;
    border-radius: 8px;
    cursor: pointer;
    transition: 0.2s;
}

.btn-secondary:hover, .btn-secondary.active-toggle {
    background: rgba(255, 255, 255, 0.1);
    color: white;
}

.btn-secondary.active-toggle {
    border-color: #00d4ff;
    color: #00d4ff;
}

.btn-text {
    background: none;
    border: none;
    color: #94a3b8;
    margin-top: 10px;
    cursor: pointer;
    font-size: 0.8rem;
    text-decoration: underline;
}

/* Reading Display */
.reading-result {
    text-align: center;
}
.total-display {
    font-size: 2rem;
    font-weight: 700;
    color: #00d4ff;
    margin-bottom: 0.5rem;
}
.unit { font-size: 1rem; color: #64748b; margin-left: 4px; }
.breakdown .row {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
    color: #cbd5e1;
    margin-bottom: 4px;
}

/* Help Overlay */
.help-overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(4px);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
}

.help-card {
    background: #1e293b;
    padding: 2rem;
    border-radius: 16px;
    max-width: 400px;
    text-align: center;
    border: 1px solid rgba(255,255,255,0.1);
    box-shadow: 0 20px 40px rgba(0,0,0,0.4);
}

.help-card h3 { margin-top: 0; color: #fff; }
.help-card ul { 
    text-align: left; 
    padding-left: 1.2rem; 
    color: #cbd5e1; 
    line-height: 1.6;
}
.help-card .btn-primary { margin-top: 1rem; width: 50%; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
