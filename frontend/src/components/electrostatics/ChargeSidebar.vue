<script setup>
import { ref } from 'vue'

const props = defineProps({
  title: String,
  topics: Array, // [{ id, label }]
  activeTopic: String
})

const emit = defineEmits(['select', 'toggle'])

const isOpen = ref(true)

const toggle = () => {
    isOpen.value = !isOpen.value
    emit('toggle', isOpen.value)
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
            <ul class="topic-list">
                <li 
                    v-for="topic in topics" 
                    :key="topic.id"
                    :class="{ active: activeTopic === topic.id }"
                    @click="emit('select', topic.id)"
                >
                    {{ topic.label }}
                </li>
            </ul>
        </div>
    </div>
</template>

<style scoped>
.lab-sidebar-container {
    position: absolute;
    top: 0; 
    left: 0;
    height: 100vh;
    width: 320px; /* Slightly wider for comfort */
    background: rgba(15, 23, 42, 0.65); /* More transparent for glass feel */
    backdrop-filter: blur(20px) saturate(180%); /* Premium Frosted Glass */
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-right: 1px solid rgba(255, 255, 255, 0.08);
    transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1); /* Smooth spring-like ease */
    z-index: 50;
    padding-top: 6rem;
    box-shadow: 10px 0 30px rgba(0,0,0,0.2);
}

.lab-sidebar-container.collapsed {
    transform: translateX(-320px);
}

/* Elegant Toggle Button */
.toggle-btn {
    position: absolute;
    top: 50%;
    right: -32px; /* Extend out */
    width: 32px;
    height: 64px;
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-left: none;
    border-radius: 0 12px 12px 0;
    color: var(--primary-glow);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    transition: all 0.3s;
    box-shadow: 4px 0 10px rgba(0,0,0,0.2);
}

.toggle-btn:hover {
    width: 36px; /* Expanding effect */
    background: var(--primary-glow);
    color: #000;
    box-shadow: 0 0 15px var(--primary-glow);
}

.sidebar-content {
    padding: 2rem 1.5rem;
    overflow-y: auto;
    height: 100%;
    /* Scrollbar styling */
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.1) transparent;
}

.sidebar-title {
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    font-weight: 700;
    color: var(--text-secondary);
    margin-bottom: 2rem;
    padding-left: 0.5rem;
    border-left: 3px solid var(--primary-glow);
}

.topic-list {
    list-style: none;
    padding: 0;
}

.topic-list li {
    padding: 14px 18px;
    margin-bottom: 0.8rem;
    border-radius: 12px;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    transition: all 0.3s;
    font-size: 1rem;
    position: relative;
    border: 1px solid transparent;
}

.topic-list li:hover {
    background: rgba(255, 255, 255, 0.05);
    color: white;
    transform: translateX(4px);
}

/* Active State - Glowing Pill */
.topic-list li.active {
    background: linear-gradient(90deg, rgba(0, 212, 255, 0.15), transparent);
    color: var(--primary-glow);
    border: 1px solid rgba(0, 212, 255, 0.2);
    font-weight: 500;
    box-shadow: inset 0 0 20px rgba(0, 212, 255, 0.05);
}

.topic-list li.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 60%;
    background: var(--primary-glow);
    border-radius: 0 4px 4px 0;
    box-shadow: 0 0 10px var(--primary-glow);
}
</style>
