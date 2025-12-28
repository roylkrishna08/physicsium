<script setup>
import { ref, computed, inject, watch } from 'vue'

const isRightSidebarCollapsed = inject('isRightSidebarCollapsed')

// --- Game Logic ---
// We have a collection of "Mixed Components": Resistor, Capacitor, Diode, LED.
// User must test them with Multimeter and drag them to correct bin.

const components = ref([
    { id: 1, type: 'resistor', x: 100, y: 100, label: '?', identified: false, colorCode: ['#a52a2a', '#000', '#f00', '#d4af37'] }, // 1k
    { id: 2, type: 'diode', x: 200, y: 150, label: '?', identified: false },
    { id: 3, type: 'led', x: 150, y: 250, label: '?', identified: false, color: '#f00' },
    { id: 4, type: 'capacitor', x: 300, y: 100, label: '?', identified: false },
    
    // Maybe duplicate types for challenge
    { id: 5, type: 'diode', x: 400, y: 200, label: '?', identified: false },
])

const correctIdentified = computed(() => components.value.filter(c => c.identified).length)
const totalComponents = computed(() => components.value.length)

// Multimeter State
const probePos = ref({ red: {x: 600, y: 400}, black: {x: 550, y: 400} })
const selectedProbe = ref(null) // 'red' or 'black'

// State of testing
const currentReadout = ref('OL') // Open Loop default

// Probing Logic
// Are probes checking a component?
// Check distance of probes to component terminals.
// Simplified: If both probes are close to component center -> Show component property.
// More Real: Check connection to specific types.

const draggingId = ref(null) // Component ID or Probe name

const startDrag = (id, type, e) => {
    draggingId.value = { id, type } // type: 'comp' or 'probe'
}

const onDrag = (e) => {
    if (!draggingId.value) return
    const rect = e.target.closest('.canvas-area').getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    if (draggingId.value.type === 'probe') {
        probePos.value[draggingId.value.id] = { x, y }
        checkProbes()
    } else if (draggingId.value.type === 'comp') {
        const comp = components.value.find(c => c.id === draggingId.value.id)
        if (comp && !comp.identified) { // Only move if not yet binned? Or allow moving anytime.
            comp.x = x
            comp.y = y
        }
    }
}

const stopDrag = () => { 
    // If component dragged, check if dropped in a Bin
    if (draggingId.value && draggingId.value.type === 'comp') {
        const comp = components.value.find(c => c.id === draggingId.value.id)
        checkBinDrop(comp)
    }
    draggingId.value = null 
}

// Check Probes
const checkProbes = () => {
    // Find component under red probe AND black probe
    const threshold = 40
    let redTarget = null
    let blackTarget = null
    
    components.value.forEach(c => {
        // Assume component center is target for now (simplified)
        // Or terminals: Left (x-30), Right (x+30)
        // Let's say any distance < 40 to center counts as touching 'a' terminal
        const distRed = Math.hypot(probePos.value.red.x - c.x, probePos.value.red.y - c.y)
        const distBlack = Math.hypot(probePos.value.black.x - c.x, probePos.value.black.y - c.y)
        
        if (distRed < threshold) redTarget = c
        if (distBlack < threshold) blackTarget = c
    })
    
    if (redTarget && blackTarget && redTarget.id === blackTarget.id) {
        // Probing same component
        measure(redTarget)
    } else {
        currentReadout.value = 'OL'
    }
}

const measure = (comp) => {
    // What mode is multimeter in? Assume Auto / Smart
    // Resistor: Value
    // Diode: Forward Voltage (if Red->Anode, Black->Cathode)
    // Capacitor: Capacitance (or resistance rises to infinity)
    // LED: Lights up + Voltage
    
    // Polarity? Simplified: Just show typical response.
    
    if (comp.type === 'resistor') {
        currentReadout.value = '1.00 kΩ'
    } else if (comp.type === 'diode') {
        // Need polarity check for fun? Assume correct bias for now.
        currentReadout.value = '0.65 V' // Diode drop
    } else if (comp.type === 'led') {
        currentReadout.value = '1.80 V' // LED drop
        // Visual cue: LED glows?
    } else if (comp.type === 'capacitor') {
        currentReadout.value = 'Charging...' // Then OL
        setTimeout(() => { if (currentReadout.value === 'Charging...') currentReadout.value = 'OL' }, 1000)
    }
}

// Bin Logic
const bins = [
    { type: 'diode', label: 'Diodes', x: 100, y: 500, w: 100, h: 80, color: '#334' },
    { type: 'led', label: 'LEDs', x: 250, y: 500, w: 100, h: 80, color: '#334' },
    { type: 'resistor', label: 'Resistors', x: 400, y: 500, w: 100, h: 80, color: '#334' },
    { type: 'capacitor', label: 'Capacitors', x: 550, y: 500, w: 100, h: 80, color: '#334' },
]

