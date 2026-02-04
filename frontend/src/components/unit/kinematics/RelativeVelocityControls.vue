<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  mode: String,
  v1: Number,
  v2: Number,
  angle1: Number,
  angle2: Number,
  observerFrame: String,
  visualTheme: String,
  showVectors: Boolean,
  showGrid: Boolean,
  objects: Array,
  selectedObjectId: [String, Number, null],
  // Rain Props
  rainSpeed: { type: Number, default: 10 },
  manualUmbrella: { type: Boolean, default: false },
  umbrellaAngle: { type: Number, default: 0 },
  showTheta: { type: Boolean, default: true }
})

const emit = defineEmits([
  'update:v1', 
  'update:v2', 
  'update:angle1', 
  'update:angle2', 
  'update:observerFrame', 
  'update:visualTheme',
  'update:showGrid',
  'update:showVectors',
  'reset',
  'addBall',
  'update:selectedObjectId',
  'update:rainSpeed',
  'update:manualUmbrella',
  'update:umbrellaAngle',
  'update:showTheta'
])

// Computed umbrella angle for Rain scenario
const umbrellaAngleDisplay = computed(() => {
  if (props.mode !== 'rain') return '0.0°'
  
  // Calculate relative velocity components
  const v_rel_x = props.v2 - props.v1  // Air Speed - Man Speed
  const v_rel_y = 10                   // Constant vertical rain speed
  
  // Calculate angle from vertical
  const angleRad = Math.atan2(v_rel_x, v_rel_y)
  const angleDeg = angleRad * 180 / Math.PI
  
  return angleDeg.toFixed(1) + '°'
})

const selectedObject = computed(() => {
    if (!props.selectedObjectId || !props.objects) return null
    return props.objects.find(o => o.id === props.selectedObjectId)
})

const deleteObject = () => {
    if (!selectedObject.value) return
    const index = props.objects.findIndex(o => o.id === props.selectedObjectId)
    if (index !== -1) {
        props.objects.splice(index, 1) // Direct mutation compliant with reactive arrays in Vue 3
        emit('update:selectedObjectId', null)
    }
}
</script>

