<script setup>
import { ref } from 'vue'
import DrawingCanvas from '../../components/drawingTool/DrawingCanvas.vue'
import DrawingSidebar from '../../components/drawingTool/DrawingSidebar.vue'

const drawingActive = ref(true)
const sidebarOpen = ref(true)
const activeMode = ref('pen')
const activeColor = ref('#00d4ff')
const activeThickness = ref(3)
const canvasRef = ref(null)

const handleClearAll = () => {
  if (canvasRef.value) {
    canvasRef.value.clearAll()
  }
}
</script>

<template>
  <div class="drawing-view">
    <div class="background-grid"></div>
    
    <DrawingCanvas 
      ref="canvasRef"
      :active="drawingActive"
      :mode="activeMode"
      :color="activeColor"
      :thickness="activeThickness"
    />
    
    <DrawingSidebar 
      v-model:isOpen="sidebarOpen"
      v-model:activeMode="activeMode"
      v-model:activeColor="activeColor"
      v-model:activeThickness="activeThickness"
      @clearAll="handleClearAll"
    />
    
    <div class="test-controls">
      <h2>Drawing Tool Test Bench</h2>
      <p>Drawing is <b>{{ drawingActive ? 'Enabled' : 'Disabled' }}</b></p>
      <button @click="drawingActive = !drawingActive">
        {{ drawingActive ? 'Disable Drawing' : 'Enable Drawing' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.drawing-view {
  width: 100vw;
  height: 100vh;
  background: #0f172a;
  overflow: hidden;
  position: relative;
}

.background-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
}

.test-controls {
  position: absolute;
  top: 2rem;
  left: 2rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: white;
  z-index: 10;
  pointer-events: all;
}

.test-controls h2 { margin: 0 0 1rem 0; font-size: 1.2rem; }
.test-controls button {
  padding: 0.5rem 1rem;
  background: #38bdf8;
  border: none;
  border-radius: 6px;
  color: #0f172a;
  font-weight: bold;
  cursor: pointer;
}
</style>
