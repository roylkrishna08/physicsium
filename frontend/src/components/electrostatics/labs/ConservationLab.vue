<script setup>
import { ref } from 'vue'

const netCharge = ref(0)
const particles = ref([])

const createPair = () => {
    const x = window.innerWidth / 2
    const y = window.innerHeight / 2
    // Electron
    particles.value.push({
        id: Math.random(),
        type: '-',
        x: x + 20, y: y,
        vx: 2, vy: (Math.random()-0.5)*2
    })
    // Positron
    particles.value.push({
        id: Math.random(),
        type: '+',
        x: x - 20, y: y,
        vx: -2, vy: (Math.random()-0.5)*2
    })
}

// Simple loop to move particles
import { onMounted, onUnmounted } from 'vue'
let frameId

const update = () => {
    particles.value.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        
        // Bounce
        if(p.x < 0 || p.x > window.innerWidth) p.vx *= -1
        if(p.y < 0 || p.y > window.innerHeight) p.vy *= -1
    })
    frameId = requestAnimationFrame(update)
}

onMounted(() => {
    update()
})
onUnmounted(() => cancelAnimationFrame(frameId))
</script>

<template>
    <div class="conservation-lab">
        <div class="info-panel">
            <h2>Conservation of Charge</h2>
            <p>Charge cannot be created or destroyed, only transferred.</p>
            <div class="stat-box">
                <span>Net Charge of System:</span>
                <span class="value">{{ netCharge }} C</span>
            </div>
            <p class="subtitle">Creating particles in pairs preserves net charge.</p>
        </div>

        <div class="particles">
            <div 
                v-for="p in particles" 
                :key="p.id"
                class="particle"
                :class="p.type === '+' ? 'pos' : 'neg'"
                :style="{ left: p.x + 'px', top: p.y + 'px' }"
            >
                {{ p.type }}
            </div>
        </div>

        <div class="controls glass-panel">
            <button class="btn-action" @click="createPair">Generate +/- Pair</button>
            <button class="btn-clear" @click="particles = []">Reset System</button>
        </div>
    </div>
</template>

<style scoped>
.conservation-lab {
    width: 100%; height: 100vh;
    overflow: hidden;
    position: relative;
    background: radial-gradient(circle at center, #1e293b, #0f172a);
}

.info-panel {
    position: absolute;
    top: 6rem;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    color: white;
    z-index: 10;
}
.stat-box {
    margin: 1rem 0;
    font-size: 1.5rem;
    background: rgba(0,0,0,0.3);
    padding: 1rem 2rem;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.1);
    display: inline-block;
}
.value { color: #00ff9d; font-weight: bold; margin-left: 10px; }
.subtitle { opacity: 0.7; font-size: 0.9rem; }

.particle {
    position: absolute;
    width: 40px; height: 40px;
    border-radius: 50%;
    display: flex; justify-content: center; align-items: center;
    color: white; font-weight: bold; font-size: 1.2rem;
    box-shadow: 0 0 20px currentColor;
}
.pos { background: #ff0055; color: #ff0055; box-shadow: 0 0 20px #ff0055; background: rgba(255,0,85,0.2); border: 2px solid #ff0055; }
.neg { background: #00d4ff; color: #00d4ff; box-shadow: 0 0 20px #00d4ff; background: rgba(0,212,255,0.2); border: 2px solid #00d4ff; }

.glass-panel {
    position: absolute;
    bottom: 3rem; left: 50%;
    transform: translateX(-50%);
    display: flex; gap: 1rem;
}
.btn-action {
    padding: 12px 24px;
    background: linear-gradient(90deg, #ff0055, #00d4ff);
    border: none; border-radius: 30px;
    color: white; font-weight: bold; cursor: pointer;
    box-shadow: 0 0 20px rgba(255,255,255,0.2);
    transition: transform 0.2s;
}
.btn-action:hover { transform: scale(1.05); }
.btn-clear {
    padding: 12px 24px;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 30px; color: white; cursor: pointer;
}
</style>
