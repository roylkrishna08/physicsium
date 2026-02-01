<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref(null)
const animationId = ref(null)

class KinematicObject {
  constructor(canvas) {
    this.canvas = canvas
    this.reset()
  }

  reset() {
    this.type = Math.random() > 0.7 ? 'projectile' : (Math.random() > 0.4 ? 'circular' : 'linear')
    this.x = Math.random() * this.canvas.width
    this.y = Math.random() * this.canvas.height
    this.color = this.type === 'projectile' ? '#ff0055' : (this.type === 'circular' ? '#ffcc00' : '#00ff9d')
    this.radius = Math.random() * 2 + 1
    this.trail = []
    this.maxTrail = 30
    this.life = 0
    this.maxLife = 200 + Math.random() * 200

    if (this.type === 'linear') {
      this.vx = (Math.random() - 0.5) * 2
      this.vy = (Math.random() - 0.5) * 2
      this.ax = 0
      this.ay = 0
    } else if (this.type === 'projectile') {
      this.x = Math.random() * (this.canvas.width * 0.5)
      this.y = this.canvas.height
      this.vx = 2 + Math.random() * 4
      this.vy = -(8 + Math.random() * 8)
      this.ax = 0
      this.ay = 0.15 // Gravity
    } else if (this.type === 'circular') {
      this.centerX = this.x
      this.centerY = this.y
      this.orbitRadius = 30 + Math.random() * 50
      this.angle = Math.random() * Math.PI * 2
      this.angularVelocity = (Math.random() - 0.5) * 0.05
    }
  }

  draw(ctx) {
    // Draw trail
    if (this.trail.length > 2) {
      ctx.beginPath()
      ctx.moveTo(this.trail[0].x, this.trail[0].y)
      for (let i = 1; i < this.trail.length; i++) {
        ctx.lineTo(this.trail[i].x, this.trail[i].y)
      }
      ctx.strokeStyle = this.color + '22'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }

    // Draw object
    const opacity = this.life < 20 ? this.life / 20 : (this.life > this.maxLife - 20 ? (this.maxLife - this.life) / 20 : 1)
    ctx.globalAlpha = opacity

    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    ctx.fillStyle = this.color
    ctx.fill()
    
    // Draw Vectors
    if (this.life % 20 === 0 || this.life < 10) {
        // Velocity (Cyan)
        ctx.beginPath()
        ctx.moveTo(this.x, this.y)
        const vScale = 5
        const vx = this.type === 'circular' ? -Math.sin(this.angle) * this.orbitRadius * this.angularVelocity : this.vx
        const vy = this.type === 'circular' ? Math.cos(this.angle) * this.orbitRadius * this.angularVelocity : this.vy
        ctx.lineTo(this.x + vx * vScale, this.y + vy * vScale)
        ctx.strokeStyle = '#00d4ffaa'
        ctx.lineWidth = 1.2
        ctx.stroke()

        // Acceleration (Red/Yellow) if applicable
        if (this.type === 'projectile' || this.type === 'circular') {
            ctx.beginPath()
            ctx.moveTo(this.x, this.y)
            const aScale = 50
            let ax = 0, ay = 0
            if (this.type === 'projectile') {
                ay = this.ay
            } else {
                ax = -Math.cos(this.angle) * this.orbitRadius * (this.angularVelocity**2)
                ay = -Math.sin(this.angle) * this.orbitRadius * (this.angularVelocity**2)
            }
            ctx.lineTo(this.x + ax * aScale, this.y + ay * aScale)
            ctx.strokeStyle = '#ff0055cc'
            ctx.lineWidth = 1.2
            ctx.stroke()
        }
    }

    // Glow
    ctx.shadowBlur = 12
    ctx.shadowColor = this.color
    ctx.globalAlpha = 1.0
  }

  update() {
    this.life++
    this.trail.push({ x: this.x, y: this.y })
    if (this.trail.length > this.maxTrail) this.trail.shift()

    if (this.type === 'circular') {
        this.angle += this.angularVelocity
        this.x = this.centerX + Math.cos(this.angle) * this.orbitRadius
        this.y = this.centerY + Math.sin(this.angle) * this.orbitRadius
    } else {
        this.vx += this.ax
        this.vy += this.ay
        this.x += this.vx
        this.y += this.vy
    }

    if (this.life > this.maxLife || this.x < -100 || this.x > this.canvas.width + 100 || this.y > this.canvas.height + 100) {
      this.reset()
    }
  }
}

const initAnimation = () => {
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  
  const resize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  window.addEventListener('resize', resize)
  resize()

  const particleCount = window.innerWidth < 768 ? 20 : 60
  const particles = Array.from({ length: particleCount }, () => new KinematicObject(canvas))

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw background grid
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'
    ctx.lineWidth = 1
    const step = 50
    for (let x = 0; x < canvas.width; x += step) {
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
    }
    for (let y = 0; y < canvas.height; y += step) {
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
    }
    ctx.stroke()

    particles.forEach(p => {
      p.update()
      p.draw(ctx)
    })

    animationId.value = requestAnimationFrame(animate)
  }
  animate()
  
  return () => {
    window.removeEventListener('resize', resize)
  }
}

let cleanupAnimation = null

onMounted(() => {
  cleanupAnimation = initAnimation()
})

onUnmounted(() => {
  if (animationId.value) cancelAnimationFrame(animationId.value)
  if (cleanupAnimation) cleanupAnimation()
})
</script>

<template>
  <canvas ref="canvasRef" class="kinematics-bg"></canvas>
</template>

<style scoped>
.kinematics-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  opacity: 0.4;
  pointer-events: none;
}
</style>
