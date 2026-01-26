<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

const props = defineProps({
  activeTopic: String,
  showGrid: Boolean,
  zoom: Number,
  charge: Number,
  surfaceType: String,
  surfaceRadius: Number,
  surfaceLength: Number,
  showSurface: Boolean,
  showLines: Boolean,
  showSource: Boolean
})

const containerRef = ref(null)
const canvasRef = ref(null)

let scene, camera, renderer, controls, frameId
let objects = [] // Track interactive objects
let fieldLinesGroup = new THREE.Group()
let surfaceMesh = null
let sourceObject = null
let gridHelper = null

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
    initStarfield()
    
    // Grid (Hidden by default but keep object)
    gridHelper = new THREE.GridHelper(1000, 20, 0x444444, 0x222222)
    gridHelper.rotateX(Math.PI / 2)
    gridHelper.visible = false
    scene.add(gridHelper)
    
    updateSimulation()
    animate()
}

const animate = () => {
    controls.update()
    if (stars) {
        stars.rotation.y += 0.0005
        stars.rotation.x += 0.0002
    }
    renderer.render(scene, camera)
    frameId = requestAnimationFrame(animate)
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

let stars = null

const initStarfield = () => {
    const starCount = 1000
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(starCount * 3)
    const colors = new Float32Array(starCount * 3)

    for (let i = 0; i < starCount; i++) {
        const i3 = i * 3
        positions[i3] = (Math.random() - 0.5) * 2000
        positions[i3 + 1] = (Math.random() - 0.5) * 2000
        positions[i3 + 2] = (Math.random() - 0.5) * 2000
        
        // Slight color variation (Blue/White/Green)
        colors[i3] = 0.5 + Math.random() * 0.5
        colors[i3 + 1] = 0.7 + Math.random() * 0.3
        colors[i3 + 2] = 0.8 + Math.random() * 0.2
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const material = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.5
    })

    stars = new THREE.Points(geometry, material)
    scene.add(stars)
}

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
    
    gridHelper.visible = props.showGrid
    fieldLinesGroup.visible = props.showLines
    if (sourceObject) sourceObject.visible = props.showSource
    if (surfaceMesh) surfaceMesh.visible = props.showSurface
    
    camera.position.setLength(600 / props.zoom)
}

// --- Topic Specific setups ---

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
    
    // Core glow pulse
    const glowGeo = new THREE.SphereGeometry(20, 32, 32)
    const glowMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.2 })
    const glow = new THREE.Mesh(glowGeo, glowMat)
    sourceObject.add(glow)
    
    // Internal light
    const chargeLight = new THREE.PointLight(color, 2, 300)
    sourceObject.add(chargeLight)
    
    scene.add(sourceObject)
    
    // Field Lines
    const numLines = 32
    for (let i = 0; i < numLines; i++) {
        const phi = Math.acos(-1 + (2 * i) / numLines)
        const theta = Math.sqrt(numLines * Math.PI) * phi
        
        const dir = new THREE.Vector3().setFromSphericalCoords(1, phi, theta)
        const start = new THREE.Vector3().copy(dir).multiplyScalar(15)
        const end = new THREE.Vector3().copy(dir).multiplyScalar(250)
        
        draw3DFieldLine(start, end, props.charge >= 0)
    }
    
    // Gaussian Surface
    setupSurfaceMesh()
}

const setupWire3D = () => {
    const color = props.charge >= 0 ? 0xff0055 : 0x00d4ff
    const geometry = new THREE.CylinderGeometry(4, 4, 1000, 32)
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
    const geometry = new THREE.BoxGeometry(12, 1200, 1200)
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
    const geometry = new THREE.SphereGeometry(80, 128, 128)
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
    if (props.surfaceRadius > 82) {
        const numLines = 32
        for (let i = 0; i < numLines; i++) {
            const phi = Math.acos(-1 + (2 * i) / numLines)
            const theta = Math.sqrt(numLines * Math.PI) * phi
            const dir = new THREE.Vector3().setFromSphericalCoords(1, phi, theta)
            const start = new THREE.Vector3().copy(dir).multiplyScalar(82)
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
        geometry = new THREE.CylinderGeometry(R, R, 350, 64)
    } else {
        geometry = new THREE.BoxGeometry(R * 2, R * 2, R * 2)
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
    props.surfaceType, 
    props.surfaceRadius, 
    props.showGrid, 
    props.zoom,
    props.showSurface,
    props.showLines,
    props.showSource
], updateSimulation, { deep: true })

</script>

<template>
  <div class="simulation-container" ref="containerRef">
    <canvas ref="canvasRef"></canvas>
    
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
canvas {
  display: block;
  outline: none;
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