const checkBinDrop = (comp) => {
    // Check intersection with bins
    const margin = 20
    for (let bin of bins) {
        if (comp.x > bin.x && comp.x < bin.x + bin.w && comp.y > bin.y && comp.y < bin.y + bin.h) {
            if (comp.type === bin.type) {
                // Correct!
                comp.identified = true
                comp.label = '✓'
                // Lock component in bin visually
                // comp.x = bin.x + bin.w/2
                // comp.y = bin.y + bin.h/2
            } else {
                // Incorrect
                // Maybe shake effect?
            }
        }
    }
}

const reset = () => {
    // Reset positions
    components.value.forEach((c, i) => {
        c.x = 100 + (i%3)*100
        c.y = 100 + Math.floor(i/3)*100
        c.identified = false
        c.label = '?'
    })
    probePos.value = { red: {x: 600, y: 400}, black: {x: 550, y: 400} }
    currentReadout.value = 'OL'
}

</script>

<template>
  <div class="sim-container" @mousemove="onDrag" @mouseup="stopDrag">
    <div class="canvas-area">
        <svg class="main-svg" viewBox="0 0 800 600">
             <!-- Mat -->
             <rect x="50" y="50" width="700" height="400" fill="#222" rx="10" />
             <text x="400" y="80" fill="#444" text-anchor="middle" font-weight="bold" font-size="20">WORKBENCH</text>
             
             <!-- Bins -->
             <g v-for="bin in bins" :key="bin.type">
                 <rect :x="bin.x" :y="bin.y" :width="bin.w" :height="bin.h" :fill="bin.color" stroke="#666" rx="5" />
                 <text :x="bin.x + bin.w/2" :y="bin.y + bin.h/2 + 5" fill="#aaa" text-anchor="middle" font-weight="bold">{{ bin.label }}</text>
             </g>
             
             <!-- Components -->
             <g v-for="comp in components" :key="comp.id" 
                :transform="`translate(${comp.x}, ${comp.y})`"
                @mousedown="startDrag(comp.id, 'comp', $event)" 
                style="cursor: grab"
                :opacity="comp.identified ? 0.5 : 1"
             >
                 <!-- Visuals based on type -->
                 <g v-if="comp.type === 'resistor'">
                     <line x1="-30" y1="0" x2="30" y2="0" stroke="#ccc" stroke-width="2" />
                     <rect x="-15" y="-6" width="30" height="12" fill="#d2b48c" rx="2" />
                     <!-- Bands -->
                     <rect x="-10" y="-6" width="3" height="12" :fill="comp.colorCode[0]" />
                     <rect x="-4" y="-6" width="3" height="12" :fill="comp.colorCode[1]" />
                     <rect x="2" y="-6" width="3" height="12" :fill="comp.colorCode[2]" />
                     <rect x="8" y="-6" width="3" height="12" :fill="comp.colorCode[3]" />
                 </g>
                 
                 <g v-else-if="comp.type === 'diode'">
                     <line x1="-30" y1="0" x2="30" y2="0" stroke="#ccc" stroke-width="2" />
                     <rect x="-10" y="-10" width="20" height="20" fill="#111" />
                     <rect x="5" y="-10" width="5" height="20" fill="#ccc" /> <!-- Cathode band -->
                 </g>
                 
                 <g v-else-if="comp.type === 'led'">
                     <!-- Leads -->
                     <line x1="-5" y1="10" x2="-5" y2="25" stroke="#ccc" stroke-width="2" />
                     <line x1="5" y1="10" x2="5" y2="25" stroke="#ccc" stroke-width="2" />
                     <!-- Dome -->
                     <path d="M -10 10 A 10 10 0 1 1 10 10 L 10 10 L -10 10" :fill="comp.color" stroke="#fff" stroke-width="1" />
                     <circle v-if="currentReadout === '1.80 V' && comp === components.find(c => c.id === draggingId?.id || (Math.hypot(probePos.red.x - comp.x, probePos.red.y - comp.y) < 40))" cx="0" cy="0" r="15" :fill="comp.color" filter="blur(5px)" opacity="0.8" />
                 </g>
                 
                 <g v-else-if="comp.type === 'capacitor'">
                     <line x1="-5" y1="10" x2="-5" y2="25" stroke="#ccc" stroke-width="2" />
                     <line x1="5" y1="10" x2="5" y2="25" stroke="#ccc" stroke-width="2" />
                     <circle cx="0" cy="0" r="12" fill="#223" stroke="#888" />
                     <text x="0" y="4" fill="#fff" font-size="8" text-anchor="middle">µF</text>
                 </g>
                 
                 <!-- Label if identified -->
                 <text v-if="comp.identified" x="0" y="-20" fill="#0f0" text-anchor="middle" font-weight="bold">✓</text>
             </g>
             
             <!-- Multimeter -->
             <g transform="translate(680, 150)">
                 <rect x="-60" y="-100" width="120" height="200" fill="#f0c000" rx="10" stroke="#333" stroke-width="5" />
                 <!-- Screen -->
                 <rect x="-50" y="-90" width="100" height="60" fill="#9ca" stroke="#666" />
                 <text x="40" y="-50" text-anchor="end" font-family="monospace" font-size="24" fill="#000">{{ currentReadout }}</text>
                 <!-- Dial -->
                 <circle cx="0" cy="20" r="40" fill="#222" />
                 <line x1="0" y1="20" x2="0" y2="-10" stroke="#fff" stroke-width="3" />
             </g>
             
             <!-- Probes -->
             <!-- Red -->
             <g :transform="`translate(${probePos.red.x}, ${probePos.red.y})`"
                @mousedown="startDrag('red', 'probe', $event)"
                style="cursor: cell"
             >
                 <polygon points="0,0 -5,-40 5,-40" fill="#f00" />
                 <line x1="0" y1="-40" x2="80" y2="-250" stroke="#d00" stroke-width="3" /> <!-- Wire to meter (approx curve) -->
                 <text x="10" y="-40" fill="#f00" font-weight="bold">Red (+)</text>
             </g>
             
             <!-- Black -->
             <g :transform="`translate(${probePos.black.x}, ${probePos.black.y})`"
                @mousedown="startDrag('black', 'probe', $event)"
                style="cursor: cell"
             >
                 <polygon points="0,0 -5,-40 5,-40" fill="#222" />
                 <line x1="0" y1="-40" x2="130" y2="-250" stroke="#111" stroke-width="3" /> <!-- Wire to meter -->
                 <text x="10" y="-40" fill="#aaa" font-weight="bold">Black (-)</text>
             </g>

        </svg>
    </div>

    <!-- Controls Panel -->
    <aside class="controls-panel glass-panel" :class="{ 'collapsed': isRightSidebarCollapsed }">
        <div class="header">
            <h3>Identity Lab</h3>
            <button class="tool-btn" @click="reset">↻</button>
        </div>
        
        <div class="control-group">
            <p style="color:#aaa; font-size:0.9rem;">
                Use the multimeter probes to test components. 
                Move components to the correct bins.
            </p>
        </div>
        
        <div class="control-group highlight">
             <label>Progress</label>
             <div class="data-row">
                 <span>Identified:</span>
                 <span class="val">{{ correctIdentified }} / {{ totalComponents }}</span>
             </div>
             <div class="progress-bar">
                 <div class="fill" :style="{ width: (correctIdentified / totalComponents * 100) + '%' }"></div>
             </div>
        </div>
        
         <div class="control-group">
             <label>Multimeter Guide</label>
             <ul style="color:#aaa; font-size:0.8rem; padding-left:20px; line-height:1.5;">
                 <li><strong>Resistors</strong>: Show specific resistance (Ω)</li>
                 <li><strong>Diodes</strong>: Show voltage drop (~0.7V)</li>
                 <li><strong>LEDs</strong>: Show voltage & Light up</li>
                 <li><strong>Capacitors</strong>: Charge briefly then Open Loop (OL)</li>
             </ul>
        </div>
    </aside>
  </div>
