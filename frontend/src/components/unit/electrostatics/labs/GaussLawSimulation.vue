<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader'

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
  drawingActive: Boolean,
  areaVectorShape: { type: String, default: 'plane' },
  dASize: { type: Number, default: 10 },
  fluxSourceType: { type: String, default: 'point' },
  
  // 3D Shadow Flux Experiment Props
  planePos: { type: Object, default: () => ({ x: 0, y: 0, z: 0 }) },
  planeRotation: { type: Object, default: () => ({ x: 0, y: 0, z: 0 }) },
  wallPos: { type: Object, default: () => ({ x: 400, y: 0, z: 0 }) },
  showShadow: { type: Boolean, default: true },
  showAreaVector: { type: Boolean, default: true },
})

const containerRef = ref(null)
const canvasRef = ref(null)

let scene, camera, perspectiveCamera, orthoCamera, renderer, controls, frameId
let objects = [] // Track interactive objects
let fieldLinesGroup = new THREE.Group()
let surfaceMesh = null
let sourceObject = null
let interactionPlane = null
let shadowWall = null
let shadowMesh = null
let areaVectorArrow = null
let gridHelper = null
let photons = [] // Not used in schematic theme, but kept for compatibility
let streamlines = [] // Array of { mesh, speed }
let labels = ref([]) // For 2D/3D overlay interaction
let pulsingMaterials = [] // Store materials for field line pulsation
let leaderLines = [] // Array of { start, endMesh, line }

// Interaction State
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()
let isDraggingPoint = false
let isRotatingDir = false
let isDraggingVector = false
let dragTarget = null // 'source', 'plane', 'wall'
let isRotatingPlane = false
const dragOffset = new THREE.Vector3()
const dragPlane = new THREE.Plane()
const initialMouse = new THREE.Vector2()
const initialRotation = { phi: 0, theta: 0 }

const emit = defineEmits([
    'update:solidAngleDir', 
    'update:chargePos',
    'update:planePos',
    'update:planeRotation',
    'update:wallPos',
    'update:fluxValue',
    'update:thetaAngle'
])

const onMouseDown = (e) => {
    const rect = canvasRef.value.getBoundingClientRect()
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    
    raycaster.setFromCamera(mouse, camera)
    
    // 1. Flux Topic Interaction (Source-Plane-Shadow)
    if (props.activeTopic === 'flux') {
        const potentialTargets = [sourceObject, interactionPlane, shadowWall].filter(obj => obj !== null)
        const hits = raycaster.intersectObjects(potentialTargets, true)
        if (hits.length > 0) {
            const hit = hits[0]
            let obj = hit.object
            // Find specific component
            while (obj) {
                if (obj === sourceObject) { dragTarget = 'source'; break }
                if (obj === interactionPlane) { dragTarget = 'plane'; break }
                if (obj === shadowWall) { dragTarget = 'wall'; break }
                obj = obj.parent
            }

            if (dragTarget) {
                controls.enabled = false
                isDraggingPoint = true
                
                // Rotation logic: if they hit near the edges, we rotate.
                // For flux components, let's make it intuitive: if they click edges, rotate.
                const targetObj = dragTarget === 'source' ? sourceObject : (dragTarget === 'plane' ? interactionPlane : shadowWall)
                
                // Check if they hit the outer part of the sprite/plane
                const localHit = hit.point.clone().applyMatrix4(targetObj.matrixWorld.clone().invert())
                const distFromCenter = Math.sqrt(localHit.y * localHit.y + localHit.z * localHit.z)
                
                // Heuristic: outer 30% of the object rotates it
                const boundary = dragTarget === 'source' ? 40 : (dragTarget === 'plane' ? 70 : 350)
                
                if (distFromCenter > boundary) {
                    isRotatingPlane = true // Re-using this flag for any component rotation
                    initialMouse.set(mouse.x, mouse.y)
                    initialRotation.phi = targetObj.rotation.y
                    initialRotation.theta = targetObj.rotation.x
                }

                // Setup Drag Plane
                const normal = camera.getWorldDirection(new THREE.Vector3()).negate()
                dragPlane.setFromNormalAndCoplanarPoint(normal, targetObj.position)
                dragOffset.copy(targetObj.position).sub(hit.point)
                return
            }
        }
    }

    if (!sourceObject) return

    // 2. Area Vector Mode
    if (props.activeTopic === 'area_vector') {
        const intersects = raycaster.intersectObject(sourceObject, true)
        if (intersects.length > 0) {
            isDraggingVector = true
            controls.enabled = false
        }
        return 
    }

    // 3. Normal interaction (Solid Angle)
    const intersects = raycaster.intersectObject(sourceObject, true)
    if (intersects.length > 0) {
        const hit = intersects[0]
        isDraggingPoint = true
        controls.enabled = false
        // ...Existing drag plane setup...
        const normal = camera.getWorldDirection(new THREE.Vector3()).negate()
        dragPlane.setFromNormalAndCoplanarPoint(normal, sourceObject.position)
        dragOffset.copy(sourceObject.position).sub(hit.point)
    }
}

const onMouseMove = (e) => {
    const rect = canvasRef.value.getBoundingClientRect()
    const newX = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const newY = -((e.clientY - rect.top) / rect.height) * 2 + 1
    
    if (isDraggingPoint) {
        raycaster.setFromCamera(new THREE.Vector2(newX, newY), camera)
        const intersectPoint = new THREE.Vector3()
        if (raycaster.ray.intersectPlane(dragPlane, intersectPoint)) {
            const targetPos = intersectPoint.add(dragOffset)
            
            if (props.activeTopic === 'flux') {
                const targetObj = dragTarget === 'source' ? sourceObject : (dragTarget === 'plane' ? interactionPlane : shadowWall)
                
                if (isRotatingPlane && targetObj) {
                    const dx = newX - initialMouse.x
                    const dy = newY - initialMouse.y
                    const rotY = initialRotation.phi + dx * Math.PI
                    const rotX = initialRotation.theta - dy * Math.PI
                    targetObj.rotation.set(rotX, rotY, 0)
                    
                    if (dragTarget === 'plane') {
                       emit('update:planeRotation', { x: rotX, y: rotY, z: 0 })
                    }
                } else {
                    if (targetObj) {
                        targetObj.position.copy(targetPos)
                        if (dragTarget === 'source') emit('update:chargePos', { x: targetPos.x, y: targetPos.y, z: targetPos.z })
                        else if (dragTarget === 'plane') emit('update:planePos', { x: targetPos.x, y: targetPos.y, z: targetPos.z })
                        else if (dragTarget === 'wall') emit('update:wallPos', { x: targetPos.x, y: targetPos.y, z: targetPos.z })
                    }
                }
                updateShadowProjection()
            } else if (sourceObject) {
                sourceObject.position.copy(targetPos)
                emit('update:chargePos', { x: targetPos.x, y: targetPos.y, z: targetPos.z })
            }
        }
    } else if (isRotatingDir) {
        // Drag anywhere else on the assembly to rotate its direction (Delta-based)
        const dx = newX - initialMouse.x
        const dy = newY - initialMouse.y
        
        // Sensitivity: 180 degrees per full screen width/height
        const phi = initialRotation.phi + (dx * 180)
        const theta = initialRotation.theta + (dy * 180)
        
        emit('update:solidAngleDir', { phi, theta })
    } else if (props.activeTopic === 'area_vector' && isDraggingVector) {
        // Raycast for Area Vector Movement
        raycaster.setFromCamera(new THREE.Vector2(newX, newY), camera)
        const intersects = raycaster.intersectObject(sourceObject, true) 
        
        if (intersects.length > 0) {
            updateAreaVectorArrow(intersects[0])
        }
    }
    
    mouse.x = newX
    mouse.y = newY
}

