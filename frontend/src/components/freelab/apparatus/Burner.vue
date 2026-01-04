<script setup>
defineProps({
    type: {
        type: String,
        required: true
    },
    isOn: {
        type: Boolean,
        default: false
    },
    intensity: { // 0 to 1
        type: Number,
        default: 0.5
    }
})
</script>

<template>
    <div class="burner-container">
        <!-- Shared Gradients -->
        <svg style="position: absolute; width: 0; height: 0;" aria-hidden="true">
            <defs>
                <linearGradient id="metal-chrome" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#94a3b8;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#e2e8f0;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#64748b;stop-opacity:1" />
                </linearGradient>
                <linearGradient id="metal-dark" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#475569;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
                </linearGradient>
                <radialGradient id="flame-inner" cx="50%" cy="80%" r="50%">
                    <stop offset="0%" style="stop-color:#38bdf8;stop-opacity:0.9" /> <!-- Light Blue -->
                    <stop offset="100%" style="stop-color:#38bdf8;stop-opacity:0" />
                </radialGradient>
                 <radialGradient id="flame-outer" cx="50%" cy="80%" r="60%">
                    <stop offset="0%" style="stop-color:#2563eb;stop-opacity:0.6" /> <!-- Deep Blue -->
                    <stop offset="100%" style="stop-color:#2563eb;stop-opacity:0" />
                </radialGradient>
                <!-- Spirit Flame -->
                 <radialGradient id="flame-spirit" cx="50%" cy="80%" r="60%">
                    <stop offset="0%" style="stop-color:#facc15;stop-opacity:0.8" /> 
                    <stop offset="100%" style="stop-color:#dc2626;stop-opacity:0" />
                </radialGradient>
            </defs>
        </svg>

        <!-- Bunsen Burner -->
        <svg v-if="type === 'bunsen_burner'" viewBox="0 0 60 150" class="burner-svg">
            <defs>
                 <linearGradient id="base-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#334155" />
                    <stop offset="100%" stop-color="#0f172a" />
                 </linearGradient>
            </defs>

            <!-- Heavy Base -->
            <path d="M10,140 L50,140 L55,145 L5,145 Z" fill="url(#base-grad)" stroke="#1e293b" />
            <rect x="5" y="145" width="50" height="3" fill="#0f172a" />

            <!-- Chimney (Tune) -->
            <rect x="25" y="40" width="10" height="100" fill="url(#metal-chrome)" stroke="#64748b" stroke-width="0.5" />
            
            <!-- Collar (Air Vent) -->
            <rect x="23" y="110" width="14" height="15" fill="url(#metal-chrome)" stroke="#475569" stroke-width="0.5" />
            <rect x="26" y="114" width="8" height="6" fill="#1e293b" rx="1" /> <!-- The hole -->
            
            <!-- Side Tube (Gas Inlet) -->
            <path d="M23,130 L10,135" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" />
            
            <!-- Flame -->
            <g v-if="isOn" class="flame-group" :style="{ transform: `scale(${0.5 + intensity})` }">
                <!-- Outer Cone -->
                <path d="M22,40 Q30,0 38,40" fill="url(#flame-outer)" />
                <!-- Inner Cone -->
                <path d="M26,40 L30,25 L34,40" fill="url(#flame-inner)" />
            </g>
        </svg>

        <!-- Spirit Lamp -->
        <svg v-else-if="type === 'spirit_lamp'" viewBox="0 0 80 100" class="burner-svg">
             <!-- Glass Reservoir -->
             <path d="M20,90 Q15,90 15,80 L25,40 Q25,30 30,30 L50,30 Q55,30 55,40 L65,80 Q65,90 60,90 Z" 
                   fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.5)" stroke-width="1.5" />
             <!-- Spirit Fluid -->
             <path d="M22,85 L58,85 L54,50 L26,50 Z" fill="#60a5fa" opacity="0.4" />
             
             <!-- Metal Cap/Wick Holder -->
             <rect x="35" y="20" width="10" height="10" fill="url(#metal-chrome)" />
             <rect x="38" y="15" width="4" height="5" fill="#d1d5db" /> <!-- Wick exposed -->
             
             <!-- Flame -->
             <g v-if="isOn" class="flame-group">
                 <path d="M40,15 Q25,-10 40,-30 Q55,-10 40,15" fill="url(#flame-spirit)" opacity="0.9" />
             </g>
        </svg>
        
        <!-- Kerosene Burner (Stove style) -->
        <svg v-else-if="type === 'kerosene_burner'" viewBox="0 0 100 120" class="burner-svg">
            <!-- Tank -->
            <path d="M10,110 L90,110 L95,80 L5,80 Z" fill="#b91c1c" stroke="#7f1d1d" />
            <!-- Legs/Stand -->
            <line x1="20" y1="80" x2="20" y2="40" stroke="#333" stroke-width="3" />
            <line x1="80" y1="80" x2="80" y2="40" stroke="#333" stroke-width="3" />
            <!-- Top Grate -->
            <ellipse cx="50" cy="40" rx="35" ry="5" fill="none" stroke="#333" stroke-width="2" />
            <!-- Burner Head -->
            <rect x="40" y="60" width="20" height="20" fill="#333" />
             <!-- Flame -->
             <g v-if="isOn" class="flame-group">
                 <path d="M40,60 Q50,30 60,60" fill="url(#flame-spirit)" opacity="0.8" />
             </g>
        </svg>
    </div>
</template>

<style scoped>
.burner-container {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: flex-end;
}

.burner-svg {
    height: 100%;
    width: auto;
    overflow: visible;
}

.flame-group {
    animation: flicker 0.1s infinite alternate;
    transform-origin: center bottom;
}

@keyframes flicker {
    0% { transform: scale(1) skewX(0deg); }
    100% { transform: scale(1.05) skewX(2deg); }
}
</style>
