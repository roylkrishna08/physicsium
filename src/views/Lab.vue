<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LabSidebar from '../components/LabSidebar.vue'
import LabBackground from '../components/LabBackground.vue'
import SimPendulum from '../components/simulations/SimPendulum.vue'

const route = useRoute()
const router = useRouter()
const activeId = computed(() => route.params.id)
const isSidebarCollapsed = ref(false)

const placeholderSims = {
    '1': "Vernier Callipers Simulation",
    '2': "Screw Gauge Simulation",
    '3': "Simple Pendulum Simulation"
}

const currentTitle = computed(() => {
    if (!activeId.value) return 'Select Experiment'
    return placeholderSims[activeId.value] || `Experiment ${activeId.value}`
})

const exitLab = () => {
    router.push('/experiments')
}
</script>

<template>
  <div class="lab-layout">
    <LabBackground />
    
    <header class="lab-top-bar">
        <div class="left-actions">
            <button class="exit-btn glass-card" @click="exitLab">
                ← Exit Lab
            </button>
            <button 
                v-if="isSidebarCollapsed"
                class="sidebar-toggle glass-card animate-in"
                @click="isSidebarCollapsed = false"
                title="Show Experiments"
            >
                ☰ Experiments
            </button>
        </div>
        
        <div class="lab-title glass-card">
            <span class="brand">Physicsium Lab</span>
            <span class="divider">|</span>
            <span class="exp-name">{{ currentTitle }}</span>
        </div>
    </header>
    
    <div class="lab-container">
        <LabSidebar 
            :activeId="activeId" 
            :collapsed="isSidebarCollapsed"
            @toggle="isSidebarCollapsed = !isSidebarCollapsed"
        />
        
        <main class="lab-main glass-card">
            <!-- existing content -->
            <div v-if="activeId" class="simulation-area">
                <!-- Real Simulation Container -->
                <div v-if="activeId === '3'" class="sim-wrapper">
                    <SimPendulum />
                </div>
                
                <!-- Placeholder for others -->
                <div v-else class="sim-viewport">
                    <div class="placeholder-content">
                        <div class="sim-icon">🧪</div>
                        <h3>{{ currentTitle }}</h3>
                        <p>Interactive lab environment coming soon.</p>
                    </div>
                </div>
            </div>
            <div v-else class="empty-state">
                <div class="icon-box">flask</div>
                <h2>Select an Experiment</h2>
                <p>Choose an experiment from the sidebar to begin.</p>
            </div>
        </main>
    </div>
  </div>
</template>

<style scoped>
/* existing styles */
.left-actions {
    display: flex;
    gap: 0.8rem;
    pointer-events: auto;
}

.sidebar-toggle {
    padding: 0.5rem 1rem;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(0,0,0,0.5);
    color: #fff;
    cursor: pointer;
    border-radius: 8px;
    font-weight: 500;
    transition: 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.sidebar-toggle:hover {
    background: rgba(255,255,255,0.1);
    transform: translateY(-2px);
}

.animate-in {
    animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
}

/* media queries */
@media (max-width: 768px) {
    .sidebar-toggle {
         padding: 0.25rem 0.6rem;
         font-size: 0.8rem;
    }
}
/* ... rest of styles ... */

.lab-layout {
    width: 100vw;
    height: 100vh;
    padding: 0;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
    background: #000;
}

.lab-top-bar {
    position: absolute;
    top: 1rem;
    left: 1rem;
    right: 1rem;
    height: 3rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 100;
    pointer-events: none;
}

.exit-btn {
    pointer-events: auto;
    padding: 0.5rem 1rem;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(0,0,0,0.5);
    color: #fff;
    cursor: pointer;
    border-radius: 8px;
    font-weight: 500;
    transition: 0.2s;
}

.exit-btn:hover {
    background: rgba(255,255,255,0.1);
    transform: translateX(-2px);
}

.lab-title {
    pointer-events: auto;
    padding: 0.5rem 1.5rem;
    border-radius: 8px;
    background: rgba(0,0,0,0.5);
    border: 1px solid rgba(255,255,255,0.1);
    display: flex;
    align-items: center;
    gap: 0.8rem;
    color: #fff;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
}

.lab-title .brand {
    font-weight: 700;
    color: var(--primary-glow);
    text-transform: uppercase;
    font-size: 0.9rem;
    letter-spacing: 1px;
}

.lab-title .divider {
    opacity: 0.3;
}

.lab-title .exp-name {
    font-weight: 500;
    color: #eee;
}

/* Sidebar needs to adjust to full height */
:deep(.lab-sidebar) {
    height: 100% !important;
    top: 0 !important;
}

.lab-container {
    display: flex;
    gap: 1rem;
    flex: 1;
    padding: 1rem;
    padding-top: 4.5rem; /* Space for top bar */
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    position: relative;
    z-index: 10;
}

.lab-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
}

.simulation-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

.empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    text-align: center;
}

.sim-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.sim-header {
    padding: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sim-viewport {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.3);
    position: relative;
    overflow: hidden;
}

.placeholder-content {
    text-align: center;
}

.sim-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    animation: float 3s ease-in-out infinite;
}

@keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
}

@media (max-width: 768px) {
    .lab-top-bar {
        top: 0.5rem;
        left: 0.5rem;
        right: 0.5rem;
        height: 2.5rem;
    }

    .lab-title {
        padding: 0.25rem 0.8rem;
        font-size: 0.8rem;
    }
    
    .lab-title .brand,
    .lab-title .divider {
        display: none;
    }
    
    .exit-btn {
        padding: 0.25rem 0.6rem;
        font-size: 0.8rem;
    }

    .lab-container {
        flex-direction: row; /* Keep sidebar on left */
        padding: 0.5rem;
        padding-top: 3.5rem; /* Reduced because top bar is smaller/closer */
        gap: 0.5rem;
    }

    .lab-main {
        overflow-y: auto;
        border-radius: 12px;
        /* Ensure it takes remaining width */
        width: calc(100vw - 80px); /* fallback Approx */
        flex: 1;
    }
    
    .simulation-area {
        height: auto;
        min-height: 100%;
        overflow-y: visible;
    }
    
    .sim-wrapper {
        overflow-y: visible;
        height: auto;
        display: flex;
        flex-direction: column;
    }
}
</style>
