<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

const props = defineProps({
  activeTopic: String,
  showGrid: Boolean,
  zoom: Number,
  charge: Number,
  chargePos: Object,
  solidAngleDir: Object,
  showSecondary: Boolean,
  surfaceType: String,
  surfaceRadius: Number,
  surfaceLength: Number,
  shellRadius: Number,
  showSurface: Boolean,
  showLines: Boolean,
  showSource: Boolean,
  drawingActive: Boolean
})

const containerRef = ref(null)
const canvasRef = ref(null)

let scene, camera, renderer, controls, frameId
let objects = [] // Track interactive objects
let fieldLinesGroup = new THREE.Group()
let surfaceMesh = null
let sourceObject = null
let gridHelper = null
let photons = [] // Array of { mesh, velocity, life }
let labels = ref([]) // For 2D/3D overlay interaction

// Interaction State
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()
let isDraggingDir = false

const emit = defineEmits(['update:solidAngleDir'])

const onMouseDown = (e) => {
    if (props.activeTopic !== 'solid_angle') return
    isDraggingDir = true
    controls.enabled = false // Disable orbit while dragging direction
}

const onMouseMove = (e) => {
    const rect = canvasRef.value.getBoundingClientRect()
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    
    if (isDraggingDir) {
        // Simple mapping: mouse delta to angle
        // For better experience, we can use screen-to-world
        const phi = (mouse.x * 180) + 180
        const theta = mouse.y * 90
        emit('update:solidAngleDir', { phi, theta })
    }
}

const onMouseUp = () => {
    isDraggingDir = false
    controls.enabled = true
}

const init = () => {
    scene = new THREE.Scene()
    
    const width = containerRef.value.clientWidth
    const height = containerRef.value.clientHeight
    
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 2000)
    camera.position.set(200, 200, 400)
    
    renderer = new THREE.WebGLRenderer({ canvas: canvasRef.value, antialias: true, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(width, height)
    
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 1.2)
    scene.add(ambientLight)
    
    // Main cinematic light
    const mainLight = new THREE.PointLight(0xffffff, 3, 3000)
    mainLight.position.set(300, 500, 400)
    scene.add(mainLight)
    
    // Rim lights for high-end look
    const rimLight1 = new THREE.DirectionalLight(0xffffff, 0.8)
    rimLight1.position.set(-200, 200, -200)
    scene.add(rimLight1)
    
    const rimLight2 = new THREE.DirectionalLight(0x00ff9d, 0.4)
    rimLight2.position.set(200, -200, 200)
    scene.add(rimLight2)
    
    scene.add(fieldLinesGroup)
    
    updateSimulation()
    animate()
}

const animate = () => {
    controls.update()
    
    // Update Photons Animation
    if (photons.length > 0) {
        photons.forEach(p => {
            p.mesh.position.add(p.velocity)
            p.life -= 0.01
            if (p.life <= 0) {
                p.mesh.position.set(0, 0, 0)
                p.life = 1.0
            }
            // Glow intensity based on life
            p.mesh.material.opacity = p.life * 0.8
        })
    }

    // Apex Pulsation
    if (sourceObject && props.activeTopic === 'solid_angle') {
        const time = Date.now() * 0.002
        const pulse = Math.sin(time) * 0.2 + 1.0
        // We need to find the core mesh. Since it's in a group, let's just use sourceObject property if we had it.
        // Actually, let's just use a loose reference or search.
        sourceObject.children.forEach(child => {
            if (child.isGroup) { // Central Group
                child.children.forEach(gc => {
                    if (gc.material) gc.material.emissiveIntensity = pulse * 1.5
                })
            }
        })
    }

    renderer.render(scene, camera)
    frameId = requestAnimationFrame(animate)
    
    // Proactive label syncing
    if (props.activeTopic === 'solid_angle') {
        syncLabels()
    }
}

const handleResize = () => {
    if (!containerRef.value) return
    const width = containerRef.value.clientWidth
    const height = containerRef.value.clientHeight
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
}

