<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({})

const canvasRef = ref(null)
const electrons = ref([])
const sphereRadius = 120
const sphereCenter = ref({ x: 400, y: 300 })
const electronRadius = 8
const maxElectrons = 12
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })



let animationId = null

onMounted(() => {
    if (canvasRef.value) {
        const canvas = canvasRef.value
        
        const resizeCanvas = () => {
            if (canvas) {
                // Get the display size
                const displayWidth = canvas.clientWidth
                const displayHeight = canvas.clientHeight
                
                // Check if the canvas is not the same size
                if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
                    canvas.width = displayWidth
                    canvas.height = displayHeight
                    
                    // Keep sphere at fixed center position if not checking drag
                    if (!isDragging.value) {
                        sphereCenter.value.x = canvas.width / 2
                        sphereCenter.value.y = canvas.height / 2
                        
                        // Re-init electrons to match new center
                        initElectrons() 
                    }
                }
            }
        }
        
        // Use ResizeObserver for accurate sizing during layout changes (sidebar collapse)
        const resizeObserver = new ResizeObserver(() => {
            resizeCanvas()
        })
        resizeObserver.observe(canvas)

        resizeCanvas()
        initElectrons()
        animate()
        
        return () => {
            resizeObserver.disconnect()
            if (animationId) cancelAnimationFrame(animationId)
        }
    }
})

onUnmounted(() => {
    if (animationId) {
        cancelAnimationFrame(animationId)
    }
})

const initElectrons = () => {
    electrons.value = []
    const angleStep = (2 * Math.PI) / maxElectrons
    
    for (let i = 0; i < maxElectrons; i++) {
        const angle = i * angleStep
        const x = sphereCenter.value.x + Math.cos(angle) * (sphereRadius + 20)
        const y = sphereCenter.value.y + Math.sin(angle) * (sphereRadius + 20)
        
        electrons.value.push({
            id: i,
            x,
            y,
            angle,
            removed: false,
            // Collection properties
            targetX: 0,
            targetY: 0,
            isMovingToCollection: false,
            collectionProgress: 0
        })
    }
}

const handleMouseDown = (event) => {
    if (!canvasRef.value) return
    
    const rect = canvasRef.value.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top
    

    // Check if clicking on sphere
    const dx = mouseX - sphereCenter.value.x
    const dy = mouseY - sphereCenter.value.y
    const distanceToCenter = Math.sqrt(dx * dx + dy * dy)
    
    if (distanceToCenter <= sphereRadius) {
        // Check if it's a drag (small movement) or a click
        const clickStartTime = Date.now()
        const startX = mouseX
        const startY = mouseY
        
        const checkClick = (e) => {
            const endTime = Date.now()
            const endRect = canvasRef.value.getBoundingClientRect()
            const endX = e.clientX - endRect.left
            const endY = e.clientY - endRect.top
            const moveDistance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2)
            
            // If released quickly and didn't move much, it's a click
            if (endTime - clickStartTime < 200 && moveDistance < 10) {
                // Remove one electron if any remain
                const activeElectron = electrons.value.find(e => !e.removed)
                if (activeElectron && canvasRef.value) {
                    activeElectron.removed = true
                    activeElectron.isMovingToCollection = true
                    activeElectron.collectionProgress = 0
                    
                    // Set collection target (arrange in circle to the right of sphere)
                    const removedCount = electrons.value.filter(e => e.removed).length
                    const collectionRadius = sphereRadius + 100
                    const angleOffset = -Math.PI / 2 // Start from top
                    const angleSpacing = Math.PI / 8 // Space between electrons
                    const angle = angleOffset + (removedCount - 1) * angleSpacing
                    
                    activeElectron.targetX = sphereCenter.value.x + Math.cos(angle) * collectionRadius
                    activeElectron.targetY = sphereCenter.value.y + Math.sin(angle) * collectionRadius
                }
            }
            
            isDragging.value = false
            canvasRef.value.removeEventListener('mouseup', checkClick)
        }
        
        isDragging.value = true
        dragOffset.value = { x: dx, y: dy }
        canvasRef.value.addEventListener('mouseup', checkClick, { once: true })
        return
    }
}

