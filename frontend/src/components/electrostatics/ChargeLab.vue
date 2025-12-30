<script setup>
import { ref, computed } from 'vue'
import ChargeSidebar from './ChargeSidebar.vue'
import CoulombLab from './labs/CoulombLab.vue'
import ConservationLab from './labs/ConservationLab.vue'
import ContinuousLab from './labs/ContinuousLab.vue'

// Sidebar State
const topics = [
    { id: 'conservation', label: 'Conservation of Charge' },
    { id: 'coulomb', label: "Coulomb's Law" },
    { id: 'forces', label: 'Forces between Multiple Charges' },
    { id: 'superposition', label: 'Superposition Principle' },
    { id: 'continuous', label: 'Continuous Charge Distribution' }
]
const activeTopic = ref('coulomb')

const handleTopicSelect = (topicId) => {
    activeTopic.value = topicId
}
</script>

<template>
    <div class="charge-lab">
        <ChargeSidebar 
            title="Charges & Fields" 
            :topics="topics" 
            :activeTopic="activeTopic"
            @select="handleTopicSelect"
        />

        <div class="lab-viewport">
            <!-- Dynamic Component Loading -->
            <transition name="fade" mode="out-in">
                <!-- Case 1: Conservation -->
                <ConservationLab v-if="activeTopic === 'conservation'" />
                
                <!-- Case 2: Continuous -->
                <ContinuousLab v-else-if="activeTopic === 'continuous'" />
                
                <!-- Case 3: Coulomb / Forces / Superposition (Same component, different logic) -->
                <CoulombLab v-else :topicId="activeTopic" />
            </transition>
        </div>
    </div>
</template>

<style scoped>
.charge-lab {
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    background: transparent;
}

.lab-viewport {
    width: 100%;
    height: 100%;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
