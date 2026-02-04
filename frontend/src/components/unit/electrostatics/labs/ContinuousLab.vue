<script setup>
import { ref, onMounted, computed, watch } from 'vue'

const props = defineProps({
    controlsOnly: {
        type: Boolean,
        default: false
    }
})

const shape = ref('line') // line | ring
const testCharge = ref({ x: 0, y: -150 })
const vector = ref({ x: 0, y: 0, mag: 0 })

const width = ref(800)
const height = ref(600)
const center = computed(() => ({ x: width.value/2, y: height.value/2 }))

// Generate segments
const segments = computed(() => {
    const segs = []
    const cx = center.value.x
    const cy = center.value.y
    const num = 50
    const size = 200 // length or radius
    
    if (shape.value === 'line') {
        const startX = cx - size/2
        const dx = size / num
        for(let i=0; i<num; i++) {
            segs.push({ x: startX + i*dx, y: cy, q: 1 })
        }
    } else {
        const dTheta = (Math.PI*2)/num
        for(let i=0; i<num; i++) {
            const angle = i * dTheta
            segs.push({
                x: cx + Math.cos(angle)*100,
                y: cy + Math.sin(angle)*100,
                q: 1
            })
        }
    }
    return segs
})

const calculateVector = () => {
    // Sum Ex, Ey from all segments
    let Ex = 0, Ey = 0
    const k = 5000 
    
    // Position relative to center for calculation simplicity?
    // Let's use absolute screen coords
    const tx = center.value.x + testCharge.value.x
    const ty = center.value.y + testCharge.value.y
    
    segments.value.forEach(s => {
        const dx = tx - s.x
        const dy = ty - s.y
        const r2 = dx*dx + dy*dy
        const r = Math.sqrt(r2)
        if (r < 10) return
        
        const dE = (k * s.q) / r2 // dE = k dq / r^2
        Ex += dE * (dx/r)
        Ey += dE * (dy/r)
    })
    
    const mag = Math.sqrt(Ex*Ex + Ey*Ey)
    vector.value = { x: Ex, y: Ey, mag }
}

// Interaction
const isDragging = ref(false)

const handleMove = (e) => {
    if (!isDragging.value) return
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    // Test charge relative to center
    testCharge.value.x = clientX - center.value.x
    testCharge.value.y = clientY - center.value.y
    calculateVector()
}

onMounted(() => {
    width.value = window.innerWidth
    height.value = window.innerHeight
    calculateVector()
})

watch(shape, calculateVector)

</script>

<template>
    <!-- Controls Only Mode (for sidebar) -->
    <div v-if="controlsOnly" class="sidebar-controls">
        <div class="control-label">Shape:</div>
        <div class="toggles-vertical">
            <button :class="{ active: shape === 'line' }" @click="shape = 'line'">Line Charge (λ)</button>
            <button :class="{ active: shape === 'ring' }" @click="shape = 'ring'">Ring Charge (λ)</button>
        </div>
    </div>

    <!-- Full Lab View -->
    <div v-else
        class="continuous-lab"
        @mousemove="handleMove"
        @touchmove="handleMove"
        @mouseup="isDragging = false"
        @touchend="isDragging = false"
    >
        <div class="info-panel">
            <h2>Continuous Charge Distribution</h2>
            <div class="toggles">
                <button :class="{ active: shape === 'line' }" @click="shape = 'line'">Line Charge (λ)</button>
                <button :class="{ active: shape === 'ring' }" @click="shape = 'ring'">Ring Charge (λ)</button>
            </div>
            <p>
                Calculated by integrating E = ∫ dE = ∫ k dq / r²
            </p>
        </div>
        
        <!-- Shape Visualization -->
        <svg class="viz-svg">
            <template v-if="shape === 'line'">
                <line 
                    :x1="center.x - 100" :y1="center.y" 
                    :x2="center.x + 100" :y2="center.y" 
                    stroke="#ff0055" stroke-width="8" stroke-linecap="round" 
                />
                <text :x="center.x" :y="center.y + 30" fill="white" text-anchor="middle">++++++++++++++++</text>
            </template>
            <template v-else>
                <circle 
                    :cx="center.x" :cy="center.y" r="100" 
                    stroke="#ff0055" stroke-width="6" fill="transparent" 
                />
            </template>
            
            <!-- Test Charge -->
            <g class="test-charge" 
               :transform="`translate(${center.x + testCharge.x}, ${center.y + testCharge.y})`"
               @mousedown="isDragging = true"
               @touchstart="isDragging = true"
            >
                <circle r="10" fill="#00d4ff" stroke="white" stroke-width="2" />
                <text x="15" y="5" fill="#00d4ff" font-size="14">q0</text>
                
                <!-- Vector Arrow -->
                <line 
                    x1="0" y1="0" 
                    :x2="vector.x * 3" :y2="vector.y * 3"
                    stroke="#00d4ff" stroke-width="4" marker-end="url(#arrow)"
                />
            </g>
            
            <defs>
                <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L9,3 z" fill="#00d4ff" />
                </marker>
            </defs>
        </svg>

        <p class="hint">Drag the blue test charge (q0) to measure the field.</p>
    </div>
</template>

<style scoped>
.continuous-lab {
    width: 100%; height: 100%;
    overflow: hidden;
    position: relative;
    user-select: none;
}
.viz-svg {
    width: 100%; height: 100%;
}
.test-charge { cursor: grab; }
.test-charge:active { cursor: grabbing; }

.info-panel {
    position: absolute;
    top: 1rem; right: 2rem;
    width: 320px;
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(10px);
    padding: 1.5rem;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.1);
    color: white;
}
.toggles { display: flex; gap: 10px; margin: 10px 0; }
.toggles button {
    flex: 1; padding: 8px; border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.2);
    background: transparent; color: #94a3b8;
    cursor: pointer;
}
.toggles button.active {
    background: #ff0055; color: white; border-color: #ff0055;
    box-shadow: 0 0 10px #ff0055;
}

/* Sidebar Controls Styling */
.sidebar-controls {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
}

.control-label {
    font-size: 0.9rem;
    color: var(--text-secondary);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.toggles-vertical {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
}

.toggles-vertical button {
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.2);
    background: transparent;
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.3s;
}

.toggles-vertical button.active {
    background: #ff0055;
    color: white;
    border-color: #ff0055;
    box-shadow: 0 0 10px #ff0055;
}

.hint {
    position: absolute;
    bottom: 5rem; left: 50%;
    transform: translateX(-50%);
    color: rgba(255,255,255,0.6);
}
</style>
