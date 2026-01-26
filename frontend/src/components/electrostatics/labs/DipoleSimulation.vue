<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  mode: { type: String, default: 'point_charge' },
  showGrid: Boolean,
  showFieldLines: Boolean,
  showVectors: Boolean,
  playAnimation: Boolean,
  
  // Physics Params
  charges: { type: Array, default: () => [] }, // [{id, q, x, y}]
  testCharges: { type: Array, default: () => [] }, // [{id, x, y, trail: []}]
  dipoleQ: { type: Number, default: 1 },
  dipoleSep: { type: Number, default: 100 },
  dipoles: { type: Array, default: () => [] }, // [{id, q, sep, x, y, phi}]
  torqueE: { type: Number, default: 5 },
  torqueP: { type: Number, default: 5 },
  torqueAngle: { type: Number, default: 45 },
  torqueEAngle: { type: Number, default: 0 }, // Field direction in degrees
  damping: { type: Number, default: 0.2 },
  inertia: { type: Number, default: 2 },
  showEquilibrium: { type: Boolean, default: true },
  
  // Legacy prop just in case
  pointQ: { type: Number, default: 1 } 
})

const emit = defineEmits(['update:angle', 'update:charges', 'update:test-charges', 'update:dipoles'])

const canvasRef = ref(null)
const containerRef = ref(null)
let ctx = null
let animationId = null
let lastTime = 0

// Transform State (Zoom/Pan)
const transform = ref({ k: 1, x: 0, y: 0 })

// Interaction State
let draggedChargeIndex = -1
let draggedDipoleIndex = -1
let draggedTestChargeIndex = -1
let isDraggingCharge = false
let isDraggingDipole = false
let isRotatingDipole = false
let isDraggingTestCharge = false
let isPanning = false
let lastMousePos = { x: 0, y: 0 }

// Touch specific
let initialPinchDist = null
let isPinching = false

// Simulation State
const dipoleCenter = ref({ x: null, y: null }) // Persistent position in Field Mode
const dipolePhi = ref(0) // Persistent rotation in radians

let currentAngle = props.torqueAngle
let angularVelocity = 0
let flowOffset = 0 // Offset for field line flow animation

// --- Coordinate Helpers ---

function getScreenPos(e) {
    if (!canvasRef.value) return { x: 0, y: 0 }
    const rect = canvasRef.value.getBoundingClientRect()
    // Handle specific touch logic externally for multi-touch
    const clientX = e.clientX || 0
    const clientY = e.clientY || 0
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    }
}

function getTouchPos(touch) {
    if (!canvasRef.value) return { x: 0, y: 0 }
    const rect = canvasRef.value.getBoundingClientRect()
    return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
    }
}

function getDist(t1, t2) {
    const dx = t1.clientX - t2.clientX
    const dy = t1.clientY - t2.clientY
    return Math.sqrt(dx*dx + dy*dy)
}

function getCenter(t1, t2) {
    const rect = canvasRef.value.getBoundingClientRect()
    return {
        x: (t1.clientX + t2.clientX)/2 - rect.left,
        y: (t1.clientY + t2.clientY)/2 - rect.top
    }
}

function toWorld(sx, sy) {
    return {
        x: (sx - transform.value.x) / transform.value.k,
        y: (sy - transform.value.y) / transform.value.k
    }
}

// --- Interaction Handlers ---

function handleWheel(e) {
    e.preventDefault()
    const pos = getScreenPos(e)
    const zoomIntensity = 0.001
    const delta = -e.deltaY * zoomIntensity
    
    // Limit zoom
    const newK = Math.min(Math.max(0.1, transform.value.k * (1 + delta)), 5)
    const factor = newK / transform.value.k
    
    // Zoom towards mouse
    // (screen - tx) / k = world
    // screen - newTx = world * newK
    // newTx = screen - world * newK = screen - (screen - tx)/k * newK
    
    transform.value.x = pos.x - (pos.x - transform.value.x) * factor
    transform.value.y = pos.y - (pos.y - transform.value.y) * factor
    transform.value.k = newK
    
    requestAnimationFrame(draw)
}

