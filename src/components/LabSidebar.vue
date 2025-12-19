<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { jeeSyllabus } from '../data/jee-syllabus.js'

const props = defineProps({
  activeId: String,
  collapsed: Boolean
})

const emit = defineEmits(['toggle'])

const router = useRouter()

// Extract experiments same as in Experiments.vue
const experimentUnit = jeeSyllabus.find(u => u.title.toLowerCase().includes('experimental'))

const experiments = computed(() => {
    if (!experimentUnit) return []
    const rawText = experimentUnit.content
    const matches = rawText.split(/\d+\.\s+/)
    
    return matches
        .filter(t => t.trim().length > 0)
        .filter(t => !t.includes('Familiarity with the basic approach'))
        .map((text, index) => {
            const endOfFirstSentence = text.indexOf('.')
            const title = endOfFirstSentence > -1 ? text.substring(0, endOfFirstSentence) : text
            return {
                id: index + 1,
                title: title.trim()
            }
        })
})

const selectExperiment = (id) => {
    router.push(`/lab/${id}`)
}
</script>

<template>
  <aside class="lab-sidebar glass-card" :class="{ collapsed: collapsed }">
    <div class="sidebar-header">
        <h3>Experiments</h3>
    </div>
    <div class="experiments-list">
        <div 
            v-for="exp in experiments" 
            :key="exp.id"
            class="exp-item"
            :class="{ active: activeId == exp.id }"
            @click="selectExperiment(exp.id)"
        >
            <span class="exp-num">{{ exp.id.toString().padStart(2, '0') }}</span>
            <span class="exp-title">{{ exp.title }}</span>
        </div>
    </div>
  </aside>
</template>

<style scoped>
.lab-sidebar {
    width: 250px;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 0;
    background: rgba(22, 26, 31, 0.95);
    backdrop-filter: blur(24px);
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    flex-shrink: 0;
}

.lab-sidebar.collapsed {
    width: 0;
    border: none;
}


.sidebar-header {
    padding: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 73px; /* Keep height stable */
    box-sizing: border-box;
}

.lab-sidebar.collapsed .sidebar-header {
    justify-content: center;
    padding: 1.5rem 0;
}

.sidebar-header h3 {
    margin: 0;
    font-size: 1.2rem;
    color: #fff;
    white-space: nowrap;
}

.collapse-btn {
    background: rgba(255,255,255,0.1);
    border: none;
    color: var(--text-secondary);
    width: 32px;
    height: 32px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.collapse-btn:hover {
    background: rgba(255,255,255,0.2);
    color: white;
}

.experiments-list {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    overflow-x: hidden;
}

.experiments-list::-webkit-scrollbar {
    width: 4px;
}
.experiments-list::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.2);
    border-radius: 4px;
}

.lab-sidebar.collapsed .experiments-list {
    padding: 1rem 0.5rem;
}

.exp-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border-radius: 12px;
    cursor: pointer;
    transition: 0.2s;
    color: var(--text-secondary);
    white-space: nowrap;
}

.lab-sidebar.collapsed .exp-item {
    justify-content: center;
    padding: 1rem 0;
}

.exp-item:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
}

.exp-item.active {
    background: rgba(0, 212, 255, 0.15);
    color: #fff;
    border: 1px solid var(--primary-glow);
}

.exp-num {
    font-family: monospace;
    opacity: 0.5;
    font-size: 0.9rem;
    flex-shrink: 0;
}

.lab-sidebar.collapsed .exp-num {
    opacity: 1;
    font-weight: bold;
    font-size: 1rem;
}

.exp-title {
    font-size: 0.9rem;
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
}

@media (max-width: 900px) {
    .lab-sidebar {
         width: 70px;
    }
    
    .sidebar-header h3,
    .exp-title {
        display: none !important;
    }
    
    .sidebar-header {
        justify-content: center;
    }
    
    /* Center the active icon/number */
    .exp-item {
        justify-content: center;
        padding: 1rem 0;
    }
    
    .exp-num {
        opacity: 1;
        font-weight: bold;
        font-size: 1rem;
    }
}
</style>
