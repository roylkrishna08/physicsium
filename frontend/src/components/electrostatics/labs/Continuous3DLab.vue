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
    showAxis: { type: Boolean, default: false },
    zoom: { type: Number, default: 1 }
})

const emit = defineEmits(['toggle-graph'])

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

// Physics & Math Helpers
const mathKeys = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2', 'exp', 'log', 'pow', 'sqrt', 'abs', 'PI', 'E', 'floor', 'ceil', 'round', 'min', 'max', 'random'];
const mathValues = mathKeys.map(k => Math[k]);

let scene, camera, renderer, controls, pointCloud, shapeMesh, axesHelper, axesLabels, samplingLine
let frameId

// Graph UI State
const graphAxis = ref('r')
const axisOptions = computed(() => {
    if (props.coords === 'cartesian') {
        return [
            { label: 'Axis: X', value: 'x' },
            { label: 'Axis: Y', value: 'y' },
            { label: 'Axis: Z', value: 'z' }
        ]
    } else if (props.coords === 'spherical') {
        return [
            { label: 'Axis: r', value: 'r' },
            { label: 'Axis: θ', value: 'theta' },
            { label: 'Axis: φ', value: 'phi' }
        ]
    } else if (props.coords === 'cylindrical') {
        return [
            { label: 'Axis: ρ', value: 'rho' },
            { label: 'Axis: φ', value: 'phi' },
            { label: 'Axis: z', value: 'z' }
        ]
    }
    return [{ label: 'Axis: r', value: 'r' }]
})

const graphYLabel = computed(() => {
    return (graphAxis.value === 'r') ? 'Electric Field (E)' : 'Charge Density (ρ)'
})

const graphTicks = computed(() => {
    if (['x', 'y', 'z'].includes(graphAxis.value)) {
        return [
            { x: 50, label: '-1', sub: '-R' },
            { x: 200, label: '0' },
            { x: 350, label: '1', sub: '+R' }
        ]
    } else if (graphAxis.value === 'theta') {
        return [
            { x: 50, label: '0', sub: '0°' },
            { x: 200, label: 'π/2', sub: '90°' },
            { x: 350, label: 'π', sub: '180°' }
        ]
    } else if (graphAxis.value === 'phi') {
        return [
            { x: 50, label: '0', sub: '0°' },
            { x: 200, label: 'π', sub: '180°' },
            { x: 350, label: '2π', sub: '360°' }
        ]
    }
    // Default (r or rho)
    return [
        { x: 50, label: '0', sub: 'Center' },
        { x: 350, label: '1', sub: 'Radius' }
    ]
})

// Reactive Compiled Function
const compiledDistributionFn = ref(null);

const compileFunction = () => {
    try {
        compiledDistributionFn.value = new Function(
            ...mathKeys,
            'x', 'y', 'z', 'r', 'theta', 'phi', 'rho', 
            `"use strict";
            try { 
                const val = (${props.distributionFunc});
                return val;
            } catch(e) { 
                return 0; 
            }`
        );
    } catch (e) {
        console.error("Function Compilation Error:", e);
        compiledDistributionFn.value = () => 0;
    }
};

// Helper to get color string matching 3D points
const getColorForValue = (val, maxAbs) => {
    if (maxAbs === 0) return 'hsl(120, 100%, 50%)'; // Green for zero
    const normalized = Math.max(0, Math.min(1, (val + maxAbs) / (maxAbs * 2)));
    const hue = 240 * (1 - normalized); // 240 is Blue, 0 is Red in HSL (degrees)
    return `hsl(${hue}, 100%, 50%)`;
}

// Function Evaluator (Caller) - Now extremely fast
const evaluateFunction = (x, y, z) => {
    if (!compiledDistributionFn.value) return 0;
    
    // 1. Calculate normalized coordinates
    const r = Math.sqrt(x*x + y*y + z*z);
    const theta = Math.acos(Math.max(-1, Math.min(1, z / (r || 1)))); 
    let phi = Math.atan2(y, x); 
    if (phi < 0) phi += 2 * Math.PI;
    const rho = Math.sqrt(x*x + y*y);

    // 2. Execute compiled function
    const result = compiledDistributionFn.value(...mathValues, x, y, z, r, theta, phi, rho);
    
    // 3. Safety Checks
    if (isNaN(result)) return 0;
    if (!isFinite(result)) return result > 0 ? 1000 : -1000; 
    return result; // Allow negative charge density
}

