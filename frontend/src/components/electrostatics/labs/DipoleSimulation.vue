<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  mode: {
    type: String, 
    default: 'point_charge'
  },
  showGrid: Boolean,
  showFieldLines: Boolean,
  showVectors: Boolean,
  playAnimation: Boolean,
  
  // Physics Params
  pointQ: { type: Number, default: 1 },
  dipoleQ: { type: Number, default: 1 },
  dipoleSep: { type: Number, default: 100 },
  torqueE: { type: Number, default: 5 },
  torqueP: { type: Number, default: 5 },
  torqueAngle: { type: Number, default: 45 }
})

const emit = defineEmits(['update:angle'])

const canvasRef = ref(null)
const containerRef = ref(null)

// Simulation State
let currentAngle = props.torqueAngle;
let angularVelocity = 0;

const initSimulation = () => {
    if (!canvasRef.value) return;
    const canvas = canvasRef.value;
    const ctx = canvas.getContext('2d');
    
    // Resize handling
    const resize = () => {
        if (containerRef.value) {
            canvas.width = containerRef.value.clientWidth;
            canvas.height = containerRef.value.clientHeight;
            draw();
        }
    }
    
    window.addEventListener('resize', resize);
    resize();
    
    // Basic Draw Loop
    function draw() {
        if (!ctx) return;
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;

        ctx.clearRect(0, 0, w, h);
        
        ctx.fillStyle = '#0f172a'; 
        ctx.fillRect(0, 0, w, h);
        
        // Grid
        if (props.showGrid) {
            drawGrid(ctx, w, h);
        }

        // Mode specific drawing
        if (props.mode === 'point_charge') {
            const q = props.pointQ;
            drawCharge(ctx, cx, cy, q, 25);
            if (props.showFieldLines && q !== 0) drawFieldLinesSingle(ctx, cx, cy, q);
            
            drawLabel(ctx, `Point Charge Q = ${q} µC`, cx, cy + 80);
        } 
        else if (props.mode === 'dipole_field') {
            const sep = props.dipoleSep; // Full separation 2a
            const q = props.dipoleQ;
            const x1 = cx - sep/2;
            const x2 = cx + sep/2;
            
            drawCharge(ctx, x1, cy, q, 20);  // +q
            drawCharge(ctx, x2, cy, -q, 20); // -q
            
            if (props.showFieldLines) drawFieldLinesDipole(ctx, x1, cy, x2, cy, q);
            
            // Draw axis line (mock)
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            ctx.moveTo(x1 - 50, cy);
            ctx.lineTo(x2 + 50, cy);
            ctx.stroke();
            ctx.setLineDash([]);

            drawLabel(ctx, `Electric Dipole (2a = ${sep}px)`, cx, cy + 120);
        }
        else if (props.mode === 'torque') {
            // Draw Uniform Field Lines
            if (props.showFieldLines) drawUniformField(ctx, w, h, props.torqueE);
            
            // Draw Dipole
            ctx.save();
            ctx.translate(cx, cy);
            // Invert angle for visual consistency (canvas Y is down)
            // But standard physics: 0 deg is right, 90 is up (negative Y)
            // Let's stick to standard canvas rotation: 
            // 0 is +X (Right), 90 works as Clockwise.
            // Physics: Torque restores to 0 (align with field).
            // Field is RIGHT (+X). Dipole wants to align with X.
            // We use currentAngle (radians).
            const angleRad = (currentAngle * Math.PI) / 180;
            ctx.rotate(-angleRad); // Rotate counter-clockwise for positive angle visual (standard math)

            const size = 80; // half length 'a' roughly
            drawDipoleStick(ctx, 0, 0, size);
            
            // Draw Forces
            if (props.showVectors) {
                 // Force on +q (at x=+size) is along E (Right)
                 // Start at (size, 0), vector (F, 0)
                 // We are in rotated context. We need to draw global horizontal vectors.
                 // Easiest is to transform points to global and draw there, or unrotate.
                
                 ctx.restore(); // Back to global
                 ctx.save();
                 ctx.translate(cx, cy);
                 // Calculate tip positions
                 const tipX = size * Math.cos(-angleRad);
                 const tipY = size * Math.sin(-angleRad);
                 
                 // Force F = qE
                 const F = props.torqueE * 15; // Scale factor
                 
                 // Force on +q (at tipX, tipY): Points RIGHT
                 drawVector(ctx, tipX, tipY, F, 0, '#ef4444');
                 
                 // Force on -q (at -tipX, -tipY): Points LEFT
                 drawVector(ctx, -tipX, -tipY, -F, 0, '#3b82f6');
                 
                 ctx.restore();
            } else {
                 ctx.restore();
            }
            
            // Draw Angle Arc
            if (props.showGrid) {
                ctx.beginPath();
                ctx.arc(cx, cy, 50, 0, -(currentAngle * Math.PI) / 180, true);
                ctx.strokeStyle = 'yellow';
                ctx.stroke();
            }

            drawLabel(ctx, `Torque τ = pE sin(${currentAngle.toFixed(1)}°)`, cx, cy + 150);
        }
    }

    function drawCharge(ctx, x, y, polarity, radius) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(x, y, radius*0.2, x, y, radius);
        if (polarity > 0) {
            grad.addColorStop(0, '#fca5a5');
            grad.addColorStop(1, '#ef4444');
        } else if (polarity < 0) {
             grad.addColorStop(0, '#93c5fd');
            grad.addColorStop(1, '#3b82f6');
        } else {
            grad.addColorStop(0, '#e2e8f0');
            grad.addColorStop(1, '#64748b');
        }
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(polarity > 0 ? '+' : (polarity < 0 ? '-' : '0'), x, y);
    }

    function drawDipoleStick(ctx, x, y, size) {
         // Draw stick
         ctx.beginPath();
         // -q to +q
         ctx.moveTo(-size, 0); 
         ctx.lineTo(size, 0);
         ctx.strokeStyle = '#94a3b8';
         ctx.lineWidth = 6;
         ctx.stroke();

         // Tip charges
         // By convention if dipole p points from - to +, and p is at angle theta...
         // Actually usually p points -q to +q.
         // Let's say +q is at +x (right) in body frame.
         drawCharge(ctx, size, 0, 1, 15);  // +q
         drawCharge(ctx, -size, 0, -1, 15); // -q
         
         // p vector
         if (props.showVectors) {
             ctx.strokeStyle = '#10b981'; // Green for dipole moment
             ctx.lineWidth = 3;
             ctx.beginPath();
             ctx.moveTo(-size/2, 25);
             ctx.lineTo(size/2, 25);
             ctx.stroke();
             // Arrow head
             ctx.beginPath();
             ctx.moveTo(size/2, 25);
             ctx.lineTo(size/2 - 10, 20);
             ctx.lineTo(size/2 - 10, 30);
             ctx.fill();
             ctx.fillStyle = '#10b981';
             ctx.fillText('p', 0, 35);
         }
    }

    function drawFieldLinesSingle(ctx, x, y, q) {
        ctx.strokeStyle = q > 0 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.4)';
        ctx.lineWidth = 2;
        const count = 16;
        const len = 800;
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            ctx.beginPath();
            const r = 25; // start at surface
            ctx.moveTo(x + Math.cos(angle)*r, y + Math.sin(angle)*r);
            // Arrows logic could be added
            // Just lines for now
            ctx.lineTo(x + Math.cos(angle)*len, y + Math.sin(angle)*len);
            ctx.stroke();
            
            // Draw arrow head at some distance
            if (props.showVectors && i % 2 === 0) {
                 drawArrowHead(ctx, x + Math.cos(angle)*150, y + Math.sin(angle)*150, angle + (q>0?0:Math.PI), 10);
            }
        }
    }

    function drawFieldLinesDipole(ctx, x1, y1, x2, y2, q) {
        // x1 (+q), x2 (-q). 
        // Iterate start points around +q
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;

        const count = 20;
        
        for (let i = 0; i < count; i++) {
            let angle = (i / count) * Math.PI * 2;
            // Trace field line
            let cx = x1 + Math.cos(angle) * 10;
            let cy = y1 + Math.sin(angle) * 10;
            
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            
            // Simple Euler integration for field line tracing
            for (let step = 0; step < 500; step++) {
                // E = k*q1/r1^2 * r1_hat + k*q2/r2^2 * r2_hat
                const dx1 = cx - x1; const dy1 = cy - y1;
                const r1sq = dx1*dx1 + dy1*dy1;
                const r1 = Math.sqrt(r1sq);
                
                const dx2 = cx - x2; const dy2 = cy - y2;
                const r2sq = dx2*dx2 + dy2*dy2;
                const r2 = Math.sqrt(r2sq);
                
                if (r1 < 5 || r2 < 20) break; // Hit a charge
                
                // Fields
                // E1 from +q (repels test +): Direction (dx1, dy1)
                const E1 = q / r1sq;
                const Ex1 = E1 * (dx1/r1);
                const Ey1 = E1 * (dy1/r1);
                
                // E2 from -q (attracts test +): Direction (-dx2, -dy2) NO!
                // Field from -q points TOWARDS -q. vector is (x2-cx, y2-cy) = (-dx2, -dy2)
                // Magnitude k|q|/r^2. 
                const E2 = Math.abs(q) / r2sq;
                // direction towards x2,y2
                const Ex2 = E2 * (-dx2/r2);
                const Ey2 = E2 * (-dy2/r2);
                
                // Net E
                let Ex = Ex1 + Ex2;
                let Ey = Ey1 + Ey2;
                
                // Normalize
                const Emod = Math.sqrt(Ex*Ex + Ey*Ey);
                Ex /= Emod;
                Ey /= Emod;
                
                cx += Ex * 5;
                cy += Ey * 5;
                ctx.lineTo(cx, cy);
            }
            ctx.stroke();
        }
    }

    function drawUniformField(ctx, w, h, strength) {
         ctx.strokeStyle = 'rgba(74, 222, 128, 0.2)'; // Green tint
         ctx.lineWidth = 2;
         const spacing = 50;
         
         for (let y = 0; y < h; y+=spacing) {
             ctx.beginPath();
             ctx.moveTo(0, y + (Date.now()/50)%spacing); // Subtle flow? No, static for syllabus
             ctx.moveTo(0, y);
             ctx.lineTo(w, y);
             ctx.stroke();
             
             // Arrows
             if (y % 100 === 0) {
                 drawArrowHead(ctx, w/2, y, 0, 8);
                 drawArrowHead(ctx, w/2 + 200, y, 0, 8);
             }
         }
         
         ctx.fillStyle = '#4ade80';
         ctx.fillText(`Uniform Electric Field E`, w - 100, 30);
    }
    
    function drawArrowHead(ctx, x, y, angle, size) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-size, -size/2);
        ctx.lineTo(-size, size/2);
        ctx.closePath();
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
        ctx.restore();
    }
    
    function drawVector(ctx, x, y, dx, dy, color) {
        const len = Math.sqrt(dx*dx + dy*dy);
        if (len < 1) return;
        
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x+dx, y+dy);
        ctx.stroke();
        
        const angle = Math.atan2(dy, dx);
        drawArrowHead(ctx, x+dx, y+dy, angle, 12);
    }

    // Animation loop for torque
    let animationId;
    let lastTime = 0;
    
    function animate(time) {
        if (!props.playAnimation || props.mode !== 'torque') return;
        
        const dt = (time - lastTime) / 1000;
        lastTime = time;
        
        // Simple Harmonic Motion approximation for small angles?
        // Or full physics: I * alpha = -pE sin(theta) - damping * omega
        // Let's do simple physics simulation
        
        // Torque tau = - p * E * sin(theta)
        // alpha = tau / I (moment of inertia)
        
        const angleRad = (currentAngle * Math.PI) / 180;
        const torque = - props.torqueP * props.torqueE * Math.sin(angleRad); // Restoring torque
        const damping = -2.0 * angularVelocity; // Damping
        
        const alpha = (torque + damping) * 5; // Scaling factor
        
        angularVelocity += alpha * 0.016; // fixed timestep approx
        currentAngle += (angularVelocity * 180 / Math.PI) * 0.016;
        
        // Normalize angle?
        
        draw();
        animationId = requestAnimationFrame(animate);
    }
    
    // Watch for animation prop
    watch(() => props.playAnimation, (val) => {
        if (val) {
            lastTime = performance.now();
            animationId = requestAnimationFrame(animate);
        } else {
            cancelAnimationFrame(animationId);
        }
    });
    
    // Watch angle controls
    watch(() => props.torqueAngle, (val) => {
        if (!props.playAnimation) {
            currentAngle = val;
            angularVelocity = 0;
            draw();
        }
    });

    // Watch all other visual props to trigger redraw
    watch(
        [
            () => props.mode, 
            () => props.showGrid, 
            () => props.showFieldLines, 
            () => props.showVectors,
            () => props.pointQ,
            () => props.dipoleQ,
            () => props.dipoleSep,
            () => props.torqueE,
            () => props.torqueP
        ],
        () => {
             // If mode changes, reset torque animation state if needed
             if (props.mode === 'torque') {
                 // Optional: reset angle?
             }
             requestAnimationFrame(draw);
        },
        { deep: true }
    );

    return () => {
        window.removeEventListener('resize', resize);
    }
}

function drawGrid(ctx, w, h) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    const size = 50;
    
    for (let x = 0; x < w; x += size) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
    }
    
    for (let y = 0; y < h; y += size) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }
}

onMounted(() => {
    const cleanup = initSimulation();
    onUnmounted(cleanup);
})

watch(() => props.mode, () => {
    // Re-init or update simulation when mode changes
    // draw(); // Trigger redraw
})
</script>

<template>
    <div class="simulation-container" ref="containerRef">
        <canvas ref="canvasRef"></canvas>
        <!-- Overlay controls can go here -->
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
}
</style>
