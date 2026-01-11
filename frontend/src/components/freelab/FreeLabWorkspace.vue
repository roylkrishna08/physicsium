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
    // improved random placement center-ish
    const startX = window.innerWidth / 2 + (Math.random() * 100 - 50) - 100
    const startY = window.innerHeight / 2 + (Math.random() * 100 - 50)
    
    workspaceItems.value.push({
        id,
        type,
        x: startX,
        y: startY,
        state: { 
            isOn: false, 
            fillLevel: type === 'test_tube' ? 50 : 0, 
            intensity: 0.5, 
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

// Data Management
const clearWorkspace = () => {
    workspaceItems.value = []
    selectedItemId.value = null
    nextId.value = 1
}

const resetSim = () => {
    workspaceItems.value.forEach(item => {
        item.state.temperature = 25
        item.state.isOn = false
        if (item.state.fillLevel) item.state.fillLevel = 50
    })
}

// Snapping Logic
const handleDragEnd = (id) => {
    const item = workspaceItems.value.find(i => i.id === id)
    if (!item) return

    // 1. Test Tube -> Rack
    if (item.type === 'test_tube') {
        const racks = workspaceItems.value.filter(i => i.type === 'test_tube_stand')
        for (const rack of racks) {
            const dx = Math.abs(item.x - rack.x)
            const dy = Math.abs(item.y - rack.y)
            if (dx < 60 && dy < 60) {
                item.x = rack.x + 20 
                item.y = rack.y - 40 
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
        const burners = workspaceItems.value.filter(i => 
            ['bunsen_burner', 'spirit_lamp', 'kerosene_burner'].includes(i.type) && i.state.isOn
        )
        
        workspaceItems.value.forEach(item => {
            if (['thermometer', 'test_tube', 'beaker', 'measuring_cylinder'].includes(item.type)) {
                let targetTemp = 25 
                
                for (const burner of burners) {
                    const dist = Math.hypot(item.x - burner.x, item.y - (burner.y - 80)) 
                    
                    if (dist < 60) { 
                        const intensity = burner.state.intensity || 0.5
                        targetTemp = 100 + (intensity * 400) 
                    }
                }
                
                const current = item.state.temperature || 25
                if (current < targetTemp) {
                    item.state.temperature = current + 2 
                } else if (current > targetTemp) {
                    item.state.temperature = current - 1 
                }
            }
        })
    }, 100) 
})

onUnmounted(() => {
    if (simInterval) clearInterval(simInterval)
})

defineExpose({ spawnItem })
</script>

<template>
    <div class="workspace" @click.self="deselectAll">
        <!-- Background Decor -->
        <div class="table-surface"></div>
        <div class="table-edge"></div>

        <!-- Global Controls -->
        <div class="global-controls">
            <button class="control-btn" @click="resetSim" title="Reset Simulation">
                <span class="btn-icon">🔄</span> Reset
            </button>
            <button class="control-btn delete" @click="clearWorkspace" title="Clear All">
                <span class="btn-icon">🗑️</span> Clear
            </button>
        </div>

        <!-- Empty State Hint -->
        <div v-if="workspaceItems.length === 0" class="empty-hint">
            <span class="pulse-icon">🧪</span>
            <p>Drag instruments from the sidebar to begin</p>
        </div>

        <!-- Float Control Panel for Selected Item -->
        <Transition name="fade">
            <div v-if="selectedItem && ['bunsen_burner', 'spirit_lamp', 'kerosene_burner'].includes(selectedItem.type)" 
                 class="item-controls"
                 :style="{ left: (selectedItem.x + 80) + 'px', top: selectedItem.y + 'px' }"
            >
                <div class="control-header">
                    <span class="control-title">{{ selectedItem.type.replace('_', ' ') }}</span>
                    <button class="close-btn" @click.stop="deselectAll">×</button>
                </div>
                
                <div class="control-body">
                    <label>Flame Intensity</label>
                    <div class="range-wrapper">
                        <span>Low</span>
                        <input 
                            type="range" 
                            min="0" max="1" step="0.1" 
                            :value="selectedItem.state.intensity"
                            @input="updateIntensity"
                        >
                        <span>High</span>
                    </div>
                </div>
            </div>
        </Transition>

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
    overflow: hidden;
    background: #0f172a; /* Fallback */
    perspective: 1000px;
}

/* Realistic Table Styles */
.table-surface {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: 
        radial-gradient(circle at 50% 0%, rgba(255,255,255,0.05) 0%, transparent 60%),
        linear-gradient(to bottom, #1e293b 0%, #0f172a 100%);
    z-index: 0;
}

.table-edge {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 20px;
    background: linear-gradient(to bottom, #334155, #1e293b);
    box-shadow: 0 -2px 10px rgba(0,0,0,0.5);
    z-index: 1;
}

.global-controls {
    position: absolute;
    top: 20px;
    right: 20px;
    display: flex;
    gap: 10px;
    z-index: 50;
}

.control-btn {
    background: rgba(30, 41, 59, 0.8);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #e2e8f0;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;
    font-family: inherit;
}

.control-btn:hover {
    background: rgba(51, 65, 85, 0.9);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.control-btn.delete:hover {
    background: rgba(220, 38, 38, 0.2);
    border-color: rgba(220, 38, 38, 0.4);
    color: #fca5a5;
}

.empty-hint {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: rgba(148, 163, 184, 0.4);
    pointer-events: none;
    z-index: 10;
}

.pulse-icon {
    font-size: 4rem;
    display: block;
    margin-bottom: 1rem;
    filter: drop-shadow(0 0 20px rgba(56, 189, 248, 0.2));
    animation: float 3s ease-in-out infinite;
}

/* Item Controls Floating Panel */
.item-controls {
    position: absolute;
    width: 200px;
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid rgba(56, 189, 248, 0.3);
    border-radius: 12px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    z-index: 200;
    backdrop-filter: blur(12px);
    overflow: hidden;
}

.control-header {
    padding: 10px 12px;
    background: rgba(255, 255, 255, 0.05);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.control-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: #e2e8f0;
    text-transform: capitalize;
}

.close-btn {
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    font-size: 1.2rem;
    line-height: 1;
    padding: 0 4px;
}

.close-btn:hover { color: #fff; }

.control-body {
    padding: 12px;
}

.control-body label {
    display: block;
    font-size: 0.75rem;
    color: #94a3b8;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.range-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.7rem;
    color: #64748b;
}

input[type="range"] {
    flex: 1;
    height: 4px;
    background: #334155;
    border-radius: 2px;
    appearance: none;
}

input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    width: 14px;
    height: 14px;
    background: #38bdf8;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 10px rgba(56, 189, 248, 0.5);
}

@keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(10px);
}
</style>

