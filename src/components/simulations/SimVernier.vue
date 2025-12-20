<script setup>
import { ref, computed, onMounted, onUnmounted, inject } from 'vue'
import { usePinchZoom } from '../../composables/usePinchZoom'

// --- Constants ---
const PIXELS_PER_MM = 5
const MAX_POS = 150
const MIN_POS = 0

// --- State ---
// --- State ---
const sliderX = ref(0) 
const isDragging = ref(false)
const dragMode = ref('slide') // 'slide', 'pan', 'object', 'magnifier'
const svgRef = ref(null)
let dragStartX = 0
let dragStartY = 0
let magDragOffsetX = 0
let magDragOffsetY = 0
let initialSliderX = 0
let initialPanX = 0
let initialPanY = 0

// Movable Objects State
const spawnedObjects = ref([])
const activeObjectId = ref(null)
const selectedShape = ref('sphere')
const objectSize = ref(20) // Default size slider value (mm)
const availableShapes = [
    { value: 'sphere', label: 'Sphere' },
    { value: 'cube', label: 'Cube' },
    { value: 'cylinder', label: 'Cylinder' },
    { value: 'wire', label: 'Thin Wire' },
    { value: 'pipe', label: 'Hollow Cyl' }, // For Internal Diameter
    { value: 'beaker', label: 'Beaker' } // For Depth
]

// Object Helper
let objectDragStartX = 0
let objectDragStartY = 0

// Configuration
const zeroError = ref(0)
const divisionCount = ref(50)
const matchingMSD = ref(49) // New: Configurable ratio (default N-1)

import { watch } from 'vue'
watch(divisionCount, (newVal) => {
    // Reset to Standard Vernier (N VSD = N-1 MSD)
    matchingMSD.value = newVal - 1
})

// Educational Modes
const showHighlight = ref(false)
const showMagnifier = ref(false)
const tutorialStep = ref(0) // 0 = off

// Layout State - use injected state from Lab.vue
const isPanelCollapsed = inject('isRightSidebarCollapsed', ref(true))

// Reading Visibility
const showReading = ref(false)

// --- Pinch Zoom Integration ---
const { isZooming } = usePinchZoom(svgRef, {
    onPinch: ({ deltaScale }) => {
        const newZoom = zoomLevel.value * deltaScale
        zoomLevel.value = Math.max(1, Math.min(newZoom, 4))
    },
    onPan: ({ deltaX, deltaY }) => {
        // Dragging right (positive delta) -> Move ViewBox left (negative pan)
        // Divide by zoomLevel to keep panning consistent with screen movement
        panX.value -= deltaX / zoomLevel.value
        panY.value -= deltaY / zoomLevel.value
    }
})

// --- Zoom Logic ---
const zoomLevel = ref(1)
const panX = ref(0)
const panY = ref(0)
const baseViewBox = { w: 1000, h: 350 }

const viewBoxString = computed(() => {
    const w = baseViewBox.w / zoomLevel.value
    const h = baseViewBox.h / zoomLevel.value
    // Center zoom
    // We adjust panX and panY relative to the baseViewBox
    // Clamp panning to stay within reasonable bounds
    // maxX/maxY represent the max offset we can have while keeping the instrument in view
    const maxX = (baseViewBox.w * (zoomLevel.value - 1)) / (2 * zoomLevel.value)
    const maxY = (baseViewBox.h * (zoomLevel.value - 1)) / (2 * zoomLevel.value)
    
    // We'll allow a huge margin to let the user pan freely (effectively off-screen if desired)
    const margin = 5000
    const clampedPanX = Math.max(-(maxX + margin), Math.min(panX.value, maxX + margin))
    const clampedPanY = Math.max(-(maxY + margin), Math.min(panY.value, maxY + margin))

    const x = (baseViewBox.w - w) / 2 + clampedPanX
    const y = (baseViewBox.h - h) / 2 + clampedPanY
    return `${x} ${y} ${w} ${h}`
})

const zoomIn = () => zoomLevel.value = Math.min(zoomLevel.value * 1.25, 4)
const zoomOut = () => {
    zoomLevel.value = Math.max(zoomLevel.value / 1.25, 1)
    if (zoomLevel.value === 1) { panX.value = 0; panY.value = 0 }
}
const resetZoom = () => {
    zoomLevel.value = 1
    panX.value = 0
    panY.value = 0
}

// Tutorial Data
const tutorialSteps = [
    { title: "Welcome", text: "Welcome to the Vernier Caliper Lab! Let's learn how to read this precision instrument." },
    { title: "Main Scale", text: "The fixed upper scale is the Main Scale. It measures in full millimeters (mm)." },
    { title: "Vernier Scale", text: "The sliding lower scale is the Vernier Scale. It allows us to measure with 0.02mm precision." },
    { title: "Reading MSR", text: "First, read the Main Scale value just before the Vernier's '0' mark. This is the Main Scale Reading (MSR)." },
    { title: "Finding Coincidence", text: "Next, look for the ONE Vernier line that aligns perfectly with a Main Scale line. This is the Coincidence." },
    { title: "Final Calculation", text: "Total Reading = MSR + (Coincidence × LC). Use the calculator panel below!" }
]

