<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

const props = defineProps({
    shape: String,
    material: { type: String, default: 'dielectric' },
    coords: { type: String, default: 'cartesian' },
    distributionFunc: { type: String, default: '1' },
    cutMode: { type: String, default: 'full' },
    showGraph: Boolean,
    showDistribution: Boolean,
    zoom: { type: Number, default: 1 }
})

const containerRef = ref(null)
const canvasRef = ref(null)

const handleResize = () => {
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    if (containerRef.value && containerRef.value.clientWidth > 0) {
        width = containerRef.value.clientWidth;
        height = containerRef.value.clientHeight;
    }
    
    if (camera) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }
    
    if (renderer) {
        renderer.setSize(width, height);
    }
}

let scene, camera, renderer, controls, pointCloud, shapeMesh
let frameId

// Function Evaluator
const evaluateFunction = (x, y, z) => {
    try {
        // Calculate all coordinates from the normalized Cartesian x,y,z
        const r = Math.sqrt(x*x + y*y + z*z);
        const theta = Math.acos(z / (r || 1)); // 0 to PI
        const phi = Math.atan2(y, x); // -PI to PI
        const rho = Math.sqrt(x*x + y*y); // Cylindrical radius

        // Create function with all possibilities available
        // We use a broader try-catch inside the user function to prevent crashes
        const f = new Function(
            'x', 'y', 'z', 'r', 'theta', 'phi', 'rho', 
            `try { 
                const val = (${props.distributionFunc});
                return isNaN(val) ? 0 : val;
            } catch(e) { 
                return 0; // Default to 0 density on error 
            }`
        );
        
        const result = f(x, y, z, r, theta, phi, rho);
        return isNaN(result) ? 0 : Math.max(0, result);
    } catch (e) {
        console.error("Distribution Eval Error:", e);
        return 0;
    }
}

// ... (graph logic skipped, unchanged) ...

// Helper to create soft glow
const createGlowTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