const updateAreaVectorArrow = (hit) => {
    // 1. Get Point in Local Space (Arrow is child of sourceObject)
    // Raycaster returns World Point.
    const localPoint = hit.point.clone()
    sourceObject.worldToLocal(localPoint)
    
    // 2. Calculate Normal
    // - Smooth Interpolation for Curved Shapes (Sphere, Cylinder, Potato)
    // - Flat Face Normal for Faceted Shapes (Cube, Plane)
    let localNormal = new THREE.Vector3()
    
    const useSmooth = ['sphere', 'cylinder', 'potato'].includes(props.areaVectorShape)
    const geometry = hit.object.geometry
    
    if (useSmooth && geometry && geometry.attributes.normal) {
        // Barycentric interpolation for smooth normals
        const face = hit.face
        const position = geometry.attributes.position
        const normal = geometry.attributes.normal
        
        const a = new THREE.Vector3().fromBufferAttribute(position, face.a)
        const b = new THREE.Vector3().fromBufferAttribute(position, face.b)
        const c = new THREE.Vector3().fromBufferAttribute(position, face.c)
        
        const triangle = new THREE.Triangle(a, b, c)
        const bary = new THREE.Vector3()
        triangle.getBarycoord(localPoint, bary)
        
        const vA = new THREE.Vector3().fromBufferAttribute(normal, face.a)
        const vB = new THREE.Vector3().fromBufferAttribute(normal, face.b)
        const vC = new THREE.Vector3().fromBufferAttribute(normal, face.c)
        
        localNormal.addScaledVector(vA, bary.x)
        localNormal.addScaledVector(vB, bary.y)
        localNormal.addScaledVector(vC, bary.z)
        localNormal.normalize()
    } else {
        // Default to flat normal for Cube/Plane
        localNormal.copy(hit.face.normal)
    }
    
    // Transform Normal from Mesh Space (hit.object) to Group Space (sourceObject)
    // This is required if the mesh is rotated (e.g., Plane)
    localNormal.transformDirection(hit.object.matrix)
    localNormal.normalize()
    
    // Enforce "Outward" direction (Flip if pointing inwards)
    if (props.areaVectorShape !== 'plane') {
        const checkVec = localPoint.clone().normalize()
        if (checkVec.dot(localNormal) < -0.1) { // Tolerance
             localNormal.negate()
        }
    }
    
    // 3. Update Arrow (ThickArrow Group)
    const arrow = sourceObject.children.find(c => c.name === 'ThickArrow')
    if (arrow) {
        arrow.position.copy(localPoint)
        
        // Align to Local Normal
        const axis = new THREE.Vector3(0, 1, 0)
        const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, localNormal)
        arrow.setRotationFromQuaternion(quaternion)
    }

    // 4. Update dA Element Mesh
    const daMesh = sourceObject.children.find(c => c.name === 'dA_Element')
    if (daMesh) {
        // Move to point, slightly offset along normal
        daMesh.position.copy(localPoint).add(localNormal.clone().multiplyScalar(0.5))
        
        // Align to normal (Look at target in local space)
        const lookTarget = localPoint.clone().add(localNormal)
        daMesh.lookAt(lookTarget)
    }
}

const onMouseUp = () => {
    isDraggingPoint = false
    isRotatingDir = false
    isDraggingVector = false
    isRotatingPlane = false
    dragTarget = null
    controls.enabled = true
}

const init = () => {
    scene = new THREE.Scene()
    
    const width = containerRef.value.clientWidth
    const height = containerRef.value.clientHeight
    const aspect = width / height
    const frustumSize = 1000
    
    perspectiveCamera = new THREE.PerspectiveCamera(45, aspect, 0.1, 5000)
    perspectiveCamera.position.set(400, 300, 600)
    
    orthoCamera = new THREE.OrthographicCamera(
        frustumSize * aspect / -2, frustumSize * aspect / 2,
        frustumSize / 2, frustumSize / -2,
        0.1, 5000
    )
    orthoCamera.position.set(0, 0, 800)
    orthoCamera.lookAt(0, 0, 0)

    // Current camera pointer
    // Flux is now 3D too
    camera = perspectiveCamera 
    
    renderer = new THREE.WebGLRenderer({ canvas: canvasRef.value, antialias: true, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(width, height)
    
    controls = new OrbitControls(camera, renderer.domElement)
    controls.rotateSpeed = -1.0
    controls.enableRotate = true 
    controls.enableDamping = true
    controls.minDistance = 10
    controls.maxDistance = 1000
    controls.minPolarAngle = 0
    controls.maxPolarAngle = Math.PI // Full vertical rotation (180 degrees, zenith to nadir)
    controls.minAzimuthAngle = -Infinity
    controls.maxAzimuthAngle = Infinity // Full horizontal rotation
    
    // Lights - Uniform "Studio" Lighting Scheme
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.8) // Soft overall base
    scene.add(ambientLight)

    // Hemisphere Light for natural, uniform gradient (Sky vs Ground) without harsh highlights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5)
    hemiLight.position.set(0, 200, 0)
    scene.add(hemiLight)

    // Soft Directional Light from top-left for slight definition, but diffused
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5)
    dirLight.position.set(-100, 200, 100)
    scene.add(dirLight)
    
    scene.add(fieldLinesGroup)
    
    updateSimulation()
    animate()
}

