<script setup>
import { computed } from 'vue'

const props = defineProps({
    type: {
        type: String,
        required: true, 
        validator: (value) => ['beaker', 'measuring_cylinder', 'volumetric_flask', 'pipette', 'burette'].includes(value)
    },
    fillLevel: {
        type: Number,
        default: 0 // 0 to 100
    },
    liquidColor: {
        type: String,
        default: '#3b82f6' // Blue default
    }
})

// Visual constants
const GLASS_GRADIENT = "url(#glass-gradient)"
const LIQUID_OPACITY = 0.6
</script>

<template>
    <div class="glassware-container">
        <!-- Shared Defs for Glass Effects -->
        <svg style="position: absolute; width: 0; height: 0; overflow: hidden;" aria-hidden="true">
            <defs>
                <linearGradient id="glass-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:rgba(255,255,255,0.1);stop-opacity:1" />
                    <stop offset="20%" style="stop-color:rgba(255,255,255,0.4);stop-opacity:1" />
                    <stop offset="50%" style="stop-color:rgba(255,255,255,0);stop-opacity:1" />
                    <stop offset="80%" style="stop-color:rgba(255,255,255,0.4);stop-opacity:1" />
                    <stop offset="100%" style="stop-color:rgba(255,255,255,0.1);stop-opacity:1" />
                </linearGradient>
                <linearGradient id="glass-shine" x1="0%" y1="0%" x2="100%" y2="0%">
                     <stop offset="0%" style="stop-color:rgba(255,255,255,0);stop-opacity:0" />
                     <stop offset="50%" style="stop-color:rgba(255,255,255,0.8);stop-opacity:1" />
                     <stop offset="100%" style="stop-color:rgba(255,255,255,0);stop-opacity:0" />
                </linearGradient>
            </defs>
        </svg>

        <!-- Beaker: Realistic Shape with Lip and Graduations -->
        <svg v-if="type === 'beaker'" viewBox="0 0 100 120" class="glass-svg">
            <!-- Liquid -->
            <path v-if="fillLevel > 0" 
                  d="M15,90 L15,100 Q15,110 25,110 L75,110 Q85,110 85,100 L85,90 Z" 
                  :fill="liquidColor" :opacity="LIQUID_OPACITY" />
            
            <!-- Glass Body -->
            <path d="M15,10 L15,100 Q15,110 25,110 L75,110 Q85,110 85,100 L85,10" 
                  fill="url(#glass-gradient)" stroke="rgba(200,220,255,0.5)" stroke-width="1.5" />
            
            <!-- Rim / Lip -->
            <path d="M15,10 Q50,15 85,10" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1.5"/>
            <path d="M85,10 L95,5" stroke="rgba(255,255,255,0.6)" stroke-width="1.5" stroke-linecap="round"/>
            
            <!-- Highlights -->
            <path d="M18,15 L18,100" stroke="url(#glass-shine)" stroke-width="3" opacity="0.4" />
            
            <!-- Graduations (Approximate) -->
            <line x1="25" y1="90" x2="45" y2="90" stroke="rgba(255,255,255,0.5)" stroke-width="1" />
            <text x="50" y="92" fill="rgba(255,255,255,0.7)" font-size="8">50ml</text>
            <line x1="25" y1="70" x2="45" y2="70" stroke="rgba(255,255,255,0.5)" stroke-width="1" />
            <line x1="25" y1="50" x2="45" y2="50" stroke="rgba(255,255,255,0.5)" stroke-width="1" />
            <text x="50" y="52" fill="rgba(255,255,255,0.7)" font-size="8">150ml</text>
        </svg>

        <!-- Measuring Cylinder: Hexagonal Base, Tall Narrow Body -->
        <svg v-else-if="type === 'measuring_cylinder'" viewBox="0 0 60 200" class="glass-svg">
            <!-- Base (Plastic/Glass Hexagon) -->
            <path d="M10,190 L50,190 L55,195 L5,195 Z" fill="rgba(200,200,255,0.2)" stroke="rgba(255,255,255,0.4)" />
            
            <!-- Cylinder Body -->
            <rect x="20" y="10" width="20" height="180" fill="url(#glass-gradient)" stroke="rgba(200,220,255,0.5)" stroke-width="1.5" />
            
            <!-- Rim -->
            <ellipse cx="30" cy="10" rx="10" ry="2" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1.5" />
            
            <!-- Highlights -->
            <rect x="22" y="12" width="3" height="176" fill="url(#glass-shine)" opacity="0.4" />

            <!-- Detailed Graduations -->
            <g stroke="rgba(255,255,255,0.4)" stroke-width="1">
                <line x1="20" y1="180" x2="30" y2="180" /> <!-- 10 -->
                <line x1="20" y1="160" x2="25" y2="160" />
                <line x1="20" y1="140" x2="30" y2="140" /> <!-- 30 -->
                <line x1="20" y1="120" x2="25" y2="120" />
                <line x1="20" y1="100" x2="30" y2="100" /> <!-- 50 -->
                <line x1="20" y1="80" x2="25" y2="80" />
                <line x1="20" y1="60" x2="30" y2="60" /> <!-- 70 -->
                <line x1="20" y1="40" x2="25" y2="40" />
                <line x1="20" y1="20" x2="30" y2="20" /> <!-- 90 -->
            </g>
        </svg>

        <!-- Volumetric Flask: Round Bottom, Long Neck, Single Mark -->
        <svg v-else-if="type === 'volumetric_flask'" viewBox="0 0 100 150" class="glass-svg">
            <!-- Bulb Body -->
            <path d="M50,145 C75,145 90,130 90,105 C90,85 75,70 58,65 L58,10 L42,10 L42,65 C25,70 10,85 10,105 C10,130 25,145 50,145 Z" 
                  fill="url(#glass-gradient)" stroke="rgba(200,220,255,0.5)" stroke-width="1.5" />
                  
            <!-- Rim -->
            <ellipse cx="50" cy="10" rx="8" ry="2" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1.5" />
            
            <!-- Calibration Mark (The key feature) -->
            <line x1="42" y1="40" x2="58" y2="40" stroke="#facc15" stroke-width="1.5" stroke-opacity="0.8" />
            
            <!-- Label -->
            <text x="35" y="100" fill="rgba(255,255,255,0.6)" font-size="8">250ml</text>
        </svg>

        <!-- Pipette: Bulbed center, tapered tip -->
        <svg v-else-if="type === 'pipette'" viewBox="0 0 40 200" class="glass-svg">
            <path d="M20,200 L18,180 L18,130 C18,125 12,120 12,100 C12,80 18,75 18,70 L18,0 L22,0 L22,70 C22,75 28,80 28,100 C28,120 22,125 22,130 L22,180 L20,200 Z" 
                  fill="url(#glass-gradient)" stroke="rgba(200,220,255,0.5)" stroke-width="1.5" />
            <!-- Mark -->
            <line x1="18" y1="20" x2="22" y2="20" stroke="#facc15" stroke-width="1.5" />
        </svg>

        <!-- Burette: Long tube with Stopcock -->
        <svg v-else-if="type === 'burette'" viewBox="0 0 40 250" class="glass-svg">
            <!-- Tube -->
            <rect x="15" y="0" width="10" height="210" fill="url(#glass-gradient)" stroke="rgba(200,220,255,0.5)" stroke-width="1.5" />
            
            <!-- Stopcock Assembly -->
            <path d="M12,210 L28,210 L28,220 L25,225 L25,245 L15,225 L12,220 Z" fill="rgba(255,255,255,0.2)" stroke="rgba(200,220,255,0.5)" />
            
            <!-- Tap Key -->
            <path d="M10,218 L30,218" stroke="rgba(255,255,255,0.8)" stroke-width="3" stroke-linecap="round" />
            <circle cx="20" cy="218" r="3" fill="#334155" />

            <!-- Graduations -->
            <g stroke="rgba(255,255,255,0.4)" stroke-width="0.5">
                <line v-for="i in 20" :key="i" x1="15" :y1="i*10" x2="20" :y2="i*10" />
            </g>
        </svg>
    </div>
</template>

<style scoped>
.glassware-container {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    filter: drop-shadow(0 0 5px rgba(255,255,255,0.2));
}

.glass-svg {
    height: 100%;
    width: auto;
    max-width: 100%;
    overflow: visible;
}
</style>
