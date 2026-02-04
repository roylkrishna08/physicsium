<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const canvas = ref(null)
let ctx = null
let animationFrameId = null
let particles = []
const mouse = { x: 0, y: 0, active: false }

class Particle {
  constructor(w, h) {
    this.x = Math.random() * w
    this.y = Math.random() * h
    this.vx = (Math.random() - 0.5) * 2
    this.vy = (Math.random() - 0.5) * 2
    this.size = Math.random() * 3 + 2 // Increased size
    this.mass = this.size
    this.color = `rgba(100, 220, 255, ${Math.random() * 0.5 + 0.3})` // Brighter and more opaque
  }

  update(w, h) {
    // Mouse attraction (gravity-like)
    if (mouse.active) {
      const dx = mouse.x - this.x
      const dy = mouse.y - this.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      
      if (dist < 300) {
        const force = 50 / (dist + 1) // Inverse distance for stability
        const angle = Math.atan2(dy, dx)
        this.vx += Math.cos(angle) * force * 0.05
        this.vy += Math.sin(angle) * force * 0.05
      }
    }

    // Default movement
    this.x += this.vx
    this.y += this.vy

    // Boundary wrap
    if (this.x < 0) this.x = w
    if (this.x > w) this.x = 0
    if (this.y < 0) this.y = h
    if (this.y > h) this.y = 0

    // Dampening
    this.vx *= 0.99
    this.vy *= 0.99
    
    // Minimum speed maintain
    if (Math.abs(this.vx) < 0.2) this.vx += (Math.random() - 0.5) * 0.1
    if (Math.abs(this.vy) < 0.2) this.vy += (Math.random() - 0.5) * 0.1
  }

  draw() {
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
  }
}

const resize = () => {
    if (!canvas.value) return
    canvas.value.width = window.innerWidth
    canvas.value.height = window.innerHeight
}

const initParticles = () => {
    if (!canvas.value) return
    particles = []
    const count = (window.innerWidth * window.innerHeight) / 15000
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(canvas.value.width, canvas.value.height))
    }
}

const animate = () => {
    if (!ctx || !canvas.value) return
    ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)

    // Optional: Draw gravity well at mouse
    if (mouse.active) {
        const gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 200);
        gradient.addColorStop(0, 'rgba(0, 212, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 200, 0, Math.PI * 2);
        ctx.fill();
    }

    particles.forEach(p => {
        p.update(canvas.value.width, canvas.value.height)
        p.draw()
    })

    animationFrameId = requestAnimationFrame(animate)
}

const handleMouseMove = (e) => {
    mouse.x = e.clientX
    mouse.y = e.clientY
    mouse.active = true
}

const handleMouseLeave = () => {
    mouse.active = false
}

onMounted(() => {
    if (!canvas.value) return
    ctx = canvas.value.getContext('2d')
    resize()
    initParticles()
    animate()

    window.addEventListener('resize', () => {
        resize()
        initParticles()
    })
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)
})

onBeforeUnmount(() => {
    cancelAnimationFrame(animationFrameId)
    window.removeEventListener('resize', resize)
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseleave', handleMouseLeave)
})
</script>

<template>
  <div class="gravitation-background">
    <canvas ref="canvas"></canvas>
    <div class="overlay"></div>
  </div>
</template>

<style scoped>
.gravitation-background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 0; /* Keep 0, but ensure content is higher */
    background: radial-gradient(circle at center, #1a1b26 0%, #000000 100%);
    overflow: hidden;
}

canvas {
    display: block;
}

.overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at 50% 50%, transparent 0%, #000 90%);
    pointer-events: none;
}
</style>
