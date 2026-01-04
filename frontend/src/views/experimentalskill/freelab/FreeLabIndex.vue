<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import InstrumentBar from '../../../components/freelab/InstrumentBar.vue'
import FreeLabWorkspace from '../../../components/freelab/FreeLabWorkspace.vue'
import LabNavBar from '../../../components/layout/LabNavBar.vue'

const router = useRouter()
const workspaceRef = ref(null)
const isSidebarCollapsed = ref(false)

const handleInstrumentSelect = (instrumentId) => {
    if (workspaceRef.value) {
        workspaceRef.value.spawnItem(instrumentId)
    }
}

const handleExit = () => {
    router.push('/experiments')
}

const toggleSidebar = () => {
    isSidebarCollapsed.value = !isSidebarCollapsed.value
}
</script>

<template>
    <div class="free-lab-container">
        <LabNavBar 
            title="Free Lab: Multipurpose Workspace"
            :isLeftSidebarCollapsed="isSidebarCollapsed"
            @toggleLeftSidebar="toggleSidebar"
            @exit="handleExit"
        />
        
        <div class="lab-content">
            <InstrumentBar 
                v-show="!isSidebarCollapsed"
                :activeId="null"
                @select="handleInstrumentSelect"
            />
            
            <FreeLabWorkspace 
                ref="workspaceRef"
            />
        </div>
    </div>
</template>

<style scoped>
.free-lab-container {
    width: 100vw;
    height: 100vh;
    background: #0f172a;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.lab-content {
    flex: 1;
    display: flex;
    position: relative;
    overflow: hidden;
    padding-top: 60px; /* Navbar height */
}
</style>