const generatePoints = () => {
    if (pointCloud) {
        if (pointCloud.geometry) pointCloud.geometry.dispose();
        if (pointCloud.material) pointCloud.material.dispose();
        scene.remove(pointCloud);
    }

    const positions = [];
    const colors = [];
    // Increase attempts to get enough points, but cap it to prevent freezing
    const desiredPoints = 40000; 
    const maxAttempts = 200000;
    const size = 100;
    
    // 1. First pass: Find approximate max density to normalize rejection
    const isConductor = props.material === 'conductor';
    let maxDensity = 0.0001; 
    const sampleSize = 2000;
    
    // Sample a few points to guess max density
    for(let i=0; i<sampleSize; i++) {
         let r, theta, phi;
         if(props.shape.includes('sphere')) {
             r = Math.random() * size;
         } else {
             r = Math.random() * size;
         }
         // Quick and dirty random probe
         const x = (Math.random()-0.5)*2*size;
         const y = (Math.random()-0.5)*2*size;
         const z = (Math.random()-0.5)*2*size;
         // We only care about density value here, geometry validity doesn't matter much for max-finding
         const d = evaluateFunction(x/size, y/size, z/size);
         if(d > maxDensity) maxDensity = d;
    }
    
    // 2. Monte Carlo Rejection Sampling
    let accepted = 0;
    
    for (let i = 0; i < maxAttempts && accepted < desiredPoints; i++) {
        let x, y, z, valid = false;

        if (props.shape === 'rod') {
            x = (Math.random() - 0.5) * 4;
            y = (Math.random() - 0.5) * size * 2;
            z = (Math.random() - 0.5) * 4;
            valid = true;
        } else if (props.shape === 'solid_sphere') {
            const u = Math.random();
            const v = Math.random();
            const w = isConductor ? 1 : Math.random();
            const theta = 2 * Math.PI * u;
            const phi = Math.acos(2 * v - 1);
            // Conductor logic: push to surface with slight fuzz
            const r = size * Math.cbrt(w) + (isConductor ? (Math.random()-0.5)*4 : 0);
            
            x = r * Math.sin(phi) * Math.cos(theta);
            y = r * Math.sin(phi) * Math.sin(theta);
            z = r * Math.cos(phi);
            valid = true;
        } else if (props.shape === 'hollow_sphere') {
            const u = Math.random();
            const v = Math.random();
            const theta = 2 * Math.PI * u;
            const phi = Math.acos(2 * v - 1);
            const r = size + (Math.random() - 0.5) * 2; 
            x = r * Math.sin(phi) * Math.cos(theta);
            y = r * Math.sin(phi) * Math.sin(theta);
            z = r * Math.cos(phi);
            valid = true;
        } else if (props.shape === 'solid_cylinder') {
             // ... cylinder gen ...
             let r, theta, h;
             if (isConductor) {
                 if (Math.random() > 0.33) {
                     r = size;
                     theta = 2 * Math.PI * Math.random();
                     h = (Math.random() - 0.5) * size * 2;
                 } else {
                     r = size * Math.sqrt(Math.random());
                     theta = 2 * Math.PI * Math.random();
                     h = Math.sign(Math.random() - 0.5) * size;
                 }
             } else {
                 r = size * Math.sqrt(Math.random());
                 theta = 2 * Math.PI * Math.random();
                 h = (Math.random() - 0.5) * size * 2;
             }
             x = r * Math.cos(theta);
             y = h;
             z = r * Math.sin(theta);
             valid = true;
        } else if (props.shape === 'hollow_cylinder') {
             const r = size + (Math.random() - 0.5) * 2;
             const theta = 2 * Math.PI * Math.random();
             const h = (Math.random() - 0.5) * size * 2;
             x = r * Math.cos(theta);
             y = h;
             z = r * Math.sin(theta);
             valid = true;
        } else if (props.shape === 'disk') {
            const r = size * Math.sqrt(Math.random());
            const theta = 2 * Math.PI * Math.random();
            x = r * Math.cos(theta);
            y = (Math.random() - 0.5) * 2; 
            z = r * Math.sin(theta);
            valid = true;
        } else if (props.shape === 'cube') {
             // Cube gen
             if (isConductor) {
                 const face = Math.floor(Math.random() * 6);
                 const spread = (Math.random() - 0.5) * size * 2;
                 const spread2 = (Math.random() - 0.5) * size * 2;
                 const wall = size;
                 if(face===0) { x=wall; y=spread; z=spread2; }
                 else if(face===1) { x=-wall; y=spread; z=spread2; }
                 else if(face===2) { y=wall; x=spread; z=spread2; }
                 else if(face===3) { y=-wall; x=spread; z=spread2; }
                 else if(face===4) { z=wall; x=spread; y=spread2; }
                 else if(face===5) { z=-wall; x=spread; y=spread2; }
             } else {
                 x = (Math.random() - 0.5) * size * 2;
                 y = (Math.random() - 0.5) * size * 2;
                 z = (Math.random() - 0.5) * size * 2;
             }
             valid = true;
        }

        // CUT LOGIC
        if (valid) {
            if (props.cutMode === 'slice_xy' && z > 0) valid = false;
            if (props.cutMode === 'cut_octant' && x > 0 && y > 0 && z > 0) valid = false;
        }

        if (valid) {
             const density = evaluateFunction(x/size, y/size, z/size);
             const safeDensity = isNaN(density) ? 0 : Math.max(0, density);
             
             // REJECTION SAMPLING
             // Accept point with probability proportional to density
             // We use a power curve to emphasize high density areas more visually
             const probability = Math.pow(safeDensity / (maxDensity || 1), 1.5); 
             
             // Also always render a baseline of points if density is very low to define shape? 
             // No, user wants distribution. If 0, then 0 points.
             
             if (Math.random() < probability || isConductor || props.shape === 'rod') {
                 positions.push(x, y, z);
                 const color = new THREE.Color();
                 color.setHSL(0.66 * (1 - Math.min(1, safeDensity / (maxDensity||1))), 1, 0.5);
                 colors.push(color.r, color.g, color.b);
                 accepted++;
             }
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 3.0, // Slightly larger particles
        map: createGlowTexture(),
        vertexColors: true,
        transparent: true,
        opacity: 0.3, // Higher opacity for visibility
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
    });

    pointCloud = new THREE.Points(geometry, material);
    scene.add(pointCloud);
    updateVisibility(); 
}
const generateShapeMesh = () => {
    if (shapeMesh) scene.remove(shapeMesh);
    
    let geometry;
    const size = 100;
    
    if (props.shape === 'rod') {
        geometry = new THREE.CylinderGeometry(2, 2, size * 2, 16);
        geometry.rotateX(Math.PI / 2); 
    } else if (props.shape === 'solid_sphere' || props.shape === 'hollow_sphere') {
        geometry = new THREE.SphereGeometry(size, 32, 32);
    } else if (props.shape === 'solid_cylinder' || props.shape === 'hollow_cylinder') {
        geometry = new THREE.CylinderGeometry(size, size, size * 2, 32);
    } else if (props.shape === 'disk') {
        geometry = new THREE.CylinderGeometry(size, size, 2, 32); 
    } else if (props.shape === 'cube') {
        geometry = new THREE.BoxGeometry(size * 2, size * 2, size * 2);
    }

    if (geometry) {
        // Define clipping planes
        let clippingPlanes = [];
        if (props.cutMode === 'slice_xy') {
            // Keep z < 0
            clippingPlanes.push(new THREE.Plane(new THREE.Vector3(0, 0, -1), 0));
        }
        // NOTE: Standard Materials only support "Intersection" of planes, so "Octant Cut" (Union of kept regions) 
        // is not possible with basic clipping. We leave the mesh uncut for octant mode or hide it?
        // User wants to "see distribution inside", so the point cloud filter handles the visualization.
        // We will just apply the XY slice to mesh. For octant, we rely on transparency.
        
        const material = new THREE.MeshPhongMaterial({
            color: 0x00d4ff,
            transparent: true,
            opacity: 0.3,
            shininess: 100,
            side: THREE.DoubleSide,
            wireframe: false,
            clippingPlanes: clippingPlanes,
            clipShadows: true
        });
        
        const wireframe = new THREE.LineSegments(
            new THREE.WireframeGeometry(geometry),
            new THREE.LineBasicMaterial({ 
                color: 0xffffff, 
                transparent: true, 
                opacity: 0.2,
                clippingPlanes: clippingPlanes // Inherit clipping
            })
        );

        shapeMesh = new THREE.Group();
        const solid = new THREE.Mesh(geometry, material);
        shapeMesh.add(solid);
        shapeMesh.add(wireframe);
        
        scene.add(shapeMesh);
    }
}