const handleMouseMove = (event) => {
    if (!canvasRef.value) return
    
    const rect = canvasRef.value.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top
    

    
    // Handle sphere dragging
    if (!isDragging.value || !canvasRef.value) return
    
    sphereCenter.value.x = mouseX - dragOffset.value.x
    sphereCenter.value.y = mouseY - dragOffset.value.y
    
    // Update electron positions
    const angleStep = (2 * Math.PI) / maxElectrons
    electrons.value.forEach((electron, i) => {
        const angle = i * angleStep
        electron.x = sphereCenter.value.x + Math.cos(angle) * (sphereRadius + 20)
        electron.y = sphereCenter.value.y + Math.sin(angle) * (sphereRadius + 20)
    })
}

const handleMouseUp = () => {

    isDragging.value = false
}



const animate = () => {
    if (!canvasRef.value) return
    
    const canvas = canvasRef.value
    const ctx = canvas.getContext('2d')
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Display electron charge equation at top
    const toSuperscript = (num) => {
        const superscripts = {
            '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
            '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
            '-': '⁻'
        }
        return num.toString().split('').map(char => superscripts[char] || char).join('')
    }
    
    const equation = `1e = 1.60 × 10${toSuperscript('-19')} C`
    ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.fillText(equation, canvas.width / 2, 80)
    

    
    // Draw 3D sphere with gradient
    const gradient = ctx.createRadialGradient(
        sphereCenter.value.x - sphereRadius * 0.3,
        sphereCenter.value.y - sphereRadius * 0.3,
        sphereRadius * 0.1,
        sphereCenter.value.x,
        sphereCenter.value.y,
        sphereRadius
    )
    gradient.addColorStop(0, '#475569')
    gradient.addColorStop(0.5, '#334155')
    gradient.addColorStop(1, '#1e293b')
    
    ctx.beginPath()
    ctx.arc(sphereCenter.value.x, sphereCenter.value.y, sphereRadius, 0, 2 * Math.PI)
    ctx.fillStyle = gradient
    ctx.fill()
    ctx.strokeStyle = '#64748b'
    ctx.lineWidth = 3
    ctx.stroke()
    
    // Display charge as text in coulombs
    const removedCount = electrons.value.filter(e => e.removed).length
    if (removedCount > 0) {
        // Calculate net charge in coulombs (1e = 1.602 × 10^-19 C)
        const chargeValue = removedCount * 1.602
        
        // Helper function to convert number to superscript
        const toSuperscript = (num) => {
            const superscripts = {
                '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
                '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
                '-': '⁻'
            }
            return num.toString().split('').map(char => superscripts[char] || char).join('')
        }
        
        // Format as proper scientific notation: +X.XX × 10⁻¹⁹
        const netCharge = `+${chargeValue.toFixed(2)} × 10${toSuperscript('-19')} C`
        
        // Draw charge text at center of sphere with enhanced styling
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.font = 'bold 32px "Segoe UI", Arial, sans-serif'
        
        // Add strong glow effect
        ctx.shadowColor = '#ff0055'
        ctx.shadowBlur = 30
        
        // Draw dark stroke for contrast
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)'
        ctx.lineWidth = 4
        ctx.strokeText(netCharge, sphereCenter.value.x, sphereCenter.value.y)
        
        // Draw main text with brighter color
        ctx.fillStyle = '#ff1166'
        ctx.fillText(netCharge, sphereCenter.value.x, sphereCenter.value.y)
        
        // Draw again with even stronger glow
        ctx.shadowBlur = 40
        ctx.fillStyle = '#ff3388'
        ctx.fillText(netCharge, sphereCenter.value.x, sphereCenter.value.y)
        
        // Reset shadow
        ctx.shadowBlur = 0
    }
    
    // Draw collected electrons in bottom-right corner
    const removedElectrons = electrons.value.filter(e => e.removed)
    
    removedElectrons.forEach(electron => {
        // Animate movement to collection
        if (electron.isMovingToCollection && electron.collectionProgress < 100) {
            electron.collectionProgress += 3
            const progress = electron.collectionProgress / 100
            
            // Ease out animation
            const eased = 1 - Math.pow(1 - progress, 3)
            
            // Interpolate position
            const startX = sphereCenter.value.x
            const startY = sphereCenter.value.y
            electron.x = startX + (electron.targetX - startX) * eased
            electron.y = startY + (electron.targetY - startY) * eased
        } else if (electron.collectionProgress >= 100) {
            electron.isMovingToCollection = false
            electron.x = electron.targetX
            electron.y = electron.targetY
        }
        
        // Draw electron
        ctx.beginPath()
        ctx.arc(electron.x, electron.y, electronRadius, 0, 2 * Math.PI)
        ctx.fillStyle = '#00d4ff'
        ctx.fill()
        ctx.strokeStyle = '#0ea5e9'
        ctx.lineWidth = 2
        ctx.stroke()
        
        // Draw - symbol
        ctx.fillStyle = '#000'
        ctx.font = 'bold 14px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('-', electron.x, electron.y)
    })
    
    // Display total negative charge on collected electrons
    if (removedElectrons.length > 0 && canvasRef.value) {
        const chargeValue = removedElectrons.length * 1.602
        
        // Helper function for superscript
        const toSuperscript = (num) => {
            const superscripts = {
                '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
                '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
                '-': '⁻'
            }
            return num.toString().split('').map(char => superscripts[char] || char).join('')
        }
        
        const negCharge = `−${chargeValue.toFixed(2)} × 10${toSuperscript('-19')} C`
        
        // Position label near the collected electrons (to the right of sphere)
        const labelX = sphereCenter.value.x + sphereRadius + 200
        const labelY = sphereCenter.value.y
        
        // Draw negative charge label
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif'
        
        // Glow effect
        ctx.shadowColor = '#00d4ff'
        ctx.shadowBlur = 30
        
        // Stroke for contrast
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)'
        ctx.lineWidth = 4
        ctx.strokeText(negCharge, labelX, labelY)
        
        // Main text
        ctx.fillStyle = '#00d4ff'
        ctx.fillText(negCharge, labelX, labelY)
        
        // Stronger glow
        ctx.shadowBlur = 40
        ctx.fillStyle = '#00eeff'
        ctx.fillText(negCharge, labelX, labelY)
        
        ctx.shadowBlur = 0
    }
    
    animationId = requestAnimationFrame(animate)
}