<template>
  <div class="controls-content">
    <div class="control-group" v-if="mode !== 'rain'">
      <div class="frame-selector">
        <button 
          v-for="frame in ['ground', 'obj1', 'obj2']" 
          :key="frame"
          class="frame-btn"
          :class="{ active: observerFrame === frame }"
          @click="emit('update:observerFrame', frame)"
        >
          {{ frame === 'ground' ? 'Ground' : (frame === 'obj1' ? 'A' : 'B') }}
        </button>
      </div>
    </div>

    <div class="control-group" v-if="mode !== 'rain'">
      <div class="theme-selector">
        <button 
          class="frame-btn"
          :class="{ active: visualTheme === 'ball' }"
          @click="emit('update:visualTheme', 'ball')"
        >
          Minimal (Balls)
        </button>
        <button 
          class="frame-btn"
          :class="{ active: visualTheme === 'car' }"
          @click="emit('update:visualTheme', 'car')"
        >
          Realistic (Cars)
        </button>
      </div>
    </div>

    <!-- Rain-specific velocity controls -->
    <div class="control-group" v-if="mode === 'rain'">
        <div class="slider-item">
            <div class="slider-header">
                <span class="label">Man Speed (V<sub>m</sub>)</span>
                <input type="number" step="0.1" :value="v1" @input="emit('update:v1', parseFloat($event.target.value))" class="number-input small">
            </div>
            <input type="range" :min="0" :max="15" step="0.1" :value="v1" @input="emit('update:v1', parseFloat($event.target.value))" class="range-slider">
        </div>

        <div class="slider-item">
            <div class="slider-header">
                <span class="label">Wind Speed (V<sub>r,x</sub>)</span>
                <input type="number" step="0.1" :value="v2" @input="emit('update:v2', parseFloat($event.target.value))" class="number-input small">
            </div>
            <input type="range" :min="-15" :max="15" step="0.1" :value="v2" @input="emit('update:v2', parseFloat($event.target.value))" class="range-slider">
            <div class="slider-labels" style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #94a3b8; margin-top: 2px;">
                <span>&lt; Left</span>
                <span>0</span>
                <span>Right &gt;</span>
            </div>
        </div>

        <div class="slider-item">
            <div class="slider-header">
                 <span class="label">Rain Speed (V<sub>r,y</sub>)</span>
                 <input type="number" step="1" :value="rainSpeed" @input="emit('update:rainSpeed', parseFloat($event.target.value))" class="number-input small">
            </div>
            <input type="range" :min="5" :max="25" step="1" :value="rainSpeed" @input="emit('update:rainSpeed', parseFloat($event.target.value))" class="range-slider">
        </div>
        
        <div class="control-group-inner" style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem; margin-top: 1rem;">
            <label class="toggle-item" style="margin-bottom: 1rem;">
                <input type="checkbox" :checked="manualUmbrella" @change="emit('update:manualUmbrella', $event.target.checked)">
                <span class="toggle-label">Manual Umbrella Control</span>
            </label>

            <div class="slider-item" :style="{ opacity: manualUmbrella ? 1 : 0.6, pointerEvents: manualUmbrella ? 'auto' : 'none' }">
                <div class="slider-header">
                    <span class="label">Umbrella Angle</span>
                    <input type="number" :value="umbrellaAngle" @input="emit('update:umbrellaAngle', parseFloat($event.target.value))" class="number-input small" :readonly="!manualUmbrella">
                </div>
                <input type="range" :min="-90" :max="90" step="1" :value="umbrellaAngle" @input="emit('update:umbrellaAngle', parseFloat($event.target.value))" class="range-slider">
                 <div style="font-size: 0.75rem; color: #94a3b8; margin-top: 4px; text-align: center;" v-if="!manualUmbrella">
                    (Auto-calculated to keep dry)
                </div>
            </div>
        </div>
    </div>

    <div class="control-group" v-if="['river', 'aeroplane', 'angular-velocity', 'min-distance', 'flag-flutter'].includes(mode)">
        <div class="slider-item" v-if="['river', 'aeroplane', 'angular-velocity', 'min-distance'].includes(mode)">
            <div class="slider-header">
                <span class="label">{{ mode === 'river' ? 'Boat Angle' : 'Angle A' }}</span>
                <input type="number" step="1" :value="angle1" @input="emit('update:angle1', parseFloat($event.target.value))" class="number-input small">
            </div>
            <input type="range" :min="0" :max="360" step="1" :value="angle1" @input="emit('update:angle1', parseFloat($event.target.value))" class="range-slider">
        </div>

        <div class="slider-item" v-if="['river', 'aeroplane', 'angular-velocity', 'min-distance', 'flag-flutter'].includes(mode)">
            <div class="slider-header">
                <span class="label">{{ mode === 'flag-flutter' ? 'Wind Angle' : 'Angle B' }}</span>
                <input type="number" step="1" :value="angle2" @input="emit('update:angle2', parseFloat($event.target.value))" class="number-input small">
            </div>
            <input type="range" :min="0" :max="360" step="1" :value="angle2" @input="emit('update:angle2', parseFloat($event.target.value))" class="range-slider">
        </div>
    </div>

    <div class="control-group">
        <label class="toggle-item">
            <input type="checkbox" :checked="showVectors" @change="emit('update:showVectors', $event.target.checked)">
            <span class="toggle-label">Show Velocity Vectors</span>
        </label>
        
        <label class="toggle-item">
            <input type="checkbox" :checked="showGrid" @change="emit('update:showGrid', $event.target.checked)">
            <span class="toggle-label">Show Grid Lines</span>
        </label>

        <label class="toggle-item" v-if="mode === 'rain'">
            <input type="checkbox" :checked="showTheta" @change="emit('update:showTheta', $event.target.checked)">
            <span class="toggle-label">Show Theta Calculation</span>
        </label>
    </div>

    <div class="control-group" v-if="mode === '1d'">
        <button class="btn-add" @click="emit('addBall')">
            Add New Particle
        </button>
        <p class="hint-text">Added particles support full 2D motion.</p>
    </div>

    <div class="control-group" v-if="selectedObject">
        <div class="group-header">
             <span class="group-title">{{ selectedObject.label }} Properties</span>
             <button class="btn-close-selection" @click="emit('update:selectedObjectId', null)">×</button>
        </div>
       
        <div class="slider-item">
            <div class="slider-header">
                <span class="label">Velocity X</span>
                <input type="number" step="0.1" v-model.number="selectedObject.vx" class="number-input">
            </div>
            <input type="range" min="-20" max="20" step="0.1" v-model.number="selectedObject.vx" class="range-slider">
        </div>

        <div class="slider-item">
            <div class="slider-header">
                <span class="label">Velocity Y</span>
                <input type="number" step="0.1" v-model.number="selectedObject.vy" class="number-input">
            </div>
            <input type="range" min="-20" max="20" step="0.1" v-model.number="selectedObject.vy" class="range-slider">
        </div>

        <div class="color-row">
            <span class="label">Color</span>
            <input type="color" v-model="selectedObject.color" class="color-picker-small">
        </div>

        <button class="btn-delete-obj" @click="deleteObject">Delete Particle</button>
    </div>

    <button class="btn-reset" @click="emit('reset')">Reset Simulation</button>
  </div>
