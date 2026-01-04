<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const canvasRef = ref(null)
let ctx = null
let animationFrameId = null
let particles = []
let formulas = []

let width = 0
let height = 0

// Physics symbols for floating background
const SYMBOLS = ['E=mc²', 'F=ma', 'λ', 'Ω', 'π', '∫', '∑', '∆', '⚡', '⚛️', 'v=u+at']

class Particle {
    constructor() {
        this.reset()
    }

    reset() {
        this.x = Math.random() * width
        this.y = Math.random() * height
        this.size = Math.random() * 2 + 1
        this.speedX = (Math.random() - 0.5) * 0.5
        this.speedY = (Math.random() - 0.5) * 0.5
        this.alpha = Math.random() * 0.3 + 0.1
    }

    update() {
        this.x += this.speedX
        this.y += this.speedY

        // Wrap around
        if (this.x < 0) this.x = width
        if (this.x > width) this.x = 0
        if (this.y < 0) this.y = height
        if (this.y > height) this.y = 0
    }

    draw() {
        ctx.fillStyle = `rgba(0, 212, 255, ${this.alpha})` // Cyan tint
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
    }
}

class Formula {
    constructor() {
        this.reset()
    }

    reset() {
        this.text = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
        this.x = Math.random() * width
        this.y = Math.random() * height
        this.size = Math.random() * 14 + 10 // 10px to 24px
        this.speedY = Math.random() * -0.5 - 0.1 // Float up slowly
        this.alpha = 0
        this.fadeState = 'in' // in, hold, out
        this.holdTime = Math.random() * 200 + 100
    }

    update() {
        this.y += this.speedY
        
        // Fade logic
        if (this.fadeState === 'in') {
            this.alpha += 0.005
            if (this.alpha >= 0.2) this.fadeState = 'hold'
        } else if (this.fadeState === 'hold') {
            this.holdTime--
            if (this.holdTime <= 0) this.fadeState = 'out'
        } else {
            this.alpha -= 0.005
            if (this.alpha <= 0) this.reset()
        }

        if (this.y < -50) this.reset()
    }

    draw() {
        ctx.font = `${this.size}px monospace`
        ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`
        ctx.fillText(this.text, this.x, this.y)
    }
}

const resize = () => {
    width = window.innerWidth
    height = window.innerHeight
    if (canvasRef.value) {
        canvasRef.value.width = width
        canvasRef.value.height = height
    }
}

const drawGrid = () => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'
    ctx.lineWidth = 1
    const gridSize = 50

    ctx.beginPath()
    for (let x = 0; x <= width; x += gridSize) {
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
    }
    for (let y = 0; y <= height; y += gridSize) {
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
    }
    ctx.stroke()
}

// Custom shapes for Physics Apparatus
const drawLens = (ctx, x, y, size, alpha) => {
    ctx.strokeStyle = `rgba(0, 212, 255, ${alpha})`
    ctx.lineWidth = 2
    ctx.beginPath()
    // Ellipse/Lens shape
    ctx.ellipse(x, y, size/3, size, 0, 0, Math.PI * 2)
    ctx.stroke()
    // Axis line
    ctx.beginPath()
    ctx.moveTo(x - size, y)
    ctx.lineTo(x + size, y)
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`
    ctx.stroke()
}

const drawPendulum = (ctx, x, y, size, alpha) => {
    ctx.strokeStyle = `rgba(0, 212, 255, ${alpha})`
    ctx.fillStyle = `rgba(0, 212, 255, ${alpha * 0.5})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x, y - size) // Pivot
    ctx.lineTo(x + size/2, y + size) // Bob pos (swinging right)
    ctx.stroke()
    
    ctx.beginPath()
    ctx.arc(x + size/2, y + size, size/4, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
}

const drawCaliper = (ctx, x, y, size, alpha) => {
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
    ctx.lineWidth = 2
    // Main scale
    ctx.beginPath()
    ctx.rect(x - size, y - size/4, size * 2, size/2)
    ctx.stroke()
    // Jaws
    ctx.beginPath()
    ctx.moveTo(x - size, y + size/4)
    ctx.lineTo(x - size, y + size)
    ctx.moveTo(x - size + size/4, y + size/4) // Vernier jaw
    ctx.lineTo(x - size + size/4, y + size/1.5)
    ctx.stroke()
}

class Doodle {
    constructor() {
        this.reset()
    }

    reset() {
        this.type = Math.floor(Math.random() * 3) // 0: Lens, 1: Pendulum, 2: Caliper
        this.x = Math.random() * width
        this.y = Math.random() * height
        this.size = Math.random() * 20 + 20 // 20-40px
        this.speedY = Math.random() * -0.3 - 0.1
        this.alpha = 0
        this.fadeState = 'in'
        this.holdTime = Math.random() * 300 + 200
        this.rotation = Math.random() * Math.PI * 2
        this.rotSpeed = (Math.random() - 0.5) * 0.01
    }

    update() {
        this.y += this.speedY
        this.rotation += this.rotSpeed
        
        if (this.fadeState === 'in') {
            this.alpha += 0.005
            if (this.alpha >= 0.15) this.fadeState = 'hold'
        } else if (this.fadeState === 'hold') {
            this.holdTime--
            if (this.holdTime <= 0) this.fadeState = 'out'
        } else {
            this.alpha -= 0.005
            if (this.alpha <= 0) this.reset()
        }

        if (this.y < -50) this.reset()
    }

    draw() {
        ctx.save()
        ctx.translate(this.x, this.y)
        ctx.rotate(this.rotation)
        // Reset translation for local drawing
        if (this.type === 0) drawLens(ctx, 0, 0, this.size, this.alpha)
        else if (this.type === 1) drawPendulum(ctx, 0, 0, this.size, this.alpha)
        else if (this.type === 2) drawCaliper(ctx, 0, 0, this.size, this.alpha)
        ctx.restore()
    }
}

const animate = () => {
    ctx.clearRect(0, 0, width, height)
    
    drawGrid()

    particles.forEach(p => {
        p.update()
        p.draw()
    })

    formulas.forEach(f => {
        f.update()
        f.draw()
    })
    
    doodles.forEach(d => {
        d.update()
        d.draw()
    })

    animationFrameId = requestAnimationFrame(animate)
}
    
let doodles = []

onMounted(() => {
    ctx = canvasRef.value.getContext('2d')
    resize()
    window.addEventListener('resize', resize)

    // Init items
    for(let i=0; i<30; i++) particles.push(new Particle())
    for(let i=0; i<10; i++) formulas.push(new Formula())
    for(let i=0; i<8; i++) doodles.push(new Doodle())

    animate()
})

onUnmounted(() => {
    window.removeEventListener('resize', resize)
    cancelAnimationFrame(animationFrameId)
})
</script>

<template>
  <canvas ref="canvasRef" class="lab-bg"></canvas>
</template>

<style scoped>
.lab-bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: -1;
    pointer-events: none;
    background: radial-gradient(circle at center, #0a0614 0%, #000 100%);
}
</style>
