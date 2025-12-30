<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'

const props = defineProps({
  topicId: String
})

const canvasRef = ref(null)
const width = ref(800)
const height = ref(600)

// State
const charges = ref([]) // { x, y, q, fixed: boolean }
const isDragging = ref(false)
const draggedIndex = ref(null)
const showValues = ref(false)
const showGrid = ref(false)
const message = ref('') // Feedback message

// Physics Constants
const k = 9000 
const gridSpacing = 50 // 1 unit visually

// --- Interaction Logic ---
const getMousePos = (e) => {
    const rect = canvasRef.value.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    }
}

const handleStart = (e) => {
    const { x, y } = getMousePos(e)
    charges.value.forEach((c, i) => {
        if (c.fixed) return // Cannot move fixed charges in challenges
        const dx = x - c.x
        const dy = y - c.y
        if (dx*dx + dy*dy < 900) { 
            isDragging.value = true
            draggedIndex.value = i
        }
    })
}

const handleMove = (e) => {
    if (!isDragging.value) return
    const { x, y } = getMousePos(e)
    if (draggedIndex.value !== null) {
        charges.value[draggedIndex.value].x = x
        charges.value[draggedIndex.value].y = y
        checkChallenge()
    }
}

const handleEnd = () => {
    isDragging.value = false
    draggedIndex.value = null
}

const addCharge = (type) => {
    charges.value.push({
        x: width.value / 2 + (Math.random() - 0.5) * 100,
        y: height.value / 2 + (Math.random() - 0.5) * 100,
        q: type === 'positive' ? 1 : -1,
        fixed: false
    })
}

// --- Physics Rendering ---
const calculateField = (x, y, excludeIndex = -1) => {
    let Ex = 0, Ey = 0
    charges.value.forEach((c, i) => {
        if (i === excludeIndex) return
        const dx = x - c.x
        const dy = y - c.y
        const r2 = dx*dx + dy*dy
        const r = Math.sqrt(r2)
        if (r < 10) return
        
        const E = (k * c.q) / r2
        Ex += E * (dx / r)
        Ey += E * (dy / r)
    })
    return { Ex, Ey }
}

