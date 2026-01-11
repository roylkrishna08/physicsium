<script setup>
const props = defineProps({
    activeId: String
})

const emit = defineEmits(['select'])

const instruments = [
    // Measuring Apparatus
    { id: 'measuring_cylinder', name: 'Measuring Cylinder', icon: '📏', type: 'chemistry' },
    { id: 'volumetric_flask', name: 'Volumetric Flask', icon: '⚗️', type: 'chemistry' },
    { id: 'pipette', name: 'Pipette', icon: '🖊️', type: 'chemistry' },
    { id: 'burette', name: 'Burette', icon: '🌡️', type: 'chemistry' },
    { id: 'beaker', name: 'Beaker', icon: '🥛', type: 'chemistry' },
    { id: 'test_tube', name: 'Test Tube', icon: '🧪', type: 'chemistry' },

    // Tools & Instruments
    { id: 'thermometer', name: 'Thermometer', icon: '🌡️', type: 'tool' },
    { id: 'tube_holder', name: 'Test Tube Holder', icon: '🤏', type: 'tool' },

    // Stands and Supports
    { id: 'retort_stand', name: 'Retort Stand', icon: '🏗️', type: 'general' },
    { id: 'tripod_stand', name: 'Tripod Stand', icon: '⛺', type: 'general' },
    { id: 'test_tube_stand', name: 'Test Tube Stand', icon: '🪜', type: 'general' },
    { id: 'funnel_stand', name: 'Funnel Stand', icon: '🍸', type: 'general' },

    // Lamps and Burners
    { id: 'bunsen_burner', name: 'Bunsen Burner', icon: '🔥', type: 'general' },
    { id: 'spirit_lamp', name: 'Spirit Lamp', icon: '🕯️', type: 'general' },
    { id: 'kerosene_burner', name: 'Kerosene Burner', icon: '🏮', type: 'general' },
]

const selectInstrument = (id) => {
    emit('select', id)
}
</script>

<template>
    <div class="instrument-bar">
        <div class="bar-header">
            <h3>Lab Tools</h3>
        </div>
        
        <div class="instrument-list">
            <div 
                v-for="inst in instruments" 
                :key="inst.id"
                class="instrument-item"
                :class="{ active: activeId === inst.id, [inst.type]: true }"
                @click="selectInstrument(inst.id)"
            >
                <div class="icon">{{ inst.icon }}</div>
                <div class="tooltip">{{ inst.name }}</div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.instrument-bar {
    width: 80px;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(12px);
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    height: 100%;
    z-index: 10;
    transition: width 0.3s ease;
}

.bar-header {
    padding: 1.5rem 0;
    text-align: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.bar-header h3 {
    margin: 0;
    font-size: 0.7rem;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 600;
}

.instrument-list {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 0.8rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.instrument-list::-webkit-scrollbar {
    width: 4px;
}

.instrument-list::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
}

.instrument-item {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    aspect-ratio: 1;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid transparent;
}

.instrument-item:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    border-color: rgba(255, 255, 255, 0.1);
}

.instrument-item:active {
    transform: translateY(0);
}

.icon {
    font-size: 1.5rem;
    line-height: 1;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
}

/* Tooltips */
.tooltip {
    position: absolute;
    left: 100%;
    top: 50%;
    transform: translateY(-50%) translateX(10px);
    background: rgba(15, 23, 42, 0.95);
    color: #e2e8f0;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 0.8rem;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s;
    pointer-events: none;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 100;
}

.tooltip::before {
    content: '';
    position: absolute;
    left: -4px;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
    width: 8px;
    height: 8px;
    background: inherit;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.instrument-item:hover .tooltip {
    opacity: 1;
    visibility: visible;
    transform: translateY(-50%) translateX(15px);
}

/* Category Colors (Subtle glows) */
.instrument-item.chemistry:hover {
    box-shadow: 0 4px 15px rgba(236, 72, 153, 0.15);
    border-color: rgba(236, 72, 153, 0.3);
}

.instrument-item.tool:hover {
    box-shadow: 0 4px 15px rgba(56, 189, 248, 0.15);
    border-color: rgba(56, 189, 248, 0.3);
}

.instrument-item.general:hover {
    box-shadow: 0 4px 15px rgba(250, 204, 21, 0.15);
    border-color: rgba(250, 204, 21, 0.3);
}
</style>
