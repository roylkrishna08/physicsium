<script setup>
import { ref, defineExpose, onMounted, onUnmounted, computed } from 'vue'
import DraggableApparatus from './DraggableApparatus.vue'

// State
const workspaceItems = ref([])
const nextId = ref(1)
const selectedItemId = ref(null)

// Actions
const spawnItem = (type) => {
    const id = nextId.value++
    const startX = 400 + (Math.random() * 100 - 50)
    const startY = 300 + (Math.random() * 100 - 50)
    
    workspaceItems.value.push({
        id,
        type,
        x: startX,
        y: startY,
        state: { 
            isOn: false, 
            fillLevel: type === 'test_tube' ? 50 : 0, // Demo fill 
            intensity: 0.5, // 0 to 1
            temperature: 25 
        } 
    })
    
    selectedItemId.value = id
}

const updatePosition = ({ id, x, y }) => {
    const item = workspaceItems.value.find(i => i.id === id)
    if (item) {
        item.x = x
        item.y = y
    }
}

const updateState = ({ id, isOn }) => {
    const item = workspaceItems.value.find(i => i.id === id)
    if (item && item.state) {
        item.state.isOn = isOn
    }
}

// Snapping Logic
const handleDragEnd = (id) => {
    const item = workspaceItems.value.find(i => i.id === id)
    if (!item) return

    // 1. Test Tube -> Rack
    if (item.type === 'test_tube') {
        const racks = workspaceItems.value.filter(i => i.type === 'test_tube_stand')
        for (const rack of racks) {
            // Check distance (simple proximity)
            const dx = Math.abs(item.x - rack.x)
            const dy = Math.abs(item.y - rack.y)
            if (dx < 60 && dy < 60) {
                // Snap to rack
                // Ideally calculate specific hole positions
                item.x = rack.x + 20 // Offset slightly
                item.y = rack.y - 40 // Sit in rack
                return
            }
        }
    }
    
    // 2. Tube Holder -> Test Tube
    if (item.type === 'tube_holder') {
        const tubes = workspaceItems.value.filter(i => i.type === 'test_tube')
        for (const tube of tubes) {
             const dx = Math.abs(item.x - tube.x)
             const dy = Math.abs(item.y - tube.y)
             if (dx < 40 && dy < 80) {
                 // Attach (visually move holder to tube neck)
                 item.x = tube.x - 40
                 item.y = tube.y + 10
                 return
             }
        }
    }
}

const removeItem = (id) => {
    workspaceItems.value = workspaceItems.value.filter(i => i.id !== id)
    if (selectedItemId.value === id) selectedItemId.value = null
}

const selectItem = (id) => {
    selectedItemId.value = id
}

const deselectAll = () => {
    selectedItemId.value = null
}

// Intensity Control
const selectedItem = computed(() => workspaceItems.value.find(i => i.id === selectedItemId.value))

const updateIntensity = (e) => {
    if (selectedItem.value) {
        selectedItem.value.state.intensity = parseFloat(e.target.value)
    }
}

// Simulation Loop (Temperature)
let simInterval = null
onMounted(() => {
    simInterval = setInterval(() => {
        // Simple Heat Transfer Model
        const burners = workspaceItems.value.filter(i => 
            ['bunsen_burner', 'spirit_lamp', 'kerosene_burner'].includes(i.type) && i.state.isOn
        )
        
        workspaceItems.value.forEach(item => {
            if (item.type === 'thermometer' || item.type === 'test_tube' || item.type === 'beaker') {
                let targetTemp = 25 // Ambient
                
                // Check user proximity to any active burner
                // Hitbox for flame is roughly (burner.x, burner.y - 100) to (burner.x + width, burner.y)
                // Proximity check
                for (const burner of burners) {
                    const dist = Math.hypot(item.x - burner.x, item.y - (burner.y - 80)) // Approx flame center
                    
                    if (dist < 60) { // Close to flame
                        const intensity = burner.state.intensity || 0.5
                        targetTemp = 100 + (intensity * 400) // Max 500C
                    }
                }
                
                // Move towards target
                const current = item.state.temperature || 25
                if (current < targetTemp) {
                    item.state.temperature = current + 2 // Heating rate
                } else if (current > targetTemp) {
                    item.state.temperature = current - 1 // Cooling rate
                }
            }
        })
    }, 100) // 10Hz
})

onUnmounted(() => {
    if (simInterval) clearInterval(simInterval)
})

defineExpose({ spawnItem })
</script>

<template>
    <div class="workspace" @click.self="deselectAll">
        <!-- Empty State Hint -->
        <div v-if="workspaceItems.length === 0" class="empty-hint">
            <span class="pulse-icon">👆</span>
            <p>Click instruments in the sidebar to add them here</p>
        </div>

        <!-- UI Controls (Overlay) -->
        <div v-if="selectedItem && ['bunsen_burner', 'spirit_lamp', 'kerosene_burner'].includes(selectedItem.type)" class="controls-overlay">
            <div class="control-panel">
                <h4>{{ selectedItem.type.replace('_', ' ') }}</h4>
                <label>Intensity</label>
                <input 
                    type="range" 
                    min="0" max="1" step="0.1" 
                    :value="selectedItem.state.intensity"
                    @input="updateIntensity"
                >
            </div>
        </div>

        <!-- Render Items -->
        <DraggableApparatus 
            v-for="item in workspaceItems" 
            :key="item.id"
            :item="item"
            :isSelected="selectedItemId === item.id"
            @update-position="updatePosition"
            @select="selectItem"
            @delete="removeItem"
            @update-state="updateState"
            @drag-end="handleDragEnd"
        />
    </div>
</template>

<style scoped>
.workspace {
    flex: 1;
    position: relative;
    background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%);
    overflow: hidden;
    /* Dot Grid Background */
    background-image: radial-gradient(#334155 1px, transparent 1px);
    background-size: 20px 20px;
}

.controls-overlay {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 1000;
}

.control-panel {
    background: rgba(15, 23, 42, 0.9);
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid #334155;
    color: white;
    backdrop-filter: blur(4px);
}

.control-panel h4 {
    margin: 0 0 0.5rem 0;
    text-transform: capitalize;
}

.control-panel input[type="range"] {
    width: 150px;
    margin-top: 0.5rem;
}

.empty-hint {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: rgba(255, 255, 255, 0.3);
    pointer-events: none;
}

.pulse-icon {
    font-size: 3rem;
    display: block;
    margin-bottom: 1rem;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.1); }
    100% { opacity: 0.3; transform: scale(1); }
}
</style>
