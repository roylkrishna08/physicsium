<script setup>
defineProps({
  title: String,
  desc: String,
  icon: String,
  tags: Array,
  color: {
      type: String,
      default: 'var(--primary-glow)'
  }
})
</script>

<template>
  <div class="glass-card topic-card" :style="{ '--accent': color }">
    <div class="card-header">
        <div class="icon-box">{{ icon }}</div>
        <div class="tags">
            <span v-for="tag in tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
    </div>
    <h3 class="title">{{ title }}</h3>
    <p class="desc">{{ desc }}</p>
    
    <div class="progress-bar">
        <div class="fill" style="width: 0%"></div>
    </div>
    
    <div class="card-footer">
        <span class="status">Not Started</span>
        <button class="btn-icon">→</button>
    </div>
  </div>
</template>

<style scoped>
.topic-card {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  cursor: pointer;
  position: relative;
  min-height: 240px;
}

.topic-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: var(--accent);
    opacity: 0.5;
    transition: 0.3s;
}

.topic-card:hover::before {
    opacity: 1;
    height: 6px;
    box-shadow: 0 0 15px var(--accent);
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.5rem;
}

.icon-box {
    width: 50px;
    height: 50px;
    background: rgba(255,255,255,0.05);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    border: 1px solid rgba(255,255,255,0.1);
}

.tag {
    font-size: 0.7rem;
    padding: 4px 8px;
    background: rgba(0,0,0,0.3);
    border-radius: 4px;
    color: var(--text-secondary);
}

.title {
    font-size: 1.25rem;
    font-weight: 600;
}

.desc {
    font-size: 0.9rem;
    color: var(--text-secondary);
    line-height: 1.5;
    flex-grow: 1;
}

.card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
    font-size: 0.85rem;
    color: var(--text-secondary);
}

.btn-icon {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.2);
    width: 32px;
    height: 32px;
    border-radius: 50%;
    color: white;
    cursor: pointer;
    transition: 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.topic-card:hover .btn-icon {
    background: var(--accent);
    border-color: var(--accent);
    color: #000;
}
</style>