const animate = () => {
    controls.update()
    
    // Update Photons Animation
    // Animate Streamlines (Flow)
    const time = Date.now() * 0.001
    streamlines.forEach(stream => {
        stream.material.dashOffset -= 0.01 * stream.speed
    })

    // Update Leader Lines for HUD
    syncLeaderLines()

    // Apex Pulsation & Surface Rotation
    if (sourceObject && props.activeTopic === 'solid_angle') {
        const time = Date.now() * 0.002
        const pulse = Math.sin(time) * 0.2 + 1.0
        
        // Rotation disabled as per user request
        
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
    syncLabels()
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
    // Precise Scene Clearing
    const toRemove = []
    scene.traverse(child => {
        // Only remove objects directly added to the scene (meshes, groups, etc.)
        // Preserve essential group holders, camera, and lights
        if (child.parent === scene) {
            if (child !== camera && !child.isLight && child !== fieldLinesGroup) {
                toRemove.push(child)
            }
        }
    })
    toRemove.forEach(obj => scene.remove(obj))

    sourceObject = null
    surfaceMesh = null
    fieldLinesGroup.clear()
    pulsingMaterials = [] 
    streamlines = []
    photons = []
    leaderLines.forEach(l => scene.remove(l.line))
    leaderLines = []
}

let isReconstructing = false
const updateSimulation = async () => {
    if (!scene || isReconstructing) return
    isReconstructing = true
    
    clearOldSimulation()
    
    switch(props.activeTopic) {
        case 'flux':
            await setupFlux3D()
            break
        case 'area_vector':
            setupAreaVector3D()
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
        case 'solid_sphere':
            setupSolidSphere3D()
            break
    }
    
    fieldLinesGroup.visible = props.showLines
    if (sourceObject) sourceObject.visible = props.showSource
    
    // Correct Zoom handling
    if (camera) {
        camera.zoom = props.zoom
        camera.updateProjectionMatrix()
    }
    syncLabels()
    isReconstructing = false
}

const setupSolidSphere3D = () => {
    const color = props.charge >= 0 ? 0xff0055 : 0x00d4ff
    const R = props.shellRadius
    
    // The Solid Sphere itself
    const geometry = new THREE.SphereGeometry(R, 64, 64)
    const material = new THREE.MeshStandardMaterial({ 
        color, 
        transparent: true, 
        opacity: 0.6, // Higher opacity for source
        metalness: 0,
        roughness: 0.8
    })
    sourceObject = new THREE.Mesh(geometry, material)
    
    // Core glow to indicate density
    const coreGlowGeo = new THREE.SphereGeometry(R * 0.8, 32, 32)
    const coreGlowMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.1 })
    sourceObject.add(new THREE.Mesh(coreGlowGeo, coreGlowMat))

    scene.add(sourceObject)

    // Field Lines
    // Inside: E proportional to r
    // Outside: E proportional to 1/r^2
    const numLines = 32
    for (let i = 0; i < numLines; i++) {
        const phi = Math.acos(-1 + (2 * i) / numLines)
        const theta = Math.sqrt(numLines * Math.PI) * phi
        const dir = new THREE.Vector3().setFromSphericalCoords(1, phi, theta)
        
        // Start from center
        const start = new THREE.Vector3(0, 0, 0)
        const end = new THREE.Vector3().copy(dir).multiplyScalar(350)
        draw3DFieldLine(start, end, props.charge >= 0)
    }

    // Animated Photons
    const getSolidSphereDir = () => {
        const phi = Math.random() * Math.PI * 2
        const theta = Math.acos(2 * Math.random() - 1)
        return new THREE.Vector3().setFromSphericalCoords(1, theta, phi)
    }
    sourceObject.add(createAnimatedPhotons(40, getSolidSphereDir, 350))

    setupSurfaceMesh('spherical')
}



const setupAreaVector3D = () => {
    // 1. Create Shape based on prop
    const size = props.surfaceRadius
    let geometry
    // Improved Realistic Material: Matte / High Tech Plastic look (No Glare)
    let material = new THREE.MeshPhysicalMaterial({
        color: 0x00ff9d, // Base Neon Cyan
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85, 
        metalness: 0.1,
        roughness: 0.8, // High roughness to diffuse light completely
        clearcoat: 0.0, // No clearcoat to avoid sharp reflections
        clearcoatRoughness: 1.0,
        transmission: 0.0, // No glass effect to avoid refraction artifacts
        emissive: 0x004433,
        emissiveIntensity: 0.4 // Higher emissive for self-illumination/uniformity
    })

    sourceObject = new THREE.Group()
    let mesh

    // Metallic Material for custom parts (Gear etc) - like Vernier/Screw Gauge
    const metalMaterial = new THREE.MeshStandardMaterial({
        color: 0xcbd5e1, // Steel/Aluminum
        metalness: 0.9,
        roughness: 0.4,
        envMapIntensity: 1.0
    })

    if (props.areaVectorShape === 'plane') {
        geometry = new THREE.PlaneGeometry(size * 2, size * 2)
        mesh = new THREE.Mesh(geometry, material)
        mesh.rotation.x = -Math.PI / 3 
        mesh.rotation.z = Math.PI / 6
    } else if (props.areaVectorShape === 'sphere') {
        geometry = new THREE.SphereGeometry(size, 64, 64)
        mesh = new THREE.Mesh(geometry, material)
    } else if (props.areaVectorShape === 'cylinder') {
        geometry = new THREE.CylinderGeometry(size, size, size * 2, 64)
        mesh = new THREE.Mesh(geometry, material)
    } else if (props.areaVectorShape === 'cube') {
        geometry = new THREE.BoxGeometry(size * 1.5, size * 1.5, size * 1.5)
        mesh = new THREE.Mesh(geometry, material)
    } else if (props.areaVectorShape === 'potato') {
        // Use Potato Geometry
        geometry = createPotatoGeometry(size, 128)
       // Potato needs explicit normals updates or smooth shading
       geometry.computeVertexNormals()
       mesh = new THREE.Mesh(geometry, material)
    } else {
        // Default Fallback
        geometry = new THREE.SphereGeometry(size, 64, 64)
        mesh = new THREE.Mesh(geometry, material)
    }

    sourceObject.add(mesh)
    
    // Add Wireframe Overlay for "Scientific" Realism
    const wireGeo = new THREE.WireframeGeometry(geometry)
    const wireMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 })
    const wireframe = new THREE.LineSegments(wireGeo, wireMat)

    // Match rotation for plane/cube or any SVG shape
    const isSVG = props.areaVectorShape === 'gear'
    if (props.areaVectorShape === 'plane' || props.areaVectorShape === 'cube' || isSVG) {
        wireframe.rotation.copy(mesh.rotation)
    }
    sourceObject.add(wireframe)

    // 2. Initial Normal Vector (Area Vector)
    // We place it at a default location depending on shape, or just center
    const origin = new THREE.Vector3(0, 0, 0)
    const dir = new THREE.Vector3(0, 0, 1) // Default
    const length = size * 0.8
    const hex = 0xff00ff 
    
    // For specific shapes, set initial arrow better
    if (props.areaVectorShape === 'plane') {
        dir.applyEuler(mesh.rotation)
    } else {
        // For 3D shapes, put it on top?
        origin.set(0, size, 0)
        dir.set(0, 1, 0)
    }

    // New Thick Arrow (Unit Sized Base)
    // Base Length = 2 (2x dA side), Base Thickness = 0.08 (Sleeker)
    const unitLen = 2
    const unitThickness = 0.08
    const daScale = props.dASize || 10
    
    // Create at unit size
    const thickArrow = createThickArrow(dir, origin, unitLen, hex, unitThickness)
    // Apply initial scale
    thickArrow.scale.set(daScale, daScale, daScale)
    sourceObject.add(thickArrow)

    // dA Element Mesh (Small Patch)
    // Base size 1x1
    const daGeometry = new THREE.PlaneGeometry(1, 1)
    const daMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffff00, // Bright Yellow for dA
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
        depthTest: false // Ensure it renders on top
    })
    const daMesh = new THREE.Mesh(daGeometry, daMaterial)
    daMesh.name = 'dA_Element'
    // Initial Scale based on prop
    daMesh.scale.set(daScale, daScale, 1) // Area elements typically scale in X/Y
    
    // Position it slightly off the surface to avoid z-fighting
    daMesh.position.copy(origin).add(dir.clone().multiplyScalar(0.5))
    daMesh.lookAt(origin.clone().add(dir)) // Align to normal
    
    sourceObject.add(daMesh)

    scene.add(sourceObject)
    
    // Setup Sync
    syncLabels()
}

