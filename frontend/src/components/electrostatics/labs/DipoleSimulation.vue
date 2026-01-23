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
  torqueE: { type: Number, default: 5 },
  torqueP: { type: Number, default: 5 },
  torqueAngle: { type: Number, default: 45 },
  
  // Legacy prop just in case
  pointQ: { type: Number, default: 1 } 
})

const emit = defineEmits(['update:angle', 'update:charges', 'update:test-charges'])

const canvasRef = ref(null)
const containerRef = ref(null)
let ctx = null
let animationId = null
let lastTime = 0

// Transform State (Zoom/Pan)
const transform = ref({ k: 1, x: 0, y: 0 })

// Interaction State
// Interaction State
let draggedChargeIndex = -1
let draggedTestChargeIndex = -1
let isDraggingCharge = false
let isDraggingTestCharge = false
let isPanning = false
let lastMousePos = { x: 0, y: 0 }

// Simulation State
let currentAngle = props.torqueAngle
let angularVelocity = 0

// --- Coordinate Helpers ---

function getScreenPos(e) {
    if (!canvasRef.value) return { x: 0, y: 0 }
    const rect = canvasRef.value.getBoundingClientRect()
    // Handle Touch
    const clientX = e.touches ? e.touches[0].clientX : (e.clientX || 0)
    const clientY = e.touches ? e.touches[0].clientY : (e.clientY || 0)
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
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
    
    // Check Hit Test (World Space)
    if (props.mode === 'point_charge') {
        const worldPos = toWorld(pos.x, pos.y)
        const rect = canvasRef.value.getBoundingClientRect() 
        // Note: Default coords (cx, cy) are conceptually World Coords w/2, h/2
        // Wait, if scale=1, tx=0, cx=w/2.
        // We need to resolve charge position fallback roughly.
        // The fallback `c.x || cx` relies on `cx` being calculated in `draw`
        // Let's assume standard fallback is canvas.width/2.
        const fallbackX = canvasRef.value.width / 2
        const fallbackY = canvasRef.value.height / 2

        draggedChargeIndex = props.charges.findIndex(c => {
             const charX = typeof c.x === 'number' ? c.x : fallbackX
             const charY = typeof c.y === 'number' ? c.y : fallbackY
             const dx = worldPos.x - charX
             const dy = worldPos.y - charY
             return (dx*dx + dy*dy) < 30*30 
        })
        
        if (draggedChargeIndex !== -1) {
            isDraggingCharge = true
            if (e.cancelable) e.preventDefault()
            return
        }

        // 2. Check Test Charges
        draggedTestChargeIndex = props.testCharges.findIndex(tc => {
             if (tc.x === null || tc.y === null) return false
             const dx = worldPos.x - tc.x
             const dy = worldPos.y - tc.y
             return (dx*dx + dy*dy) < 20*20 // Hit radius 20
        })

        if (draggedTestChargeIndex !== -1) {
            isDraggingTestCharge = true
            // Unfreeze immediately so it's ready
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
    } else if (isDraggingTestCharge && draggedTestChargeIndex !== -1) {
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
    isDraggingTestCharge = false
    draggedTestChargeIndex = -1
    isPanning = false
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
    if (props.testCharges.length === 0 || props.charges.length === 0) return

    const newTestCharges = props.testCharges.map((tc, index) => {
        // Skip physics for dragged charge
        if (isDraggingTestCharge && index === draggedTestChargeIndex) return tc
        
        // Initialize position if needed
        if (tc.x === null || tc.y === null) return tc // Handled by watcher
        if (tc.frozen) return tc

        let Ex = 0, Ey = 0
        let hit = false
        
        // Sum fields
        for (const source of props.charges) {
            // Need to carefully handle if source x/y are null (fallback)
            // But main loop initializes them usually.
            const sx = typeof source.x === 'number' ? source.x : 0 // Should be init
            const sy = typeof source.y === 'number' ? source.y : 0
            
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
    const dt = (time - lastTime) / 1000
    lastTime = time
    
    // Test Charge Physics
    if (props.mode === 'point_charge' && props.testCharges.length > 0) {
        updateTestCharges()
        draw()
        animationId = requestAnimationFrame(animate)
        return
    }

    if (!props.playAnimation || props.mode !== 'torque') return
    
    const angleRad = (currentAngle * Math.PI) / 180
    const torque = - props.torqueP * props.torqueE * Math.sin(angleRad)
    const damping = -2.0 * angularVelocity
    
    angularVelocity += (torque + damping) * 0.08
    currentAngle += (angularVelocity * 180 / Math.PI) * 0.016
    
    draw()
    animationId = requestAnimationFrame(animate)
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
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
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

function drawCharge(ctx, x, y, polarity, radius) {
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    const grad = ctx.createRadialGradient(x, y, radius*0.2, x, y, radius)
    if (polarity > 0) { grad.addColorStop(0, '#fca5a5'); grad.addColorStop(1, '#ef4444'); } 
    else if (polarity < 0) { grad.addColorStop(0, '#93c5fd'); grad.addColorStop(1, '#3b82f6'); } 
    else { grad.addColorStop(0, '#e2e8f0'); grad.addColorStop(1, '#64748b'); }
    ctx.fillStyle = grad; ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; ctx.stroke()
    ctx.fillStyle = 'white'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(`${polarity > 0 ? '+' : ''}${polarity}µC`, x, y)
}

function drawArrowHead(ctx, x, y, angle, size) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle)
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-size, -size/2); ctx.lineTo(-size, size/2); ctx.closePath()
    ctx.fillStyle = ctx.strokeStyle; ctx.fill(); ctx.restore()
}

function drawVector(ctx, x, y, dx, dy, color) {
    const len = Math.sqrt(dx*dx + dy*dy)
    if (len < 1) return;
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x+dx, y+dy); ctx.stroke()
    const angle = Math.atan2(dy, dx)
    drawArrowHead(ctx, x+dx, y+dy, angle, 12)
}

function drawDipoleStick(ctx, x, y, size) {
     ctx.beginPath()
     ctx.moveTo(-size, 0); ctx.lineTo(size, 0)
     ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 6; ctx.stroke()
     drawCharge(ctx, size, 0, 1, 15)
     drawCharge(ctx, -size, 0, -1, 15)
     
     if (props.showVectors) {
         ctx.strokeStyle = '#10b981'; ctx.lineWidth = 3
         ctx.beginPath(); ctx.moveTo(-size/2, 25); ctx.lineTo(size/2, 25); ctx.stroke()
         ctx.beginPath(); ctx.moveTo(size/2, 25); ctx.lineTo(size/2 - 10, 20); ctx.lineTo(size/2 - 10, 30); ctx.fill()
         ctx.fillStyle = '#10b981'; ctx.fillText('p', 0, 35)
     }
}

// Update signature to accept visible bounds
function drawFieldLinesMulti(ctx, visible, charges) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; ctx.lineWidth = 1
    const fallbackX = (visible.left + visible.right)/2
    const fallbackY = (visible.top + visible.bottom)/2

    charges.forEach(c => {
         if (c.q === 0) return
         const isPos = c.q > 0
         
         const count = Math.max(8, Math.floor(Math.abs(c.q) * 8)) 
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
}

function drawFieldLinesDipole(ctx, visible, x1, y1, x2, y2, q) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; ctx.lineWidth = 1
    const count = 20
    for (let i = 0; i < count; i++) {
        let angle = (i / count) * Math.PI * 2
        let cx = x1 + Math.cos(angle) * 10
        let cy = y1 + Math.sin(angle) * 10
        ctx.beginPath(); ctx.moveTo(cx, cy)
        
        for (let step = 0; step < 5000; step++) {
            const dx1 = cx - x1; const dy1 = cy - y1; const r1sq = dx1*dx1 + dy1*dy1
            const dx2 = cx - x2; const dy2 = cy - y2; const r2sq = dx2*dx2 + dy2*dy2
            if (Math.sqrt(r1sq) < 5 || Math.sqrt(r2sq) < 20) break
            
            const E1 = q / r1sq; const Ex1 = E1 * (dx1/Math.sqrt(r1sq)); const Ey1 = E1 * (dy1/Math.sqrt(r1sq))
            const E2 = Math.abs(q) / r2sq; const Ex2 = E2 * (-dx2/Math.sqrt(r2sq)); const Ey2 = E2 * (-dy2/Math.sqrt(r2sq))
            
            let Ex = Ex1 + Ex2; let Ey = Ey1 + Ey2
            const Emod = Math.sqrt(Ex*Ex + Ey*Ey)
            cx += (Ex/Emod) * 5; cy += (Ey/Emod) * 5
            
             // Bounds check matching Multi
            if (cx < visible.left - 500 || cx > visible.right + 500 || cy < visible.top - 500 || cy > visible.bottom + 500) break;

            ctx.lineTo(cx, cy)
        }
        ctx.stroke()
    }
}

function drawUniformField(ctx, visible, strength) {
     ctx.strokeStyle = 'rgba(74, 222, 128, 0.2)'; ctx.lineWidth = 2; const spacing = 50
     const startY = Math.floor(visible.top / spacing) * spacing
     for (let y = startY; y < visible.bottom; y+=spacing) {
         ctx.beginPath(); ctx.moveTo(visible.left, y); ctx.lineTo(visible.right, y); ctx.stroke()
         // Arrows? roughly centered
         const mid = (visible.left + visible.right)/2
         if (y % 100 === 0) { drawArrowHead(ctx, mid, y, 0, 8); }
     }
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
        if (props.charges.length === 0) {
             drawLabelScreen(ctx, "Add charges using the sidebar", w/2, h/2)
        }
        props.charges.forEach(c => {
             drawCharge(ctx, typeof c.x === 'number' ? c.x : cx, typeof c.y === 'number' ? c.y : cy, c.q, 25)
        })
        if (props.showFieldLines) {
            drawFieldLinesMulti(ctx, visible, props.charges)
        }
        drawTestCharges(ctx, visible, props.testCharges)
    } 
    else if (props.mode === 'dipole_field') {
        const sep = props.dipoleSep
        const q = props.dipoleQ
        const x1 = cx - sep/2
        const x2 = cx + sep/2
        drawCharge(ctx, x1, cy, q, 20)
        drawCharge(ctx, x2, cy, -q, 20)
        if (props.showFieldLines) drawFieldLinesDipole(ctx, visible, x1, cy, x2, cy, q)
        ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(x1 - 50, cy); ctx.lineTo(x2 + 50, cy); ctx.stroke(); ctx.setLineDash([]);
        drawLabel(ctx, `Electric Dipole (2a = ${sep}px)`, cx, cy + 120)
    }
    else if (props.mode === 'torque') {
        if (props.showFieldLines) drawUniformField(ctx, visible, props.torqueE)
        
        ctx.save()
        ctx.translate(cx, cy)
        const angleRad = (currentAngle * Math.PI) / 180
        ctx.rotate(-angleRad) 

        const size = 80
        drawDipoleStick(ctx, 0, 0, size)
        
        if (props.showVectors) {
             ctx.restore(); ctx.save(); ctx.translate(cx, cy)
             const tipX = size * Math.cos(-angleRad); const tipY = size * Math.sin(-angleRad)
             const F = props.torqueE * 15
             drawVector(ctx, tipX, tipY, F, 0, '#ef4444')
             drawVector(ctx, -tipX, -tipY, -F, 0, '#3b82f6')
             ctx.restore()
        } else { ctx.restore() }
        
        if (props.showGrid) {
            ctx.beginPath(); ctx.arc(cx, cy, 50, 0, -(currentAngle * Math.PI) / 180, true); ctx.strokeStyle = 'yellow'; ctx.stroke()
        }
        drawLabel(ctx, `Torque τ = pE sin(${currentAngle.toFixed(1)}°)`, cx, cy + 150)
    }
}

function resize() {
    if (containerRef.value && canvasRef.value) {
        canvasRef.value.width = containerRef.value.clientWidth
        canvasRef.value.height = containerRef.value.clientHeight
        draw()
    }
}

// --- Lifecycle ---

onMounted(() => {
    if (canvasRef.value) {
        ctx = canvasRef.value.getContext('2d')
        window.addEventListener('resize', resize)
        
        const canvas = canvasRef.value
        canvas.addEventListener('wheel', handleWheel, { passive: false })
        canvas.addEventListener('mousedown', handleMouseDown)
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
        
        canvas.addEventListener('touchstart', handleMouseDown)
        window.addEventListener('touchmove', handleMouseMove)
        window.addEventListener('touchend', handleMouseUp)
        
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

watch(
    [
        () => props.mode, () => props.showGrid, () => props.showFieldLines, () => props.showVectors,
        () => props.dipoleQ, () => props.dipoleSep,
        () => props.torqueE, () => props.torqueP
    ],
    () => {
         requestAnimationFrame(draw)
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
</style>
