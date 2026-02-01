<script setup>
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:isOpen'])

const toggle = () => {
    emit('update:isOpen', !props.isOpen)
}
</script>

<template>
    <div class="control-sidebar-container" :class="{ collapsed: !isOpen }">
        <button class="toggle-btn" @click="toggle">
            <span v-if="isOpen">»</span>
            <span v-else>«</span>
        </button>
        
        <div class="sidebar-content">
            <slot></slot>
        </div>
    </div>
</template>

<style scoped>
.control-sidebar-container {
    position: absolute;
    top: 60px; /* Below Navbar */
    right: 0;
    height: calc(100vh - 60px);
    width: 320px;
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-left: 1px solid rgba(255, 255, 255, 0.08);
    transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
    z-index: 50;
    padding-top: 1rem;
    box-shadow: -10px 0 30px rgba(0,0,0,0.2);
}

.control-sidebar-container.collapsed {
    transform: translateX(320px);
}

.toggle-btn {
    position: absolute;
    top: 50%;
    left: -32px;
    width: 32px;
    height: 64px;
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-right: none;
    border-radius: 12px 0 0 12px;
    color: var(--primary-glow);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    transition: all 0.3s;
    box-shadow: -4px 0 10px rgba(0,0,0,0.2);
}

.toggle-btn:hover {
    width: 36px;
    background: var(--primary-glow);
    color: #000;
    box-shadow: 0 0 15px var(--primary-glow);
}

.sidebar-content {
    padding: 2rem 1.5rem;
    overflow-y: auto;
    height: 100%;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.1) transparent;
}
</style>