// Watch for dA Size changes
watch(() => props.dASize, (newSize) => {
    if (props.activeTopic !== 'area_vector' || !sourceObject) return
    
    let daMesh = null
    let arrow = null
    
    sourceObject.traverse((child) => {
        if (child.name === 'dA_Element') daMesh = child
        if (child.name === 'ThickArrow') arrow = child
    })
    
    if (daMesh) {
        daMesh.scale.set(newSize, newSize, 1)
    }
    
    if (arrow) {
        // Robust Scaling: Just update the scale!
        arrow.scale.set(newSize, newSize, newSize)
    }
})

// --- Topic Specific setups ---

const setupSolidAngle3D = () => {
    const radius = props.surfaceRadius
    const halfAngleDeg = props.charge // Using chargeValue as θ/2
    const halfAngleRad = (halfAngleDeg * Math.PI) / 180
    
    sourceObject = new THREE.Group()
    if (props.chargePos) {
        sourceObject.position.set(props.chargePos.x, props.chargePos.y, props.chargePos.z)
    }
    scene.add(sourceObject)

    // --- 1. Central Origin Point (Pure White Core) ---
    const centerPointGroup = new THREE.Group()
    centerPointGroup.name = 'centerPointGroup'
    const centerGeo = new THREE.SphereGeometry(3, 32, 32)
    const centerMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
    })
    const centerPoint = new THREE.Mesh(centerGeo, centerMat)
    centerPointGroup.add(centerPoint)

    const centerGlowGeo = new THREE.SphereGeometry(10, 32, 32)
    const centerGlowMat = new THREE.MeshBasicMaterial({
        color: 0xffffff, // White aura for origin
        transparent: true,
        opacity: 0.5 
    })
    centerPointGroup.add(new THREE.Mesh(centerGlowGeo, centerGlowMat))
    sourceObject.add(centerPointGroup)

    // --- 2. Directional Group (Orientation) ---
    const dirGroup = new THREE.Group()
    const phi = (props.solidAngleDir?.phi || 0) * Math.PI / 180
    const theta = (props.solidAngleDir?.theta || 0) * Math.PI / 180
    dirGroup.rotation.y = phi
    dirGroup.rotation.x = -theta
    sourceObject.add(dirGroup)

    // --- 3. Projecting Cone (Vibrant Magenta Lines & Faint Volume) ---
    const projectionLinesGroup = new THREE.Group()
    const coneHeight = radius * Math.cos(halfAngleRad)
    const coneRadius = radius * Math.sin(halfAngleRad)
    
    if (halfAngleDeg < 179) {
        const coneGeo = new THREE.CylinderGeometry(coneRadius, 0, coneHeight, 64, 1, true)
        const coneMat = new THREE.MeshBasicMaterial({
            color: 0xff00ff, // Magenta Volume
            transparent: true,
            opacity: 0.05, 
            side: THREE.DoubleSide
        })
        const coneMesh = new THREE.Mesh(coneGeo, coneMat)
        coneMesh.rotateX(Math.PI / 2)
        coneMesh.position.z = coneHeight / 2
        projectionLinesGroup.add(coneMesh)
    }

    const numBoundaryLines = 32
    for(let i = 0; i < numBoundaryLines; i++) {
        const angle = (i / numBoundaryLines) * Math.PI * 2
        const endPoint = new THREE.Vector3(
            Math.sin(halfAngleRad) * Math.cos(angle),
            Math.sin(halfAngleRad) * Math.sin(angle),
            Math.cos(halfAngleRad)
        ).multiplyScalar(radius)

        const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), endPoint])
        const lineMat = new THREE.LineBasicMaterial({
            color: 0xff00ff, // Sharp Magenta Lines
            transparent: true,
            opacity: 0.5 // Slightly more visible for clarity
        })
        projectionLinesGroup.add(new THREE.Line(lineGeo, lineMat))
    }
    projectionLinesGroup.visible = props.showLines
    dirGroup.add(projectionLinesGroup)

    // --- 4. Spherical Cap (The Projection Area) ---
    const capGeo = new THREE.SphereGeometry(
        radius, 64, 64, 
        0, Math.PI * 2, 
        0, halfAngleRad  
    )
    const capMat = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.4, 
        side: THREE.DoubleSide
    })
    const cap = new THREE.Mesh(capGeo, capMat)
    cap.rotateX(Math.PI / 2) 
    dirGroup.add(cap)

    // Cap boundary circle (No flare, just the edge)
    const capLevel = radius * Math.cos(halfAngleRad)
    const capRad = radius * Math.sin(halfAngleRad)
    const circleCurve = new THREE.EllipseCurve(0, 0, capRad, capRad, 0, Math.PI * 2, false, 0)
    const points = circleCurve.getPoints(128)
    const circleGeo = new THREE.BufferGeometry().setFromPoints(points)
    const circleMat = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.6 })
    const circle = new THREE.Line(circleGeo, circleMat)
    circle.position.z = capLevel
    dirGroup.add(circle)

    // --- 5. Solid Angle Indicator (Small Red Arc/Circle near origin) ---
    if (props.showSecondary) {
        const indicatorRadius = 40
        const indicatorGeo = new THREE.SphereGeometry(
            indicatorRadius, 32, 16,
            0, Math.PI * 2,
            0, halfAngleRad
        )
        const indicatorMat = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        })
        const indicatorCap = new THREE.Mesh(indicatorGeo, indicatorMat)
        indicatorCap.rotateX(Math.PI / 2)
        dirGroup.add(indicatorCap)

        // Indicator boundary circle
        const indLevel = indicatorRadius * Math.cos(halfAngleRad)
        const indRad = indicatorRadius * Math.sin(halfAngleRad)
        const indCircleCurve = new THREE.EllipseCurve(0, 0, indRad, indRad, 0, Math.PI * 2, false, 0)
        const indCircleGeo = new THREE.BufferGeometry().setFromPoints(indCircleCurve.getPoints(64))
        const indCircleMat = new THREE.LineBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.8 })
        const indCircle = new THREE.Line(indCircleGeo, indCircleMat)
        indCircle.position.z = indLevel
        dirGroup.add(indCircle)
    }

    labels.value = []
}