// Graph Data Generation
const graphData = computed(() => {
    const samples = 100;
    const data = [];
    const dx = 1 / samples;
    const size = 100;
    
    if (graphAxis.value === 'r') {
        let integral = 0;
        for(let i=0; i<=samples; i++) {
            const rNorm = i / samples; 
            const rho = evaluateFunction(rNorm, 0, 0); 
            if (i > 0) {
                const prevR = (i - 1) / samples;
                const avgRho = (rho + evaluateFunction(prevR, 0, 0)) / 2;
                let dV = 4 * Math.PI * Math.pow(rNorm, 2) * dx;
                if (props.shape === 'rod') dV = dx;
                else if (props.shape === 'disk') dV = 2 * Math.PI * rNorm * dx;
                integral += avgRho * dV;
            }
            let E = 0;
            if (rNorm > 0.05) {
                if (props.shape === 'rod') E = integral / rNorm;
                else if (props.shape === 'disk') E = integral / (rNorm + 0.1);
                else E = integral / (rNorm * rNorm);
            }
            data.push({ t: rNorm, val: E });
        }
    } else {
        for(let i=0; i<=samples; i++) {
            let t = i / samples; // 0 to 1
            let x=0, y=0, z=0;
            
            // Cartesian: Map [0, 1] to [-1, 1]
            const rangeT = (t * 2 - 1); 

            if (graphAxis.value === 'x') { x = rangeT; y = 0; z = 0; }
            else if (graphAxis.value === 'y') { y = rangeT; x = 0; z = 0; }
            else if (graphAxis.value === 'z') { z = rangeT; x = 0; y = 0; }
            else if (graphAxis.value === 'theta') { 
                // Sample at Surface (r=1)
                const th = t * Math.PI;
                x = Math.sin(th); z = Math.cos(th); y = 0;
            }
            else if (graphAxis.value === 'phi') { 
                // Sample at Surface (r=1)
                const ph = t * 2 * Math.PI;
                x = Math.cos(ph); y = Math.sin(ph); z = 0;
            }
            else if (graphAxis.value === 'rho') { x = t; y = 0; z = 0; }
            
            data.push({ t, val: evaluateFunction(x, y, z) });
        }
    }
    
    let maxVal = 0, minVal = 0;
    data.forEach(d => {
        if (d.val > maxVal) maxVal = d.val;
        if (d.val < minVal) minVal = d.val;
    });
    
    let range = Math.max(Math.abs(maxVal), Math.abs(minVal));
    if (range === 0) range = 1;

    let path = "";
    let stops = [];
    data.forEach((p, idx) => {
        const xPos = 50 + (p.t * 300);
        let yPos;
        if (minVal < 0) {
            const mid = 100;
            yPos = mid - (p.val * (80 / range));
        } else {
            yPos = 180 - (p.val / range) * 160;
        }
        path += (idx === 0) ? `M ${xPos} ${yPos}` : ` L ${xPos} ${yPos}`;
        
        // Color Stop for gradient
        if (idx % 5 === 0 || idx === data.length - 1) {
            const offset = (p.t * 100).toFixed(1);
            stops.push({ offset: `${offset}%`, color: getColorForValue(p.val, range) });
        }
    });
    
    return { path, minVal, maxVal, range, stops };
});