function handleMouseDown(e) {
    const pos = getScreenPos(e)
    lastMousePos = pos
    const worldPos = toWorld(pos.x, pos.y)
    
    // Check Hit Test (World Space)
    if (props.mode === 'point_charge') {
        const rect = canvasRef.value.getBoundingClientRect()
        const center = toWorld(rect.width/2, rect.height/2)
        const fallbackX = center.x
        const fallbackY = center.y

        // Search backwards to pick the topmost charge
        for (let i = props.charges.length - 1; i >= 0; i--) {
            const c = props.charges[i]
            const charX = typeof c.x === 'number' ? c.x : fallbackX
            const charY = typeof c.y === 'number' ? c.y : fallbackY
            const dx = worldPos.x - charX
            const dy = worldPos.y - charY
            if ((dx*dx + dy*dy) < 30*30) {
                draggedChargeIndex = i
                break
            }
        }
        
        if (draggedChargeIndex !== -1) {
            isDraggingCharge = true
            if (e.cancelable) e.preventDefault()
            return
        }
    }

    if (props.mode === 'torque' && props.playAnimation) {
        // τ = - pE sin(θ - θE)
        // Here dipolePhi = -currentAngle * PI / 180
        // Field angle = props.torqueEAngle * PI / 180
        const theta_d = - (currentAngle * Math.PI / 180)
        const theta_e = - (props.torqueEAngle * Math.PI / 180)
        
        // Restoration Torque Magnitude 
        const torque = - props.torqueP * props.torqueE * Math.sin(theta_d - theta_e)
        const alpha = (torque / props.inertia) * 100 // Scale factor for visual speed
        
        angularVelocity += alpha * dt
        angularVelocity *= (1 - (props.damping * 4) * dt) // Damping
        
        currentAngle -= (angularVelocity * 180 / Math.PI) * dt
        emit('update:angle', currentAngle)
        needsAnimation = true
    }

    if (props.mode === 'dipole_field') {
        // Search backwards to pick the topmost dipole
        for (let i = props.dipoles.length - 1; i >= 0; i--) {
            const d = props.dipoles[i]
            const dc = { x: d.x !== null ? d.x : canvasRef.value.width/2, y: d.y !== null ? d.y : canvasRef.value.height/2 }
            const sep = d.sep; const phi = d.phi
            
            const x1 = dc.x - (sep/2) * Math.cos(phi); const y1 = dc.y - (sep/2) * Math.sin(phi)
            const x2 = dc.x + (sep/2) * Math.cos(phi); const y2 = dc.y + (sep/2) * Math.sin(phi)

            const d1 = Math.hypot(worldPos.x - x1, worldPos.y - y1)
            const d2 = Math.hypot(worldPos.x - x2, worldPos.y - y2)
            if (d1 < 30 || d2 < 30) {
                draggedDipoleIndex = i; isRotatingDipole = true; break
            }

            const distToStick = distToSegment(worldPos, {x: x1, y: y1}, {x: x2, y: y2})
            if (distToStick < 30) {
                draggedDipoleIndex = i; isDraggingDipole = true; break
            }
        }
        if (draggedDipoleIndex !== -1) {
            if (e.cancelable) e.preventDefault()
            return
        }
    }

    if (props.mode === 'torque') {
        const dc = dipoleCenter.value.x !== null ? dipoleCenter.value : { x: canvasRef.value.width/2, y: canvasRef.value.height/2 }
        const sep = props.dipoleSep
        const phi = - (currentAngle * Math.PI / 180)
        
        const x1 = dc.x - (sep/2) * Math.cos(phi); const y1 = dc.y - (sep/2) * Math.sin(phi)
        const x2 = dc.x + (sep/2) * Math.cos(phi); const y2 = dc.y + (sep/2) * Math.sin(phi)

        const d1 = Math.hypot(worldPos.x - x1, worldPos.y - y1)
        const d2 = Math.hypot(worldPos.x - x2, worldPos.y - y2)

        if (d1 < 30 || d2 < 30) {
            isRotatingDipole = true; if (e.cancelable) e.preventDefault(); return
        }

        const distToStick = distToSegment(worldPos, {x: x1, y: y1}, {x: x2, y: y2})
        if (distToStick < 15) {
            isDraggingDipole = true; if (e.cancelable) e.preventDefault(); return
        }
    }

    if (props.mode === 'point_charge' || props.mode === 'dipole_field') {
        draggedTestChargeIndex = props.testCharges.findIndex(tc => {
             if (tc.x === null || tc.y === null) return false
             const dx = worldPos.x - tc.x
             const dy = worldPos.y - tc.y
             return (dx*dx + dy*dy) < 20*20
        })

        if (draggedTestChargeIndex !== -1) {
            isDraggingTestCharge = true
            const updatedTCs = [...props.testCharges]
            updatedTCs[draggedTestChargeIndex] = { ...updatedTCs[draggedTestChargeIndex], frozen: false }
            emit('update:test-charges', updatedTCs)
            if (e.cancelable) e.preventDefault()
            return
        }
    }
    
    // If not hit, start panning
    isPanning = true
    if (e.cancelable) e.preventDefault()
}

function handleMouseMove(e) {
    const pos = getScreenPos(e)
    
    if (isDraggingCharge && draggedChargeIndex !== -1) {
        if (e.cancelable) e.preventDefault()
        const worldPos = toWorld(pos.x, pos.y)
        
        const newCharges = [...props.charges]
        if (newCharges[draggedChargeIndex]) {
            newCharges[draggedChargeIndex] = { 
                ...newCharges[draggedChargeIndex], 
                x: worldPos.x, 
                y: worldPos.y 
            }
            emit('update:charges', newCharges)
        }
    } else if (isDraggingDipole) {
        if (e.cancelable) e.preventDefault()
        const worldPos = toWorld(pos.x, pos.y)
        const prevWorld = toWorld(lastMousePos.x, lastMousePos.y)
        const dx = worldPos.x - prevWorld.x
        const dy = worldPos.y - prevWorld.y

        if (props.mode === 'dipole_field' && draggedDipoleIndex !== -1) {
            const newDipoles = [...props.dipoles]
            const d = newDipoles[draggedDipoleIndex]
            newDipoles[draggedDipoleIndex] = {
                ...d,
                x: (d.x !== null ? d.x : canvasRef.value.width/2) + dx,
                y: (d.y !== null ? d.y : canvasRef.value.height/2) + dy
            }
            emit('update:dipoles', newDipoles)
        } else if (props.mode === 'torque') {
            dipoleCenter.value.x += dx; dipoleCenter.value.y += dy
        }
        lastMousePos = pos
        requestAnimationFrame(draw)
    } else if (isRotatingDipole) {
        if (e.cancelable) e.preventDefault()
        const worldPos = toWorld(pos.x, pos.y)
        
        if (props.mode === 'dipole_field' && draggedDipoleIndex !== -1) {
            const newDipoles = [...props.dipoles]
            const d = newDipoles[draggedDipoleIndex]
            const dc = { x: d.x !== null ? d.x : canvasRef.value.width/2, y: d.y !== null ? d.y : canvasRef.value.height/2 }
            newDipoles[draggedDipoleIndex] = { ...d, phi: Math.atan2(worldPos.y - dc.y, worldPos.x - dc.x) }
            emit('update:dipoles', newDipoles)
        } else if (props.mode === 'torque') {
            const dc = dipoleCenter.value.x !== null ? dipoleCenter.value : { x: canvasRef.value.width/2, y: canvasRef.value.height/2 }
            currentAngle = - (Math.atan2(worldPos.y - dc.y, worldPos.x - dc.x) * 180 / Math.PI)
            emit('update:angle', currentAngle)
        }
        requestAnimationFrame(draw)
    }
 else if (isDraggingTestCharge && draggedTestChargeIndex !== -1) {
        if (e.cancelable) e.preventDefault()
        const worldPos = toWorld(pos.x, pos.y)
        const newTCs = [...props.testCharges]
        if (newTCs[draggedTestChargeIndex]) {
            newTCs[draggedTestChargeIndex] = { 
                ...newTCs[draggedTestChargeIndex], 
                x: worldPos.x, 
                y: worldPos.y,
                frozen: false 
            }
            emit('update:test-charges', newTCs)
        }
    } else if (isPanning) {
        if (e.cancelable) e.preventDefault()
        const dx = pos.x - lastMousePos.x
        const dy = pos.y - lastMousePos.y
        transform.value.x += dx
        transform.value.y += dy
        lastMousePos = pos
        requestAnimationFrame(draw)
    }
}