const syncLabels = () => {
    if (!camera || !containerRef.value) return
    
    const updatedLabels = []
    const width = containerRef.value.clientWidth
    const height = containerRef.value.clientHeight

    if (props.activeTopic === 'solid_angle') {
        // No labels for solid angle as requested by user
    } else if (props.activeTopic === 'solid_sphere' || props.activeTopic === 'shell') {
        const r = props.surfaceRadius
        const R = props.shellRadius
        const Q = props.charge
        const pos = new THREE.Vector3(r, 0, 0) // Just pick a point on the surface
        const screenPos = pos.clone().project(camera)

        let E = 0
        const k = 8.99e9
        const rMeters = r / 100 // Scale
        if (props.activeTopic === 'solid_sphere') {
            if (r < R) {
                E = (k * Math.abs(Q) * 1e-9 * rMeters) / Math.pow(R / 100, 3)
            } else {
                E = (k * Math.abs(Q) * 1e-9) / (rMeters * rMeters)
            }
        } else { // shell
            if (r < R) E = 0
            else E = (k * Math.abs(Q) * 1e-9) / (rMeters * rMeters)
        }

        updatedLabels.push({
            id: 'efield',
            text: `E = ${E.toExponential(2)} N/C`,
            x: (screenPos.x * 0.5 + 0.5) * width,
            y: (-screenPos.y * 0.5 + 0.5) * height - 40,
            color: '#00ff9d'
        })
    } else if (props.activeTopic === 'area_vector' && sourceObject) {
         // Labels removed as per user request
    } else if (props.activeTopic === 'flux') {
         // Flux labels removed
    }
    
    labels.value = updatedLabels
}

const createSVGTexture = (svgString) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    const svg = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svg)
    
    // Higher resolution for crispness
    canvas.width = 512
    canvas.height = 512
    
    return new Promise((resolve) => {
        img.onload = () => {
            ctx.clearRect(0, 0, 512, 512)
            ctx.drawImage(img, 0, 0, 512, 512)
            const texture = new THREE.CanvasTexture(canvas)
            texture.needsUpdate = true
            URL.revokeObjectURL(url)
            resolve(texture)
        }
        img.src = url
    })
}

const setupFlux3D = async () => {
    const type = props.fluxSourceType || 'point'
    const colorStr = props.charge >= 0 ? '#ff0055' : '#00d4ff'
    const colorHex = props.charge >= 0 ? 0xff0055 : 0x00d4ff
    const { x, y, z } = props.chargePos || { x: -400, y: 0, z: 0 }

    // 1. Source (Left)
    let svgString = ''
    let size = 100

    if (type === 'point') {
        const sign = props.charge >= 0 ? '+' : '-'
        svgString = `
            <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
                <circle cx="256" cy="256" r="200" fill="${colorStr}" stroke="white" stroke-width="20" />
                <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-family="Arial" font-size="250" font-weight="bold" fill="white">${sign}</text>
            </svg>`
        size = 80
    } else if (type === 'wire') {
        svgString = `
            <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
                <rect x="236" y="20" width="40" height="472" rx="20" fill="${colorStr}" stroke="white" stroke-width="10" />
            </svg>`
        size = 120
    } else if (type === 'plane') {
        svgString = `
            <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
                <rect x="100" y="100" width="312" height="312" rx="20" fill="${colorStr}" stroke="white" stroke-width="10" transform="skewX(-10)" />
            </svg>`
        size = 150
    }

    const texture = await createSVGTexture(svgString)
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true })
    sourceObject = new THREE.Group()
    sourceObject.name = 'FluxSource_3D'
    
    const sprite = new THREE.Sprite(material)
    sprite.scale.set(size, size, 1)
    sprite.name = 'SourceSprite'
    sourceObject.add(sprite)
    sourceObject.position.set(x, y, z)

    const light = new THREE.PointLight(colorHex, 2, 800)
    sourceObject.add(light)
    scene.add(sourceObject)

    // 2. Interaction Plane (Center)
    const planeGeo = new THREE.PlaneGeometry(200, 200)
    const planeMat = new THREE.MeshStandardMaterial({ 
        color: 0x00ff9d, 
        transparent: true, 
        opacity: 0.4, 
        side: THREE.DoubleSide,
        metalness: 0.5,
        roughness: 0.2,
        emissive: 0x00ff9d,
        emissiveIntensity: 0.1
    })
    interactionPlane = new THREE.Mesh(planeGeo, planeMat)
    interactionPlane.name = 'InteractionPlane'
    interactionPlane.position.set(props.planePos.x, props.planePos.y, props.planePos.z)
    interactionPlane.rotation.set(props.planeRotation.x, props.planeRotation.y, props.planeRotation.z)
    
    // Add border to plane
    const edges = new THREE.EdgesGeometry(planeGeo)
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x00ff9d, linewidth: 2 }))
    interactionPlane.add(line)
    
    scene.add(interactionPlane)

    // 3. Shadow Wall (Right)
    const wallGeo = new THREE.BoxGeometry(20, 1000, 1000)
    const wallMat = new THREE.MeshStandardMaterial({ 
        color: 0x112233, 
        metalness: 0.8, 
        roughness: 0.3 
    })
    shadowWall = new THREE.Mesh(wallGeo, wallMat)
    shadowWall.name = 'ShadowWall'
    shadowWall.position.set(props.wallPos.x, props.wallPos.y, props.wallPos.z)
    scene.add(shadowWall)

    // 4. Shadow Projection Mesh (on the wall)
    const shadowGeo = new THREE.PlaneGeometry(1, 1) // Initially small, will be scaled/shaped
    const shadowMat = new THREE.MeshBasicMaterial({ 
        color: 0x000000, 
        transparent: true, 
        opacity: 0.8,
        side: THREE.FrontSide
    })
    shadowMesh = new THREE.Mesh(shadowGeo, shadowMat)
    shadowMesh.name = 'ShadowProjection'
    // Position slightly in front of wall
    shadowMesh.position.set(-11, 0, 0) 
    shadowMesh.rotation.y = -Math.PI / 2
    shadowWall.add(shadowMesh)

    updateShadowProjection()
}