// --- Logic ---
const leastCount = computed(() => {
    // LC = Value of 1 MSD (1mm) - Value of 1 VSD
    // 1 VSD = (matchingMSD / divisionCount) * 1mm
    return 1 - (matchingMSD.value / divisionCount.value)
})

const sliderWidth = computed(() => {
    const count = divisionCount.value
    // Tick Spacing = matchingMSD / count
    const spacing = matchingMSD.value / count
    const scalePixelWidth = count * spacing * PIXELS_PER_MM
    return Math.max(120, scalePixelWidth + 50)
})

const totalReading = computed(() => {
    const raw = sliderX.value
    // Quantize to Least Count
    const lc = leastCount.value
    const quantized = Math.round(raw / lc) * lc
    
    // Fix floating point issues
    return quantized.toFixed(divisionCount.value === 10 ? 1 : 2)
})

const msrValue = computed(() => Math.floor(parseFloat(totalReading.value)))
const vsrIndex = computed(() => {
    const reading = parseFloat(totalReading.value)
    const lc = leastCount.value
    // Avoid precision jitter
    return Math.round((reading - msrValue.value) / lc)
})

const mainScaleTicks = computed(() => {
    const ticks = []
    for (let i = 0; i <= 150; i++) {
        let height = 10
        let stroke = 1
        if (i % 10 === 0) {
           height = 20
           stroke = 2
        } else if (i % 5 === 0) {
           height = 15
        }
        ticks.push({ x: i * PIXELS_PER_MM, height, stroke, label: i % 10 === 0 ? i/10 : null })
    }
    return ticks
})

// Object Management
// Object Management
const updateObjectDimensions = (obj) => {
    // Recalculate dimensions based on objectSize.value (mm)
    const sizeMM = objectSize.value
    
    if (obj.type === 'sphere') {
        obj.radius = (sizeMM / 2) * PIXELS_PER_MM
        obj.width = sizeMM * PIXELS_PER_MM
        obj.height = sizeMM * PIXELS_PER_MM
    } else if (obj.type === 'cube') {
        obj.width = sizeMM * PIXELS_PER_MM
        obj.height = sizeMM * PIXELS_PER_MM
    } else if (obj.type === 'cylinder') {
        obj.width = sizeMM * PIXELS_PER_MM
        obj.height = (sizeMM * 1.5) * PIXELS_PER_MM // Height proportional
    } else if (obj.type === 'wire') {
        obj.width = Math.min(sizeMM, 4) * PIXELS_PER_MM // Wire usually thin
        obj.height = 60 * PIXELS_PER_MM
    } else if (obj.type === 'pipe') {
         // Hollow Cylinder: 'width' is Outer Diameter
         // Inner Diameter will be (width - thickness)
         obj.width = sizeMM * PIXELS_PER_MM
         obj.height = (sizeMM * 1.5) * PIXELS_PER_MM
         obj.thickness = 2 * PIXELS_PER_MM // Constant wall thickness
    } else if (obj.type === 'beaker') {
         // Beaker: Depth is crucial
         // 'height' will be the depth
         obj.width = (sizeMM * 1.2) * PIXELS_PER_MM
         obj.height = sizeMM * PIXELS_PER_MM // Depth = Slider Value
    }
}

watch(objectSize, () => {
    if (spawnedObjects.value.length > 0) {
        updateObjectDimensions(spawnedObjects.value[0])
    }
})

const spawnObject = () => {
    // Single Object Constraint: Clear previous
    spawnedObjects.value = []
    
    const id = Date.now()
    const shapeType = selectedShape.value
    let newObj = {
        id,
        type: shapeType,
        x: 200, 
        y: 150, 
        color: '#fbbf24', 
    }
    
    updateObjectDimensions(newObj)
    
    // Adjust initial Y to be visible
    newObj.y = 150 - (newObj.height || newObj.radius * 2) / 2

    spawnedObjects.value.push(newObj)
    activeObjectId.value = id
}

const removeObject = (id) => {
    spawnedObjects.value = spawnedObjects.value.filter(o => o.id !== id)
    if (activeObjectId.value === id) activeObjectId.value = null
}

const vernierTicks = computed(() => {
    const ticks = []
    const count = divisionCount.value
    
    // Spacing based on Ratio
    const spacing = matchingMSD.value / count
    const tickSpacingMM = spacing
    
    for (let i = 0; i <= count; i++) {
        const x = i * tickSpacingMM * PIXELS_PER_MM
        let height = 8
        let label = null
        
        // Unified Formatting: Label every 5th division
        if (i % 5 === 0) {
            height = 15
            label = i 
        } else if (i % 1 === 0 && count <= 10) {
             // For 10-div, maybe taller ticks for 1s?
             height = 12
        }

        ticks.push({ x, height, label })
    }
    return ticks
})

// Highlight Calculation
const highlightX = computed(() => {
    // VSR index * tickSpacing * pixels
    const lc = leastCount.value
    return vsrIndex.value * (1 - lc) * PIXELS_PER_MM
})

