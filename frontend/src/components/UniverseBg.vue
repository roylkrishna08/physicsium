<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const canvasRef = ref(null)
let ctx = null
let animationFrameId = null
let stars = []
let shootingStars = []
let mouseX = 0
let mouseY = 0

// Configuration
const STAR_COUNT = 200
const SHOOTING_STAR_INTERVAL = 2000 // ms
let width = 0
let height = 0

class Star {
    constructor() {
        this.reset()
    }

    reset() {
        this.x = Math.random() * width
        this.y = Math.random() * height
        this.z = Math.random() * 2 + 0.5 // Depth/Size
        this.alpha = Math.random() * 0.5 + 0.1
        this.twinkleSpeed = Math.random() * 0.02 + 0.005
        this.twinkleDir = Math.random() > 0.5 ? 1 : -1
    }

    update() {
        // Twinkle
        this.alpha += this.twinkleSpeed * this.twinkleDir
        if (this.alpha > 0.8 || this.alpha < 0.1) {
            this.twinkleDir *= -1
        }

        // Mouse Parallax (subtle)
        const moveX = (mouseX - width / 2) * 0.0001 * this.z
        const moveY = (mouseY - height / 2) * 0.0001 * this.z
        this.x += moveX
        this.y += moveY

        // Wrap around
        if (this.x < 0) this.x = width
        if (this.x > width) this.x = 0
        if (this.y < 0) this.y = height
        if (this.y > height) this.y = 0
    }

    draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.z * 0.8, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`
        ctx.fill()
        
        // Glow
        if (this.z > 1.5) {
             ctx.shadowBlur = 5
             ctx.shadowColor = "white"
        } else {
             ctx.shadowBlur = 0
        }
    }
}

class ShootingStar {
    constructor() {
        this.reset()
    }
    
    reset() {
        this.x = Math.random() * width
        this.y = 0
        this.len = Math.random() * 80 + 10
        this.speed = Math.random() * 10 + 6
        this.size = Math.random() * 1 + 0.1
        this.waitTime = new Date().getTime() + Math.random() * 3000 + 500
        this.active = false
    }

    update() {
        if (this.active) {
            this.x -= this.speed
            this.y += this.speed
            if (this.x < 0 || this.y > height) {
                this.active = false
                this.wait()
            }
        } else {
            if (this.waitTime < new Date().getTime()) {
                this.active = true
            }
        }
    }
    
    wait() {
        this.waitTime = new Date().getTime() + Math.random() * 3000 + 500
        this.x = Math.random() * width + 200
        this.y = -50
    }

    draw() {
        if (this.active) {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"
            ctx.lineWidth = this.size
            ctx.beginPath()
            ctx.moveTo(this.x, this.y)
            ctx.lineTo(this.x + this.len, this.y - this.len)
            ctx.stroke()
        }
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

const animate = () => {
    ctx.clearRect(0, 0, width, height)
    
    stars.forEach(star => {
        star.update()
        star.draw()
    })
    
    shootingStars.forEach(star => {
        star.update()
        star.draw()
    })

    animationFrameId = requestAnimationFrame(animate)
}

const handleMouseMove = (e) => {
    mouseX = e.clientX
    mouseY = e.clientY
}

onMounted(() => {
    ctx = canvasRef.value.getContext('2d')
    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', handleMouseMove)
    
    // Init stars
    for(let i=0; i<STAR_COUNT; i++) {
        stars.push(new Star())
    }
    
    // Init shooting stars
    shootingStars.push(new ShootingStar())
    shootingStars.push(new ShootingStar())

    animate()
})

onUnmounted(() => {
    window.removeEventListener('resize', resize)
    window.removeEventListener('mousemove', handleMouseMove)
    cancelAnimationFrame(animationFrameId)
})
</script>

<template>
  <canvas ref="canvasRef" class="universe-bg"></canvas>
</template>

<style scoped>
.universe-bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: -2; /* Behind everything */
    background: radial-gradient(circle at bottom, #0b1023 0%, #05070e 100%);
    pointer-events: none;
}
</style>
