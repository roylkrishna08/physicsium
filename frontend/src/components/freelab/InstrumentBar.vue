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
            <h3>Tools</h3>
        </div>
        
        <div class="instrument-list">
            <div 
                v-for="inst in instruments" 
                :key="inst.id"
                class="instrument-item"
                :class="{ active: activeId === inst.id, [inst.type]: true }"
                @click="selectInstrument(inst.id)"
                :title="inst.name"
            >
                <div class="icon">{{ inst.icon }}</div>
                <!-- <span class="label">{{ inst.name }}</span> -->
            </div>
        </div>
    </div>
</template>

<style scoped>
.instrument-bar {
    width: 80px;
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(10px);
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    height: 100%;
    z-index: 10;
}

.bar-header {
    padding: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.bar-header h3 {
    margin: 0;
    font-size: 1.2rem;
    color: var(--primary-glow);
    text-transform: uppercase;
    display: none;
}

.instrument-list {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
}

.instrument-item {
    display: flex;
    justify-content: center;
    padding: 0.8rem;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid transparent;
}

.instrument-item:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateX(5px);
}

.instrument-item.active {
    background: rgba(0, 212, 255, 0.15);
    border-color: rgba(0, 212, 255, 0.3);
    color: white;
}

/* Chemistry distinct style */
.instrument-item.chemistry.active {
    background: rgba(255, 0, 85, 0.15);
    border-color: rgba(255, 0, 85, 0.3);
}

.icon {
    font-size: 1.4rem;
    margin-right: 0;
    width: 30px;
    text-align: center;
}

.label {
    font-size: 0.95rem;
    font-weight: 500;
}
</style>