function handleMouseUp() {
    if (isDraggingTestCharge && draggedTestChargeIndex !== -1) {
        // Drop test charge - Clear trail to start fresh path
        const newTCs = [...props.testCharges]
        if (newTCs[draggedTestChargeIndex]) {
            newTCs[draggedTestChargeIndex] = { 
                ...newTCs[draggedTestChargeIndex], 
                trail: [], // Reset trail
                frozen: false 
            }
            emit('update:test-charges', newTCs)
        }
    }

    isDraggingCharge = false
    draggedChargeIndex = -1
    isDraggingDipole = false
    isRotatingDipole = false
    draggedDipoleIndex = -1
    isDraggingTestCharge = false
    draggedTestChargeIndex = -1
    isPanning = false
}



function distToSegment(p, v, w) {
    const l2 = (v.x - w.x)**2 + (v.y - w.y)**2
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y)
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2
    t = Math.max(0, Math.min(1, t))
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)))
}

// --- Zoom Controls ---

function zoomAtCenter(factor) {
    if (!canvasRef.value) return
    const rect = canvasRef.value.getBoundingClientRect()
    const cx = rect.width / 2
    const cy = rect.height / 2
    
    const newK = Math.min(Math.max(0.1, transform.value.k * factor), 5)
    const effectiveFactor = newK / transform.value.k
    
    transform.value.x = cx - (cx - transform.value.x) * effectiveFactor
    transform.value.y = cy - (cy - transform.value.y) * effectiveFactor
    transform.value.k = newK
    requestAnimationFrame(draw)
}

function zoomIn() { zoomAtCenter(1.2) }
function zoomOut() { zoomAtCenter(1/1.2) }
function resetView() {
    transform.value = { k: 1, x: 0, y: 0 }
    requestAnimationFrame(draw)
}

// --- Physics Logic (Test Charges) ---

function updateTestCharges() {
    if (props.testCharges.length === 0) return

    const newTestCharges = props.testCharges.map((tc, index) => {
        // Skip physics for dragged charge
        if (isDraggingTestCharge && index === draggedTestChargeIndex) return tc
        
        // Initialize position if needed
        if (tc.x === null || tc.y === null) return tc 
        if (tc.frozen) return tc

        let Ex = 0, Ey = 0
        let hit = false
        
        const rect = canvasRef.value.getBoundingClientRect()
        const center = toWorld(rect.width/2, rect.height/2)
        const fallbackX = center.x
        const fallbackY = center.y

        let sources = []
        if (props.mode === 'point_charge') {
            sources = props.charges
        } else if (props.mode === 'dipole_field') {
            props.dipoles.forEach(d => {
                const dc = { x: d.x !== null ? d.x : fallbackX, y: d.y !== null ? d.y : fallbackY }
                const sep = d.sep; const phi = d.phi
                sources.push({ x: dc.x - (sep/2) * Math.cos(phi), y: dc.y - (sep/2) * Math.sin(phi), q: d.q })
                sources.push({ x: dc.x + (sep/2) * Math.cos(phi), y: dc.y + (sep/2) * Math.sin(phi), q: -d.q })
            })
        }

        if (sources.length === 0) return tc

        // Sum fields
        for (const source of sources) {
            const sx = typeof source.x === 'number' ? source.x : fallbackX
            const sy = typeof source.y === 'number' ? source.y : fallbackY
            
            const dx = tc.x - sx; const dy = tc.y - sy
            const r2 = dx*dx + dy*dy
            const r = Math.sqrt(r2)
            
            if (r < 20) { hit = true; break; }
            
            const E = source.q / r2
            Ex += E * (dx/r)
            Ey += E * (dy/r)
        }
        
        if (hit) return { ...tc, frozen: true }
        
        const Emod = Math.sqrt(Ex*Ex + Ey*Ey)
        if (Emod < 1e-6) return tc
        
        // Move - Overdamped v proportional to E
        // Scale speed for visibility.
        const speed = Math.min(Emod * 5000, 10) // Cap speed
        const vx = (Ex/Emod) * speed
        const vy = (Ey/Emod) * speed
        
        const nextX = tc.x + vx 
        const nextY = tc.y + vy
        
        // Bounds check (optional, or let them fly off)
        if (nextX < -5000 || nextX > 5000 || nextY < -5000 || nextY > 5000) return { ...tc, frozen: true }

        // Update Trail
        const newTrail = [...(tc.trail || [])]
        // Add point if moved enough
        if (newTrail.length === 0 || Math.hypot(newTrail[newTrail.length-1].x - tc.x, newTrail[newTrail.length-1].y - tc.y) > 5) {
             newTrail.push({ x: tc.x, y: tc.y })
        }
        // Limit trail length to avoid perf issues
        if (newTrail.length > 200) newTrail.shift()

        return {
            ...tc,
            x: nextX,
            y: nextY,
            trail: newTrail
        }
    })
    
    emit('update:test-charges', newTestCharges)
}