</template>

<style scoped>
.sim-container {
    width: 100%;
    height: 100%;
    display: flex;
    overflow: hidden;
    position: relative;
    background: radial-gradient(circle at center, #1a2030 0%, #000 100%);
    user-select: none;
}

.canvas-area {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
}

.main-svg {
    width: 100%;
    height: 100%;
    background: linear-gradient(to bottom, #111521 0%, #05070a 100%);
}

/* Controls Panel Styling (Reused) */
.controls-panel {
    width: 300px;
    height: 100%;
    background: rgba(10, 14, 25, 0.85);
    backdrop-filter: blur(20px);
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
    gap: 1.2rem;
    position: absolute;
    right: 0;
    top: 0;
    z-index: 100;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow-y: auto;
}

.controls-panel.collapsed {
    transform: translateX(100%);
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #fff;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    padding-bottom: 1rem;
}

.control-group {
    background: rgba(255, 255, 255, 0.05);
    padding: 1rem;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.05);
}

.control-group.highlight {
    background: rgba(0, 212, 50, 0.05);
    border-color: rgba(0, 212, 50, 0.2);
}

.control-group label {
    display: block;
    color: var(--primary-glow, #00d4ff);
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
}

.data-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.4rem;
    color: #ccc;
    font-size: 0.9rem;
}

.data-row .val {
    color: #fff;
    font-weight: bold;
    font-family: monospace;
}

.progress-bar {
    width: 100%;
    height: 6px;
    background: #333;
    border-radius: 3px;
    overflow: hidden;
    margin-top: 10px;
}

.progress-bar .fill {
    height: 100%;
    background: #0f0;
    transition: width 0.3s ease;
}

.tool-btn {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    color: white;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
}
.tool-btn:hover {
    background: var(--primary-glow);
    color: #000;
}
</style>