const graphOriginX = computed(() => {
    // For Cartesian (x,y,z), 0 is at center (200px: 50 + 150)
    if (['x', 'y', 'z'].includes(graphAxis.value)) return 200;
    // For others (r, theta, phi), 0 is at left (50px)
    return 50;
});

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
    const rawDensities = [];
    const colors = [];
    
    // Increase attempts to get enough points
    const desiredPoints = 40000; 
    const maxAttempts = 200000;
    const size = 100;
    
    // 1. First pass: Find approximate max density to normalize rejection (Estimation)
    const isConductor = props.material === 'conductor';
    let estimatedMaxDensity = 0.0001; 
    const sampleSize = 2000;
    
    for(let i=0; i<sampleSize; i++) {
         let r = Math.random() * size;
         const x = (Math.random()-0.5)*2*size;
         const y = (Math.random()-0.5)*2*size;
         const z = (Math.random()-0.5)*2*size;
         const d = evaluateFunction(x/size, y/size, z/size);
         if(d > estimatedMaxDensity) estimatedMaxDensity = d;
    }
    
    // 2. Monte Carlo Rejection Sampling
    let accepted = 0;
    let observedMaxDensity = 0.0001; // Track true max of ACCEPTED points

    for (let i = 0; i < maxAttempts && accepted < desiredPoints; i++) {
        let x, y, z, valid = false;

        if (props.shape === 'rod') {
            x = Math.random() * size * 2; // 0 to 200 (Along X)
            y = (Math.random() - 0.5) * 4;
            z = (Math.random() - 0.5) * 4;
            valid = true;
        } else if (props.shape === 'solid_sphere') {
            const u = Math.random();
            const v = Math.random();
            const w = isConductor ? 1 : Math.random();
            const theta = 2 * Math.PI * u;
            const phi = Math.acos(2 * v - 1);
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
             let r, theta, h;
             if (isConductor) {
                 if (Math.random() > 0.33) {
                     r = size; theta = 2 * Math.PI * Math.random(); h = (Math.random() - 0.5) * size * 2;
                 } else {
                     r = size * Math.sqrt(Math.random()); theta = 2 * Math.PI * Math.random(); h = Math.sign(Math.random() - 0.5) * size;
                 }
             } else {
                 r = size * Math.sqrt(Math.random()); theta = 2 * Math.PI * Math.random(); h = (Math.random() - 0.5) * size * 2;
             }
             x = r * Math.cos(theta); y = h; z = r * Math.sin(theta);
             valid = true;
        } else if (props.shape === 'hollow_cylinder') {
             const r = size + (Math.random() - 0.5) * 2;
             const theta = 2 * Math.PI * Math.random();
             const h = (Math.random() - 0.5) * size * 2;
             x = r * Math.cos(theta); y = h; z = r * Math.sin(theta);
             valid = true;
        } else if (props.shape === 'disk') {
            const r = size * Math.sqrt(Math.random());
            const theta = 2 * Math.PI * Math.random();
            x = r * Math.cos(theta); 
            y = r * Math.sin(theta); 
            z = (Math.random() - 0.5) * 2; // Flat in Z
            valid = true;
        } else if (props.shape === 'cube') {
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

        if (valid) {
            if (props.cutMode === 'slice_xy' && z > 0) valid = false;
            if (props.cutMode === 'cut_octant' && x > 0 && y > 0 && z > 0) valid = false;
        }

        if (valid) {
             const density = evaluateFunction(x/size, y/size, z/size);
             const safeDensity = isNaN(density) ? 0 : density;
             
             // Charge Density is visualized via Color. 
             // Positive -> Reds, Negative -> Blues.
             
             positions.push(x, y, z);
             rawDensities.push(safeDensity);
             
             // Track max
             if(safeDensity > observedMaxDensity) observedMaxDensity = safeDensity;
             
             accepted++;
        }
    }

    // 3. Absolute Normalization (Zero-Centered)
    let minDensity = 0;
    let maxDensity = 0;
    rawDensities.forEach(d => {
        if (d < minDensity) minDensity = d;
        if (d > maxDensity) maxDensity = d;
    });

    // Blue (-MaxAbs) -> Green (0) -> Red (+MaxAbs)
    const maxAbs = Math.max(Math.abs(minDensity), Math.abs(maxDensity));
    const range = maxAbs === 0 ? 1 : maxAbs * 2;

    for(let i=0; i<rawDensities.length; i++) {
        const d = rawDensities[i];
        
        // Normalize [-maxAbs, maxAbs] to [0, 1]
        let normalized = (d + maxAbs) / range;
        normalized = Math.max(0, Math.min(1, normalized));
        
        // Map to HSL: 0.66 (Blue) -> 0.0 (Red)
        // 0.5 (Green) will correspond to d=0.
        const hue = 0.66 * (1 - normalized);
        
        const color = new THREE.Color();
        color.setHSL(hue, 1.0, 0.5);
        colors.push(color.r, color.g, color.b);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 2.0, // Smaller, sharper points
        map: createGlowTexture(),
        vertexColors: true,
        transparent: true,
        opacity: 0.8, // Higher opacity for visibility
        blending: THREE.NormalBlending, // Normal blending preserves True Colors
        depthWrite: false, // Prevent z-fighting transparency issues
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
        geometry.rotateZ(-Math.PI / 2); // Align Y-cylinder to X
        geometry.translate(size, 0, 0); // Shift X from 0 to +200
    } else if (props.shape === 'solid_sphere' || props.shape === 'hollow_sphere') {
        geometry = new THREE.SphereGeometry(size, 32, 32);
    } else if (props.shape === 'solid_cylinder' || props.shape === 'hollow_cylinder') {
        geometry = new THREE.CylinderGeometry(size, size, size * 2, 32);
    } else if (props.shape === 'disk') {
        geometry = new THREE.CylinderGeometry(size, size, 2, 32); 
        geometry.rotateX(Math.PI / 2); // Align cylinder axis to Z, so flat face is XY
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

// 3D Sampling Line Helper
const updateSamplingLine = () => {
    if (!samplingLine) return;
    
    const size = 100;
    const pts = [];
    const samples = 50;
    
    if (graphAxis.value === 'r' || graphAxis.value === 'rho') {
        pts.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(size, 0, 0));
    } else if (graphAxis.value === 'x') {
        pts.push(new THREE.Vector3(-size, 0, 0), new THREE.Vector3(size, 0, 0));
    } else if (graphAxis.value === 'y') {
        pts.push(new THREE.Vector3(0, -size, 0), new THREE.Vector3(0, size, 0));
    } else if (graphAxis.value === 'z') {
        pts.push(new THREE.Vector3(0, 0, -size), new THREE.Vector3(0, 0, size));
    } else if (graphAxis.value === 'theta') {
        for(let i=0; i<=samples; i++) {
            const th = (i/samples) * Math.PI;
            pts.push(new THREE.Vector3(size * Math.sin(th), 0, size * Math.cos(th)));
        }
    } else if (graphAxis.value === 'phi') {
        for(let i=0; i<=samples; i++) {
            const ph = (i/samples) * 2 * Math.PI;
            pts.push(new THREE.Vector3(size * Math.cos(ph), size * Math.sin(ph), 0));
        }
    }

    samplingLine.geometry.dispose();
    samplingLine.geometry = new THREE.BufferGeometry().setFromPoints(pts);
    samplingLine.computeLineDistances(); // Required for dashes
    samplingLine.visible = props.showGraph;
}

const updateVisibility = () => {
    if(pointCloud) pointCloud.visible = props.showDistribution;
    if(shapeMesh) shapeMesh.visible = !props.showDistribution;
    
    if(axesHelper) axesHelper.visible = props.showAxis;
    if(axesLabels) axesLabels.visible = props.showAxis;
    if(samplingLine) samplingLine.visible = props.showGraph;
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

    // Custom Axes Helper (Positive and Negative)
    const createAxis = (dir, color, length) => {
        const pts = [
            new THREE.Vector3().copy(dir).multiplyScalar(-length),
            new THREE.Vector3().copy(dir).multiplyScalar(length)
        ];
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineBasicMaterial({ color: color, opacity: 0.5, transparent: true });
        return new THREE.Line(geo, mat);
    };

    axesHelper = new THREE.Group();
    axesHelper.add(createAxis(new THREE.Vector3(1, 0, 0), 0xff0000, 150)); // X
    axesHelper.add(createAxis(new THREE.Vector3(0, 1, 0), 0x00ff00, 150)); // Y
    axesHelper.add(createAxis(new THREE.Vector3(0, 0, 1), 0x0000ff, 150)); // Z
    scene.add(axesHelper);

    // Axis Labels
    const createLabel = (text, color, position) => {
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        ctx.font = 'bold 100px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 64, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture, depthTest: false }); // Always visible on top
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.copy(position);
        sprite.scale.set(25, 25, 1);
        return sprite;
    };

    axesLabels = new THREE.Group();
    axesLabels.add(createLabel('X', '#ff0000', new THREE.Vector3(160, 0, 0)));
    axesLabels.add(createLabel('Y', '#00ff00', new THREE.Vector3(0, 160, 0)));
    axesLabels.add(createLabel('Z', '#0000ff', new THREE.Vector3(0, 0, 160)));
    scene.add(axesLabels);

    // Initial Sampling Line (Invisible)
    const lineMat = new THREE.LineDashedMaterial({ color: 0xffff00, dashSize: 10, gapSize: 5 });
    samplingLine = new THREE.Line(new THREE.BufferGeometry(), lineMat);
    // samplingLine.computeLineDistances(); // Was causing crash on empty geometry
    scene.add(samplingLine);

    generatePoints();
    generateShapeMesh();
    updateVisibility();
    updateSamplingLine();
    
    animate();
}




// Watchers
let debounceTimer = null;

watch([() => props.showGraph, graphAxis], () => {
    updateSamplingLine();
    updateVisibility();
});

watch(() => props.coords, (newVal) => {
    if (newVal === 'cartesian') graphAxis.value = 'x';
    else if (newVal === 'spherical') graphAxis.value = 'r';
    else if (newVal === 'cylindrical') graphAxis.value = 'rho';
    
    // Immediate update for UI toggles
    generatePoints();
    generateShapeMesh();
    updateVisibility();
});

watch([
    () => props.shape, 
    () => props.cutMode,
    () => props.material
], () => {
    // Immediate update for UI toggles
    generatePoints();
    generateShapeMesh();
    updateVisibility();
});

watch(() => props.showAxis, updateVisibility);

// Debounce heavy calculation for typing (distributionFunc)
watch(() => props.distributionFunc, () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        compileFunction(); // Re-compile before re-generating
        generatePoints();
        generateShapeMesh(); 
        updateVisibility();
    }, 800); 
});

