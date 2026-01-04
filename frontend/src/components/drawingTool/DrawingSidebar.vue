<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  activeMode: {
    type: String,
    default: 'pen'
  },
  activeColor: {
    type: String,
    default: '#00d4ff'
  },
  activeThickness: {
    type: Number,
    default: 3
  }
})

const emit = defineEmits(['update:isOpen', 'update:activeMode', 'update:activeColor', 'update:activeThickness', 'clearAll'])

const showShapesMenu = ref(false)

const colors = [
  '#ff0055', '#00d4ff', '#fbbf24', '#22c55e', '#ffffff', '#a855f7'
]

const shapeTools = [
  { id: 'select', icon: '🎯', label: 'Select' },
  { id: 'rect', icon: '⬜', label: 'Rectangle' },
  { id: 'circle', icon: '⭕', label: 'Circle' },
  { id: 'arrow', icon: '↗️', label: 'Arrow' },
  { id: 'line', icon: '📏', label: 'Line' }
]

const isShapeActive = computed(() => {
  return ['select', 'rect', 'circle', 'arrow', 'line'].includes(props.activeMode)
})

const activeShapeIcon = computed(() => {
  const tool = shapeTools.find(t => t.id === props.activeMode)
  return tool ? tool.icon : '📐'
})

const selectTool = (toolId) => {
  emit('update:activeMode', toolId)
  
  if (!['select', 'rect', 'circle', 'arrow', 'line'].includes(toolId)) {
    showShapesMenu.value = false
  }
}

const toggleShapesMenu = () => {
  showShapesMenu.value = !showShapesMenu.value
  if (showShapesMenu.value && !isShapeActive.value) {
    selectTool('rect')
  }
}

const selectColor = (color) => {
  emit('update:activeColor', color)
}

const updateThickness = (e) => {
  emit('update:activeThickness', parseInt(e.target.value))
}

const toggleSidebar = () => {
  emit('update:isOpen', !props.isOpen)
}
</script>