function animate(time) {
    const dt = (time - lastTime) / 1000 || 0.016
    lastTime = time
    
    let needsAnimation = false

    // 1. Test Charge Physics
    if ((props.mode === 'point_charge' || props.mode === 'dipole_field') && props.testCharges.length > 0) {
        updateTestCharges()
        needsAnimation = true
    }

    // 2. Torque Physics
    if (props.playAnimation && props.mode === 'torque') {
        const angleRad = (currentAngle * Math.PI) / 180
    const fieldAngleRad = (props.torqueEAngle * Math.PI) / 180
    // Torque = -p * E * sin(theta_dipole - theta_field)
    const torque = - props.torqueP * props.torqueE * Math.sin(angleRad - fieldAngleRad)
        const inertia = 20.0 
        const damping = -2.5 * angularVelocity
        const angularAcceleration = (torque + damping) / inertia
        angularVelocity += angularAcceleration * dt * 50
        currentAngle += (angularVelocity * 180 / Math.PI) * dt
        needsAnimation = true
    }

    // 3. Field Line Animation (Always run if visible)
    if (props.showFieldLines) {
        flowOffset = (flowOffset + dt * 40) % 25
        needsAnimation = true
    }

    draw()
    
    if (needsAnimation || props.playAnimation) {
        animationId = requestAnimationFrame(animate)
    } else {
        animationId = null
    }
}

// --- Physics Helpers (Field Calculation) ---

function getFieldAt(x, y, charges, fallbackX, fallbackY) {
    let Ex = 0, Ey = 0
    let hit = false
    
    for (const other of charges) {
        const ox = typeof other.x === 'number' ? other.x : fallbackX
        const oy = typeof other.y === 'number' ? other.y : fallbackY
        const dx = x - ox; const dy = y - oy
        const r2 = dx*dx + dy*dy
        const r = Math.sqrt(r2)
        
        // Check for charge hit (singularity)
        if (r < 25) { hit = true; break; } 
        
        const E = other.q / r2
        Ex += E * (dx/r)
        Ey += E * (dy/r)
    }
    return { Ex, Ey, hit }
}

// --- Drawing Helpers ---

function drawGrid(ctx, visible) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)'
    ctx.lineWidth = 1
    const size = 50
    
    // Snap to grid
    const startX = Math.floor(visible.left / size) * size
    const startY = Math.floor(visible.top / size) * size
    
    for (let x = startX; x < visible.right; x += size) {
        ctx.beginPath(); ctx.moveTo(x, visible.top); ctx.lineTo(x, visible.bottom); ctx.stroke();
    }
    for (let y = startY; y < visible.bottom; y += size) {
        ctx.beginPath(); ctx.moveTo(visible.left, y); ctx.lineTo(visible.right, y); ctx.stroke();
    }
}

