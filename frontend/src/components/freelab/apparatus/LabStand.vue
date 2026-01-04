<script setup>
defineProps({
    type: {
        type: String,
        required: true
    }
})
</script>

<template>
    <div class="stand-container">
        <!-- Shared -->
        <svg style="position: absolute; width: 0; height: 0;" aria-hidden="true">
            <defs>
                 <linearGradient id="stand-rod" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#64748b;stop-opacity:1" />
                    <stop offset="40%" style="stop-color:#f1f5f9;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#475569;stop-opacity:1" />
                </linearGradient>
                <linearGradient id="stand-base" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#1e293b;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#334155;stop-opacity:1" />
                </linearGradient>
            </defs>
        </svg>

        <!-- Retort Stand -->
        <svg v-if="type === 'retort_stand'" viewBox="0 0 100 200" class="stand-svg">
            <!-- Heavy Base -->
            <rect x="15" y="190" width="70" height="8" rx="2" fill="url(#stand-base)" stroke="#0f172a" />
            <!-- Vertical Rod -->
            <rect x="48" y="10" width="4" height="180" fill="url(#stand-rod)" />
            <!-- Bosshead/Clamp -->
            <rect x="45" y="60" width="10" height="12" fill="#334155" rx="2" />
            <rect x="55" y="63" width="30" height="4" fill="url(#stand-rod)" /> <!-- The arm -->
            <path d="M85,63 L95,58 L95,68 Z" fill="#94a3b8" /> <!-- Clamp jaw -->
        </svg>

        <!-- Tripod Stand -->
        <svg v-if="type === 'tripod_stand'" viewBox="0 0 100 100" class="stand-svg">
            <!-- Top Ring (Perspective) -->
            <path d="M20,30 Q50,20 80,30 L80,35 Q50,45 20,35 Z" fill="#1e293b" stroke="#475569" stroke-width="1" />
            <path d="M20,30 Q50,20 80,30" fill="none" stroke="#94a3b8" stroke-width="1" /> <!-- Highlight -->
            
            <!-- Wire Gauze (Optional hint) -->
            <path d="M30,32 L70,32" stroke="rgba(255,255,255,0.2)" stroke-dasharray="2,2" />

            <!-- Legs -->
            <!-- Back Leg -->
            <path d="M50,35 L50,95" stroke="#334155" stroke-width="4" stroke-linecap="round" />
            <!-- Front Legs -->
            <path d="M25,35 L15,100" stroke="url(#stand-rod)" stroke-width="3" stroke-linecap="round" />
            <path d="M75,35 L85,100" stroke="url(#stand-rod)" stroke-width="3" stroke-linecap="round" />
        </svg>

        <!-- Test Tube Stand -->
        <svg v-if="type === 'test_tube_stand'" viewBox="0 0 120 80" class="stand-svg">
            <!-- Wood Texture Gradient -->
            <defs>
                <linearGradient id="wood-grad" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="0%" stop-color="#a16207" />
                     <stop offset="100%" stop-color="#713f12" />
                </linearGradient>
            </defs>
            
            <!-- Back Pillars -->
             <rect x="15" y="20" width="5" height="50" fill="#5c3a21" />
             <rect x="100" y="20" width="5" height="50" fill="#5c3a21" />

            <!-- Bottom Deck -->
            <path d="M10,70 L110,70 L115,80 L5,80 Z" fill="url(#wood-grad)" stroke="#451a03" />
            
            <!-- Top Deck -->
            <path d="M10,20 L110,20 L115,30 L5,30 Z" fill="url(#wood-grad)" stroke="#451a03" />
            
            <!-- Holes -->
            <ellipse cx="30" cy="25" rx="6" ry="3" fill="#3E2723" />
            <ellipse cx="55" cy="25" rx="6" ry="3" fill="#3E2723" />
            <ellipse cx="80" cy="25" rx="6" ry="3" fill="#3E2723" />
        </svg>
        
        <!-- Funnel Stand (Wooden) -->
        <svg v-if="type === 'funnel_stand'" viewBox="0 0 100 200" class="stand-svg">
             <rect x="20" y="190" width="60" height="10" fill="url(#wood-grad)" />
             <rect x="50" y="20" width="8" height="170" fill="url(#wood-grad)" />
             
             <!-- Clamp -->
             <rect x="48" y="70" width="12" height="15" fill="#5c3a21" />
             <rect x="60" y="75" width="20" height="5" fill="#a16207" />
             <circle cx="85" cy="77" r="12" fill="none" stroke="#a16207" stroke-width="3" />
        </svg>
    </div>
</template>

<style scoped>
.stand-container {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: flex-end;
}

.stand-svg {
    height: 100%;
    width: auto;
    overflow: visible;
}
</style>