// Global update for shadow
const updateShadowProjection = () => {
    if (!sourceObject || !interactionPlane || !shadowMesh || !shadowWall) return

    const sourcePos = new THREE.Vector3().setFromMatrixPosition(sourceObject.matrixWorld)
    
    // Define the Wall Plane in world space
    // Standard box left face is at x = -10 (local)
    const wallLocalNormal = new THREE.Vector3(-1, 0, 0)
    const wallWorldNormal = wallLocalNormal.clone().applyQuaternion(shadowWall.quaternion).normalize()
    const wallWorldPoint = new THREE.Vector3(-10, 0, 0).applyMatrix4(shadowWall.matrixWorld)
    const wallPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(wallWorldNormal, wallWorldPoint)

    // Corner vertices of the interaction plane (local space)
    const planeVertices = [
        new THREE.Vector3(-100, 100, 0),
        new THREE.Vector3(100, 100, 0),
        new THREE.Vector3(100, -100, 0),
        new THREE.Vector3(-100, -100, 0)
    ]

    // Clear old rays
    fieldLinesGroup.clear()

    const projectedPointsInWorld = []
    const intersectionValid = planeVertices.every(v => {
        const worldV = v.applyMatrix4(interactionPlane.matrixWorld)
        const rayDir = new THREE.Vector3().subVectors(worldV, sourcePos).normalize()
        const ray = new THREE.Ray(sourcePos, rayDir)
        
        const intersectionPoint = new THREE.Vector3()
        if (ray.intersectPlane(wallPlane, intersectionPoint)) {
            const dot = new THREE.Vector3().subVectors(intersectionPoint, sourcePos).dot(rayDir)
            if (dot <= 0) return false
            projectedPointsInWorld.push(intersectionPoint)
            return true
        }
        return false
    })

    // Pedagogical Grid of Rays
    if (props.showLines && props.showSurface) {
        const gridRes = 3 // 3x3 grid inside the plane
        for (let i = 0; i <= gridRes; i++) {
            for (let j = 0; j <= gridRes; j++) {
                const u = (i / gridRes) * 2 - 1 // -1 to 1
                const v = (j / gridRes) * 2 - 1 // -1 to 1
                const localP = new THREE.Vector3(u * 100, v * 100, 0)
                const worldP = localP.applyMatrix4(interactionPlane.matrixWorld)
                
                const rayDir = new THREE.Vector3().subVectors(worldP, sourcePos).normalize()
                const ray = new THREE.Ray(sourcePos, rayDir)
                const intersect = new THREE.Vector3()
                
                if (ray.intersectPlane(wallPlane, intersect)) {
                    const points = [sourcePos, worldP, intersect]
                    const lineGeo = new THREE.BufferGeometry().setFromPoints(points)
                    const lineMat = new THREE.LineDashedMaterial({ 
                        color: 0x00ffff, 
                        dashSize: 10, 
                        gapSize: 5,
                        opacity: 0.15,
                        transparent: true
                    })
                    const line = new THREE.Line(lineGeo, lineMat)
                    line.computeLineDistances()
                    fieldLinesGroup.add(line)
                }
            }
        }
    }

    if (!intersectionValid) {
        shadowMesh.visible = false
        return
    }

    shadowMesh.visible = props.showShadow && props.showSurface
    
    // To update shadowMesh (PlaneGeometry warped), we map world points to Wall's local ZY plane
    const wallInvMatrix = shadowWall.matrixWorld.clone().invert()
    const localPoints = projectedPointsInWorld.map(p => {
        const lp = p.clone().applyMatrix4(wallInvMatrix)
        return new THREE.Vector2(lp.y, lp.z)
    })

    const shape = new THREE.Shape()
    shape.moveTo(localPoints[0].x, localPoints[0].y)
    shape.lineTo(localPoints[1].x, localPoints[1].y)
    shape.lineTo(localPoints[2].x, localPoints[2].y)
    shape.lineTo(localPoints[3].x, localPoints[3].y)
    shape.closePath()

    const newGeo = new THREE.ShapeGeometry(shape)
    shadowMesh.geometry.dispose()
    shadowMesh.geometry = newGeo

    // 5. Calculate Flux and Update Area Vector
    const planeNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(interactionPlane.quaternion).normalize()
    const fieldDir = new THREE.Vector3().subVectors(interactionPlane.position, sourcePos).normalize()
    const distSq = interactionPlane.position.distanceToSquared(sourcePos)
    
    // Simple flux model: k * Q * A * cos(theta) / r^2
    const cosTheta = fieldDir.dot(planeNormal)
    const fieldStrength = 100000 / distSq // Arbitrary scaling for visibility
    const area = 200 * 200
    const flux = fieldStrength * area * Math.abs(cosTheta)
    
    // Angle in degrees
    const angleDeg = Math.acos(Math.abs(cosTheta)) * (180 / Math.PI)
    
    if (Math.abs(cosTheta) < 0.001) {
        emit('update:fluxValue', 0)
        emit('update:thetaAngle', 90)
    } else {
        emit('update:fluxValue', flux)
        emit('update:thetaAngle', angleDeg)
    }

    // Update Area Vector Arrow
    if (!areaVectorArrow) {
        areaVectorArrow = new THREE.ArrowHelper(new THREE.Vector3(0,0,1), new THREE.Vector3(0,0,0), 60, 0xffff00, 20, 10)
        interactionPlane.add(areaVectorArrow)
    }
    areaVectorArrow.visible = props.showAreaVector && props.showSurface

    // 6. Update Overlay Labels
    syncFluxLabels(interactionPlane.position, angleDeg)
}