// --- Magnifier Logic ---
const mouseX = ref(0)
const mouseY = ref(0) // In SVG Coordinates relative to viewBox

// Initialize position to center of viewbox if 0
watch(showMagnifier, (val) => {
    if (val && !mouseX.value && !mouseY.value) {
        // Default center roughly
        mouseX.value = 500
        mouseY.value = 175
    }
})

const lensTransform = computed(() => {
    // Scale 2x around the mouse point
    // translate(mx, my) scale(2) translate(-mx, -my)
    return `translate(${mouseX.value}, ${mouseY.value}) scale(2) translate(${-mouseX.value}, ${-mouseY.value})`
})

// --- Interaction ---
const getSVGPoint = (clientX, clientY) => {
    if (!svgRef.value) return { x: 0, y: 0 }
    const point = svgRef.value.createSVGPoint()
    point.x = clientX
    point.y = clientY
    return point.matrixTransform(svgRef.value.getScreenCTM().inverse())
}

const startDrag = (e) => {
    // Ignore multi-touch (pinch) or active zoom
    if ((e.touches && e.touches.length > 1) || isZooming.value) return

    // Clear State
    isDragging.value = false
    dragMode.value = null

    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    
    // Detect if we clicked on the slider or background
    const target = e.target
    const isSlider = target.closest('.movable-slider')
    const isObject = target.closest('.movable-object')
    
    isDragging.value = true
    
    const svgPoint = getSVGPoint(clientX, clientY)
    
    // Check Magnifier Hit
    if (showMagnifier.value) {
        // Distance check
        const dist = Math.sqrt((svgPoint.x - mouseX.value)**2 + (svgPoint.y - mouseY.value)**2)
        if (dist < 75) {
            dragMode.value = 'magnifier'
            magDragOffsetX = svgPoint.x - mouseX.value
            magDragOffsetY = svgPoint.y - mouseY.value
            
            window.addEventListener('mousemove', onDrag)
            window.addEventListener('mouseup', stopDrag)
            window.addEventListener('touchmove', onDrag, { passive: false })
            window.addEventListener('touchend', stopDrag)
            e.preventDefault()
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
    } else {
        dragMode.value = isSlider ? 'slide' : 'pan'
        dragStartX = svgPoint.x 
        dragStartY = svgPoint.y
        initialSliderX = sliderX.value
        initialPanX = panX.value
        initialPanY = panY.value
    }
    
    window.addEventListener('mousemove', onDrag)
    window.addEventListener('mouseup', stopDrag)
    window.addEventListener('touchmove', onDrag, { passive: false })
    window.addEventListener('touchend', stopDrag)
    e.preventDefault() 
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
        // Abort drag if zooming started
        isDragging.value = false
        stopDrag()
        return
    }
    if (!isDragging.value || !svgRef.value) return
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    
    const currentPoint = getSVGPoint(clientX, clientY)
    
    if (dragMode.value === 'slide') {
        const deltaSVG = currentPoint.x - dragStartX
        const deltaMM = deltaSVG / PIXELS_PER_MM
        
        let newPos = initialSliderX + deltaMM
        
        const minLimit = zeroError.value
        newPos = Math.max(minLimit, Math.min(newPos, MAX_POS))
        
        if (Math.abs(newPos - minLimit) < 0.5) newPos = minLimit
        sliderX.value = newPos
    } else if (dragMode.value === 'object') {
        const obj = spawnedObjects.value.find(o => o.id === activeObjectId.value)
        if (obj) {
            obj.x = currentPoint.x - objectDragStartX
            obj.y = currentPoint.y - objectDragStartY
        }
    } else if (dragMode.value === 'magnifier') {
        mouseX.value = currentPoint.x - magDragOffsetX
        mouseY.value = currentPoint.y - magDragOffsetY
    } else {
        const deltaX = currentPoint.x - dragStartX
        const deltaY = currentPoint.y - dragStartY
        
        panX.value = initialPanX - deltaX
        panY.value = initialPanY - deltaY
    }
}

// ... Tutorial Navigation ...

// Tutorial Navigation
const nextStep = () => { if (tutorialStep.value < tutorialSteps.length - 1) tutorialStep.value++ }
const closeTutorial = () => tutorialStep.value = 0
const startTutorial = () => tutorialStep.value = 1 // 0 is off
</script>