watch(() => props.showDistribution, updateVisibility);

watch(() => props.zoom, (val) => {
    camera.position.z = 400 / val;
});

onMounted(() => {
    nextTick(() => {
        compileFunction(); // Compile initial function
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
                <span>Negative (-)</span>
                <span style="color: #4ade80">Zero (0)</span>
                <span>Positive (+)</span>
            </div>
        </div>

        <!-- Graph Modal Overlay -->
        <transition name="pop">
            <div v-if="showGraph" class="graph-modal glass">
                <div class="modal-header">
                    <h3>{{ graphYLabel }} Distribution</h3>
                    
                    <!-- Axis Selector (Moved from SVG) -->
                    <div class="axis-selector">
                        <label>Along Axis:</label>
                        <select v-model="graphAxis" class="axis-select">
                            <option v-for="opt in axisOptions" :key="opt.value" :value="opt.value">
                                {{ opt.label.replace('Axis: ', '') }}
                            </option>
                        </select>
                    </div>

                    <button @click="emit('toggle-graph')" class="close-lite">✕</button>
                </div>
                <div class="graph-placeholder">
                    <div class="mock-chart">
                        <svg viewBox="-20 0 420 230" style="overflow: visible;">
                           <defs>
                               <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                   <stop v-for="stop in graphData.stops" :key="stop.offset" 
                                         :offset="stop.offset" :stop-color="stop.color" />
                               </linearGradient>
                           </defs>
                           
                           <!-- Plot Line -->
                           <path :d="graphData.path" fill="none" stroke="url(#lineGradient)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                           
                           <!-- Fill Area under curve -->
                           <path :d="graphData.path + ' L 350 180 L 50 180 Z'" fill="url(#lineGradient)" fill-opacity="0.1" stroke="none" v-if="graphData.minVal >= 0" />

                           <!-- Axes -->
                           <line x1="50" y1="180" x2="350" y2="180" stroke="white" stroke-width="2" v-if="graphAxis === 'r' || (graphAxis !== 'r' && graphData.minVal >= 0)" />
                           <line x1="50" y1="100" x2="350" y2="100" stroke="rgba(255,255,255,0.3)" stroke-width="1" stroke-dasharray="4" v-if="graphAxis !== 'r' && graphData.minVal < 0" />
                           <line :x1="graphOriginX" y1="20" :x2="graphOriginX" y2="180" stroke="white" stroke-width="2" />
                           
                           <!-- Labels -->
                           <!-- Y Label -->
                           <text x="0" y="100" fill="#94a3b8" text-anchor="middle" font-size="14" transform="rotate(-90, 0, 100)" font-weight="bold">
                                {{ graphYLabel }}
                           </text>
                           
                           <!-- Ticks -->
                           <g v-for="tick in graphTicks" :key="tick.label + tick.x">
                               <line :x1="tick.x" y1="180" :x2="tick.x" y2="185" stroke="white" stroke-width="1" />
                               <text :x="tick.x" y="198" fill="#e2e8f0" text-anchor="middle" font-size="11" font-weight="bold">{{ tick.label }}</text>
                               <text :x="tick.x" y="212" fill="#64748b" text-anchor="middle" font-size="10" v-if="tick.sub">{{ tick.sub }}</text>
                           </g>
                           <text :x="graphOriginX - 8" y="25" fill="#e2e8f0" text-anchor="end" font-size="11">MAX</text>
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
    background: rgba(15, 23, 42, 0.82);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.axis-selector {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(30, 41, 59, 0.5);
    padding: 0.2rem 0.6rem;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.axis-selector label {
    color: #94a3b8;
    font-size: 0.8rem;
    font-weight: 500;
}

.axis-select {
    background: transparent;
    color: #00d4ff;
    border: none;
    font-size: 0.9rem;
    font-weight: bold;
    outline: none;
    cursor: pointer;
    min-width: 60px;
}

.axis-select option {
    background: #1e293b;
    color: #e2e8f0;
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