const syncFluxLabels = (pos, angle) => {
    if (!props.showSurface) {
        labels.value = []
        return
    }
    // Add a label showing theta near the plane
    labels.value = [
        {
            id: 'angle-label',
            text: `θ = ${angle.toFixed(1)}°`,
            position: pos.clone().add(new THREE.Vector3(0, 120, 0)),
            color: '#ffff00'
        }
    ]
}

// Helper to add animated field lines that move WITH the source
function addLocalFieldLine(parent, start, end, isPositive) {
    const color = isPositive ? 0x00ffff : 0xff3366
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end])
    
    // 1. Static Reference Line
    const refMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.1 })
    parent.add(new THREE.Line(geometry, refMat))
    
    // 2. Animated Streamline
    const streamMat = new THREE.LineDashedMaterial({
        color,
        dashSize: 10,
        gapSize: 5,
        transparent: true,
        opacity: 0.6,
        linewidth: 2
    })
    const streamLine = new THREE.Line(geometry, streamMat)
    streamLine.computeLineDistances()
    streamlines.push({ material: streamMat, speed: isPositive ? 1 : -1 })
    parent.add(streamLine)
    
    // 3. Arrowhead
    const dir = new THREE.Vector3().subVectors(end, start).normalize()
    const arrowPos = start.clone().lerp(end, 0.5)
    const arrowDir = isPositive ? dir : dir.clone().negate()
    const arrowHelper = new THREE.ArrowHelper(arrowDir, arrowPos, 12, color, 6, 3)
    parent.add(arrowHelper)
}

const setupWire3D = () => {
    const color = props.charge >= 0 ? 0xff0055 : 0x00d4ff
    const geometry = new THREE.CylinderGeometry(4, 4, props.surfaceLength, 32)
    const material = new THREE.MeshStandardMaterial({ 
        color, 
        emissive: color, 
        emissiveIntensity: 0.3,
        metalness: 0,
        roughness: 0.5
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

    // Animated Photons (Radial)
    const getWireDir = () => {
        const angle = Math.random() * Math.PI * 2
        return new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle))
    }
    sourceObject.add(createAnimatedPhotons(40, getWireDir, 250))
    
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

    // Animated Photons (Planar)
    const getSheetDir = () => {
        return new THREE.Vector3(Math.random() > 0.5 ? 1 : -1, 0, 0)
    }
    sourceObject.add(createAnimatedPhotons(30, getSheetDir, 300))
    
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
    const R_shell = props.shellRadius
    if (props.surfaceRadius > R_shell + 2) {
        const numLines = 32
        for (let i = 0; i < numLines; i++) {
            const phi = Math.acos(-1 + (2 * i) / numLines)
            const theta = Math.sqrt(numLines * Math.PI) * phi
            const dir = new THREE.Vector3().setFromSphericalCoords(1, phi, theta)
            const start = new THREE.Vector3().copy(dir).multiplyScalar(R_shell + 2)
            const end = new THREE.Vector3().copy(dir).multiplyScalar(300)
            draw3DFieldLine(start, end, props.charge >= 0)
        }
    }
    
    // Animated Photons
    const getShellDir = () => {
        const phi = Math.random() * Math.PI * 2
        const theta = Math.acos(2 * Math.random() - 1)
        return new THREE.Vector3().setFromSphericalCoords(1, theta, phi)
    }
    sourceObject.add(createAnimatedPhotons(40, getShellDir, 400))
    
    setupSurfaceMesh('spherical')
}

// --- Helper Functions ---

function createPotatoGeometry(radius, detail = 64) {
    const geometry = new THREE.SphereGeometry(radius, detail, detail)
    const positionAttribute = geometry.getAttribute('position')
    const vertex = new THREE.Vector3()

    for (let i = 0; i < positionAttribute.count; i++) {
        vertex.fromBufferAttribute(positionAttribute, i)
        vertex.normalize()
        
        // Pronounced random but smooth displacement (More visible Potato)
        const v = vertex.clone()
        const noise = 
            0.25 * Math.sin(v.x * 2.0 + v.y * 2.5 + v.z * 1.5) +
            0.15 * Math.sin(v.x * 4.0 - v.y * 2.0 + v.z * 3.5) +
            0.08 * Math.sin(v.x * 8.0 + v.y * 6.0 + v.z * 5.5)
        
        const displacement = 1.0 + noise
        vertex.multiplyScalar(radius * displacement)
        positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z)
    }
    
    geometry.computeVertexNormals()
    return geometry
}

// Helper to create a thick 3D arrow (Cylinder + Cone)
function createThickArrow(dir, origin, length, color, thickness) {
    const arrowGroup = new THREE.Group()
    arrowGroup.name = 'ThickArrow'
    
    // Default orientation is along Y axis for Cylinder/Cone
    const shaftLen = length * 0.75
    const headLen = length * 0.25
    const shaftRadius = thickness
    const headRadius = thickness * 2.5
    
    // Shaft
    const shaftGeo = new THREE.CylinderGeometry(shaftRadius, shaftRadius, shaftLen, 32)
    const shaftMat = new THREE.MeshStandardMaterial({ 
        color: color, 
        metalness: 0.3, 
        roughness: 0.4
    })
    const shaft = new THREE.Mesh(shaftGeo, shaftMat)
    shaft.position.y = shaftLen / 2
    arrowGroup.add(shaft)
    
    // Head
    const headGeo = new THREE.ConeGeometry(headRadius, headLen, 32)
    const headMat = new THREE.MeshStandardMaterial({ 
        color: color, 
        metalness: 0.3, 
        roughness: 0.4 
    })
    const head = new THREE.Mesh(headGeo, headMat)
    head.position.y = shaftLen + headLen / 2
    arrowGroup.add(head)
    
    // Position at origin
    arrowGroup.position.copy(origin)
    
    // Rotate to match direction
    // Cylinder is defaults UP (0,1,0)
    const axis = new THREE.Vector3(0, 1, 0)
    const target = dir.clone().normalize()
    
    // Handle anti-parallel case for setFromUnitVectors
    if (axis.dot(target) < -0.9999) {
        arrowGroup.quaternion.set(1, 0, 0, 0) // 180 deg rot X
    } else {
        arrowGroup.quaternion.setFromUnitVectors(axis, target)
    }
    
    return arrowGroup
}