</template>

<style scoped>
.controls-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.group-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 1rem;
  letter-spacing: 1px;
}

.control-group {
    background: rgba(255, 255, 255, 0.03);
    padding: 1rem;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.05);
}

.frame-selector {
    display: flex;
    gap: 0.5rem;
    background: rgba(0, 0, 0, 0.2);
    padding: 4px;
    border-radius: 8px;
}

.frame-btn {
    flex: 1;
    padding: 8px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 500;
    transition: all 0.3s;
}

.frame-btn.active {
    background: var(--primary-glow);
    color: #000;
    box-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
}

.slider-item {
    margin-bottom: 1.2rem;
}

.slider-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    font-size: 0.85rem;
}

.label { color: var(--text-secondary); }
.value { color: var(--primary-glow); font-family: monospace; }

.number-input {
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    color: var(--primary-glow);
    font-family: monospace;
    font-size: 0.85rem;
    padding: 2px 6px;
    width: 60px;
    outline: none;
    transition: all 0.3s;
}

.number-input:focus {
    border-color: var(--primary-glow);
    box-shadow: 0 0 5px rgba(0, 212, 255, 0.3);
}

.number-input.small {
    width: 50px;
}

/* Remove arrows from number input */
.number-input::-webkit-outer-spin-button,
.number-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.range-slider {
    width: 100%;
    -webkit-appearance: none;
    appearance: none;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    outline: none;
}

.range-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    background: #fff;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
    border: 2px solid var(--primary-glow);
}

.toggle-item {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    color: var(--text-secondary);
    font-size: 0.85rem;
}

.btn-add {
    width: 100%;
    padding: 10px;
    background: rgba(0, 212, 255, 0.1);
    border: 1px solid rgba(0, 212, 255, 0.3);
    color: var(--primary-glow);
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s;
    margin-bottom: 0.5rem;
}

.btn-add:hover {
    background: var(--primary-glow);
    color: #000;
    box-shadow: 0 0 15px rgba(0, 212, 255, 0.4);
}

.hint-text {
    font-size: 0.7rem;
    color: var(--text-secondary);
    text-align: center;
    margin: 0;
    font-style: italic;
}

.btn-reset {
    margin-top: 1rem;
    padding: 12px;
    background: rgba(255, 0, 85, 0.1);
    border: 1px solid rgba(255, 0, 85, 0.3);
    color: #ff0055;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s;
}

.btn-reset:hover {
    background: #ff0055;
    color: #fff;
    box-shadow: 0 0 15px rgba(255, 0, 85, 0.4);
}

.color-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.color-picker-small {
    width: 40px;
    height: 25px;
    border: none;
    background: none;
    cursor: pointer;
}

.btn-delete-obj {
    width: 100%;
    padding: 8px;
    background: rgba(255, 0, 85, 0.1);
    border: 1px solid rgba(255, 0, 85, 0.3);
    color: #ff0055;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
    transition: all 0.3s;
}

.btn-delete-obj:hover {
    background: #ff0055;
    color: #fff;
}

.group-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.btn-close-selection {
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 1.2rem;
    cursor: pointer;
    line-height: 1;
}
</style>