const draw = () => {
    const ctx = canvasRef.value?.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, width.value, height.value)
    
    // Draw Grid (if enabled)
    if (showGrid.value || props.topicId === 'coulomb') { // Auto-show grid for challenges
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.lineWidth = 1
        ctx.beginPath()
        for (let x = 0; x <= width.value; x += gridSpacing) {
            ctx.moveTo(x, 0); ctx.lineTo(x, height.value)
            // Ruler numbers
            if(x % 100 === 0) {
                 ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillText((x/gridSpacing).toFixed(0), x+2, 10)
            }
        }
        for (let y = 0; y <= height.value; y += gridSpacing) {
            ctx.moveTo(0, y); ctx.lineTo(width.value, y)
        }
        ctx.stroke()
    }
    
    // Vector Field (Disabled in simple null point mode to reduce noise? No, keep it)
    for (let x = 0; x <= width.value; x += 40) {
        for (let y = 0; y <= height.value; y += 40) {
            const { Ex, Ey } = calculateField(x, y)
            const E = Math.sqrt(Ex*Ex + Ey*Ey)
            if (E < 0.1) continue 
            
            const maxLen = 30
            const len = Math.min(E * 10, maxLen)
            const angle = Math.atan2(Ey, Ex)
            
            ctx.save()
            ctx.translate(x, y)
            ctx.rotate(angle)
            ctx.beginPath()
            ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(E/2, 0.3)})`
            ctx.moveTo(-len/2, 0); ctx.lineTo(len/2, 0)
            ctx.stroke()
            ctx.restore()
        }
    }
    
    // Charges
    charges.value.forEach((c, i) => {
        ctx.beginPath()
        ctx.arc(c.x, c.y, 18, 0, Math.PI * 2)
        ctx.fillStyle = c.q > 0 ? '#ff0055' : '#00d4ff'
        if (c.fixed) ctx.strokeStyle = 'white'; ctx.lineWidth = 3; ctx.stroke();
        
        ctx.fill()
        
        ctx.fillStyle = 'white'
        ctx.font = 'bold 16px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(c.q > 0 ? `+${Math.abs(c.q)}` : `${c.q}`, c.x, c.y)

        // Show Value Label
        if (showValues.value) {
            const { Ex, Ey } = calculateField(c.x, c.y, i)
            const F = Math.sqrt(Ex*Ex + Ey*Ey) * Math.abs(c.q)
            ctx.fillStyle = '#fff'
            ctx.font = '12px monospace'
            ctx.fillText(`F=${F.toFixed(1)}`, c.x, c.y - 25)
        }
    })
}

// Challenge Logic
const checkChallenge = () => {
    message.value = ''
    if (props.topicId === 'coulomb') {
        // Null Point: User moves the 3rd charge (index 2) usually
        // But for "Null Point" we just need E=0 at test charge location
        const testCharge = charges.value.find(c => !c.fixed)
        if (!testCharge) return

        const { Ex, Ey } = calculateField(testCharge.x, testCharge.y, charges.value.indexOf(testCharge))
        const E = Math.sqrt(Ex*Ex + Ey*Ey)
        
        if (E < 0.5) {
            message.value = "✅ Exact Null Point Found! E ≈ 0"
        } else if (E < 5) {
             message.value = "⚠️ Close! Move slightly to minimize Field."
        }
    }
}

// Animation
let frameId
const animate = () => {
    draw()
    frameId = requestAnimationFrame(animate)
}

// Preset Logic
const applyPreset = () => {
    charges.value = []
    message.value = ''
    width.value = window.innerWidth
    height.value = window.innerHeight

    if (props.topicId === 'coulomb') {
        // Null Point Challenge Setup
        // +1Q and +4Q separated by distance
        const cx = width.value / 2
        const cy = height.value / 2
        
        charges.value = [
            { x: cx - 200, y: cy, q: 1, fixed: true },
            { x: cx + 200, y: cy, q: 4, fixed: true },
            { x: cx, y: cy, q: 1, fixed: false } // Test Charge
        ]
        message.value = "Challenge: Find the Null Point (E=0) for +1Q and +4Q."
        showValues.value = true
        showGrid.value = true
        
    } else if (props.topicId === 'superposition') {
        // Triangle
        charges.value = [
            { x: width.value/2, y: height.value/2 - 100, q: 1, fixed: true },
            { x: width.value/2 - 86, y: height.value/2 + 50, q: 1, fixed: true },
            { x: width.value/2 + 86, y: height.value/2 + 50, q: 1, fixed: true }
        ]
        showValues.value = true
    } else {
        // Default Exploration
        charges.value = [{ x: width.value/2, y: height.value/2, q: 1, fixed: false }]
    }
}

watch(() => props.topicId, applyPreset)

onMounted(() => {
    // init
    window.addEventListener('resize', applyPreset)
    applyPreset()
    animate()
})

onUnmounted(() => {
    window.removeEventListener('resize', applyPreset)
    cancelAnimationFrame(frameId)
})
</script>

<template>
    <div class="lab-container">
        <canvas 
            ref="canvasRef" 
            :width="width" 
            :height="height" 
            class="lab-canvas"
            @mousedown="handleStart"
            @mousemove="handleMove"
            @mouseup="handleEnd"
            @touchstart.prevent="handleStart"
            @touchmove.prevent="handleMove"
            @touchend="handleEnd"
        ></canvas>

        <div class="lab-info" v-if="topicId === 'coulomb'">
            <h2>Null Point Challenge</h2>
            <p>
                Two charges (+1, +4) are fixed. 
                <br>Drag the free charge to where the Net Force is zero.
                <br><strong>Hint:</strong> For like charges, the null point is between them, closer to the smaller charge.
            </p>
            <div class="feedback" v-if="message">{{ message }}</div>
        </div>
        
        <div class="lab-info" v-else>
            <h2 v-if="topicId === 'superposition'">Superposition Principle</h2>
            <h2 v-else>Electric Forces</h2>
            <p>Drag charges to explore. Use the grid to measure distances.</p>
        </div>

        <div class="controls glass-panel">
            <div class="toggles">
                <label><input type="checkbox" v-model="showGrid"> Show Grid</label>
                <label><input type="checkbox" v-model="showValues"> Show Values</label>
            </div>
            
            <div class="buttons" v-if="topicId !== 'coulomb'">
                <button class="btn-charge pos" @click="addCharge('positive')">+q</button>
                <button class="btn-charge neg" @click="addCharge('negative')">-q</button>
                <button class="btn-clear" @click="charges = []">Clear</button>
            </div>
            <div class="buttons" v-else>
                 <button class="btn-clear" @click="applyPreset">Reset Challenge</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.lab-container {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
}
.lab-canvas {
    display: block;
    cursor: grab;
}
.lab-canvas:active { cursor: grabbing; }

.lab-info {
    position: absolute;
    top: 6rem;
    right: 2rem;
    width: 320px;
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(10px);
    padding: 1.5rem;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.1);
    color: white;
    pointer-events: none;
    user-select: none;
}
.lab-info h2 { margin-bottom: 0.5rem; color: #00d4ff; }
.lab-info p { font-size: 0.95rem; line-height: 1.6; color: #94a3b8; }
.feedback {
    margin-top: 1rem;
    padding: 0.8rem;
    background: rgba(0, 255, 157, 0.1);
    border-left: 4px solid #00ff9d;
    color: #00ff9d;
    font-weight: bold;
}

.glass-panel {
    position: absolute;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(12px);
    padding: 1rem 1.5rem;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
}

.toggles {
    display: flex; gap: 1.5rem;
    color: #cbd5e1; font-size: 0.9rem;
}
.toggles label { cursor: pointer; display: flex; align-items: center; gap: 0.5rem; }

.buttons { display: flex; gap: 1rem; }

.btn-charge {
    width: 44px; height: 44px;
    border-radius: 50%; border: none;
    color: white; font-weight: bold; cursor: pointer;
    transition: transform 0.2s;
}
.btn-charge:hover { transform: scale(1.1); }
.pos { background: #ff0055; box-shadow: 0 0 10px #ff0055; }
.neg { background: #00d4ff; box-shadow: 0 0 10px #00d4ff; }

.btn-clear {
    padding: 0.6rem 1.2rem;
    border-radius: 20px;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    color: white; cursor: pointer;
}
.btn-clear:hover { background: rgba(255,255,255,0.2); }
</style>