// --- Visual Helpers ---

const clearOldSimulation = () => {
    if (sourceObject) scene.remove(sourceObject)
    if (surfaceMesh) scene.remove(surfaceMesh)
    fieldLinesGroup.clear()
}

const updateSimulation = () => {
    if (!scene) return
    clearOldSimulation()
    
    switch(props.activeTopic) {
        case 'flux':
            setupFlux3D()
            break
        case 'solid_angle':
            setupSolidAngle3D()
            break
        case 'wire':
            setupWire3D()
            break
        case 'sheet':
            setupSheet3D()
            break
        case 'shell':
            setupShell3D()
            break
    }
    
    fieldLinesGroup.visible = props.showLines
    if (sourceObject) sourceObject.visible = props.showSource
    if (surfaceMesh) sourceObject ? (surfaceMesh.visible = props.showSurface) : null
    
    camera.position.setLength(600 / props.zoom)
}

// --- Topic Specific setups ---

const setupSolidAngle3D = () => {
    const radius = props.surfaceRadius
    const halfAngleDeg = props.charge // Using charge as angle in degrees
    const halfAngleRad = (halfAngleDeg * Math.PI) / 180
    const phi = (props.solidAngleDir?.phi || 0) * Math.PI / 180
    const theta = (props.solidAngleDir?.theta || 0) * Math.PI / 180

    sourceObject = new THREE.Group()
    photons = [] // Reset photons

    // --- Cinematic Apex (Point Source) ---
    const centerGroup = new THREE.Group()
    const coreGeo = new THREE.SphereGeometry(12, 32, 32)
    const coreMat = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        emissive: 0x00ff9d,
        emissiveIntensity: 2,
        transparent: true,
        opacity: 0.9
    })
    const core = new THREE.Mesh(coreGeo, coreMat)
    centerGroup.add(core)

    // Apex Glow Pulse
    const glowGeo = new THREE.SphereGeometry(25, 32, 32)
    const glowMat = new THREE.MeshBasicMaterial({ 
        color: 0x00ff9d, 
        transparent: true, 
        opacity: 0.2,
        side: THREE.BackSide 
    })
    const glow = new THREE.Mesh(glowGeo, glowMat)
    centerGroup.add(glow)
    sourceObject.add(centerGroup)

    // --- Directional Group ---
    const dirGroup = new THREE.Group()
    dirGroup.rotation.y = phi
    dirGroup.rotation.x = -theta
    sourceObject.add(dirGroup)

    const drawSolidAngleLayer = (r, opacity, color = 0x00ff9d, labelText = "") => {
        const layerGroup = new THREE.Group()
        
        // Sphere Wireframe (Minimal High-End)
        const sphereGeo = new THREE.SphereGeometry(r, 48, 48)
        const sphereMat = new THREE.MeshStandardMaterial({ 
            color: 0x444444, 
            transparent: true, 
            opacity: 0.03,
            wireframe: true 
        })
        const refSphere = new THREE.Mesh(sphereGeo, sphereMat)
        layerGroup.add(refSphere)

        // Spherical Cap
        const capGeo = new THREE.SphereGeometry(r, 64, 32, 0, Math.PI * 2, 0, halfAngleRad)
        const capMat = new THREE.MeshStandardMaterial({
            color: color,
            transparent: true,
            opacity: opacity,
            emissive: color,
            emissiveIntensity: 1.2,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        })
        const cap = new THREE.Mesh(capGeo, capMat)
        cap.rotateX(-Math.PI / 2)
        layerGroup.add(cap)

        return layerGroup
    }

    // Main Layers
    const mainLayer = drawSolidAngleLayer(radius, 0.4, 0x00ff9d, "Area A")
    dirGroup.add(mainLayer)

    if (props.showSecondary) {
        dirGroup.add(drawSolidAngleLayer(radius * 0.6, 0.2, 0x00d4ff, "Area A'"))
    }

    // --- Boundary Lines ---
    const numBoundaryLines = 32
    for(let i = 0; i < numBoundaryLines; i++) {
        const angle = (i / numBoundaryLines) * Math.PI * 2
        const zOrientedPoint = new THREE.Vector3(
            Math.sin(halfAngleRad) * Math.cos(angle) * radius * 1.2,
            Math.sin(halfAngleRad) * Math.sin(angle) * radius * 1.2,
            Math.cos(halfAngleRad) * radius * 1.2
        )
        const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), zOrientedPoint])
        const lineMat = new THREE.LineBasicMaterial({ 
            color: 0x00ff9d, 
            transparent: true, 
            opacity: 0.15 
        })
        const line = new THREE.Line(lineGeo, lineMat)
        dirGroup.add(line)
    }

    // --- Animated Photons (Active Flow) ---
    const photonCount = 40
    for(let i = 0; i < photonCount; i++) {
        const u = Math.random()
        const v = Math.random()
        const localTheta = Math.acos(1 - u * (1 - Math.cos(halfAngleRad)))
        const localPhi = v * 2 * Math.PI
        
        const direction = new THREE.Vector3(
            Math.sin(localTheta) * Math.cos(localPhi),
            Math.sin(localTheta) * Math.sin(localPhi),
            Math.cos(localTheta)
        )

        const pGeo = new THREE.SphereGeometry(2, 8, 8)
        const pMat = new THREE.MeshBasicMaterial({ 
            color: 0x00ff9d, 
            transparent: true, 
            opacity: 0.8 
        })
        const pMesh = new THREE.Mesh(pGeo, pMat)
        
        const speed = 0.5 + Math.random() * 2.5
        const pLife = Math.random() // Normalized life 0-1
        
        pMesh.position.copy(direction).multiplyScalar(radius * 1.5 * pLife)
        
        dirGroup.add(pMesh)
        photons.push({
            mesh: pMesh,
            velocity: direction.clone().multiplyScalar(speed),
            life: pLife,
            maxDist: radius * 1.5
        })
    }

    scene.add(sourceObject)
}