function draw3DFieldLine(start, end, isPositive) {
    const color = isPositive ? 0x00ffff : 0xff3366 // Technical Cyan / Hot Pink
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end])
    
    // 1. Static Reference Line (Thin)
    const refMat = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.2 })
    const refLine = new THREE.Line(geometry, refMat)
    fieldLinesGroup.add(refLine)
    
    // 2. Animated Streamline (Dashed)
    const streamMat = new THREE.LineDashedMaterial({
        color: color,
        dashSize: 10,
        gapSize: 5,
        transparent: true,
        opacity: 0.8,
        linewidth: 2
    })
    const streamLine = new THREE.Line(geometry, streamMat)
    streamLine.computeLineDistances()
    
    // Custom property for animation
    streamlines.push({ material: streamMat, speed: isPositive ? 1 : -1 })
    fieldLinesGroup.add(streamLine)
    
    // 3. Technical Arrowhead
    const dir = new THREE.Vector3().subVectors(end, start)
    const length = dir.length()
    const arrowDir = isPositive ? dir.clone().normalize() : dir.clone().normalize().negate()
    const arrowHelper = new THREE.ArrowHelper(
        arrowDir, 
        start.clone().add(dir.clone().normalize().multiplyScalar(length * 0.45)), 
        14, 
        color, 
        6, 
        3
    )
    fieldLinesGroup.add(arrowHelper)
}

function createAnimatedPhotons(count, getDirection, maxDist = 400) {
    // Photons are disabled in the Streamline schematic theme
    return new THREE.Group()
}

const syncLeaderLines = () => {
    if (!camera) return
    leaderLines.forEach(l => {
        // In a real leader line system, we'd draw these in 2D or 3D
        // For simplicity, let's just make sure the labels point to the right place
    })
}

const setupSurfaceMesh = (forcedType = null) => {
    if (surfaceMesh) scene.remove(surfaceMesh)
    
    // Only show if toggled or mandated by topic (Flux topic usually implies seeing the surface)
    if (!props.showSurface && props.activeTopic !== 'flux') return 

    const type = forcedType || props.surfaceType
    let geometry
    
    // 1. Create Layout Geometry
    if (type === 'spherical') {
        geometry = new THREE.SphereGeometry(props.surfaceRadius, 64, 64)
    } else if (type === 'cylindrical') {
        // height is surfaceLength, radius is surfaceRadius
        geometry = new THREE.CylinderGeometry(props.surfaceRadius, props.surfaceRadius, props.surfaceLength, 64, 1, false)
    } else if (type === 'box') {
        const s = props.surfaceRadius * 2 // Use radius as half-extent
        geometry = new THREE.BoxGeometry(s, s, s)
    } else {
        return
    }

    // 2. Holographic Material (Neon Lab Style)
    // Clear, transparent, with edge glow handled by a rim-like effect or just wireframe overlay
    const material = new THREE.MeshBasicMaterial({
        color: 0x00ff9d, // Fluorescent Green for the Gaussian Surface
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide,
        depthWrite: false // Important for transparency sorting
    })
    
    surfaceMesh = new THREE.Group()
    
    const mainMesh = new THREE.Mesh(geometry, material)
    surfaceMesh.add(mainMesh)
    
    // 3. Boundary / Wireframe for definition
    const wireGeo = new THREE.WireframeGeometry(geometry)
    const wireMat = new THREE.LineBasicMaterial({
        color: 0x00ff9d,
        transparent: true,
        opacity: 0.3
    })
    const wireframe = new THREE.LineSegments(wireGeo, wireMat)
    surfaceMesh.add(wireframe)
    
    // 4. Orientation adjustments
    if (type === 'cylindrical') {
        // Default cylinder is along Y. If we want it along Z or X?
        // Let's keep Y vertical for now to match typical "Wire" setups
    }
    
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
    props.solidAngleDir,
    props.showSecondary,
    props.surfaceType, 
    props.surfaceRadius, 
    props.surfaceLength,
    props.shellRadius,
    props.showGrid, 
    props.zoom,
    props.showSurface,
    props.showSource,
    props.areaVectorShape,
    props.fluxSourceType
], updateSimulation, { deep: true })

watch(() => props.activeTopic, (newTopic) => {
    if (controls) {
        controls.enableRotate = true 
        camera = perspectiveCamera
        controls.object = perspectiveCamera
        
        if (newTopic === 'flux') {
            camera.position.set(600, 400, 800)
            controls.target.set(0, 0, 0)
        }
        controls.update()
    }
}, { immediate: true })

watch(() => props.showLines, (val) => {
    if (fieldLinesGroup) fieldLinesGroup.visible = val
    if (sourceObject) {
       const local = sourceObject.getObjectByName('LocalFieldLines')
       if (local) local.visible = val
    }
})

watch(() => props.planePos, (newPos) => {
    if (interactionPlane && !isDraggingPoint) {
        interactionPlane.position.set(newPos.x, newPos.y, newPos.z)
        updateShadowProjection()
    }
}, { deep: true })

watch(() => props.planeRotation, (newRot) => {
    if (interactionPlane && !isRotatingPlane) {
        interactionPlane.rotation.set(newRot.x, newRot.y, newRot.z)
        updateShadowProjection()
    }
}, { deep: true })

watch(() => props.wallPos, (newPos) => {
    if (shadowWall && !isDraggingPoint) {
        shadowWall.position.set(newPos.x, newPos.y, newPos.z)
        updateShadowProjection()
    }
}, { deep: true })

watch(() => props.showSource, (val) => {
    if (sourceObject) sourceObject.visible = val
})

watch(() => props.showShadow, (val) => {
    if (shadowWall) shadowWall.visible = val
})

watch(() => props.showSurface, (val) => {
    if (interactionPlane) {
        interactionPlane.visible = val
        // If plane is hidden, hide the projection too? 
        // Usually, yes, since flux is caught by the plane.
        if (shadowMesh) shadowMesh.visible = val && props.showShadow
    }
})

watch(() => props.showLines, (val) => {
    // In this mode, showLines toggles visibility of the "Light Rays" 
    // (Which could be field lines group).
    if (fieldLinesGroup) fieldLinesGroup.visible = val
})

watch(() => props.drawingActive, (active) => {
    if (controls) {
        controls.enabled = !active
    }
})


// Watcher moved to setupAreaVector3D proximity or consolidated.
// (Actually I replaced the block above, so I need to remove this block entirely)


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
    <div class="label-overlay">
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
    font-family: 'Mono', monospace;
    font-weight: 400;
    font-size: 0.75rem;
    padding: 6px 10px;
    background: rgba(10, 25, 47, 0.9);
    border: 1px solid #00ffff;
    border-radius: 0;
    color: #00ffff;
    white-space: nowrap;
    transition: all 0.05s linear;
    pointer-events: none;
    box-shadow: 0 0 15px rgba(0, 255, 255, 0.2);
    text-align: left;
}

.lab-3d-label::before {
    content: '[';
    margin-right: 4px;
    opacity: 0.5;
}

.lab-3d-label::after {
    content: ']';
    margin-left: 4px;
    opacity: 0.5;
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