function drawCharge(ctx, x, y, polarity, radius, label = null) {
    ctx.save()
    
    const baseColor = polarity > 0 ? '#ef4444' : (polarity < 0 ? '#3b82f6' : '#64748b')
    
    // 1. Outer Glow (Atmospheric)
    ctx.shadowBlur = radius * 0.8
    ctx.shadowColor = baseColor
    
    // 2. Main Sphere Body
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    
    // Premium 3D Radial Gradient for Volume
    const grad = ctx.createRadialGradient(
        x - radius * 0.3, y - radius * 0.3, radius * 0.1, 
        x, y, radius
    )
    if (polarity > 0) { 
        grad.addColorStop(0, '#ff9fa1'); // Bright Highlight
        grad.addColorStop(0.3, '#ef4444'); // Main Red
        grad.addColorStop(1, '#450a0a'); // Deep Shadow
    } 
    else if (polarity < 0) { 
        grad.addColorStop(0, '#93c5fd'); // Bright Highlight
        grad.addColorStop(0.3, '#3b82f6'); // Main Blue
        grad.addColorStop(1, '#172554'); // Deep Shadow
    } 
    else { 
        grad.addColorStop(0, '#f8fafc'); 
        grad.addColorStop(1, '#334155'); 
    }
    
    ctx.fillStyle = grad; ctx.fill()
    
    // 3. Specular Highlight (Small bright dot)
    ctx.shadowBlur = 0
    ctx.beginPath()
    ctx.ellipse(x - radius * 0.4, y - radius * 0.4, radius * 0.15, radius * 0.1, Math.PI/4, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.fill()

    // 4. Rim Light (Subtle inner glow on the dark edge)
    ctx.beginPath()
    ctx.arc(x, y, radius - 1, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(${polarity > 0 ? '239, 68, 68' : '59, 130, 246'}, 0.3)`
    ctx.lineWidth = 1.5
    ctx.stroke()
    
    // 5. Crisp Outer Border
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1; ctx.stroke()
    
    // 6. Label
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.font = '800 14px "Inter", sans-serif'; 
    const text = label !== null ? label : `${polarity > 0 ? '+' : ''}${polarity}`
    
    // Strong outline for legibility
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.strokeText(text, x, y - (label ? 0 : 5))
    
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, x, y - (label ? 0 : 5))
    
    if (!label) {
        ctx.font = '700 9px "Inter", sans-serif'; 
        ctx.strokeText('µC', x, y + 9)
        ctx.fillText('µC', x, y + 9)
    }
    
    ctx.restore()
}

function drawArrowHead(ctx, x, y, angle, size) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle)
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-size, -size/2); ctx.lineTo(-size, size/2); ctx.closePath()
    ctx.fillStyle = ctx.strokeStyle; ctx.fill(); ctx.restore()
}

function drawVector(ctx, x, y, dx, dy, color, label = '') {
    const len = Math.sqrt(dx*dx + dy*dy)
    if (len < 5) return;
    
    ctx.save()
    // Drop shadow for professional look
    ctx.shadowBlur = 4
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3
    ctx.lineCap = 'round'
    
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x+dx, y+dy); ctx.stroke()
    const angle = Math.atan2(dy, dx)
    drawArrowHead(ctx, x+dx, y+dy, angle, 12)
    
    if (label) {
        ctx.shadowBlur = 0
        ctx.font = '800 13px "Inter", sans-serif'
        ctx.textAlign = 'center'
        // Position label slightly offset from the vector path
        const midX = x + dx * 0.5
        const midY = y + dy * 0.5
        const perpX = -dy / len * 15
        const perpY = dx / len * 15
        
        // Draw label background for readability
        const textWidth = ctx.measureText(label).width
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)'
        ctx.fillRect(midX + perpX - textWidth/2 - 4, midY + perpY - 10, textWidth + 8, 16)
        
        ctx.fillStyle = color
        ctx.fillText(label, midX + perpX, midY + perpY + 2)
    }
    
    ctx.restore()
}

function drawDipoleStick(ctx, x, y, size) {
     // Metallic Rod Styling
     const rodHeight = 8
     const rodGrad = ctx.createLinearGradient(0, -rodHeight/2, 0, rodHeight/2)
     rodGrad.addColorStop(0, '#475569') // Dark Top
     rodGrad.addColorStop(0.4, '#f8fafc') // Metallic Shine
     rodGrad.addColorStop(0.6, '#94a3b8') // Body
     rodGrad.addColorStop(1, '#1e293b') // Deep Shadow Bottom

     ctx.beginPath()
     ctx.rect(-size, -rodHeight/2, size*2, rodHeight)
     ctx.fillStyle = rodGrad
     ctx.fill()
     
     // Rod Caps
     ctx.fillStyle = '#cbd5e1'
     ctx.beginPath(); ctx.arc(-size, 0, rodHeight/2, 0.5*Math.PI, 1.5*Math.PI); ctx.fill()
     ctx.beginPath(); ctx.arc(size, 0, rodHeight/2, 1.5*Math.PI, 0.5*Math.PI); ctx.fill()

     drawCharge(ctx, size, 0, 1, 15, '+q')
     drawCharge(ctx, -size, 0, -1, 15, '-q')
     
     if (props.showVectors) {
         ctx.strokeStyle = '#10b981'; ctx.lineWidth = 3
         ctx.beginPath(); ctx.moveTo(-size/2, 25); ctx.lineTo(size/2, 25); ctx.stroke()
         ctx.beginPath(); ctx.moveTo(size/2, 25); ctx.lineTo(size/2 - 10, 20); ctx.lineTo(size/2 - 10, 30); ctx.fill()
         ctx.fillStyle = '#10b981'; ctx.font = 'bold 12px "Inter", sans-serif'
         ctx.fillText('p', 0, 42)
     }
}

// Update signature to accept visible bounds
function drawFieldLinesMulti(ctx, visible, charges) {
    const rect = canvasRef.value.getBoundingClientRect()
    const center = toWorld(rect.width/2, rect.height/2)
    const fallbackX = center.x
    const fallbackY = center.y

    // Set line dash for movement effect
    ctx.setLineDash([15, 10])
    ctx.lineDashOffset = -flowOffset
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)'
    ctx.lineWidth = 1.8

    charges.forEach(c => {
         if (c.q === 0) return
         const isPos = c.q > 0
         
         const count = Math.max(8, Math.floor(Math.abs(c.q) * 4)) 
         for (let i = 0; i < count; i++) {
            let angle = (i / count) * Math.PI * 2
            let cx = (typeof c.x === 'number' ? c.x : fallbackX) + Math.cos(angle) * 28 
            let cy = (typeof c.y === 'number' ? c.y : fallbackY) + Math.sin(angle) * 28
            
            ctx.beginPath(); ctx.moveTo(cx, cy)
            
            // RK4 Integration Constants
            const ds = 10 * (isPos ? 1 : -1) // Step size (positive for out, negative for in)

            for (let step = 0; step < 2000; step++) {
                // RK4 Step
                // k1
                const f1 = getFieldAt(cx, cy, charges, fallbackX, fallbackY)
                if (f1.hit) break
                const E1mod = Math.sqrt(f1.Ex*f1.Ex + f1.Ey*f1.Ey); if (E1mod === 0) break
                const k1x = (f1.Ex / E1mod) * ds
                const k1y = (f1.Ey / E1mod) * ds
                
                // k2
                const f2 = getFieldAt(cx + k1x*0.5, cy + k1y*0.5, charges, fallbackX, fallbackY)
                if (f2.hit) break
                const E2mod = Math.sqrt(f2.Ex*f2.Ex + f2.Ey*f2.Ey); if (E2mod === 0) break
                const k2x = (f2.Ex / E2mod) * ds
                const k2y = (f2.Ey / E2mod) * ds
                
                // k3
                const f3 = getFieldAt(cx + k2x*0.5, cy + k2y*0.5, charges, fallbackX, fallbackY)
                if (f3.hit) break
                const E3mod = Math.sqrt(f3.Ex*f3.Ex + f3.Ey*f3.Ey); if (E3mod === 0) break
                const k3x = (f3.Ex / E3mod) * ds
                const k3y = (f3.Ey / E3mod) * ds
                
                // k4
                const f4 = getFieldAt(cx + k3x, cy + k3y, charges, fallbackX, fallbackY)
                if (f4.hit) break
                const E4mod = Math.sqrt(f4.Ex*f4.Ex + f4.Ey*f4.Ey); if (E4mod === 0) break
                const k4x = (f4.Ex / E4mod) * ds
                const k4y = (f4.Ey / E4mod) * ds
                
                // Combine
                cx += (k1x + 2*k2x + 2*k3x + k4x) / 6
                cy += (k1y + 2*k2y + 2*k3y + k4y) / 6
                
                // Bounds Check
                if (cx < visible.left - 500 || cx > visible.right + 500 || cy < visible.top - 500 || cy > visible.bottom + 500) break;
                ctx.lineTo(cx, cy)
            }
            ctx.stroke()
         }
    })
    ctx.setLineDash([]) // Reset
}

function drawFieldLinesDipole(ctx, visible, x1, y1, x2, y2, q) {
    // Reuse the robust RK4 Multi-charge solver
    // Construct temporary charge objects
    const tempCharges = [
        { x: x1, y: y1, q: q },
        { x: x2, y: y2, q: -q }
    ]
    drawFieldLinesMulti(ctx, visible, tempCharges)
}

function drawUniformField(ctx, visible, strength, cx, cy) {
     const angleRad = (props.torqueEAngle * Math.PI) / 180
     // Inverse relationship: Stronger field (10) -> Small spacing (40), Weaker field (1) -> Large spacing (120)
     const spacing = 130 - (strength * 8) 
     
     // Restrict field to a box around the dipole
     const boxSize = 500 // +/- 250px
     
     ctx.save()
     ctx.translate(cx, cy)
     ctx.rotate(-angleRad)
     
     const halfSize = boxSize / 2
     
     // Visibility based on strength
     const opacity = 0.4 + (strength / 10) * 0.4
     ctx.strokeStyle = `rgba(74, 222, 128, ${opacity})`
     ctx.lineWidth = 3 + (strength / 10) * 3
     ctx.shadowBlur = 15
     ctx.shadowColor = 'rgba(74, 222, 128, 0.4)'

     // Dynamic movement (Flow effect)
     ctx.setLineDash([20, 15])
     ctx.lineDashOffset = -flowOffset * 1.5

     // Draw lines within the box [-halfSize, halfSize]
     // Center the lines relative to 0 (which is now cx,cy)
     const startY = Math.floor(-halfSize / spacing) * spacing
     
     for (let y = startY; y <= halfSize; y += spacing) {
         ctx.beginPath()
         ctx.moveTo(-halfSize, y); ctx.lineTo(halfSize, y)
         ctx.stroke()
         
         // Arrows
         for (let x = -halfSize + 50; x <= halfSize; x += 150) {
             drawArrowHead(ctx, x, y, 0, 12)
         }
     }
     
     // Draw a subtle border for the field area? User said "only around dipole". 
     // A border makes it look clean.
     ctx.strokeStyle = `rgba(74, 222, 128, ${opacity * 0.3})`
     ctx.lineWidth = 1
     ctx.setLineDash([5, 5])
     ctx.strokeRect(-halfSize, -halfSize, boxSize, boxSize)
     ctx.restore()
     ctx.shadowBlur = 0
     ctx.setLineDash([])

     // Direction Indicator (Fixed position in World Space)
     // Use an absolute position relative to the viewport top-left
     const indX = visible.left + 80
     const indY = visible.top + 80
     drawVector(ctx, indX, indY, Math.cos(-angleRad) * 70, Math.sin(-angleRad) * 70, '#4ade80', 'E')
}

function drawLabel(ctx, text, x, y) {
    ctx.save(); ctx.setTransform(1,0,0,1,0,0); 
    ctx.fillStyle = '#94a3b8'; ctx.font = '16px Sans-Serif'; ctx.textAlign = 'center'; ctx.fillText(text, x, y)
    ctx.restore()
}

function drawLabelScreen(ctx, text, x, y) {
     ctx.save(); ctx.setTransform(1,0,0,1,0,0); // Screen Space
     ctx.fillStyle = '#94a3b8'; ctx.font = '16px Sans-Serif'; ctx.textAlign = 'center'; 
     ctx.fillText(text, x, y)
     ctx.restore()
}

function drawTestCharges(ctx, visible, testCharges) {
    if (!testCharges) return
    testCharges.forEach(tc => {
        if (tc.x === null || tc.y === null) return
        
        ctx.save()
        // Draw Trail
        if (tc.trail && tc.trail.length > 1) {
            ctx.beginPath()
            ctx.moveTo(tc.trail[0].x, tc.trail[0].y)
            for (let i = 1; i < tc.trail.length; i++) {
                ctx.lineTo(tc.trail[i].x, tc.trail[i].y)
            }
            ctx.lineTo(tc.x, tc.y)
            ctx.strokeStyle = '#facc15' // Yellow
            ctx.lineWidth = 2
            ctx.stroke()
        }
        
        // Draw Particle
        ctx.beginPath()
        ctx.arc(tc.x, tc.y, 6, 0, Math.PI*2)
        ctx.fillStyle = '#fbbf24'
        ctx.fill()
        ctx.strokeStyle = 'white'
        ctx.lineWidth = 1
        ctx.stroke()
        
        ctx.fillStyle = 'white'; ctx.font = '10px Arial'; ctx.textAlign = 'center'; 
        ctx.fillText('q0', tc.x, tc.y - 10)
        
        ctx.restore()
    })
}

// --- Main Draw & Animation functions ---

function draw() {
    if (!ctx || !canvasRef.value) return
    const canvas = canvasRef.value
    const w = canvas.width
    const h = canvas.height
    
    // Clear Screen (Identity Transform)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, w, h)
    
    // Calculate Visible Bounds in World Space
    const t = transform.value
    const left = -t.x / t.k
    const top = -t.y / t.k
    const right = (w - t.x) / t.k
    const bottom = (h - t.y) / t.k
    const visible = { left, top, right, bottom }
    
    // Apply Transform
    ctx.translate(t.x, t.y)
    ctx.scale(t.k, t.k)
    
    // Center logic (World Center = w/2, h/2 of initial view roughly)
    // We use w/2, h/2 as the "Default Center" coordinate
    const cx = w/2
    const cy = h/2

    if (props.showGrid) drawGrid(ctx, visible)

    if (props.mode === 'point_charge') {
        props.charges.forEach(c => {
             drawCharge(ctx, typeof c.x === 'number' ? c.x : cx, typeof c.y === 'number' ? c.y : cy, c.q, 25)
        })
        if (props.showFieldLines) {
            drawFieldLinesMulti(ctx, visible, props.charges)
        }
        drawTestCharges(ctx, visible, props.testCharges)
    } 
    else if (props.mode === 'dipole_field') {
        let allCharges = []
        
        props.dipoles.forEach(d => {
            const dc = { x: d.x !== null ? d.x : cx, y: d.y !== null ? d.y : cy }
            const sep = d.sep; const q = d.q; const phi = d.phi
            
            ctx.save()
            ctx.translate(dc.x, dc.y)
            ctx.rotate(phi)
            drawDipoleStick(ctx, 0, 0, sep/2)
            ctx.restore()
            
            const x1 = dc.x - (sep/2) * Math.cos(phi); const y1 = dc.y - (sep/2) * Math.sin(phi)
            const x2 = dc.x + (sep/2) * Math.cos(phi); const y2 = dc.y + (sep/2) * Math.sin(phi)
            
            allCharges.push({ x: x1, y: y1, q: q })
            allCharges.push({ x: x2, y: y2, q: -q })
            
        })

        if (props.showFieldLines && allCharges.length > 0) {
            drawFieldLinesMulti(ctx, visible, allCharges)
        }

        drawTestCharges(ctx, visible, props.testCharges)
    }
    else if (props.mode === 'torque') {
        if (props.showFieldLines) {
            drawUniformField(ctx, visible, props.torqueE, cx, cy)
        }
        
        ctx.save()
        ctx.translate(cx, cy)
        const angleRad = (currentAngle * Math.PI) / 180
        ctx.rotate(-angleRad) 

        const size = 80
        drawDipoleStick(ctx, 0, 0, size)
        
        if (props.showVectors) {
             ctx.restore(); ctx.save(); ctx.translate(cx, cy)
             const angleRad = (currentAngle * Math.PI) / 180
             const tipX = size * Math.cos(-angleRad); const tipY = size * Math.sin(-angleRad)
             const F = props.torqueE * 18
             
             // Force on Positive Charge (+q)
             drawVector(ctx, tipX, tipY, F, 0, '#ef4444', '')
             
             // Force on Negative Charge (-q)
             drawVector(ctx, -tipX, -tipY, -F, 0, '#3b82f6', '')

             // Torque Indicator (Arc with arrow)
             const torqueMag = - props.torqueP * props.torqueE * Math.sin(angleRad)
             if (Math.abs(torqueMag) > 0.05) {
                 ctx.beginPath()
                 const arcRadius = 45
                 const startA = -angleRad
                 ctx.arc(0, 0, arcRadius, 0, -angleRad, (currentAngle < 0))
                 ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2.5; ctx.setLineDash([5, 3]); ctx.stroke()
                 ctx.setLineDash([])
                 
              // Torque label (Removed)
              }
              
              if (props.showEquilibrium) {
                  const theta_e = - (props.torqueEAngle * Math.PI / 180)
                  
                  // Stable Equilibrium (0 deg relative to E)
                  ctx.save()
                  ctx.rotate(theta_e)
                  ctx.fillStyle = '#10b981'; ctx.font = '600 12px "Inter", sans-serif'
                  // ctx.fillText('Stable (0°)', size + 40, 0)
                  ctx.beginPath(); ctx.arc(size + 20, 0, 4, 0, Math.PI*2); ctx.fill()
                  
                  // Unstable Equilibrium (180 deg relative to E)
                  ctx.fillStyle = '#ef4444'
                  // ctx.fillText('Unstable (180°)', -size - 50, 0)
                  ctx.beginPath(); ctx.arc(-size - 20, 0, 4, 0, Math.PI*2); ctx.fill()
                  ctx.restore()
              }

              ctx.restore()
        } else { ctx.restore() }
        
        
        if (props.showGrid) {
            ctx.beginPath(); ctx.arc(cx, cy, 50, 0, -(currentAngle * Math.PI) / 180, true); ctx.strokeStyle = 'yellow'; ctx.stroke()
        }
    }
}

function resize() {
    if (containerRef.value && canvasRef.value) {
        canvasRef.value.width = containerRef.value.clientWidth
        canvasRef.value.height = containerRef.value.clientHeight
        draw()
    }
}

// --- Touch Handlers ---

function handleTouchStart(e) {
    if (e.touches.length === 2) {
        e.preventDefault()
        isPinching = true
        initialPinchDist = getDist(e.touches[0], e.touches[1])
        return
    }
    
    if (e.touches.length === 1) {
        // Delegate to mouse logic for single touch
        // Create fake mouse event-like object
        const touch = e.touches[0]
        handleMouseDown({
           clientX: touch.clientX,
           clientY: touch.clientY,
           preventDefault: () => e.preventDefault(),
           cancelable: true
        })
    }
}

function handleTouchMove(e) {
    if (e.touches.length === 2 && isPinching) {
        e.preventDefault()
        const newDist = getDist(e.touches[0], e.touches[1])
        const center = getCenter(e.touches[0], e.touches[1])
        
        if (initialPinchDist > 0) {
            const scale = newDist / initialPinchDist
            
            // Limit zoom speed/range locally for smoothness
            const newK = Math.min(Math.max(0.1, transform.value.k * scale), 5)
            const factor = newK / transform.value.k
            
            // Zoom towards pinch center
            transform.value.x = center.x - (center.x - transform.value.x) * factor
            transform.value.y = center.y - (center.y - transform.value.y) * factor
            transform.value.k = newK
            
            initialPinchDist = newDist // Reset for continuous delta
            requestAnimationFrame(draw)
        }
        return
    }
    
    if (e.touches.length === 1 && !isPinching) {
         // Delegate
         const touch = e.touches[0]
         handleMouseMove({
            clientX: touch.clientX,
            clientY: touch.clientY,
            preventDefault: () => e.preventDefault(),
            cancelable: true
         })
    }
}

function handleTouchEnd(e) {
    if (e.touches.length < 2) {
        isPinching = false
        initialPinchDist = null
    }
    
    if (e.touches.length === 0) {
        handleMouseUp()
    }
}

// --- Lifecycle ---

onMounted(() => {
    if (canvasRef.value) {
        ctx = canvasRef.value.getContext('2d')
        window.addEventListener('resize', resize)
        
        const canvas = canvasRef.value
        canvas.addEventListener('wheel', handleWheel, { passive: false })
        canvas.addEventListener('wheel', handleWheel, { passive: false })
        canvas.addEventListener('mousedown', handleMouseDown)
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
        
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
        window.addEventListener('touchmove', handleTouchMove, { passive: false })
        window.addEventListener('touchend', handleTouchEnd)
        
        resize()
    }
})

onUnmounted(() => {
    window.removeEventListener('resize', resize)
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
    window.removeEventListener('touchmove', handleMouseMove)
    window.removeEventListener('touchend', handleMouseUp)
    cancelAnimationFrame(animationId)
})

watch(() => props.torqueAngle, (val) => {
    if (!props.playAnimation) {
        currentAngle = val
        angularVelocity = 0
        draw()
    }
})

// Initialize Charges (Center if null)
watch(() => props.charges, (newCharges) => {
    let needsUpdate = false
    const updatedCharges = newCharges.map(c => {
        if (c.x === null || c.y === null) {
            needsUpdate = true
            const canvas = canvasRef.value
            if (!canvas) return { ...c, x: 0, y: 0 }
            const rect = canvas.getBoundingClientRect()
            const centerWorld = toWorld(rect.width / 2, rect.height / 2)
            return { ...c, x: centerWorld.x, y: centerWorld.y }
        }
        return c
    })
    
    if (needsUpdate) {
        emit('update:charges', updatedCharges)
    }
}, { deep: true })

// Initialize Test Charges
watch(() => props.testCharges, (newTC) => {
    let needsUpdate = false
    const updated = newTC.map(tc => {
        if (tc.x === null || tc.y === null) {
            needsUpdate = true
            const canvas = canvasRef.value
            if (!canvas) return { ...tc, x: 0, y: 0 }
            const rect = canvas.getBoundingClientRect()
             // Center in World Space
            const centerWorld = toWorld(rect.width / 2, rect.height / 2)
            return { ...tc, x: centerWorld.x, y: centerWorld.y }
        }
        return tc
    })
    if (needsUpdate) emit('update:test-charges', updated)
    // Trigger animation if idle
    if (!animationId && newTC.length > 0) {
        lastTime = performance.now()
        animationId = requestAnimationFrame(animate)
    }
}, { deep: true })

// Initialize Dipoles
watch(() => props.dipoles, (newDipoles) => {
    let needsUpdate = false
    const updated = newDipoles.map((d, idx) => {
        if (d.x === null || d.y === null) {
            needsUpdate = true
            const canvas = canvasRef.value
            if (!canvas) return { ...d, x: 0, y: 0 }
            const rect = canvas.getBoundingClientRect()
            const centerWorld = toWorld(rect.width / 2, rect.height / 2)
            
            // Much larger staggered spawning
            const offset = 80 + (idx * 120) % 400
            const xDir = idx % 2 === 0 ? 1 : -1
            const yDir = idx % 3 === 0 ? 1 : -1
            return { 
                ...d, 
                x: centerWorld.x + (xDir * offset), 
                y: centerWorld.y + (yDir * offset)
            }
        }
        return d
    })
    if (needsUpdate) emit('update:dipoles', updated)
}, { deep: true, immediate: true })

watch(
    [
        () => props.mode, () => props.showGrid, () => props.showFieldLines, () => props.showVectors,
        () => props.dipoleQ, () => props.dipoleSep, () => props.dipoles,
        () => props.torqueE, () => props.torqueP, () => props.torqueEAngle
    ],
    () => {
         requestAnimationFrame(draw)
         if (props.showFieldLines && !animationId) {
             lastTime = performance.now()
             animationId = requestAnimationFrame(animate)
         }
    },
    { deep: true }
)
watch(() => props.charges, () => requestAnimationFrame(draw), { deep: true })

watch(() => props.playAnimation, (val) => {
    if (val) {
        lastTime = performance.now()
        animationId = requestAnimationFrame(animate)
    } else {
        cancelAnimationFrame(animationId)
    }
})
</script>

<template>
    <div class="simulation-container" ref="containerRef">
        <canvas ref="canvasRef"></canvas>
        
        <div class="zoom-controls">
            <button @click="zoomIn" title="Zoom In">+</button>
            <button @click="resetView" title="Reset View">⟲</button>
            <button @click="zoomOut" title="Zoom Out">−</button>
        </div>
    </div>
</template>

<style scoped>
.simulation-container {
    width: 100%;
    height: 100%;
    position: relative;
    background: #0f172a;
    overflow: hidden;
}

canvas {
    display: block;
    width: 100%;
    height: 100%;
    touch-action: none;
}

.zoom-controls {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: row;
    gap: 16px;
    z-index: 20;
}

.zoom-controls button {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    font-size: 1.4rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
    transition: all 0.2s;
    padding-bottom: 2px; /* Visual alignment for text */
}

.zoom-controls button:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1); 
}

.zoom-controls button:active {
    transform: scale(0.95);
}

@media (max-width: 768px) {
    .zoom-controls {
        bottom: 80px; /* Avoid overlapping with system bars or lower UI */
        gap: 12px;
    }
    
    .zoom-controls button {
        width: 44px; /* Slightly larger for touch */
        height: 44px;
        background: rgba(15, 23, 42, 0.8); /* Darker for contrast */
    }
}
</style>
