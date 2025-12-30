<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref(null)
const animationId = ref(null)

// Animation Logic
class Charge {
  constructor(canvas) {
    this.canvas = canvas
    this.x = Math.random() * canvas.width
    this.y = Math.random() * canvas.height
    this.radius = Math.random() * 3 + 2
    this.vx = (Math.random() - 0.5) * 0.5
    this.vy = (Math.random() - 0.5) * 0.5
    this.type = Math.random() > 0.5 ? 'positive' : 'negative'
    this.color = this.type === 'positive' ? '#ff0055' : '#00d4ff'
    this.fx = 0
    this.fy = 0
  }

  draw(ctx) {
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    ctx.fillStyle = this.color
    ctx.fill()
    
    // Glow
    ctx.shadowBlur = 10
    ctx.shadowColor = this.color
  }

  update() {
    this.x += this.vx
    this.y += this.vy

    if (this.x < 0 || this.x > this.canvas.width) this.vx *= -1
    if (this.y < 0 || this.y > this.canvas.height) this.vy *= -1
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

  const particleCount = window.innerWidth < 768 ? 12 : 30
  const charges = Array.from({ length: particleCount }, () => new Charge(canvas))

  // Mouse Interaction
  const mouse = { x: -1000, y: -1000, active: false }
  
  const handleMouseMove = (e) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.active = true
      clearTimeout(mouse.timer)
      mouse.timer = setTimeout(() => { mouse.active = false }, 2000)
  }
  
  const handleClick = (e) => {
      charges.forEach(p => {
          const dx = p.x - e.clientX
          const dy = p.y - e.clientY
          const dist = Math.sqrt(dx * dx + dy * dy)
          const force = 5000 / (dist + 10)
          p.vx += (dx / dist) * force
          p.vy += (dy / dist) * force
      })
  }

  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('click', handleClick)

  const drawLightning = (x1, y1, x2, y2, displacement, ctx) => {
    if (displacement < 2) {
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      return
    }
    
    let midX = (x1 + x2) / 2
    let midY = (y1 + y2) / 2
    midX += (Math.random() - 0.5) * displacement
    midY += (Math.random() - 0.5) * displacement
    
    drawLightning(x1, y1, midX, midY, displacement / 2, ctx)
    drawLightning(midX, midY, x2, y2, displacement / 2, ctx)
  }

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw Mouse Cursor
    if (mouse.active) {
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, 20, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
        ctx.lineWidth = 2
        ctx.stroke()
        
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, 5, 0, Math.PI * 2)
        ctx.fillStyle = '#fff'
        ctx.fill()
    }

    // Reset forces
    charges.forEach(p => { p.fx = 0; p.fy = 0 })

    // Physics Pass & Draw connections
    for (let i = 0; i < charges.length; i++) {
        let a = charges[i]
        
        // Mouse Force
        if (mouse.active) {
            const dx = a.x - mouse.x
            const dy = a.y - mouse.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            const minDist = 50
            
            if (dist < 300) {
                const force = 1000 / (dist * dist + 100)
                a.fx += (dx / dist) * force * 50
                a.fy += (dy / dist) * force * 50
            }
        }

        for (let j = i + 1; j < charges.length; j++) {
            let b = charges[j]
            
            const dx = a.x - b.x
            const dy = a.y - b.y
            let dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < 5) dist = 5

            // Coulomb Force
            const q1 = a.type === 'positive' ? 1 : -1
            const q2 = b.type === 'positive' ? 1 : -1
            const curvature = 2000
            
            const force = (curvature * q1 * q2) / (dist * dist)
            
            const fx = (dx / dist) * force
            const fy = (dy / dist) * force
            
            a.fx += fx
            a.fy += fy
            b.fx -= fx
            b.fy -= fy
            
            // Visuals
            if (dist < 150) {
              const isOpposite = a.type !== b.type
              
              if (isOpposite) {
                if (Math.random() > 0.92 && dist < 100) { 
                    ctx.beginPath()
                    ctx.shadowBlur = 30
                    ctx.shadowColor = '#b0e0ff'
                    ctx.strokeStyle = '#ffffff'
                    ctx.lineWidth = 2.5
                    drawLightning(a.x, a.y, b.x, b.y, 25, ctx)
                    ctx.stroke()
                    ctx.shadowBlur = 0
                } else if (dist < 100) {
                     ctx.beginPath()
                     ctx.strokeStyle = `rgba(100, 200, 255, ${0.2 - dist/1000})`
                     ctx.lineWidth = 0.5
                     ctx.moveTo(a.x, a.y)
                     ctx.lineTo(b.x, b.y)
                     ctx.stroke()
                }
              } else if (dist < 100) {
                 ctx.beginPath()
                 ctx.strokeStyle = `rgba(255, 255, 255, ${0.05 - dist/2000})`
                 ctx.lineWidth = 0.2
                 ctx.moveTo(a.x, a.y)
                 ctx.lineTo(b.x, b.y)
                 ctx.stroke()
              }
            }
        }
    }

    // Update positions
    charges.forEach(p => {
        p.vx += p.fx * 0.1
        p.vy += p.fy * 0.1
        p.vx *= 0.98
        p.vy *= 0.98
        p.x += p.vx
        p.y += p.vy
        
        if (p.x < 0 || p.x > canvas.width) { p.vx *= -1; p.x = Math.max(0, Math.min(canvas.width, p.x)) }
        if (p.y < 0 || p.y > canvas.height) { p.vy *= -1; p.y = Math.max(0, Math.min(canvas.height, p.y)) }
        
        p.draw(ctx)
    })

    animationId.value = requestAnimationFrame(animate)
  }
  animate()
  
  // Return cleanup function to be used by onUnmounted
  return () => {
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('click', handleClick)
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
  <canvas ref="canvasRef" class="electrostatics-bg"></canvas>
</template>

<style scoped>
.electrostatics-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  opacity: 0.6;
  pointer-events: none;
}
</style>
