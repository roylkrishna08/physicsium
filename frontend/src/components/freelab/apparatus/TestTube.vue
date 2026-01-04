<script setup>
defineProps({
    type: String,
    fillLevel: {
        type: Number,
        default: 0
    },
    liquidColor: {
        type: String,
        default: '#3b82f6'
    }
})
</script>

<template>
    <div class="tube-container">
        <svg viewBox="0 0 30 100" class="tube-svg">
            <defs>
                <linearGradient id="glass-tube-grad" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stop-color="rgba(255,255,255,0.3)" />
                    <stop offset="20%" stop-color="rgba(255,255,255,0.1)" />
                    <stop offset="80%" stop-color="rgba(255,255,255,0.1)" />
                    <stop offset="100%" stop-color="rgba(255,255,255,0.3)" />
                </linearGradient>
            </defs>

            <!-- Liquid -->
            <path v-if="fillLevel > 0" 
                  d="M5,85 L5,90 Q5,95 15,95 Q25,95 25,90 L25,85 Z" 
                  :fill="liquidColor" opacity="0.8" />
            <!-- Simple fill rect for demo, ideally calculates height -->
            <rect v-if="fillLevel > 0" x="5" :y="90 - (fillLevel * 0.8)" width="20" :height="fillLevel * 0.8" :fill="liquidColor" opacity="0.8" />
            
            <!-- Glass Body -->
            <path d="M5,5 L5,90 Q5,98 15,98 Q25,98 25,90 L25,5" 
                  fill="url(#glass-tube-grad)" stroke="rgba(200,220,255,0.6)" stroke-width="1.5" />
            
            <!-- Rim -->
            <ellipse cx="15" cy="5" rx="10" ry="2" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.5" />
        </svg>
    </div>
</template>

<style scoped>
.tube-container {
    width: 30px;
    height: 100px;
}
.tube-svg {
    width: 100%;
    height: 100%;
    overflow: visible;
}
</style>