<template>
  <div class="sim-container">
    <div class="canvas-area">
        <div class="zoom-controls glass-panel">
            <button @click="zoomIn">＋</button>
            <button @click="resetZoom" style="font-size:0.8rem">1x</button>
            <button @click="zoomOut">－</button>
        </div>

        <div class="svg-container glass-card">
            <svg 
                ref="svgRef"
                :viewBox="viewBoxString"
                width="100%" 
                height="100%"
                preserveAspectRatio="xMidYMid meet"
                class="vernier-svg"
                @mousedown="startDrag"
                @touchstart.prevent="startDrag"
                :class="{ 
                    grabbing: isDragging,
                    'can-pan': zoomLevel > 1 && dragMode === 'pan'
                }"
            >
                <!-- Background Rect for Event Catching (Transparent) -->
            <rect x="-10000" y="-10000" width="20000" height="20000" fill="transparent" />
            
            <defs>
                <!-- Brushed Steel Gradient -->
                <linearGradient id="mainBodyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#94a3b8" />
                    <stop offset="10%" stop-color="#cbd5e1" />
                    <stop offset="25%" stop-color="#e2e8f0" /> <!-- Shine -->
                    <stop offset="40%" stop-color="#cbd5e1" />
                    <stop offset="100%" stop-color="#64748b" />
                </linearGradient>

                <!-- Darker Slider Gradient -->
                <linearGradient id="sliderGradient" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="0%" stop-color="#64748b" />
                   <stop offset="20%" stop-color="#94a3b8" />
                   <stop offset="45%" stop-color="#cbd5e1" />
                   <stop offset="60%" stop-color="#94a3b8" />
                   <stop offset="100%" stop-color="#475569" />
                </linearGradient>

                <!-- Knurled Screw Pattern -->
                <pattern id="knurling" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
                    <path d="M0 4L4 0M-2 2L2 -2M2 6L6 2" stroke="#334155" stroke-width="1" />
                </pattern>

                <!-- Deep Shadow -->
                <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                    <feOffset dx="2" dy="3" result="offsetblur"/>
                    <feComponentTransfer>
                        <feFuncA type="linear" slope="0.4"/>
                    </feComponentTransfer>
                    <feMerge> 
                        <feMergeNode/>
                        <feMergeNode in="SourceGraphic"/> 
                    </feMerge>
                </filter>
                
                <!-- Engraving Highlight (White Drop) -->
                <filter id="engrave">
                     <feDropShadow dx="0" dy="1" stdDeviation="0" flood-color="rgba(255,255,255,0.4)" />
                </filter>
            </defs>
            
            <!-- Grouped Content for Magnifier Cloning -->
            <g id="caliper-content">

            <!-- Depth Rod (Movable, Behind Scale) -->
            <!-- Linked to Slider Position -->
            <g :transform="`translate(${50 + sliderX * PIXELS_PER_MM}, 50)`">
                 <!-- Length: Spans from slider info to end. 
                      Calibrated: Main Scale ends at -60 + 920 = 860 relative to origin.
                      Slider starts at 0 relative to origin (at 0 position).
                      So Rod Width should be 860.
                 -->
                 <rect x="0" y="27" width="860" height="6" fill="#94a3b8" stroke="#64748b" stroke-width="0.5" />
            </g>

            <!-- Main Scale Body (Fixed) -->
            <g transform="translate(50, 50)" filter="url(#dropShadow)">
                <!-- Main Bar (Covers the depth rod channel) -->
                <rect x="-60" y="0" width="920" height="60" fill="url(#mainBodyGradient)" rx="2" stroke="#475569" stroke-width="0.5" />
                
                <!-- Fixed Jaw (Lower/External) -->
                <path 
                    d="M0 60 L0 160 L-10 160 L-40 60 Z" 
                    fill="url(#mainBodyGradient)" 
                    stroke="#475569" stroke-width="0.5" 
                />
                
                <!-- Fixed Jaw (Upper/Internal) -->
                <!-- Shape: Inverted Taper (Base at Right, Tip at 0) -->
                <path 
                    d="M0 0 L0 -15 Q0 -50 0 -60 L12 0 Z" 
                    fill="url(#mainBodyGradient)" 
                    stroke="#475569" stroke-width="0.5" 
                />

                <!-- Ticks & Text (Moved to Overlay for Visibility) -->
                <!-- MSR Indicator -->
                <g v-if="tutorialStep === 3 || showHighlight">
                     <line :x1="msrValue * PIXELS_PER_MM" y1="65" :x2="msrValue * PIXELS_PER_MM" y2="90" stroke="#ef4444" stroke-width="3" />
                     <text :x="msrValue * PIXELS_PER_MM" y="105" fill="#ef4444" font-size="12" font-weight="bold" text-anchor="middle">MSR</text>
                </g>
            </g>

            <!-- Movable Vernier Slider -->
            <g class="movable-slider" :transform="`translate(${50 + sliderX * PIXELS_PER_MM}, 50)`" filter="url(#dropShadow)" style="cursor: grab;">
                <!-- Slider Body -->
                <rect x="-10" y="-10" :width="sliderWidth" height="80" fill="url(#sliderGradient)" stroke="#334155" stroke-width="0.5" rx="4" />
                
                <!-- Locking Screw (Centered) -->
                <g :transform="`translate(${sliderWidth / 2}, -18)`">
                     <rect x="-5" y="-12" width="10" height="12" fill="#e2e8f0" stroke="#475569" />
                     <circle cx="0" cy="-14" r="7" fill="url(#knurling)" stroke="#334155" /> 
                </g>

                <!-- Thumb Rest (Right Aligned) -->
                <rect :x="sliderWidth - 40" y="50" width="30" height="15" fill="url(#knurling)" stroke="#334155" rx="2" />

                <!-- Movable Jaw (Lower/External) -->
                <!-- Shape: Inclined Straight Back Edge (Standard) -->
                <path 
                    d="M0 60 L0 160 L10 160 L40 60 Z" 
                    fill="url(#sliderGradient)" 
                    stroke="#334155" 
                />
                
                <!-- Movable Jaw (Upper/Internal) -->
                <!-- Shape: Inverted Taper (Base at Left, Tip at 0) -->
                <path 
                    d="M0 0 L0 -15 Q0 -50 0 -60 L-12 0 Z" 
                    fill="url(#sliderGradient)" 
                    stroke="#334155" 
                />

                <!-- Vernier Ticks -->
                <!-- Moved UP to y=10 (Global y=60) for perfect alignment with Main Scale -->
                <g transform="translate(0, 10)" filter="url(#engrave)">
                     <g v-for="(tick, i) in vernierTicks" :key="'v'+i">
                        <line 
                            :x1="tick.x" :y1="tick.height * 1.5" 
                            :x2="tick.x" y2="0" 
                            stroke="#0f172a" 
                            stroke-width="1.2"
                        />
                        <!-- Numbers on Upper Side (Near Gap) -->
                        <text 
                            v-if="tick.label !== null" 
                            :x="tick.x" y="12" 
                            text-anchor="middle" 
                            font-size="9" 
                            font-family="Arial, sans-serif"
                            font-weight="bold"
                            fill="#0f172a"
                        >{{ tick.label }}</text>
                    </g>
                    
                    <!-- Coincidence Highlighter (Dynamic Green Line) -->
                    <g v-if="showHighlight || tutorialStep === 4">
                        <line 
                            :x1="highlightX" y1="-10" 
                            :x2="highlightX" y2="40" 
                            stroke="#10b981" 
                            stroke-width="2" 
                            stroke-dasharray="4"
                        />
                        <circle :cx="highlightX" cy="45" r="4" fill="#10b981" />
                    </g>
                </g>
            </g>
            <!-- Fixed Upper Jaw Overlay (To stay visible over slider housing) -->
            <g transform="translate(50, 50)" filter="url(#dropShadow)" style="pointer-events: none;">
                 <path 
                    d="M0 0 L0 -15 Q0 -50 0 -60 L12 0 Z" 
                    fill="url(#mainBodyGradient)" 
                    stroke="#475569" stroke-width="0.5" 
                />
            </g>

             <!-- Spawned Movable Objects -->
            <g v-for="obj in spawnedObjects" :key="obj.id" 
               :transform="`translate(${obj.x}, ${obj.y})`"
               class="movable-object"
               :class="{ active: activeObjectId === obj.id }"
               :data-id="obj.id"
               style="cursor: move;"
            >
                <!-- Shadow -->
                <g filter="url(#dropShadow)">
                    <!-- Sphere -->
                    <circle v-if="obj.type === 'sphere'" :r="obj.radius" :fill="obj.color" stroke="rgba(255,255,255,0.4)" stroke-width="1" />
                    <!-- Cube/Cylinder(Rect) -->
                    <rect v-else-if="obj.type === 'cube' || obj.type === 'cylinder' || obj.type === 'wire'" :width="obj.width" :height="obj.height" :fill="obj.color" stroke="rgba(255,255,255,0.4)" stroke-width="1" rx="2" />
                    
                    <!-- PIPE (Hollow Cylinder) -->
                    <g v-else-if="obj.type === 'pipe'">
                        <!-- Outer Rim -->
                        <path :d="`M0,0 H${obj.width} V${obj.height} H0 Z M${obj.thickness},${obj.thickness} V${obj.height - obj.thickness} H${obj.width - obj.thickness} V${obj.thickness} Z`" fill-rule="evenodd" :fill="obj.color" stroke="rgba(255,255,255,0.4)" stroke-width="0.5" />
                        <!-- Visual cues for hollowness -->
                        <rect :x="obj.thickness" :y="obj.thickness" :width="obj.width - 2*obj.thickness" :height="obj.height - 2*obj.thickness" fill="rgba(0,0,0,0.3)" />
                    </g>
                    
                    <!-- BEAKER (Bucket) -->
                    <g v-else-if="obj.type === 'beaker'">
                         <!-- U-Shape Path -->
                         <path :d="`M0,0 V${obj.height - 5} Q0,${obj.height} 5,${obj.height} H${obj.width - 5} Q${obj.width},${obj.height} ${obj.width},${obj.height - 5} V0`" fill="none" :stroke="obj.color" stroke-width="4" />
                         <!-- Bottom Base (Target for Depth Rod) -->
                         <line :x1="4" :y1="obj.height - 2" :x2="obj.width - 4" :y2="obj.height - 2" stroke="white" stroke-width="2" stroke-dasharray="2" opacity="0.6" />
                    </g>
                </g>
            </g>

            <!-- Main Scale Ticks Overlay (Ensures visibility through/over slider) -->
            <!-- Position: Global (50, 110) to match original (50, 50 + 60) -->
            <g transform="translate(50, 110)" style="pointer-events: none;">
                <g v-for="(tick, i) in mainScaleTicks" :key="'overlay_m'+i">
                    <line 
                        :x1="tick.x" :y1="-tick.height * 1.5" 
                        :x2="tick.x" y2="0" 
                        stroke="#0f172a" 
                        stroke-linecap="round"
                        :stroke-width="tick.stroke"
                    />
                    <!-- Numbers on Bottom Side (Near Gap) -->
                    <text 
                        v-if="tick.label !== null" 
                        :x="tick.x" y="-12" 
                        text-anchor="middle" 
                        font-size="10" 
                        font-family="Arial, sans-serif"
                        fill="#0f172a" 
                        font-weight="600"
                    >{{ tick.label }}</text>
                </g>
            </g>
            </g><!-- End caliper-content -->

            <!-- Magnifier Lens -->
            <g v-if="showMagnifier">
                <defs>
                    <clipPath id="lens-clip">
                        <circle :cx="mouseX" :cy="mouseY" r="75" />
                    </clipPath>
                </defs>
                
                <!-- Lens Container -->
                <g clip-path="url(#lens-clip)">
                    <!-- White Background -->
                    <circle :cx="mouseX" :cy="mouseY" r="80" fill="#fbe7d1" /> <!-- Slight tint for 'glass' feel -->
                    
                    <!-- Zoomed Content -->
                    <g :transform="lensTransform">
                        <use href="#caliper-content" />
                    </g>
                    
                     <!-- Glass Highlight/Gloss -->
                    <circle :cx="mouseX - 20" :cy="mouseY - 20" r="40" fill="white" opacity="0.1" filter="url(#dropShadow)" />

                    <!-- Cross Wires -->
                    <line :x1="mouseX - 75" :y1="mouseY" :x2="mouseX + 75" :y2="mouseY" stroke="rgba(255, 0, 0, 0.5)" stroke-width="1" />
                    <line :x1="mouseX" :y1="mouseY - 75" :x2="mouseX" :y2="mouseY + 75" stroke="rgba(255, 0, 0, 0.5)" stroke-width="1" />
                </g>
                
                <!-- Lens Rim -->
                <circle :cx="mouseX" :cy="mouseY" r="75" fill="none" stroke="#334155" stroke-width="3" filter="url(#dropShadow)" />
                <circle :cx="mouseX" :cy="mouseY" r="72" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2" />
            </g>
            </svg>
            
            <!-- Tutorial Overlay Card -->
            <div v-if="tutorialStep > 0" class="tutorial-card glass-card">
                <h3>{{ tutorialSteps[tutorialStep].title }}</h3>
                <p>{{ tutorialSteps[tutorialStep].text }}</p>
                <div class="tut-actions">
                    <button class="btn-tut" @click="closeTutorial">Skip</button>
                    <button class="btn-tut primary" @click="nextStep">Next →</button>
                </div>
            </div>
        </div>
    </div><!-- End canvas-area -->

    <aside class="controls-panel glass-panel" :class="{ 'collapsed': isPanelCollapsed }">
        <div class="header">
            <div class="mobile-drag-handle"></div>
            <h3>Controls</h3>
        </div>
        
        <div class="scroll-content">
            <!-- Settings -->
            <div class="info-box glass-inset">
                 <h4 style="margin-bottom:0.8rem; color:#94a3b8; font-size:0.85rem; text-transform:uppercase; letter-spacing:1px;">Configuration</h4>
                 
                 <div class="control-group">
                    <div class="label-row">
                        <label>Zero Error</label>
                        <span class="value">{{ zeroError > 0 ? '+' : '' }}{{ zeroError }} mm</span>
                    </div>
                    <div class="slider-container">
                        <input type="range" v-model.number="zeroError" min="-1" max="1" step="0.1">
                        <div class="slider-track" :style="{ width: ((zeroError + 1) / 2) * 100 + '%' }"></div>
                    </div>
                 </div>

                 <div class="control-group">
                    <label>Vernier Divisions (N)</label>
                    <input type="number" v-model.number="divisionCount" min="5" max="100" class="input-modern">
                 </div>

                 <div class="control-group">
                    <label>Coinciding MSD</label>
                    <div style="display:flex; gap:10px; align-items:center;">
                        <input type="number" v-model.number="matchingMSD" class="input-modern" style="width:70px;">
                        <span class="sub-label" style="opacity:0.6; font-size:0.8rem">(Default: {{ divisionCount - 1 }})</span>
                    </div>
                 </div>

                 <div class="control-group" style="flex-direction:row; align-items:center; gap:10px; margin-top:0.5rem;">
                    <input type="checkbox" id="magToggle" v-model="showMagnifier" style="width:16px; height:16px; accent-color:#00d4ff;">
                    <label for="magToggle" style="cursor:pointer; margin:0; color:#cbd5e1;">Show Magnifier</label>
                 </div>
            </div>

                <!-- Movable Objects Section -->
            <div class="info-box glass-inset" style="margin-top:1rem;">
                 <h4 style="margin-bottom:0.8rem; color:#94a3b8; font-size:0.85rem; text-transform:uppercase; letter-spacing:1px;">Movable Objects</h4>
                 
                 <div class="control-group">
                    <label>Select Shape</label>
                    <div style="display:flex; gap:10px;">
                        <select v-model="selectedShape" class="input-modern" style="flex:1;">
                            <option v-for="s in availableShapes" :key="s.value" :value="s.value">{{ s.label }}</option>
                        </select>
                        <button @click="spawnObject" style="background:#00d4ff; color:black; border:none; padding:0 1rem; border-radius:6px; font-weight:bold; cursor:pointer;">Spawn</button>
                    </div>
                 </div>

                 <!-- Size Control (Visible if object exists) -->
                 <div v-if="spawnedObjects.length > 0" class="control-group" style="margin-top:10px;">
                     <label>Size</label>
                     <div class="slider-container">
                        <input type="range" v-model.number="objectSize" min="5" max="60" step="1">
                        <div class="slider-track" :style="{ width: ((objectSize - 5) / 55) * 100 + '%' }"></div>
                    </div>
                 </div>
                 
                 <div v-if="spawnedObjects.length > 0" style="margin-top:0.5rem;">
                     <!-- No Remove Buttons, Single Object Mode -->
                 </div>
            </div>

            <!-- Readings -->
            <div class="info-box glass-inset">
                 <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem;">
                     <h4 style="margin:0; color:#94a3b8; font-size:0.85rem; text-transform:uppercase; letter-spacing:1px;">Readings</h4>
                     <button v-if="showReading" @click="showReading = false" style="background:none; border:none; color:#64748b; cursor:pointer; font-size:0.8rem; display:flex; align-items:center; gap:4px;">
                        <span>Hide</span>
                        <span style="font-size:1.2em">×</span>
                     </button>
                 </div>
                 
                 <div v-if="!showReading" style="text-align:center; padding:1.5rem 0;">
                     <p style="color:#cbd5e1; font-size:0.9rem; margin-bottom:1rem;">Take the reading yourself!</p>
                     <button @click="showReading = true" style="background:#00d4ff; color:black; border:none; padding:0.6rem 1.2rem; border-radius:6px; font-weight:bold; cursor:pointer; box-shadow:0 0 15px rgba(0,212,255,0.3); transition: transform 0.1s;">Check Answer</button>
                 </div>

                 <div v-else class="readings-content">
                     <div class="main-reading" style="text-align:center; padding:0.5rem; margin-bottom:1rem;">
                        <span style="font-size:2.5rem; font-weight:bold; color:#00d4ff; font-family:monospace; text-shadow:0 0 15px rgba(0,212,255,0.3);">{{ totalReading }}</span>
                        <span style="font-size:1rem; color:#64748b; margin-left:5px;">mm</span>
                     </div>
                     
                     <div class="breakdown-grid" style="display:grid; gap:0.5rem; font-size:0.9rem;">
                         <div style="display:flex; justify-content:space-between; border-bottom:1px dashed rgba(255,255,255,0.1); padding-bottom:4px;">
                             <span style="color:#aaa;">LC (1-{{matchingMSD}}/{{divisionCount}})</span>
                             <span style="font-family:monospace; color:#fff;">{{ leastCount.toFixed(3) }}</span>
                         </div>
                         <div style="display:flex; justify-content:space-between;">
                             <span style="color:#aaa;">MSR</span>
                             <span style="font-family:monospace; color:#fff;">{{ msrValue }}</span>
                         </div>
                         <div style="display:flex; justify-content:space-between;">
                             <span style="color:#aaa;">VSR</span>
                             <span style="font-family:monospace; color:#fff;">{{ vsrIndex }} × LC</span>
                         </div>
                     </div>
                     <div class="formula-box" style="margin-top:0.8rem; padding:0.5rem; background:rgba(0,0,0,0.3); border-radius:6px; text-align:center; font-family:monospace; color:#cbd5e1; font-size:0.85rem;">
                        {{ msrValue }} + {{ (vsrIndex * leastCount).toFixed(2) }} = {{ totalReading }}
                     </div>
                 </div>
            </div>
        </div>
    </aside>
  </div>