const createPair = () => {
    // Re-initialize electrons (reset system)
    initElectrons()
}

const resetLab = () => {
    initElectrons()
}

defineExpose({
    createPair,
    resetLab
})
</script>


<template>

    
    <div class="conservation-lab">
        <canvas 
            ref="canvasRef" 
            class="lab-canvas"
            @mousedown="handleMouseDown"
            @mousemove="handleMouseMove"
            @mouseup="handleMouseUp"
            @mouseleave="handleMouseUp"
        ></canvas>
    </div>
</template>

<style scoped>
.conservation-lab {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: transparent;
    overflow: hidden;
}

.lab-canvas {
    width: 100%;
    height: 100%;
    cursor: pointer;
    background: transparent;
}

/* Sidebar Controls Styling */
.sidebar-controls {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
}

.info-text {
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    color: #cbd5e1;
    font-size: 0.9rem;
    line-height: 1.5;
    text-align: center;
}

.btn-action {
    padding: 12px 24px;
    background: linear-gradient(90deg, #ff0055, #00d4ff);
    border: none;
    border-radius: 30px;
    color: white;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
    transition: transform 0.2s;
}

.btn-action:hover {
    transform: scale(1.05);
}

.btn-clear {
    padding: 12px 24px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 30px;
    color: white;
    cursor: pointer;
}


</style>