const syncLabels = () => {
    if (!camera || !containerRef.value) return
    
    // We update the labels array which our template will render
    const updatedLabels = []
    
    if (props.activeTopic === 'solid_angle') {
        // Label for main cap
        const radius = props.surfaceRadius
        const phi = (props.solidAngleDir?.phi || 0) * Math.PI / 180
        const theta = (props.solidAngleDir?.theta || 0) * Math.PI / 180
        
        const pos = new THREE.Vector3(0, 0, radius)
        pos.applyAxisAngle(new THREE.Vector3(1, 0, 0), -theta)
        pos.applyAxisAngle(new THREE.Vector3(0, 1, 0), phi)
        
        const screenPos = pos.clone().project(camera)
        
        // Solid Angle Calculation
        const omega = 2 * Math.PI * (1 - Math.cos((props.charge * Math.PI) / 180))
        const area = omega * (radius/100) * (radius/100) // Scaled for display

        updatedLabels.push({
            id: 'omega',
            text: `Ω = ${omega.toFixed(3)} sr`,
            x: (screenPos.x * 0.5 + 0.5) * containerRef.value.clientWidth,
            y: (-screenPos.y * 0.5 + 0.5) * containerRef.value.clientHeight - 60,
            color: '#00ff9d'
        })
        
        updatedLabels.push({
            id: 'area1',
            text: `A₁ ≈ ${(omega * radius * radius / 10000).toFixed(2)} units²`,
            x: (screenPos.x * 0.5 + 0.5) * containerRef.value.clientWidth,
            y: (-screenPos.y * 0.5 + 0.5) * containerRef.value.clientHeight - 30,
            color: '#00ff9d'
        })

        if (props.showSecondary) {
            const r2 = radius * 0.6
            const pos2 = new THREE.Vector3(0, 0, r2)
            pos2.applyAxisAngle(new THREE.Vector3(1, 0, 0), -theta)
            pos2.applyAxisAngle(new THREE.Vector3(0, 1, 0), phi)
            const screenPos2 = pos2.clone().project(camera)

            updatedLabels.push({
                id: 'area2',
                text: `A₂ ≈ ${(omega * r2 * r2 / 10000).toFixed(2)} units²`,
                x: (screenPos2.x * 0.5 + 0.5) * containerRef.value.clientWidth,
                y: (-screenPos2.y * 0.5 + 0.5) * containerRef.value.clientHeight + 20,
                color: '#00d4ff'
            })
        }
    }
    
    labels.value = updatedLabels
}

