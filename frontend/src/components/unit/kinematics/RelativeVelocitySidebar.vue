<script setup>
import { ref } from 'vue'

const props = defineProps({
  title: String,
  topics: Array, // [{ id, label, description }]
  activeTopic: String,
  isOpen: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['select', 'update:isOpen'])

const toggle = () => {
    emit('update:isOpen', !props.isOpen)
}
</script>

<template>
    <div class="lab-sidebar-container" :class="{ collapsed: !isOpen }">
        <button class="toggle-btn" @click="toggle">
            <span v-if="isOpen">«</span>
            <span v-else>»</span>
        </button>
        
        <div class="sidebar-content">
            <h3 class="sidebar-title">{{ title }}</h3>
            
            <div class="topic-list">
                <div 
                    v-for="topic in topics" 
                    :key="topic.id"
                    class="topic-item"
                    :class="{ active: activeTopic === topic.id }"
                    @click="emit('select', topic.id)"
                >
                    <div class="topic-header">
                        <span class="topic-label">{{ topic.label }}</span>
                    </div>
                </div>
            </div>

        </div>
    </div>
</template>

<style scoped>
.lab-sidebar-container {
    position: absolute;
    top: 64px;
    left: 0;
    height: calc(100vh - 64px);
    width: 300px;
    background: rgba(15, 23, 42, 0.7);
    backdrop-filter: blur(20px);
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 50;
}

.lab-sidebar-container.collapsed {
    transform: translateX(-300px);
}

.toggle-btn {
    position: absolute;
    top: 20px;
    right: -30px;
    width: 30px;
    height: 60px;
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-left: none;
    border-radius: 0 8px 8px 0;
    color: var(--primary-glow);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.sidebar-content {
    padding: 2rem 1rem;
    height: 100%;
    overflow-y: auto;
}

.sidebar-title {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: var(--text-secondary);
    margin-bottom: 2rem;
    padding-left: 0.5rem;
    border-left: 2px solid var(--primary-glow);
}

.topic-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.topic-item {
    padding: 1rem;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s;
    border: 1px solid transparent;
}

.topic-item:hover {
    background: rgba(255, 255, 255, 0.05);
}

.topic-item.active {
    background: rgba(0, 212, 255, 0.1);
    border-color: rgba(0, 212, 255, 0.3);
}

.topic-label {
    font-weight: 600;
    color: #fff;
}

.active .topic-label {
    color: var(--primary-glow);
}

.topic-desc {
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin-top: 0.5rem;
    line-height: 1.4;
}

</style>
