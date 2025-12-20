<script setup>
import { ref, computed, inject, onMounted, onUnmounted } from 'vue'
import { usePinchZoom } from '../../composables/usePinchZoom'

// --- Constants ---
const PIXELS_PER_MM = 10 // Magnified for detail
const PITCH = 1 // 1mm per rotation
const MAX_RANGE = 25 // 0-25mm
const SCALE_START_OFFSET = 15 // Space before zero

// --- State ---
const measurement = ref(0) // Total displacement in mm
const isDragging = ref(false)
const svgRef = ref(null)
const zeroError = ref(0) // Adjustable zero error
const showReading = ref(false)

// Layout State - use injected state from Lab.vue
// Layout State - use injected state from Lab.vue
const isPanelCollapsed = inject('isRightSidebarCollapsed', ref(true))

// --- Pan & Zoom State ---
const zoomLevel = ref(1)
const panX = ref(0)
const panY = ref(0)
const baseViewBox = { w: 800, h: 400 }
const dragMode = ref('screw') // 'screw', 'pan', 'object'
const divisionCount = ref(100) // 100 or 50
const showMagnifier = ref(false)
const mouseX = ref(0)
const mouseY = ref(0)

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

// Object Interaction Helpers
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
    
    // Calculate Panning Limits
    const maxX = (baseViewBox.w * (zoomLevel.value - 1)) / (2 * zoomLevel.value)
    const maxY = (baseViewBox.h * (zoomLevel.value - 1)) / (2 * zoomLevel.value)
    
    // Allow large margin for free panning
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
        // Wire: Round cross-section (circle) for measurement? Or line?
        // Usually screw gauge measures diameter. Let's represent as a small cylinder/circle.
        // For visual clarity, a vertical wire.
        obj.width = sizeMM * PIXELS_PER_MM
        obj.height = 200 // Long wire
    } else if (obj.type === 'sheet') {
        // Sheet: Thickness
        obj.width = sizeMM * PIXELS_PER_MM
        obj.height = 150
    } else if (obj.type === 'shot') {
        // Lead Shot: Sphere
        obj.radius = (sizeMM / 2) * PIXELS_PER_MM
        obj.width = sizeMM * PIXELS_PER_MM // Diameter bound
        obj.height = sizeMM * PIXELS_PER_MM
    }
}

const spawnObject = () => {
    spawnedObjects.value = [] // Single object mode
    const id = Date.now()
    const shapeType = selectedShape.value
    const defaultSize = availableShapes.find(s => s.value === shapeType)?.defaultSize || 1
    objectSize.value = defaultSize // Reset slider to default for shape
    
    let newObj = {
        id,
        type: shapeType,
        x: 100, // Position in gap
        y: 190, // Center Y
        color: '#fbbf24',
        label: availableShapes.find(s => s.value === shapeType)?.label
    }
    
    updateObjectDimensions(newObj)
    
    // Centering logic
    if (shapeType === 'shot') {
        newObj.y = 200 // Center Y
        newObj.x = 125 // Past anvil (100-120)
    } else {
         newObj.y = 125 // Top of wire/sheet (Center is ~200)
         newObj.x = 125
    }

    spawnedObjects.value.push(newObj)
    activeObjectId.value = id
}