<template>
  <div class="drawing-sidebar" :class="{ 'collapsed': !isOpen }">
    <button class="toggle-btn" @click="toggleSidebar" :title="isOpen ? 'Close Panel' : 'Open Drawing Panel'">
      <span v-if="isOpen">»</span>
      <span v-else>🖌️</span>
    </button>

    <div class="sidebar-content">
      <!-- Icon-only Primary Tools Grid -->
      <div class="primary-tools-grid">
        <!-- 1. Pen -->
        <button 
          class="icon-tool-btn" 
          :class="{ active: activeMode === 'pen' }" 
          @click="selectTool('pen')"
          title="Pen (✏️)"
        >
          ✏️
        </button>

        <!-- 2. Eraser -->
        <button 
          class="icon-tool-btn" 
          :class="{ active: activeMode === 'eraser' }" 
          @click="selectTool('eraser')"
          title="Eraser (🧼)"
        >
          🧼
        </button>

        <!-- 3. Laser -->
        <button 
          class="icon-tool-btn" 
          :class="{ active: activeMode === 'laser' }" 
          @click="selectTool('laser')"
          title="Laser Pointer (🔦)"
        >
          🔦
        </button>

        <!-- 4. Shapes Toggle -->
        <button 
          class="icon-tool-btn shapes-toggle" 
          :class="{ active: isShapeActive }" 
          @click="toggleShapesMenu"
          title="Shapes (📐)"
        >
          {{ isShapeActive ? activeShapeIcon : '📐' }}
          <span class="indicator" v-if="showShapesMenu"></span>
        </button>
      </div>

      <!-- Hierarchical Shape Submenu (Clean Grid) -->
      <div class="shape-submenu-container" v-if="showShapesMenu">
        <label class="group-label">Select Shape</label>
        <div class="shape-grid">
          <button 
            v-for="tool in shapeTools" 
            :key="tool.id"
            class="sub-tool-btn"
            :class="{ active: activeMode === tool.id }"
            @click="selectTool(tool.id)"
            :title="tool.label"
          >
            {{ tool.icon }}
          </button>
        </div>
      </div>

      <!-- Refined Controls Area -->
      <div class="controls-wrapper" v-if="isOpen">
        <!-- Color Selection -->
        <div class="control-group" v-if="['pen', 'rect', 'circle', 'arrow', 'line'].includes(activeMode)">
          <div class="group-label">Color</div>
          <div class="color-grid">
            <button 
              v-for="color in colors" 
              :key="color"
              class="color-btn"
              :class="{ active: activeColor === color }"
              :style="{ backgroundColor: color }"
              @click="selectColor(color)"
            ></button>
          </div>
        </div>

        <!-- Thickness Slider (Compact) -->
        <div class="control-group">
          <div class="group-label">Size: {{ activeThickness }}</div>
          <input 
            type="range" 
            min="1" max="25" 
            :value="activeThickness" 
            @input="updateThickness"
            class="thickness-slider"
          >
        </div>
      </div>

      <!-- Action Footer -->
      <div class="sidebar-footer">
        <button class="clear-btn-icon" @click="emit('clearAll')" title="Clear Everything">
          🗑️
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.drawing-sidebar {
  position: fixed;
  top: 100px;
  right: 15px;
  width: 80px; /* Slightly wider for bigger colors */
  max-height: calc(100vh - 150px);
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(25px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 40px; /* Pill shape */
  z-index: 100;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  padding: 1rem 0.6rem;
  box-shadow: 0 10px 40px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.drawing-sidebar.collapsed {
  transform: translateX(100px);
  opacity: 0;
  pointer-events: none;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  align-items: center;
  width: 100%;
}

.primary-tools-grid {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  width: 100%;
}

.icon-tool-btn {
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: #fff;
  font-size: 1.4rem;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.icon-tool-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: scale(1.1);
}

.icon-tool-btn.active {
  background: #00d4ff;
  border-color: #00d4ff;
  box-shadow: 0 0 15px rgba(0, 212, 255, 0.4);
  transform: scale(1.15);
}

.indicator {
  position: absolute;
  bottom: 4px;
  width: 4px;
  height: 4px;
  background: #fff;
  border-radius: 50%;
}

.shape-submenu-container {
  position: absolute;
  right: 85px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(15, 23, 42, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  padding: 1rem;
  min-width: 140px;
  box-shadow: -10px 0 30px rgba(0,0,0,0.5);
  animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes popIn {
  from { opacity: 0; transform: translateY(-50%) translateX(20px) scale(0.9); }
  to { opacity: 1; transform: translateY(-50%) translateX(0) scale(1); }
}

.group-label {
  font-size: 0.65rem;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  display: block;
  text-align: center;
}

.shape-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.6rem;
}

.sub-tool-btn {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #fff;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.2s;
}

.sub-tool-btn:hover { background: rgba(255, 255, 255, 0.1); }
.sub-tool-btn.active { background: #00d4ff; border-color: #00d4ff; }

.controls-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
  align-items: center;
}

.color-grid {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.color-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.25s;
}

.color-btn:hover { transform: scale(1.3); }
.color-btn.active { border-color: white; box-shadow: 0 0 8px rgba(255, 255, 255, 0.5); }

.thickness-slider {
  writing-mode: bt-lr; /* IE */
  -webkit-appearance: slider-vertical; /* WebKit */
  width: 8px;
  height: 80px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.sidebar-footer {
  margin-top: auto;
  width: 100%;
  display: flex;
  justify-content: center;
}

.clear-btn-icon {
  width: 44px;
  height: 44px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 50%;
  color: #fca5a5;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-btn-icon:hover {
  background: #ef4444;
  color: white;
  transform: rotate(15deg);
}

.toggle-btn {
  position: absolute;
  left: -44px;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 80px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-right: none;
  border-radius: 16px 0 0 16px;
  color: #00d4ff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
}

/* Custom Scrollbar - hidden but active */
.drawing-sidebar {
  overflow-y: visible; /* To allow submenu overlap */
}
</style>
