<script setup>
import { ref, computed, watch } from 'vue'

// ... imports
const m1 = ref(10) // mass in kg
const m2 = ref(10)
const distance = ref(200) // pixels

// Canvas dimensions
const width = 800
const height = 300
const centerY = height / 2

// Limits
const minDistance = 100
const maxDistance = 600

// Real Physics Constants
const G = 6.67430e-11
const PIXELS_TO_METERS = 0.01 // 100px = 1m

// Computed positions
const pos1 = computed(() => (width - distance.value) / 2)
const pos2 = computed(() => (width + distance.value) / 2)

// Real Force Calculation
const forceValue = computed(() => {
    const r = distance.value * PIXELS_TO_METERS
    return (G * m1.value * m2.value) / (r * r)
})

// Arrow length visualization
// We need to map the tiny force to a visible pixel length (0-100px)
// Max force approx 7e-7 N. Scale accordingly.
const arrowLength = computed(() => {
    const maxReferenceForce = 7e-7 // roughly max force in this sim
    const scalingFactor = 100 / maxReferenceForce
    return Math.min(forceValue.value * scalingFactor * 0.5, 120) 
})

// Formatted Display object
const formattedForce = computed(() => {
    const val = forceValue.value
    if (val === 0) return { mantissa: '0', exponent: null }
    
    // Get scientific string
    const str = val.toExponential(2)
    const [mantissa, exponent] = str.split('e')
    
    return { 
        mantissa, 
        exponent: parseInt(exponent) // clean up + sign
    }
})

// ... drag logic remains same ...

// IN TEMPLATE below (I will use replace_file for template part separately or include it effectively if I can map ranges. 
// Ah, replace_file_content works on contiguous block. The template is far away.
// I should split this into two calls or use multi_replace.
// I will just use replace_file for the script first.

const isDragging = ref(null) // 'm1' or 'm2'

const startDrag = (mass, event) => {
    isDragging.value = mass
    window.addEventListener('mousemove', onDrag)
    window.addEventListener('mouseup', stopDrag)
}

const onDrag = (event) => {
    if (!isDragging.value) return 
    
    // Simplistic drag logic: just resizing the distance based on mouse X relative to center
    // We assume the container is centered. For better precision, we'd calculate offset.
    // But since it's symmetric, dragging either mass effectively changes 'distance'.
    
    // Let's get the SVG rect to map coordinates if needed, 
    // but a relative movement delta is easier.
    
    // Actually, simpler: calculate new distance based on mouse X relative to container center.
    // We need a ref to the container.
}

// Improved Drag Logic with container ref
const containerRef = ref(null)

const handleMouseMove = (e) => {
    if (!isDragging.value || !containerRef.value) return
    
    const rect = containerRef.value.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const centerX = rect.width / 2
    
    let newHalfDist = 0
    
    if (isDragging.value === 'm1') {
        // m1 is on the left. MouseX should be < centerX
        // Distance from center
        const distFromCenter = centerX - mouseX
        newHalfDist = distFromCenter
    } else {
        // m2 is on the right
        const distFromCenter = mouseX - centerX
        newHalfDist = distFromCenter
    }
    
    // Update total distance (2 * halfDist)
    let newDist = newHalfDist * 2
    
    // Clamp
    if (newDist < minDistance) newDist = minDistance
    if (newDist > maxDistance) newDist = maxDistance
    
    distance.value = newDist
}

const stopDrag = () => {
    isDragging.value = null
    window.removeEventListener('mousemove', onDrag) // Cleanup logic if we used global listeners
    // Since we put handleMouseMove on the SVG, we might rely on that, but global is better for dragging outside
}

// Global event listeners for smoother dragging
watch(isDragging, (val) => {
    if (val) {
        window.addEventListener('mousemove', handleGlobalMove)
        window.addEventListener('mouseup', stopDrag)
    } else {
        window.removeEventListener('mousemove', handleGlobalMove)
        window.removeEventListener('mouseup', stopDrag)
    }
})

const handleGlobalMove = (e) => {
    handleMouseMove(e) // Reuse the logic
}

</script>