const setupFlux3D = () => {
    // Point Charge
    const color = props.charge >= 0 ? 0xff0055 : 0x00d4ff
    const geometry = new THREE.SphereGeometry(15, 64, 64)
    const material = new THREE.MeshStandardMaterial({ 
        color, 
        emissive: color, 
        emissiveIntensity: 1.2,
        metalness: 0.8,
        roughness: 0.2
    })
    sourceObject = new THREE.Mesh(geometry, material)
    
    const { x, y, z } = props.chargePos || { x: 0, y: 0, z: 0 }
    sourceObject.position.set(x, y, z)

    // Core glow pulse
    const glowGeo = new THREE.SphereGeometry(20, 32, 32)
    const glowMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.2 })
    const glow = new THREE.Mesh(glowGeo, glowMat)
    sourceObject.add(glow)
    
    // Internal light
    const chargeLight = new THREE.PointLight(color, 2, 300)
    sourceObject.add(chargeLight)
    
    scene.add(sourceObject)
    
    // Field Lines - Dynamic density
    const numLines = Math.max(12, Math.min(64, Math.abs(props.charge) * 2))
    for (let i = 0; i < numLines; i++) {
        const phi = Math.acos(-1 + (2 * i) / numLines)
        const theta = Math.sqrt(numLines * Math.PI) * phi
        
        const dir = new THREE.Vector3().setFromSphericalCoords(1, phi, theta)
        const start = new THREE.Vector3().copy(dir).multiplyScalar(15).add(sourceObject.position)
        const end = new THREE.Vector3().copy(dir).multiplyScalar(400).add(sourceObject.position)
        
        draw3DFieldLine(start, end, props.charge >= 0)
    }
    
    // Gaussian Surface
    setupSurfaceMesh()
}

const setupWire3D = () => {
    const color = props.charge >= 0 ? 0xff0055 : 0x00d4ff
    const geometry = new THREE.CylinderGeometry(4, 4, props.surfaceLength, 32)
    const material = new THREE.MeshStandardMaterial({ 
        color, 
        emissive: color, 
        emissiveIntensity: 0.8,
        metalness: 0.9,
        roughness: 0.1
    })
    sourceObject = new THREE.Mesh(geometry, material)
    
    const wireLight = new THREE.PointLight(color, 1.5, 500)
    sourceObject.add(wireLight)
    
    scene.add(sourceObject)
    
    // Radial Field Lines
    const rings = 12
    const linesPerRing = 16
    for(let r = 0; r < rings; r++) {
        const y = (r - rings/2) * 60
        for(let l = 0; l < linesPerRing; l++) {
            const angle = (l / linesPerRing) * Math.PI * 2
            const start = new THREE.Vector3(Math.cos(angle) * 5, y, Math.sin(angle) * 5)
            const end = new THREE.Vector3(Math.cos(angle) * 200, y, Math.sin(angle) * 200)
            draw3DFieldLine(start, end, props.charge >= 0)
        }
    }
    
    // Surface
    setupSurfaceMesh('cylindrical')
}