</template>

<style scoped>
/* Main Container */
.sim-container {
    display: flex;
    flex-direction: row;
    height: 100%;
    width: 100%;
    overflow: hidden;
    background: linear-gradient(135deg, #050505 0%, #0a0a10 100%);
}

/* Canvas Area */
.canvas-area {
    flex: 1;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    background: radial-gradient(circle at center, #151525 0%, #000 100%);
}

.svg-container {
    background: transparent;
    border: none;
    border-radius: 0;
    overflow: hidden;
    backdrop-filter: none;
    box-shadow: none;
    max-width: none;
    width: 100%;
    height: 100%;
}

.vernier-svg {
    user-select: none;
    touch-action: none;
    cursor: default;
}

.vernier-svg.can-pan {
    cursor: grab;
}

.grabbing {
    cursor: grabbing !important;
}

/* Sidebar */
.controls-panel {
    width: 320px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    background: #161a1f;
    backdrop-filter: blur(20px);
    border-left: 1px solid rgba(255, 255, 255, 0.05);
    z-index: 20;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Desktop Collapsed State */
.controls-panel.collapsed {
    width: 0;
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

.toggle-btn {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    border: none;
    background: rgba(255,255,255,0.1);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.toggle-btn:hover {
    background: rgba(255,255,255,0.2);
    transform: scale(1.1);
}

/* Content Scroll */
.scroll-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.scroll-content::-webkit-scrollbar { width: 6px; }
.scroll-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }

/* Info Boxes */
.info-box {
    background: rgba(0,0,0,0.2);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 12px;
    padding: 1rem;
}

.control-group {
    margin-bottom: 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}
.control-group:last-child { margin-bottom: 0; }

.label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.85rem;
    color: #94a3b8;
    margin-bottom: 4px;
}
.value { color: #fff; font-family: monospace; }
.value-badge {
    background: rgba(255,255,255,0.1);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.85rem;
    color: #fff;
}

/* Premium Range Slider */
.slider-container {
    position: relative;
    height: 6px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
    display: flex;
    align-items: center;
}
.slider-track {
    position: absolute; left: 0; top: 0; height: 100%;
    background: linear-gradient(90deg, #00d4ff, #3b82f6);
    border-radius: 3px;
    pointer-events: none;
}
input[type="range"] {
    -webkit-appearance: none; width: 100%; height: 100%;
    background: transparent; position: absolute; left: 0; z-index: 5; margin: 0; cursor: pointer;
}
input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none; width: 16px; height: 16px;
    background: #fff; border: 2px solid #3b82f6; border-radius: 50%;
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
    cursor: grab; transition: transform 0.1s;
}
input[type="range"]::-webkit-slider-thumb:hover { transform: scale(1.2); }

/* Inputs */
.input-modern {
    background: rgba(0,0,0,0.3);
    border: 1px solid rgba(255,255,255,0.1);
    color: white;
    padding: 0.5rem;
    border-radius: 6px;
    width: 100%;
    font-family: inherit;
}
.input-modern:focus { outline: none; border-color: #3b82f6; background: rgba(0,0,0,0.5); }

/* Tutorial Overlay (Preserved) */
.tutorial-card {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(10px);
    padding: 2rem;
    max-width: 400px;
    text-align: center;
    border: 1px solid rgba(0, 212, 255, 0.2);
    box-shadow: 0 0 40px rgba(0, 212, 255, 0.1);
    border-radius: 16px;
    animation: popIn 0.3s ease;
    z-index: 50;
}
@keyframes popIn {
    from { transform: translate(-50%, -40%); opacity: 0; }
    to { transform: translate(-50%, -50%); opacity: 1; }
}
.tutorial-card h3 { color: #facc15; margin-bottom: 1rem; font-size: 1.4rem; }
.tutorial-card p { color: #cbd5e1; margin-bottom: 1.5rem; line-height: 1.6; }
.tut-actions { display: flex; gap: 1rem; justify-content: center; }
.btn-tut {
    padding: 0.5rem 1.5rem; border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.2); background: transparent; color: #fff; cursor: pointer;
}
.btn-tut.primary {
    background: #00d4ff; border: none; color: #000; font-weight: bold;
    box-shadow: 0 0 15px rgba(0, 212, 255, 0.3);
}



.zoom-controls {
    position: absolute;
    bottom: 30px; left: 50%;
    transform: translateX(-50%);
    z-index: 90;
    display: flex;
    gap: 0.5rem;
    padding: 6px;
    border-radius: 12px;
    background: rgba(22, 26, 31, 0.8);
    border: 1px solid rgba(255,255,255,0.1);
    backdrop-filter: blur(10px);
}
.zoom-controls button {
    width: 32px; height: 32px;
    border-radius: 6px;
    border: none;
    background: rgba(255,255,255,0.05);
    color: #cbd5e1;
    font-size: 1.1rem;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
    font-family: inherit;
}
.zoom-controls button:hover {
    background: #00d4ff;
    color: #000;
    box-shadow: 0 0 10px rgba(0, 212, 255, 0.4);
}

/* Mobile Responsive */
@media (max-width: 768px) {
    .sim-container {
        flex-direction: column;
        overflow: hidden;
        height: 100dvh;
    }
    
    .canvas-area {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 100%;
        z-index: 10;
        padding: 1rem;
    }
    
    .controls-panel {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 60%;
        max-height: 80vh;
        z-index: 50;
        border-radius: 20px 20px 0 0;
        transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
        transform: translateY(0);
        background: rgba(10, 10, 15, 0.95);
        border-left: none;
        border-top: 1px solid rgba(255,255,255,0.15);
        box-shadow: 0 -5px 20px rgba(0,0,0,0.5);
    }

    .controls-panel.collapsed {
        transform: translateY(calc(100% - 60px));
    }

    .header {
        cursor: pointer;
        padding: 0.8rem 1.5rem;
        position: relative;
        background: rgba(10, 10, 15, 0.6);
    }
    
    .mobile-drag-handle {
        position: absolute;
        top: 8px;
        left: 50%;
        transform: translateX(-50%);
        width: 40px;
        height: 4px;
        background: rgba(255,255,255,0.2);
        border-radius: 2px;
    }

    .main-actions {
        margin-left: auto;
    }
    
    .scroll-content {
        padding: 1.5rem;
        overflow-y: auto;
        flex: 1;
    }

    .zoom-controls {
        bottom: 20px;
    }
}
</style>
