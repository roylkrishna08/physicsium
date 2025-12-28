<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const canvasRef = ref(null)
let animationId = null

// Physics Drawings
const drawAtom = (ctx, x, y, size, alpha) => {
    ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`
    ctx.lineWidth = 2
    
    // Orbit 1
    ctx.beginPath()
    ctx.ellipse(x, y, size, size * 0.3, Math.PI / 4, 0, Math.PI * 2)
    ctx.stroke()
    
    // Orbit 2
    ctx.beginPath()
    ctx.ellipse(x, y, size, size * 0.3, -Math.PI / 4, 0, Math.PI * 2)
    ctx.stroke()
    
    // Orbit 3
    ctx.beginPath()
    ctx.ellipse(x, y, size, size * 0.3, 0, 0, Math.PI * 2)
    ctx.stroke()
    
    // Nucleus
    ctx.fillStyle = `rgba(255, 200, 100, ${alpha})`
    ctx.beginPath()
    ctx.arc(x, y, size * 0.15, 0, Math.PI * 2)
    ctx.fill()
}

const drawMagnet = (ctx, x, y, size, alpha) => {
    const w = size * 1.2
    const h = size * 0.4
    
    ctx.lineWidth = 2
    
    // N Pole
    ctx.fillStyle = `rgba(255, 80, 80, ${alpha * 0.8})`
    ctx.fillRect(x - w/2, y - h/2, w/2, h)
    
    // S Pole
    ctx.fillStyle = `rgba(80, 80, 255, ${alpha * 0.8})`
    ctx.fillRect(x, y - h/2, w/2, h)
    
    // Field lines (arcs)
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.3})`
    ctx.beginPath()
    ctx.arc(x, y - h, w, Math.PI * 0.2, Math.PI * 0.8)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(x, y + h, w, Math.PI * 1.2, Math.PI * 1.8)
    ctx.stroke()
}

const drawWave = (ctx, x, y, size, alpha) => {
    ctx.strokeStyle = `rgba(100, 255, 150, ${alpha})`
    ctx.lineWidth = 2
    ctx.beginPath()
    for(let i = -size; i <= size; i+=5) {
        const waveY = Math.sin(i * 0.1) * (size * 0.4)
        if(i === -size) ctx.moveTo(x + i, y + waveY)
        else ctx.lineTo(x + i, y + waveY)
    }
    ctx.stroke()
}

const drawBlock = (ctx, x, y, size, alpha) => {
    ctx.strokeStyle = `rgba(255, 255, 100, ${alpha})`
    ctx.lineWidth = 2
    
    // Incline
    ctx.beginPath()
    ctx.moveTo(x - size, y + size/2)
    ctx.lineTo(x + size, y + size/2)
    ctx.lineTo(x + size, y - size/2)
    ctx.closePath()
    ctx.stroke()
    
    // Block
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.2})`
    ctx.fillRect(x, y - size * 0.2, size * 0.4, size * 0.4)
}

class Doodle {
    constructor(w, h) {
        this.reset(w, h)
    }

    reset(w, h) {
        this.x = Math.random() * w
        this.y = Math.random() * h
        this.type = Math.floor(Math.random() * 4) // 0: Atom, 1: Magnet, 2: Wave, 3: Block
        this.size = Math.random() * 30 + 30
        this.vx = (Math.random() - 0.5) * 0.3
        this.vy = (Math.random() - 0.5) * 0.3
        this.alpha = 0
        this.phase = 'in' // in, wait, out
        this.timer = Math.random() * 100
    }

    update(w, h) {
        this.x += this.vx
        this.y += this.vy
        
        if (this.phase === 'in') {
            this.alpha += 0.005
            if (this.alpha >= 0.4) this.phase = 'wait'
        } else if (this.phase === 'wait') {
            this.timer--
            if (this.timer <= 0) this.phase = 'out'
        } else {
            this.alpha -= 0.005
            if (this.alpha <= 0) this.reset(w, h)
        }
    }

    draw(ctx) {
        if (this.type === 0) drawAtom(ctx, this.x, this.y, this.size, this.alpha)
        else if (this.type === 1) drawMagnet(ctx, this.x, this.y, this.size, this.alpha)
        else if (this.type === 2) drawWave(ctx, this.x, this.y, this.size, this.alpha)
        else drawBlock(ctx, this.x, this.y, this.size, this.alpha)
    }
}

onMounted(() => {
    const canvas = canvasRef.value
    const ctx = canvas.getContext('2d')
    const doodles = Array.from({ length: 15 }, () => new Doodle(window.innerWidth, window.innerHeight))
    
    const resize = () => {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
    }
    
    window.addEventListener('resize', resize)
    resize()

    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        // Background Grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'
        ctx.lineWidth = 1
        const gridSize = 60
        ctx.beginPath()
        for (let x = 0; x < canvas.width; x += gridSize) {
            ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height)
        }
        for (let y = 0; y < canvas.height; y += gridSize) {
            ctx.moveTo(0, y); ctx.lineTo(canvas.width, y)
        }
        ctx.stroke()

        doodles.forEach(d => {
            d.update(canvas.width, canvas.height)
            d.draw(ctx)
        })
        
        animationId = requestAnimationFrame(animate)
    }
    
    animate()
})

onUnmounted(() => {
    cancelAnimationFrame(animationId)
})
</script>

<template>
  <canvas ref="canvasRef" class="topics-bg"></canvas>
</template>

<style scoped>
.topics-bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    background: linear-gradient(to bottom, #0a0e17, #111521);
    pointer-events: none;
}
</style>
