// Isolated Scenario Logic for Relative Velocity Lab
// Each scenario is strictly decoupled across physics, rendering, and UI statistics.

export const scenarios = {
    '1d': {
        label: '1D Pursuit (2D Sandbox)',
        init: (objects, cx, cy, props) => {
            objects.value = [
                { id: 'A', x: cx - 150, y: cy - 60, vx: props.v1, vy: 0, color: '#00d4ff', label: 'A', type: 'auto' },
                { id: 'B', x: cx - 50, y: cy + 60, vx: props.v2, vy: 0, color: '#ff0055', label: 'B', type: 'auto' }
            ]
        },
        update: (objects, dt, props) => {
            objects.value.forEach(obj => {
                obj.x += obj.vx * dt
                obj.y += obj.vy * dt
            })
        },
        draw: (ctx, canvas, objects, props, utils) => {
            objects.value.forEach(obj => {
                const type = obj.type === 'auto' ? props.visualTheme : obj.type
                if (type === 'car') {
                    utils.drawRoad(ctx, canvas, obj.y)
                    utils.drawCar(ctx, obj.x, obj.y, obj.color, obj.label)
                } else {
                    utils.drawObj(ctx, obj.x, obj.y, obj.color, obj.label, type)
                }
            })
        },
        getStats: (objects, props, minDistance) => []
    },

    'river': {
        label: 'River-Boat',
        init: (objects, cx, cy, props) => {
            const angleRad = (props.angle1 * Math.PI) / 180
            objects.value = [
                {
                    id: 'Boat',
                    x: cx,
                    y: cy + 150,
                    vx: props.v1 * Math.cos(angleRad),
                    vy: -props.v1 * Math.sin(angleRad),
                    color: '#00ff9d',
                    label: 'Boat',
                    type: 'boat'
                },
                { id: 'B', x: cx, y: cy + 150, vx: props.v2, vy: 0, color: '#ff0055', label: 'B', type: 'ball' }
            ]
        },
        update: (objects, dt, props) => {
            const boat = objects.value[0]
            const ref = objects.value[1]
            if (boat) {
                boat.x += (boat.vx + props.v2) * dt
                boat.y += boat.vy * dt
            }
            if (ref) {
                ref.x += props.v2 * dt
            }
        },
        draw: (ctx, canvas, objects, props, utils) => {
            utils.drawRiver(ctx, canvas)
            objects.value.forEach(obj => {
                if (obj.type === 'boat') {
                    utils.drawBoat(ctx, obj.x, obj.y, obj.color, obj.label)
                } else {
                    utils.drawObj(ctx, obj.x, obj.y, obj.color, obj.label, obj.type)
                }
            })
        },
        getStats: (objects, props, minDistance) => {
            const boat = objects.value[0]
            return boat ? [
                { label: 'Rel Velocity X', value: (boat.vx).toFixed(1) + ' m/s' }
            ] : []
        }
    },

    'aeroplane': {
        label: 'Aeroplane-Wind',
        init: (objects, cx, cy, props) => {
            const a1 = (props.angle1 * Math.PI) / 180
            const a2 = (props.angle2 * Math.PI) / 180
            objects.value = [
                {
                    id: 'Plane',
                    x: cx - 100,
                    y: cy - 50,
                    vx: props.v1 * Math.cos(a1),
                    vy: -props.v1 * Math.sin(a1),
                    color: '#fff',
                    label: 'Plane',
                    type: 'plane'
                },
                {
                    id: 'Wind',
                    x: cx - 100,
                    y: cy + 50,
                    vx: props.v2 * Math.cos(a2),
                    vy: -props.v2 * Math.sin(a2),
                    color: '#00d4ff',
                    label: 'Wind',
                    type: 'ball'
                }
            ]
        },
        update: (objects, dt, props) => {
            const plane = objects.value[0]
            const wind = objects.value[1]
            if (plane && wind) {
                plane.x += (plane.vx + wind.vx) * dt
                plane.y += (plane.vy + wind.vy) * dt
            }
        },
        draw: (ctx, canvas, objects, props, utils) => {
            utils.drawSky(ctx, canvas)
            const plane = objects.value[0]
            const wind = objects.value[1]
            if (plane && wind) {
                utils.drawVector(ctx, plane.x, plane.y, props.v1, props.angle1, '#00ff9d', 'v_AW')
                utils.drawVector(ctx, plane.x, plane.y, props.v2, props.angle2, '#00d4ff', 'v_WG')
            }
            objects.value.forEach(obj => {
                if (obj.type === 'plane') {
                    utils.drawPlane(ctx, obj.x, obj.y, obj.color, obj.label)
                } else {
                    utils.drawObj(ctx, obj.x, obj.y, obj.color, obj.label, obj.type)
                }
            })
        },
        getStats: (objects, props, minDistance) => []
    },

    'rain': {
        label: 'Rain-Man',
        init: (objects, cx, cy, props) => {
            // Updated physics: Constant vertical speed (10), horizontal depends on "Air Speed" (v2)
            objects.value = [
                { id: 'Man', x: cx, y: cy + 100, vx: props.v1, vy: 0, color: '#fff', label: 'Man', type: 'man' },
                {
                    id: 'Rain',
                    x: cx,
                    y: cy - 200,
                    vx: props.v2, // Air Speed
                    vy: 10,       // Constant Gravity
                    color: '#00d4ff',
                    label: 'Rain',
                    type: 'rain'
                },
                // Background Clouds for Air Motion Visual
                { id: 'Cloud1', x: cx - 300, y: cy - 250, vx: props.v2, scale: 0.8, type: 'cloud' },
                { id: 'Cloud2', x: cx + 200, y: cy - 280, vx: props.v2, scale: 1.2, type: 'cloud' },
                { id: 'Cloud3', x: cx - 100, y: cy - 350, vx: props.v2, scale: 0.6, type: 'cloud' },
                { id: 'Cloud4', x: cx + 400, y: cy - 220, vx: props.v2, scale: 0.9, type: 'cloud' },
                { id: 'Cloud5', x: cx - 400, y: cy - 300, vx: props.v2, scale: 0.7, type: 'cloud' }
            ]
        },
        update: (objects, dt, props) => {
            const man = objects.value[0]
            const rain = objects.value[1]

            // Hot-fix: Inject clouds if they are missing (State Migration)
            if (objects.value.length < 5 && man) {
                const cx = man.x
                const cy = man.y - 100
                objects.value.push(
                    { id: 'Cloud1', x: cx - 300, y: cy - 250, vx: props.v2, scale: 0.8, type: 'cloud' },
                    { id: 'Cloud2', x: cx + 200, y: cy - 280, vx: props.v2, scale: 1.2, type: 'cloud' },
                    { id: 'Cloud3', x: cx - 100, y: cy - 350, vx: props.v2, scale: 0.6, type: 'cloud' },
                    { id: 'Cloud4', x: cx + 400, y: cy - 220, vx: props.v2, scale: 0.9, type: 'cloud' },
                    { id: 'Cloud5', x: cx - 400, y: cy - 300, vx: props.v2, scale: 0.7, type: 'cloud' }
                )
            }

            // Boost speed for visibility
            const timeScale = 5

            if (man) {
                man.x += man.vx * dt * timeScale
                // Tighter cyclic wrapping for visual loop
                const limit = 400
                if (man.x > limit) man.x = -limit
                if (man.x < -limit) man.x = limit
            }

            if (rain) {
                rain.x += rain.vx * dt * timeScale
                // Link rain source wrapping to man for consistancy, or let it follow man logic
                // Rain source typically covers the sky, but here it's a point source. 
                // Let's just let it move with wind.

                // If Man wraps, we should probably wrap Rain to keep them relatively close?
                // The parent component handles rain-snap, so we just update position here.
            }

            // Update Clouds
            objects.value.forEach(obj => {
                if (obj.type === 'cloud') {
                    obj.vx = props.v2 // Update wind speed
                    obj.x += obj.vx * dt * timeScale * 0.5 // Move slower for parallax

                    // Wrap clouds
                    if (obj.x > 800) obj.x = -800
                    else if (obj.x < -800) obj.x = 800
                }
            })
        },
        draw: (ctx, canvas, objects, props, utils) => {
            // Draw rainy environment
            const man = objects.value[0]
            if (!man) return

            // Stormy atmosphere
            const lightning = (Math.sin(utils.time.value * 20) > 0.95 && Math.random() > 0.8) ? 0.3 : 0

            const skyGrad = ctx.createRadialGradient(0, -500, 100, 0, 0, 2000)
            skyGrad.addColorStop(0, lightning > 0 ? '#475569' : '#1e293b')
            skyGrad.addColorStop(0.5, '#0f172a')
            skyGrad.addColorStop(1, '#020617')
            ctx.fillStyle = skyGrad
            ctx.fillRect(-5000, -2000, 10000, 4000)

            if (lightning > 0) {
                ctx.fillStyle = `rgba(255, 255, 255, ${lightning})`
                ctx.fillRect(-5000, -2000, 10000, 4000)
            }

            // Ground (wet pavement) - Centered around man's feet
            const groundY = man.y + 15
            const groundGrad = ctx.createLinearGradient(0, groundY, 0, groundY + 200)
            groundGrad.addColorStop(0, '#334155')
            groundGrad.addColorStop(1, '#1e293b')
            ctx.fillStyle = groundGrad
            ctx.fillRect(-5000, groundY, 10000, 200)

            // Pavement grid lines
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)'
            ctx.lineWidth = 1
            for (let i = -50; i < 50; i++) {
                ctx.beginPath()
                ctx.moveTo(i * 100, groundY)
                ctx.lineTo(i * 100, groundY + 200)
                ctx.stroke()
            }

            // Puddles with reflections
            ctx.fillStyle = 'rgba(71, 85, 105, 0.5)'
            const puddles = [
                { x: -200, w: 150 },
                { x: 100, w: 200 },
                { x: -450, w: 180 },
                { x: 350, w: 160 }
            ]
            puddles.forEach(p => {
                ctx.beginPath()
                ctx.ellipse(p.x, man.y + 15, p.w, 20, 0, 0, Math.PI * 2)
                ctx.fill()

                // Ripples in puddles
                ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)'
                ctx.lineWidth = 1
                const ripple = (utils.time.value * 5) % 1
                ctx.beginPath()
                ctx.ellipse(p.x, man.y + 15, p.w * ripple, 20 * ripple, 0, 0, Math.PI * 2)
                ctx.stroke()
            })

            // Rain particles
            utils.drawRain(ctx, man.x, man.y)

            // Rain source (cloud) and Man and Background Clouds
            objects.value.forEach(obj => {
                if (obj.id === 'Rain') {
                    utils.drawRainSource(ctx, obj.x, obj.y, obj.color, obj.label)
                } else if (obj.type === 'cloud') {
                    // Draw simple cloud shape
                    ctx.save()
                    ctx.translate(obj.x, obj.y)
                    ctx.scale(obj.scale, obj.scale)
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
                    ctx.beginPath()
                    ctx.arc(0, 0, 30, 0, Math.PI * 2)
                    ctx.arc(40, -10, 35, 0, Math.PI * 2)
                    ctx.arc(80, 0, 30, 0, Math.PI * 2)
                    ctx.arc(40, 10, 30, 0, Math.PI * 2)
                    ctx.fill()
                    ctx.restore()
                } else if (obj.id === 'Man') {
                    utils.drawMan(ctx, obj.x, obj.y)
                }
            })
        },
        getStats: (objects, props, minDistance) => {
            const man = objects.value[0]
            if (!man) return []

            // Relative Velocity: Vrm = Vr - Vm
            // Vr = (v2, 10)
            // Vm = (v1, 0) => Vrm_x = v2 - v1, Vrm_y = 10
            const v_rel_x = props.v2 - props.v1
            const v_rel_y = 10

            // Umbrella blocks rain from relative direction
            // Angle is relative to vertical (Y axis)
            const umbrellaAngle = Math.atan2(v_rel_x, v_rel_y) * 180 / Math.PI

            return []
        }
    },

    'flag-flutter': {
        label: 'Flag Fluttering',
        init: (objects, cx, cy, props) => {
            const a2 = (props.angle2 * Math.PI) / 180
            objects.value = [
                { id: 'Man', x: cx, y: cy + 100, vx: props.v1, vy: 0, color: '#fff', label: 'Man', type: 'flag-man' },
                {
                    id: 'Wind',
                    x: cx,
                    y: cy - 200,
                    vx: props.v2 * Math.cos(a2),
                    vy: props.v2 * Math.sin(a2),
                    color: '#00d4ff',
                    label: 'Wind',
                    type: 'ball'
                }
            ]
        },
        update: (objects, dt, props) => {
            const man = objects.value[0]
            if (man) man.x += man.vx * dt
        },
        draw: (ctx, canvas, objects, props, utils) => {
            const man = objects.value[0]
            if (man) utils.drawManWithFlag(ctx, man.x, man.y)
        },
        getStats: (objects, props, minDistance) => []
    },

    'angular-velocity': {
        label: 'Angular Velocity',
        init: (objects, cx, cy, props) => {
            const a1 = (props.angle1 * Math.PI) / 180
            const a2 = (props.angle2 * Math.PI) / 180
            objects.value = [
                { id: 'A', x: cx - 100, y: cy - 100, vx: props.v1 * Math.cos(a1), vy: -props.v1 * Math.sin(a1), color: '#00d4ff', label: 'A', type: 'auto' },
                { id: 'B', x: cx + 100, y: cy + 100, vx: props.v2 * Math.cos(a2), vy: -props.v2 * Math.sin(a2), color: '#ff0055', label: 'B', type: 'auto' }
            ]
        },
        update: (objects, dt, props) => {
            objects.value.forEach(obj => {
                obj.x += obj.vx * dt
                obj.y += obj.vy * dt
            })
        },
        draw: (ctx, canvas, objects, props, utils) => {
            objects.value.forEach(obj => {
                const type = obj.type === 'auto' ? props.visualTheme : obj.type
                if (type === 'car') {
                    utils.drawRoad(ctx, canvas, obj.y)
                    utils.drawCar(ctx, obj.x, obj.y, obj.color, obj.label)
                } else {
                    utils.drawObj(ctx, obj.x, obj.y, obj.color, obj.label, type)
                }
            })
            if (objects.value.length >= 2) {
                utils.drawAngular(ctx, objects.value[0], objects.value[1])
            }
        },
        getStats: (objects, props, minDistance) => []
    },

    'min-distance': {
        label: 'Closest Approach',
        init: (objects, cx, cy, props) => {
            objects.value = [
                { id: 'A', x: cx - 200, y: cy - 100, vx: props.v1, vy: 0, color: '#00d4ff', label: 'A', type: 'auto' },
                { id: 'B', x: cx + 100, y: cy + 200, vx: 0, vy: -props.v2, color: '#ff0055', label: 'B', type: 'auto' }
            ]
        },
        update: (objects, dt, props) => {
            objects.value.forEach(obj => {
                obj.x += obj.vx * dt
                obj.y += obj.vy * dt
            })
        },
        draw: (ctx, canvas, objects, props, utils) => {
            objects.value.forEach(obj => {
                const type = obj.type === 'auto' ? props.visualTheme : obj.type
                if (type === 'car') {
                    utils.drawRoad(ctx, canvas, obj.y)
                    utils.drawCar(ctx, obj.x, obj.y, obj.color, obj.label)
                } else {
                    utils.drawObj(ctx, obj.x, obj.y, obj.color, obj.label, type)
                }
            })

            if (objects.value.length >= 2) {
                const obj1 = objects.value[0]
                const obj2 = objects.value[1]
                ctx.setLineDash([5, 5])
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
                ctx.beginPath()
                ctx.moveTo(obj1.x, obj1.y)
                ctx.lineTo(obj2.x, obj2.y)
                ctx.stroke()
                ctx.setLineDash([])
            }
        },
        getStats: (objects, props, minDistance) => {
            if (objects.value.length < 2) return []
            const obj1 = objects.value[0]
            const obj2 = objects.value[1]
            const dx = obj1.x - obj2.x
            const dy = obj1.y - obj2.y
            const currentDist = Math.sqrt(dx * dx + dy * dy)
            return [
                { label: 'Current Distance', value: (currentDist / 10).toFixed(1) + ' m' },
                { label: 'Min Distance achieved', value: (minDistance === Infinity ? '---' : minDistance.toFixed(1)) + ' m' }
            ]
        }
    }
}