const setupSheet3D = () => {
    const color = props.charge >= 0 ? 0xff0055 : 0x00d4ff
    const size = props.surfaceLength
    const geometry = new THREE.BoxGeometry(12, size, size)
    const material = new THREE.MeshStandardMaterial({ 
        color, 
        transparent: true, 
        opacity: 0.5,
        emissive: color,
        emissiveIntensity: 0.3,
        metalness: 0.7,
        roughness: 0.1
    })
    sourceObject = new THREE.Mesh(geometry, material)
    
    const sheetLight1 = new THREE.PointLight(color, 1, 600)
    sheetLight1.position.set(50, 0, 0)
    sourceObject.add(sheetLight1)
    
    const sheetLight2 = new THREE.PointLight(color, 1, 600)
    sheetLight2.position.set(-50, 0, 0)
    sourceObject.add(sheetLight2)

    scene.add(sourceObject)
    
    // Field Lines (Normal to plane)
    const grid = 8
    const spacing = 100
    for(let i = -grid/2; i <= grid/2; i++) {
        for(let j = -grid/2; j <= grid/2; j++) {
            const startPos = new THREE.Vector3(5, i * spacing, j * spacing)
            const endPos = new THREE.Vector3(250, i * spacing, j * spacing)
            draw3DFieldLine(startPos, endPos, props.charge >= 0)
            
            const startNeg = new THREE.Vector3(-5, i * spacing, j * spacing)
            const endNeg = new THREE.Vector3(-250, i * spacing, j * spacing)
            draw3DFieldLine(startNeg, endNeg, props.charge >= 0)
        }
    }
    
    setupSurfaceMesh('box')
}

const setupShell3D = () => {
    const color = props.charge >= 0 ? 0xff0055 : 0x00d4ff
    const geometry = new THREE.SphereGeometry(props.shellRadius, 128, 128)
    const material = new THREE.MeshStandardMaterial({ 
        color, 
        transparent: true, 
        opacity: 0.6,
        side: THREE.DoubleSide,
        metalness: 1.0,
        roughness: 0.05,
        emissive: color,
        emissiveIntensity: 0.2
    })
    sourceObject = new THREE.Mesh(geometry, material)
    
    const shellLight = new THREE.PointLight(color, 2, 400)
    sourceObject.add(shellLight)

    scene.add(sourceObject)
    
    // Outside Field Lines
    const R = props.shellRadius
    if (props.surfaceRadius > R + 2) {
        const numLines = 32
        for (let i = 0; i < numLines; i++) {
            const phi = Math.acos(-1 + (2 * i) / numLines)
            const theta = Math.sqrt(numLines * Math.PI) * phi
            const dir = new THREE.Vector3().setFromSphericalCoords(1, phi, theta)
            const start = new THREE.Vector3().copy(dir).multiplyScalar(R + 2)
            const end = new THREE.Vector3().copy(dir).multiplyScalar(300)
            draw3DFieldLine(start, end, props.charge >= 0)
        }
    }
    
    setupSurfaceMesh('spherical')
}

// --- Helper Functions ---

const draw3DFieldLine = (start, end, isPositive) => {
    const color = isPositive ? 0xff0055 : 0x00d4ff
    // Main inner core
    const coreMat = new THREE.LineBasicMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
    })
    // Outer glow
    const glowMat = new THREE.LineBasicMaterial({ 
        color,
        transparent: true,
        opacity: 0.4,
        linewidth: 2 // Note: linewidth > 1 depends on platform/extension
    })
    
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end])
    
    const coreLine = new THREE.Line(geometry, coreMat)
    const glowLine = new THREE.Line(geometry, glowMat)
    
    fieldLinesGroup.add(glowLine)
    fieldLinesGroup.add(coreLine)
    
    // Arrowhead
    const dir = new THREE.Vector3().subVectors(end, start).normalize()
    const arrowPos = new THREE.Vector3().lerpVectors(start, end, 0.4)
    const arrowHelper = new THREE.ArrowHelper(
        isPositive ? dir : dir.clone().negate(),
        arrowPos,
        18,
        color,
        6,
        4
    )
    fieldLinesGroup.add(arrowHelper)
}