const updateVisibility = () => {
    if(pointCloud) pointCloud.visible = props.showDistribution;
    if(shapeMesh) shapeMesh.visible = !props.showDistribution;
}

const animate = () => {
    controls.update();
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(animate);
}

const init = () => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.z = 400;

    renderer = new THREE.WebGLRenderer({ canvas: canvasRef.value, antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Initial size from container
    const width = containerRef.value ? containerRef.value.clientWidth : window.innerWidth;
    const height = containerRef.value ? containerRef.value.clientHeight : window.innerHeight;
    renderer.setSize(width, height);
    renderer.localClippingEnabled = true;

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    
    const ambientLight = new THREE.AmbientLight(0x404040); 
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // Grid Helpers removed as per request
    // scene.add(gridXY);
    // scene.add(axesHelper);

    generatePoints();
    generateShapeMesh();
    updateVisibility();
    
    animate();
}


// Watchers
watch([
    () => props.shape, 
    () => props.coords, 
    () => props.distributionFunc,
    () => props.cutMode,
    () => props.material
], () => {
    generatePoints();
    generateShapeMesh();
    updateVisibility();
});

watch(() => props.showDistribution, updateVisibility);

watch(() => props.zoom, (val) => {
    camera.position.z = 400 / val;
});

onMounted(() => {
    nextTick(() => {
        init();
        handleResize(); // Force initial size
        
        // Use ResizeObserver for robust layout handling
        const resizeObserver = new ResizeObserver(() => {
            handleResize();
        });
        
        if (containerRef.value) {
            resizeObserver.observe(containerRef.value);
        }
        
        // Store observer to disconnect later
        window._c3dObserver = resizeObserver;
    });
});

onUnmounted(() => {
    if (window._c3dObserver) {
        window._c3dObserver.disconnect();
        delete window._c3dObserver;
    }
    cancelAnimationFrame(frameId);
    if(renderer) renderer.dispose();
});
</script>

<template>
    <div class="continuous-3d-container" ref="containerRef">
        <canvas ref="canvasRef"></canvas>
        
        <div class="legend glass">
            <h4>Charge Density (ρ)</h4>
            <div class="gradient-bar"></div>
            <div class="labels">
                <span>Low</span>
                <span>High</span>
            </div>
        </div>

        <!-- Graph Modal Overlay -->
        <transition name="pop">
            <div v-if="showGraph" class="graph-modal glass">
                <div class="modal-header">
                    <h3>Electric Field Distribution</h3>
                    <button @click="$parent.handleGraphToggle" class="close-lite">✕</button>
                </div>
                <div class="graph-placeholder">
                    <div class="mock-chart">
                        <svg viewBox="0 0 400 220" style="overflow: visible;">
                           <defs>
                               <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                   <stop offset="0%" stop-color="#00d4ff" />
                                   <stop offset="100%" stop-color="#ff0055" />
                               </linearGradient>
                           </defs>
                           
                           <!-- Plot Line -->
                           <path :d="graphPath" fill="none" stroke="url(#lineGradient)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                           
                           <!-- Fill Area under curve -->
                           <path :d="graphPath + ' L 350 180 L 50 180 Z'" fill="url(#lineGradient)" fill-opacity="0.1" stroke="none" />

                           <!-- Axes -->
                           <line x1="50" y1="180" x2="350" y2="180" stroke="white" stroke-width="2" />
                           <line x1="50" y1="20" x2="50" y2="180" stroke="white" stroke-width="2" />
                           
                           <!-- Labels -->
                           <text x="200" y="215" fill="#94a3b8" text-anchor="middle" font-size="14">Distance (r)</text>
                           <text x="15" y="100" fill="#94a3b8" text-anchor="middle" font-size="14" transform="rotate(-90, 15, 100)">Charge Density (ρ)</text>
                           
                           <!-- Ticks -->
                           <text x="45" y="180" fill="#64748b" text-anchor="end" font-size="10">0</text>
                           <text x="45" y="195" fill="#64748b" text-anchor="end" font-size="10">Center</text>
                           
                           <text x="350" y="200" fill="#64748b" text-anchor="middle" font-size="10">Surface</text>
                           <text x="40" y="30" fill="#64748b" text-anchor="end" font-size="10">max</text>
                        </svg>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<style scoped>
.continuous-3d-container {
    width: 100%;
    height: 100%;
    position: relative;
    background: radial-gradient(circle at center, #0f172a 0%, #020617 100%);
}

canvas {
    display: block;
}

.legend {
    position: absolute;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    padding: 1rem 2rem;
    border-radius: 30px;
    width: 300px;
    text-align: center;
    pointer-events: none; /* Let clicks pass through */
}

.gradient-bar {
    height: 12px;
    background: linear-gradient(to right, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000);
    border-radius: 6px;
    margin: 10px 0;
}

.labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: #94a3b8;
}

.graph-modal {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 500px;
    padding: 2rem;
    border-radius: 20px;
    z-index: 1000;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.close-lite {
    background: transparent;
    border: none;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
}

.graph-placeholder {
    height: 300px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.mock-chart {
    width: 100%;
    margin-top: 2rem;
}

.glass {
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Animations */
.pop-enter-active, .pop-leave-active {
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.pop-enter-from, .pop-leave-to {
    opacity: 0;
    transform: translate(-50%, -40%) scale(0.9);
}
</style>