import { watch } from 'vue'
watch(objectSize, () => {
    if (spawnedObjects.value.length > 0) {
        updateObjectDimensions(spawnedObjects.value[0])
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

const msr = computed(() => Math.floor(parseFloat(totalReading.value)))
const circularReading = computed(() => {
    const fraction = (parseFloat(totalReading.value) % 1) / LC.value
    return Math.round(fraction) % divisionCount.value
})

// --- Interaction ---
const startDrag = (e) => {
    // Ignore multi-touch or active zoom
    if ((e.touches && e.touches.length > 1) || isZooming.value) return
    
    // Clear State
    isDragging.value = false
    dragMode.value = null

    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    
    // Valid touch/click started
    isDragging.value = true
    
    const target = e.target
    const isScrew = target.closest('.movable-screw') // We'll add this class to screw parts
    const isObject = target.closest('.movable-object')
    
    const svgPoint = getSVGPoint(clientX, clientY)
    
    // Magnifier Hit Test
    if (showMagnifier.value) {
        const dist = Math.sqrt((svgPoint.x - mouseX.value)**2 + (svgPoint.y - mouseY.value)**2)
        if (dist < 80) { // Radius 80 (75 + rim)
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
    } else if (isScrew) {
        dragMode.value = 'screw'
        dragStartY = clientY // Use screen Y for screw rotation feel
        initialMeasurement = measurement.value
    } else {
        dragMode.value = 'pan'
        dragStartX = svgPoint.x
        dragStartY = svgPoint.y // Use SVG Y for pan
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
        // Abort drag
        stopDrag()
        return
    }

    if (!isDragging.value || !svgRef.value) return
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    
    if (dragMode.value === 'screw') {
        const deltaY = dragStartY - clientY // Pull up to rotate thimble "forward" (close)
        // Sensitivity: 200 pixels = 1 full rotation (1mm)
        const sensitivity = 200 
        const deltaMM = (deltaY / sensitivity) * PITCH
        
        let newVal = initialMeasurement + deltaMM
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
        const deltaY = currentPoint.y - dragStartY // SVG Y
        
        panX.value = initialPanX - deltaX
        panY.value = initialPanY - deltaY
    } else if (dragMode.value === 'magnifier') {
        const currentPoint = getSVGPoint(clientX, clientY)
        mouseX.value = currentPoint.x - magDragOffsetX
        mouseY.value = currentPoint.y - magDragOffsetY
    }
    
    
    if (e.cancelable) e.preventDefault()
}

// Initialize Magnifier Position Check
watch(showMagnifier, (val) => {
    if (val && !mouseX.value && !mouseY.value) {
        // Default center
        mouseX.value = 400
        mouseY.value = 200
    }
})

// --- SVG Helpers ---
const mainScaleTicks = computed(() => {
    const ticks = []
    for (let i = 0; i <= MAX_RANGE; i++) {
        const xPos = SCALE_START_OFFSET + i * PIXELS_PER_MM
        // Upper ticks (whole mm)
        ticks.push({ 
            x: xPos, 
            y1: 0, 
            y2: i === 0 ? -18 : -10, // Longer line for zero
            label: i % 5 === 0 ? i : null,
            isZero: i === 0 
        })
        // Lower ticks (0.5 mm)
        if (i < MAX_RANGE) {
            ticks.push({ x: xPos + 0.5 * PIXELS_PER_MM, y1: 0, y2: 8, label: null })
        }
    }
    return ticks
})

const thimbleTicks = computed(() => {
    const ticks = []
    // We only render what's visible on the semi-cylinder
    // The current circularReading is at the reference line (y=0 in thimble local space)
    const range = 12 // +/- range to show
    const count = divisionCount.value
    
    for (let i = -range; i <= range; i++) {
        const div = (circularReading.value + i + count) % count
        const angle = (i / 20) * Math.PI // Map -10..10 to -90..90 degrees
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
      <div class="svg-container glass-card">
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
            class="screw-gauge-svg"
            @mousedown="startDrag"
            @touchstart.prevent="startDrag"
            @mousemove="null"
            :class="{ grabbing: isDragging }"
        >
          <defs>
             <clipPath id="screw-mask">
                 <rect x="0" y="0" width="800" height="400" />
             </clipPath>
             <!-- Gradients existing... -->
            <linearGradient id="metalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#94a3b8" />
              <stop offset="20%" stop-color="#cbd5e1" />
              <stop offset="50%" stop-color="#f1f5f9" />
              <stop offset="80%" stop-color="#cbd5e1" />
              <stop offset="100%" stop-color="#64748b" />
            </linearGradient>
            
            <linearGradient id="frameGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#1e293b" />
              <stop offset="100%" stop-color="#0f172a" />
            </linearGradient>

            <filter id="shadow">
                <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.5" />
            </filter>
          </defs>

          <!-- Main Content Wrapper for Magnifier Reuse -->
          <g id="screw-content">
          
          <!-- U-Frame -->
          <path d="M 100 150 L 100 250 Q 100 320 170 320 L 300 320 Q 370 320 370 250 L 370 220" 
                fill="none" stroke="url(#frameGradient)" stroke-width="40" stroke-linecap="round" filter="url(#shadow)" />
          
          <!-- Anvil (Fixed Stud) -->
          <rect x="100" y="180" width="20" height="40" fill="#cbd5e1" stroke="#475569" />

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

          <!-- Spindle (Movable) class for detecting screw drag -->
          <!-- Spindle (Movable) class for detecting screw drag -->
          <!-- Spindle moves with thimble. If Thimble is at X_base + meas, Spindle is X_spin + meas? 
               Actually Spindle moves left/right. 
               Wait, Spindle tip is at 100 (Anvil) + Gap.
               Gap = Measurement.
               So Spindle X should end at 120 + Measure * 10.
               Rect Width = 250 - Measure * 10?
               Original: x="120 + measurement" width="250 - measurement".
               This logic was correct for the gap geometry.
               The Thimble position is visual.
               So Spindle rendering does not need OFFSET change unless visual coherence is needed.
               Actually, Spindle is the rod on the left. Thimble is on the right.
               They are connected.
               If thimble moves by OFFSET (15px), the rod length shouldn't change, just the "housing" relative to it?
               No, the Thimble moves relative to the fixed Sleeve.
               The Spindle moves relative to the fixed Frame.
               Current code: Spindle x depends on measurement. Thimble x depends on measurement.
               If I shift Thimble visual start by 15, I don't physically change the gap.
               So Spindle code can stay same.
          -->
          <rect class="movable-screw" :x="120 + measurement * PIXELS_PER_MM" y="190" :width="250 - measurement * PIXELS_PER_MM" height="20" fill="#e2e8f0" stroke="#94a3b8" />

          <!-- Spawned Objects (Rendered between Spindle and Anvil space) -->
          <g v-for="obj in spawnedObjects" :key="obj.id" 
               :transform="`translate(${obj.x}, ${obj.y})`"
               class="movable-object"
               :class="{ active: activeObjectId === obj.id }"
               :data-id="obj.id"
               style="cursor: move;"
          >
              <g filter="url(#shadow)">
                   <!-- Wire (Vertical Line/Rect) -->
                   <rect v-if="obj.type === 'wire'" :width="obj.width" :height="obj.height" fill="#fbbf24" stroke="rgba(255,255,255,0.6)" rx="2" />
                   
                   <!-- Sheet (Thin Rect) -->
                   <rect v-else-if="obj.type === 'sheet'" :width="obj.width" :height="obj.height" fill="#fbbf24" stroke="rgba(255,255,255,0.6)" rx="1" />
                   
                   <!-- Lead Shot (Sphere) -->
                   <circle v-else-if="obj.type === 'shot'" :r="obj.radius" fill="#475569" stroke="rgba(255,255,255,0.4)" stroke-width="1">
                        <animate attributeName="fill" values="#475569;#334155;#475569" dur="4s" repeatCount="indefinite" />
                   </circle>
              </g>
          </g>

          <!-- Thimble (Movable) -->
          <!-- Offset by SCALE_START_OFFSET to align edge with 0 mark -->
          <!-- Visual Position includes Zero Error -->
          <g class="movable-screw" :transform="`translate(${370 + SCALE_START_OFFSET + (measurement + zeroError) * PIXELS_PER_MM}, 200)`">
             <!-- Beveled edge -->
             <path d="M 0 -35 L 20 -40 L 20 40 L 0 35 Z" fill="url(#metalGradient)" stroke="#475569" />
             <!-- Thimble Body -->
             <rect x="20" y="-40" width="120" height="80" fill="url(#metalGradient)" stroke="#475569" />
             
             <!-- Knurling Pattern Placeholder -->
             <rect x="100" y="-40" width="40" height="80" fill="rgba(0,0,0,0.1)" />

             <!-- Circular Scale Ticks -->
             <g v-for="tick in thimbleTicks" :key="'t'+tick.div" :style="{ opacity: tick.opacity }">
                <line x1="0" :y1="tick.y" :x2="tick.isMajor ? 15 : 8" :y2="tick.y" stroke="#0f172a" stroke-width="1" />
                <text v-if="tick.label !== null" :x="20" :y="tick.y + 4" font-size="9" font-weight="bold" fill="#1e293b">{{ tick.label }}</text>
             </g>
          </g>

          <!-- Ratchet (Movable) -->
          <g class="movable-screw" :transform="`translate(${370 + measurement * PIXELS_PER_MM + 140}, 200)`">
             <rect x="0" y="-20" width="40" height="40" fill="#475569" rx="4" />
             <rect x="5" y="-18" width="30" height="36" fill="rgba(255,255,255,0.1)" rx="2" />
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
          
          <g class="movable-screw interaction-hint-g" v-if="!showMagnifier" style="opacity:0.001">
            <!-- Invisible hit area for easier grabbing if needed, but existing refs work well -->
          </g>

        </svg>

        <div class="interaction-hint">
            <p>Drag the thimble up or down to rotate it.</p>
        </div>
      </div>
    </div>

    <!-- Controls Panel -->
    <aside class="controls-panel glass-panel" :class="{ 'collapsed': isPanelCollapsed }">
        <div class="header">
            <h3>Controls</h3>
        </div>
        
        <div class="scroll-content">
            <div class="info-box glass-inset">
                <h4 class="label-heading">Configuration</h4>
                
                <div class="control-group">
                    <div class="label-row">
                        <label>Zero Error</label>
                        <span class="value">{{ zeroError > 0 ? '+' : '' }}{{ zeroError.toFixed(2) }} mm</span>
                    </div>
                    <input type="range" v-model.number="zeroError" min="-0.05" max="0.05" step="0.01" class="modern-slider">
                </div>

                <div class="control-group">
                    <button class="btn-secondary" @click="measurement = 0">Reset to Zero</button>
                    
                     <div class="label-row" style="margin-top:10px;">
                        <label>Divisions</label>
                        <input type="number" v-model.number="divisionCount" class="input-modern" style="width:100px;" min="10" max="200" step="10">
                    </div>
                </div>
                
                 <div class="control-group">
                    <button class="btn-secondary" @click="showMagnifier = !showMagnifier" :style="{ background: showMagnifier ? '#00d4ff' : '', color: showMagnifier ? '#000' : '' }">
                        {{ showMagnifier ? 'Hide Magnifier' : 'Show Magnifier' }}
                    </button>
                </div>
            </div>

            <!-- Movable Objects -->
            <div class="info-box glass-inset">
                 <h4 class="label-heading">Movable Objects</h4>
                 
                 <div class="control-group">
                    <label>Select Object</label>
                    <div style="display:flex; gap:10px;">
                        <select v-model="selectedShape" class="input-modern" style="flex:1;">
                            <option v-for="s in availableShapes" :key="s.value" :value="s.value">{{ s.label }}</option>
                        </select>
                        <button @click="spawnObject" class="btn-primary" style="width:auto; padding:0 1rem;">Spawn</button>
                    </div>
                 </div>

                 <div v-if="spawnedObjects.length > 0" class="control-group">
                     <label>Size (mm)</label>
                     <input type="range" v-model.number="objectSize" min="0.5" max="10" step="0.1" class="modern-slider">
                 </div>
            </div>

            <div class="info-box glass-inset">
                <h4 class="label-heading">Readings</h4>
                
                <div v-if="!showReading" class="quiz-mode">
                    <p>Read the scale and verify your measurement.</p>
                    <button class="btn-primary" @click="showReading = true">Check Reading</button>
                </div>

                <div v-else class="reading-result">
                    <div class="total-display">
                        <span class="val">{{ totalReading }}</span>
                        <span class="unit">mm</span>
                    </div>
                    
                    <div class="breakdown">
                        <div class="row">
                            <span>Main Scale (MSR):</span>
                            <span class="val">{{ msr }} mm</span>
                        </div>
                        <div class="row">
                            <span>Circular Scale (CS):</span>
                            <span class="val">{{ circularReading }}</span>
                        </div>
                        <div class="row formula">
                            <span>{{ msr }} + ({{ circularReading }} × 0.01)</span>
                        </div>
                    </div>
                    <button class="btn-text" @click="showReading = false">Hide</button>
                </div>
            </div>
        </div>
    </aside>
  </div>
</template>

<style scoped>
.input-modern {
    background: rgba(30, 41, 59, 0.8); /* Darker, more opaque */
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #fff;
    padding: 8px 12px;
    border-radius: 6px;
    font-family: inherit;
    font-size: 0.9rem;
    cursor: pointer;
    outline: none;
}

.input-modern option {
    background: #1e293b;
    color: #fff;
}

.input-modern:focus {
    border-color: #00d4ff;
    box-shadow: 0 0 0 2px rgba(0, 212, 255, 0.2);
}
.sim-container {
    display: flex;
    flex-direction: row;
    height: 100%;
    width: 100%;
    overflow: hidden;
}

.canvas-area {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    position: relative;
    background: radial-gradient(circle at center, #1e293b 0%, #000 100%);
}

.svg-container {
    width: 100%;
    max-width: 900px;
    max-width: 900px;
    padding: 0; /* Remove padding to fill container */
    position: relative;
    overflow: hidden;
    height: 100%;
}

.zoom-controls {
    position: absolute;
    top: 20px;
    right: 20px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    z-index: 10;
}

.zoom-controls button {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: rgba(30, 41, 59, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #cbd5e1;
    font-size: 1.2rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
    transition: all 0.2s;
}

.zoom-controls button:hover {
    background: #00d4ff;
    color: #0f172a;
    transform: scale(1.05);
}

.screw-gauge-svg {
    filter: drop-shadow(0 10px 20px rgba(0,0,0,0.5));
    cursor: ns-resize;
    user-select: none;
}

.grabbing {
    cursor: grabbing;
}

.interaction-hint {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    color: var(--text-secondary);
    font-size: 0.9rem;
    opacity: 0.6;
}

/* Controls Panel */
.controls-panel {
    width: 320px;
    background: rgba(15, 23, 42, 0.9);
    backdrop-filter: blur(20px);
    border-left: 1px solid rgba(255,255,255,0.1);
    display: flex;
    flex-direction: column;
    transition: transform 0.3s ease, width 0.3s ease;
}

.controls-panel.collapsed {
    width: 0;
    overflow: hidden;
    border: none;
}

.header {
    padding: 1.5rem;
    border-bottom: 1px solid rgba(255,255,255,0.05);
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
    background: rgba(255,255,255,0.03);
    border-radius: 12px;
}

.label-heading {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #94a3b8;
    margin-bottom: 1rem;
}

.control-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.label-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
}

.value {
    color: #00d4ff;
    font-weight: bold;
}

.modern-slider {
    width: 100%;
    height: 4px;
    accent-color: #00d4ff;
}

.btn-primary {
    background: #00d4ff;
    color: #000;
    border: none;
    padding: 0.75rem;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    width: 100%;
    transition: 0.2s;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
}

.btn-secondary {
    background: rgba(255,255,255,0.05);
    color: #fff;
    border: 1px solid rgba(255,255,255,0.1);
    padding: 0.5rem;
    border-radius: 6px;
    cursor: pointer;
}

.total-display {
    text-align: center;
    margin: 1rem 0;
}

.total-display .val {
    font-size: 2.5rem;
    font-weight: bold;
    color: #00d4ff;
}

.total-display .unit {
    font-size: 1rem;
    color: #64748b;
    margin-left: 0.5rem;
}

.breakdown {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: 0.9rem;
    border-top: 1px solid rgba(255,255,255,0.05);
    padding-top: 1rem;
}

.row {
    display: flex;
    justify-content: space-between;
}

.formula {
    margin-top: 0.5rem;
    justify-content: center;
    font-style: italic;
    color: #94a3b8;
}

.btn-text {
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    width: 100%;
    margin-top: 1rem;
    font-size: 0.8rem;
}

@media (max-width: 768px) {
    .sim-container {
        flex-direction: column;
        height: 100%; /* Use full height */
        overflow: hidden; /* Prevent body scroll, handle internally */
    }
    
    .canvas-area {
        height: 55%; /* Fixed percentage of screen */
        width: 100%;
        padding: 0.5rem;
        flex: none;
        display: flex;
        align-items: center;
        justify-content: center;
        background: radial-gradient(circle at center, #1e293b 0%, #000 100%);
    }

    .svg-container {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    /* Ensure SVG preserves aspect ratio and fits */
    .screw-gauge-svg {
        width: 100%;
        height: 100%;
        max-height: 100%;
    }

    .controls-panel {
        width: 100%;
        height: 45%; /* Remaining space */
        max-height: none;
        border-left: none;
        border-top: 1px solid rgba(255,255,255,0.1);
        display: flex;
        flex-direction: column;
    }

    .scroll-content {
        padding: 1rem;
        padding-bottom: 2rem; /* Add padding for bottom overlap */
    }
    
    /* Zoom controls positioning for mobile */
    .zoom-controls {
        top: 10px;
        right: 10px;
    }
}
</style>
