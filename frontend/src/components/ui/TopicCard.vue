<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: String,
  desc: String,
  icon: String,
  tags: Array,
  color: {
      type: String,
      default: 'var(--primary-glow)'
  },
  compact: {
      type: Boolean,
      default: false
  },
  index: {
      type: Number,
      default: null
  }
});

const formattedIndex = (i) => {
    return (i + 1).toString().padStart(2, '0')
};

// Safely determine if icon is SVG or emoji
const iconType = computed(() => {
    if (!props.icon) return 'none';
    // Icons should be emojis by default for safety
    // If you need SVG support, pass as a component instead
    return 'text';
});
</script>

<template>
  <!-- Normal Card -->
  <div v-if="!compact" class="glass-card topic-card" :style="{ '--accent': color }">
    <div v-if="index !== null" class="card-number">{{ formattedIndex(index) }}</div>
    <div class="card-header">
        <!-- Safe icon rendering without v-html to prevent XSS -->
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

  <!-- Compact Card -->
  <div v-else class="glass-card topic-card compact" :style="{ '--accent': color }">
      <div v-if="index !== null" class="card-number compact-num">{{ formattedIndex(index) }}</div>
      
      <!-- Safe icon rendering without v-html to prevent XSS -->
      <div class="icon-box sm">{{ icon }}</div>
      
      <h3 class="title sm">{{ title }}</h3>
  </div>
</template>

<style scoped>
.topic-card {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  cursor: pointer;
  position: relative;
  min-height: auto; /* Allow natural height on mobile */
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

/* Compact Mode */
.topic-card.compact {
    min-height: auto;
    flex-direction: column; /* Stack top-to-bottom for centering */
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 1.5rem 1rem;
    gap: 0.5rem;
}

.topic-card.compact::before {
    height: 100%;
    width: 4px; /* Vertical strip on left */
}

.topic-card.compact:hover::before {
    width: 6px;
    height: 100%;
}

/* Card Number Styles */
.card-number {
    position: absolute;
    top: 1rem;
    left: 1rem;
    font-family: monospace;
    font-size: 1.5rem; /* Large and faint */
    font-weight: 700;
    color: rgba(255, 255, 255, 0.1);
    z-index: 0;
    pointer-events: none;
}

.card-number.compact-num {
    position: static; /* Flow with layout in compact mode? Or keep absolute? */
    /* Let's try absolute top-right for compact */
    position: absolute;
    top: 0.5rem;
    left: 0.8rem;
    font-size: 0.9rem;
    color: var(--accent);
    opacity: 0.5;
}

/* Make sure card is relative for absolute positioning */
.topic-card {
    position: relative;
}

.topic-card.compact .icon-box {
    width: 40px;
    height: 40px;
    font-size: 1.5rem;
    background: transparent;
    border: none;
    box-shadow: none;
    margin-bottom: 0.25rem;
}

.topic-card.compact .card-header,
.topic-card.compact .card-footer {
    width: 100%;
    justify-content: center;
}

.icon-box.sm {
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
    flex-shrink: 0;
}

.title.sm {
    font-size: 1rem;
    margin: 0;
}

/* PC View Cleanup - Minimal Design */
@media (min-width: 1024px) {
    /* Adjust layout for centered/minimal look with ambient glow */
    .topic-card:not(.compact) {
        min-height: 140px; /* Reduced from 160px */
        align-items: center;
        text-align: center;
        padding: 1.25rem 1rem; /* Reduced from 1.5rem */
        background: radial-gradient(circle at center, rgba(255, 255, 255, 0.03) 0%, transparent 70%),
                    rgba(255, 255, 255, 0.02);
        box-shadow: inset 0 0 20px rgba(0,0,0,0.2);
        position: relative;
        overflow: hidden;
    }

    /* Show description again */
    .topic-card:not(.compact) .desc {
        display: block;
        font-size: 0.85rem; /* Slightly smaller */
        color: var(--text-secondary);
        margin-bottom: 0.75rem;
        max-width: 95%;
        margin-left: auto;
        margin-right: auto;
        position: relative;
        z-index: 1;
        line-height: 1.4;
    }

    /* Keep tags hidden for cleaner look, or maybe show them small? Let's keep hidden for now unless requested */
    .topic-card:not(.compact) .tags,
    .topic-card:not(.compact) .status {
        display: none;
    }

    /* Ambient colored glow - reduced size */
    .topic-card:not(.compact)::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 80px; /* Reduced */
        height: 80px;
        background: var(--accent);
        filter: blur(50px);
        opacity: 0.15;
        z-index: 0;
        pointer-events: none;
        transition: 0.5s;
    }

    .topic-card:not(.compact):hover::after {
        opacity: 0.25;
        width: 120px;
        height: 120px;
    }

    .topic-card:not(.compact) .card-header {
        justify-content: center;
        width: 100%;
        margin-bottom: 0.75rem;
        position: relative;
        z-index: 1;
    }

    /* Moderate Icon Size */
    .topic-card:not(.compact) .icon-box {
        width: 50px; /* Reduced from 60px */
        height: 50px;
        font-size: 1.8rem; /* Reduced */
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        box-shadow: 0 8px 16px rgba(0,0,0,0.2);
    }

    /* Moderate Title Size */
    .topic-card:not(.compact) .title {
        font-size: 1.2rem; /* Reduced from 1.3rem */
        font-weight: 700;
        margin-bottom: 0.5rem;
        position: relative;
        z-index: 1;
        text-shadow: 0 4px 12px rgba(0,0,0,0.5);
    }

    /* Hide Footer elements except button maybe? Or just keep it clean */
    .topic-card:not(.compact) .card-footer {
        justify-content: center;
        width: 100%;
        margin-top: 0.25rem;
        position: relative;
        z-index: 1;
    }
    
    .topic-card:not(.compact) .btn-icon {
        width: 32px;
        height: 32px;
        font-size: 1rem;
        background: rgba(255,255,255,0.05);
    }

    .topic-card:not(.compact) .progress-bar {
        display: none; /* Even cleaner */
    }
}

@media (max-width: 768px) {
    .topic-card {
        text-align: center;
        padding-top: 3rem; /* Add space for the number at top-left */
    }

    .card-header {
        justify-content: center;
        width: 100%;
        margin-bottom: 1rem;
    }

    .tags {
        display: none; /* Hide tags on mobile for cleaner look */
    }
    
    .card-number {
        /* Ensure number stays left and is visible */
        left: 1rem;
        right: auto;
        top: 0.5rem;
        font-size: 2.5rem; /* Bigger */
        opacity: 0.8; /* Much more visible */
        color: rgba(255, 255, 255, 0.2); /* Brighter */
        text-shadow: 0 0 10px rgba(0,0,0,0.5); /* Pop against background */
    }
}
</style>
