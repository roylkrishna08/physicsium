<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import ChemGlassware from './apparatus/ChemGlassware.vue'
import Burner from './apparatus/Burner.vue'
import LabStand from './apparatus/LabStand.vue'
import Thermometer from './apparatus/Thermometer.vue'
import TestTube from './apparatus/TestTube.vue'
import TubeHolder from './apparatus/TubeHolder.vue'

const props = defineProps({
    item: {
        type: Object,
        required: true
    },
    isSelected: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update-position', 'select', 'delete', 'update-state', 'drag-end'])

const dragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

const handleMouseDown = (e) => {
    emit('select', props.item.id) // Select on click start
    dragging.value = true
    dragOffset.value = {
        x: e.clientX - props.item.x,
        y: e.clientY - props.item.y
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
}

const handleMouseMove = (e) => {
    if (dragging.value) {
        let newX = e.clientX - dragOffset.value.x
        let newY = e.clientY - dragOffset.value.y
        emit('update-position', { id: props.item.id, x: newX, y: newY })
    }
}

const handleMouseUp = () => {
    if (dragging.value) {
        dragging.value = false
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
        emit('drag-end', props.item.id)
    }
}

// Interaction (e.g., toggle burner)
const handleClick = () => {
    if (['bunsen_burner', 'spirit_lamp', 'kerosene_burner'].includes(props.item.type)) {
        emit('update-state', { id: props.item.id, isOn: !props.item.state?.isOn })
    }
}

// Delete on right click
const handleRightClick = (e) => {
    e.preventDefault()
    emit('delete', props.item.id)
}

// Visual Helpers
const getComponentType = (type) => {
    if (['beaker', 'measuring_cylinder', 'volumetric_flask', 'pipette', 'burette'].includes(type)) return ChemGlassware
    if (['bunsen_burner', 'spirit_lamp', 'kerosene_burner'].includes(type)) return Burner
    if (['retort_stand', 'tripod_stand', 'test_tube_stand', 'funnel_stand'].includes(type)) return LabStand
    if (type === 'thermometer') return Thermometer
    if (type === 'test_tube') return TestTube
    if (type === 'tube_holder') return TubeHolder
    return null
}
</script>

<template>
    <div 
        class="apparatus-wrapper"
        :class="{ selected: isSelected, dragging: dragging }"
        :style="{ left: item.x + 'px', top: item.y + 'px' }"
        @mousedown="handleMouseDown"
        @contextmenu="handleRightClick"
        @click.stop="handleClick"
    >
        <!-- Render specific component based on type -->
        <component 
            :is="getComponentType(item.type)" 
            :type="item.type"
            :isOn="item.state?.isOn"
            :intensity="item.state?.intensity"
            :fillLevel="item.state?.fillLevel"
            :temperature="item.state?.temperature" 
        />
        
        <!-- Selection Glow (No more dashed border) -->
        <div v-if="isSelected" class="selection-glow"></div>
    </div>
</template>

<style scoped>
.apparatus-wrapper {
    position: absolute;
    cursor: grab;
    width: 60px; /* Default size base */
    height: 120px;
    display: flex;
    justify-content: center;
    align-items: flex-end;
    transition: transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1);
    user-select: none;
    z-index: 10;
}

/* Specific Sizes based on Type (Overriding) */
/* Glassware */
.apparatus-wrapper:has(.glass-svg) { height: 100px; width: 60px; }
/* Stands */
.apparatus-wrapper:has(.stand-svg) { height: 200px; width: 80px; z-index: 5; } /* Stands usually behind */
/* Burners */
.apparatus-wrapper:has(.burner-svg) { height: 120px; width: 50px; z-index: 8; }

.apparatus-wrapper.dragging {
    cursor: grabbing;
    z-index: 100;
    transform: scale(1.05) translateY(-5px);
    transition: none; /* Instant follow */
}

.selection-glow {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    border-radius: 50%;
    box-shadow: 0 0 25px rgba(56, 189, 248, 0.4);
    opacity: 0.8;
    z-index: -1;
    pointer-events: none;
    animation: pulse-glow 2s infinite;
}

/* Adjust glow for differently shaped items */
.apparatus-wrapper:has(.stand-svg) .selection-glow {
    border-radius: 10px;
    bottom: -10px;
}

@keyframes pulse-glow {
    0% { opacity: 0.5; transform: scale(0.95); }
    50% { opacity: 0.8; transform: scale(1.05); }
    100% { opacity: 0.5; transform: scale(0.95); }
}
</style>
