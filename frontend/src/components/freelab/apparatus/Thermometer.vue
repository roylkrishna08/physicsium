<script setup>
import { computed } from 'vue'

const props = defineProps({
    temperature: {
        type: Number,
        default: 25 // Celsius
    },
    type: {
        type: String,
        default: 'thermometer'
    }
})

// Calculate red line height (0px at -10C, full at 110C)
// Range: -10 to 110 = 120 degrees span.
// Height available approx 180px.
// 25C is (25 - (-10)) = 35 relative. 35/120 * 180 = 52.5px
const mercuryHeight = computed(() => {
    const minTemp = -10
    const maxTemp = 110
    const range = maxTemp - minTemp
    const relative = Math.max(minTemp, Math.min(maxTemp, props.temperature)) - minTemp
    const percent = relative / range
    return 20 + (percent * 160) // 20px base buffer
})
</script>

<template>
    <div class="thermometer-container">
        <svg viewBox="0 0 40 220" class="thermo-svg">
            <defs>
                <linearGradient id="glass-tube" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stop-color="rgba(255,255,255,0.4)" />
                    <stop offset="50%" stop-color="rgba(255,255,255,0.1)" />
                    <stop offset="100%" stop-color="rgba(255,255,255,0.4)" />
                </linearGradient>
            </defs>
            
            <!-- Glass Body -->
            <path d="M15,10 L25,10 L25,190 Q25,200 30,205 Q20,215 10,205 Q15,200 15,190 Z" 
                  fill="url(#glass-tube)" stroke="#cbd5e1" stroke-width="1" />
            
            <!-- Bulb (Red Liquid) -->
            <circle cx="20" cy="205" r="8" fill="#ef4444" />
            
            <!-- Mercury/Alcohol Line -->
            <line x1="20" y1="200" x2="20" :y2="200 - mercuryHeight" stroke="#ef4444" stroke-width="4" stroke-linecap="round" />
            
            <!-- Scale Markings -->
            <g stroke="#94a3b8" stroke-width="1">
                <!-- Major ticks every 20px approx -->
                <line x1="25" y1="180" x2="30" y2="180" /> <!-- 0 -->
                <line x1="25" y1="153" x2="30" y2="153" /> <!-- 20 -->
                <line x1="25" y1="126" x2="30" y2="126" /> <!-- 40 -->
                <line x1="25" y1="100" x2="30" y2="100" /> <!-- 60 -->
                <line x1="25" y1="73"  x2="30" y2="73" /> <!-- 80 -->
                <line x1="25" y1="46"  x2="30" y2="46" /> <!-- 100 -->
            </g>
            
            <!-- Selection Hitbox (invisible) -->
            <rect x="0" y="0" width="40" height="220" fill="transparent" />
        </svg>
        <div class="temp-readout">{{ Math.round(temperature) }}°C</div>
    </div>
</template>

<style scoped>
.thermometer-container {
    width: 40px;
    height: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.thermo-svg {
    height: 100%;
    overflow: visible;
}

.temp-readout {
    position: absolute;
    top: -20px;
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 2px 4px;
    border-radius: 4px;
    font-size: 10px;
    pointer-events: none;
}
</style>