<template>
  <div class="simulation-container glass-panel">
    <div class="controls-header">
        <h3>Interactive Lab</h3>
        <p class="instruction">Drag the masses to change distance. Use sliders to change mass.</p>
    </div>

    <!-- Visualization Area -->
    <div class="canvas-wrapper" ref="containerRef">
        <svg :viewBox="`0 0 ${width} ${height}`" class="interactive-svg">
            <!-- Connecting Line -->
            <line 
                :x1="pos1" :y1="height/2" 
                :x2="pos2" :y2="height/2" 
                stroke="rgba(255,255,255,0.1)" 
                stroke-width="2" 
                stroke-dasharray="5,5"
            />
            
            <!-- Distance Label -->
            <text :x="width/2" :y="height/2 - 20" fill="#94a3b8" text-anchor="middle" font-size="14">
                r = {{ (distance * 0.01).toFixed(2) }} m
            </text>

            <!-- Force Arrows -->
            <!-- Force on M1 (towards M2) -->
            <g :transform="`translate(${pos1 + 40}, ${height/2})`">
                <line x1="0" y1="0" :x2="arrowLength" y2="0" stroke="#f472b6" stroke-width="4" marker-end="url(#arrowhead)" />
                <text :x="0" y="-15" fill="#f472b6" font-size="12" font-weight="bold">F</text>
            </g>

            <!-- Force on M2 (towards M1) -->
            <g :transform="`translate(${pos2 - 40}, ${height/2}) rotate(180)`">
                <line x1="0" y1="0" :x2="arrowLength" y2="0" stroke="#f472b6" stroke-width="4" marker-end="url(#arrowhead)" />
            </g>
            <text :x="pos2 - 50" :y="height/2 - 15" fill="#f472b6" font-size="12" font-weight="bold" text-anchor="end">F</text>

            <!-- Definitions -->
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#f472b6" />
                </marker>
            </defs>

            <!-- Mass 1 -->
            <g class="mass-group" 
               :transform="`translate(${pos1}, ${height/2})`"
               @mousedown="startDrag('m1', $event)"
               :class="{ dragging: isDragging === 'm1' }"
            >
                <circle r="30" fill="url(#grad1)" stroke="#60a5fa" stroke-width="2" />
                <text y="5" text-anchor="middle" fill="white" font-weight="bold">m₁</text>
                <!-- Selection Glow -->
                <circle r="40" fill="rgba(96, 165, 250, 0.2)" class="hover-glow" />
            </g>

            <!-- Mass 2 -->
            <g class="mass-group" 
               :transform="`translate(${pos2}, ${height/2})`"
               @mousedown="startDrag('m2', $event)"
               :class="{ dragging: isDragging === 'm2' }"
            >
                <circle r="30" fill="url(#grad2)" stroke="#34d399" stroke-width="2" />
                <text y="5" text-anchor="middle" fill="white" font-weight="bold">m₂</text>
                 <circle r="40" fill="rgba(52, 211, 153, 0.2)" class="hover-glow" />
            </g>

            <!-- Gradients -->
            <defs>
                <radialGradient id="grad1" cx="30%" cy="30%">
                    <stop offset="0%" stop-color="#93c5fd" />
                    <stop offset="100%" stop-color="#2563eb" />
                </radialGradient>
                <radialGradient id="grad2" cx="30%" cy="30%">
                    <stop offset="0%" stop-color="#6ee7b7" />
                    <stop offset="100%" stop-color="#059669" />
                </radialGradient>
            </defs>
        </svg>
    </div>

    <!-- Controls -->
    <div class="controls-panel">
        <div class="control-group">
            <div class="label-row">
                <label>Mass 1 (kg)</label>
                <input type="number" v-model.number="m1" min="1" max="100" class="num-input" />
            </div>
            <input type="range" v-model.number="m1" min="1" max="100" class="slider slider-blue" />
        </div>
        
        <div class="data-display">
            <div class="value-box">
                <span class="label">Gravitational Force</span>
                <span class="value">
                    {{ formattedForce.mantissa }}
                    <span v-if="formattedForce.exponent" class="scientific">
                        × 10<sup>{{ formattedForce.exponent }}</sup>
                    </span> 
                    <small>N</small>
                </span>
                <span class="label-tiny">Assuming G = 6.67 × 10⁻¹¹</span>
            </div>
        </div>

        <div class="control-group">
             <div class="label-row">
                <label>Mass 2 (kg)</label>
                <input type="number" v-model.number="m2" min="1" max="100" class="num-input" />
            </div>
            <input type="range" v-model.number="m2" min="1" max="100" class="slider slider-green" />
        </div>
    </div>
  </div>
</template>

<style scoped>
.simulation-container {
    padding: 0 !important; /* Override default glass-panel padding for internal layout */
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.controls-header {
    padding: 1.5rem;
    border-bottom: 1px solid rgba(255,255,255,0.1);
}

.controls-header h3 {
    margin: 0;
    font-size: 1.25rem;
    color: white;
}

.instruction {
    margin: 0.5rem 0 0;
    color: #94a3b8;
    font-size: 0.9rem;
}

.canvas-wrapper {
    background: rgba(0,0,0,0.2);
    width: 100%;
    height: 300px;
    cursor: default;
    position: relative;
}

.interactive-svg {
    width: 100%;
    height: 100%;
    user-select: none;
}

.mass-group {
    cursor: grab;
    transition: transform 0.1s ease-out; /* Smooth movement when not dragging */
}

.mass-group.dragging {
    cursor: grabbing;
    transition: none; /* Instant movement when dragging */
}

.hover-glow {
    opacity: 0;
    transition: opacity 0.2s;
}

.mass-group:hover .hover-glow,
.mass-group.dragging .hover-glow {
    opacity: 1;
}

.controls-panel {
    padding: 2rem;
    background: rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2rem;
    flex-wrap: wrap;
}

.control-group {
    flex: 1;
    min-width: 200px;
}

.control-group label {
    display: block;
    margin-bottom: 0.5rem;
    color: #e2e8f0;
    font-weight: 500;
}

.slider {
    width: 100%;
    height: 6px;
    background: rgba(255,255,255,0.1);
    border-radius: 3px;
    outline: none;
    -webkit-appearance: none;
}

.slider-blue::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    background: #60a5fa;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 10px rgba(96, 165, 250, 0.5);
}

.slider-green::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    background: #34d399;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 10px rgba(52, 211, 153, 0.5);
}

.data-display {
    text-align: center;
}

.value-box {
    background: rgba(255,255,255,0.05);
    padding: 1rem 2rem;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.1);
}

.value-box .label {
    display: block;
    font-size: 0.8rem;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 0.2rem;
}

.value-box .value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #f472b6;
    font-family: 'Courier New', monospace;
}
/* ... existing styles ... */
.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.num-input {
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.1);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  width: 60px;
  text-align: right;
  font-family: monospace;
}

.num-input:focus {
  outline: none;
  border-color: #60a5fa;
}

/* ... existing styles ... */
.label-tiny {
    display: block;
    font-size: 0.7rem;
    color: #64748b;
    margin-top: 0.2rem;
}

.scientific {
    font-size: 0.9em;
    margin-left: 2px;
}

.scientific sup {
    font-size: 0.7em;
}
</style>