const setupSurfaceMesh = (forcedType = null) => {
    const type = forcedType || props.surfaceType
    let geometry
    const R = props.surfaceRadius
    
    if (type === 'spherical') {
        geometry = new THREE.SphereGeometry(R, 64, 64)
    } else if (type === 'cylindrical') {
        // For wire, the cylinder usually has a specific height for the lab view
        const height = props.activeTopic === 'wire' ? 250 : 350 // Height 350 matches flux inside/outside calculation
        geometry = new THREE.CylinderGeometry(R, R, height, 64)
    } else {
        // For sheet, a pillbox (cylinder or box) is used. 
        // We'll use a box that is thicker than the sheet.
        const size = props.activeTopic === 'sheet' ? 300 : R * 2
        geometry = new THREE.BoxGeometry(size, R * 2, R * 2)
    }
    
    const material = new THREE.MeshPhysicalMaterial({
        color: 0x00ff9d,
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide,
        depthWrite: false,
        transmission: 0.8, // More transparent/glass-like
        thickness: 5,      // Thicker refractive edge
        roughness: 0,
        metalness: 0,
        ior: 1.5,          // Index of refraction for glass
        clearcoat: 1.0,    // High shine
        clearcoatRoughness: 0
    })
    
    surfaceMesh = new THREE.Mesh(geometry, material)
    
    // Wireframe for surface - pulse style
    const wireframe = new THREE.LineSegments(
        new THREE.WireframeGeometry(geometry),
        new THREE.LineBasicMaterial({ 
            color: 0x00ff9d, 
            transparent: true, 
            opacity: 0.4
        })
    )
    surfaceMesh.add(wireframe)
    scene.add(surfaceMesh)
}

// --- Lifecycle & Watchers ---

onMounted(() => {
    nextTick(init)
    window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
    cancelAnimationFrame(frameId)
    window.removeEventListener('resize', handleResize)
    if(renderer) renderer.dispose()
})

watch(() => [
    props.activeTopic, 
    props.charge, 
    props.chargePos,
    props.solidAngleDir,
    props.showSecondary,
    props.surfaceType, 
    props.surfaceRadius, 
    props.surfaceLength,
    props.shellRadius,
    props.showGrid, 
    props.zoom,
    props.showSurface,
    props.showLines,
    props.showSource
], updateSimulation, { deep: true })

watch(() => props.drawingActive, (active) => {
    if (controls) {
        controls.enabled = !active
    }
})

</script>

<template>
  <div class="simulation-container" ref="containerRef">
    <canvas 
        ref="canvasRef" 
        class="sim-canvas"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
    ></canvas>

    <!-- Dynamic 3D Labels Overlay -->
    <div class="label-overlay" v-if="props.activeTopic === 'solid_angle'">
        <div
            v-for="label in labels"
            :key="label.id"
            class="lab-3d-label"
            :style="{
                left: `${label.x}px`,
                top: `${label.y}px`,
                color: label.color
            }"
        >
            {{ label.text }}
        </div>
    </div>

    <div class="three-controls-hint">
        Use Mouse to Rotate & Scroll to Zoom
    </div>
  </div>
</template>

<style scoped>
.simulation-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: radial-gradient(circle at center, #0f172a 0%, #020617 100%);
  overflow: hidden;
}
.sim-canvas {
    width: 100%;
    height: 100%;
    display: block;
    outline: none;
}

.label-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 10;
}

.lab-3d-label {
    position: absolute;
    transform: translate(-50%, -50%);
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 0.9rem;
    text-shadow: 0 0 10px rgba(0,0,0,0.8), 0 0 5px currentColor;
    white-space: nowrap;
    transition: all 0.1s linear;
}

.three-controls-hint {
    position: absolute;
    bottom: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.5);
    padding: 8px 16px;
    border-radius: 20px;
    color: #94a3b8;
    font-size: 0.8rem;
    pointer-events: none;
    border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
