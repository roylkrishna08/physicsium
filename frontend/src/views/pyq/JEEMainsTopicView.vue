<template>
  <div class="topic-view">
    <div class="background-grid"></div>
    <div class="container">
      <header class="page-header">
        <button class="small-back-btn" @click="$router.back()" title="Go Back">
            ←
        </button>
        <div class="header-content">
            <h1>{{ topicTitle }}</h1>
            <div class="zoom-controls">
                <button @click="zoomOut" class="zoom-btn" title="Zoom Out">-</button>
                <span class="zoom-label">{{ Math.round(zoomLevel * 100) }}%</span>
                <button @click="zoomIn" class="zoom-btn" title="Zoom In">+</button>
            </div>
        </div>
      </header>

      <div class="questions-list" v-if="questions.length > 0" :style="{ '--zoom-scale': zoomLevel }">
        <div 
            v-for="(q, index) in questions" 
            :key="q.id" 
            class="question-card glass-card"
        >
          <div class="q-header">
            <span class="q-number">Q{{ index + 1 }}</span>
            <div class="q-meta">
                <span class="q-year">{{ q.year }}</span>
                <button class="lang-toggle-btn" @click="toggleLanguage(q.id)" :title="isHindi[q.id] ? 'Switch to English' : 'Switch to Hindi'">
                    {{ isHindi[q.id] ? 'English' : 'हिंदी' }}
                </button>
            </div>
          </div>
          
          <div class="q-content">
            <p>{{ isHindi[q.id] ? q.question_hi : q.question }}</p>
          </div>

          <div class="q-options">
            <div 
                v-for="(opt, optIndex) in (isHindi[q.id] ? q.options_hi : q.options)" 
                :key="optIndex"
                class="option-item"
                :class="{ 
                    'correct': showAnswer[q.id] && optIndex === q.correctAnswer,
                    'wrong': showAnswer[q.id] && selectedOptions[q.id] === optIndex && optIndex !== q.correctAnswer,
                    'selected': selectedOptions[q.id] === optIndex
                }"
                @click="selectOption(q.id, optIndex)"
            >
                <span class="opt-label">{{ String.fromCharCode(65 + optIndex) }}</span>
                <span class="opt-text">{{ opt }}</span>
            </div>
          </div>

          <div class="q-footer">
            <button class="toggle-ans-btn" @click="toggleAnswer(q.id)">
                {{ showAnswer[q.id] ? 'Hide Answer' : 'Show Answer' }}
            </button>
            
            <div class="solution-box" v-if="showAnswer[q.id]">
                <h4>Solution:</h4>
                <p>{{ isHindi[q.id] ? q.solution_hi : q.solution }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="no-data">
        <div class="empty-state">
            <h2>No questions found</h2>
            <p>We are adding questions for this topic. Check back soon!</p>
        </div>
      </div>
      
      <!-- Drawing Tool Integration -->
      <DrawingCanvas 
        ref="canvasRef"
        :active="isDrawingActive"
        :mode="drawingMode"
        :color="drawingColor"
        :thickness="drawingThickness"
      />
      
      <!-- Standard Lab Drawing Sidebar -->
      <DrawingSidebar 
        v-model:isOpen="isSidebarOpen"
        v-model:activeMode="drawingMode"
        v-model:activeColor="drawingColor"
        v-model:activeThickness="drawingThickness"
        @clearAll="clearCanvas"
      />
      
      <!-- Toggle Button (to initially activate drawing if needed, or we rely on sidebar) -->
      <!-- Since DrawingSidebar has a built-in toggle for 'isOpen', we might just need a main 'Enable Drawing' toggle 
           OR we treat the presence of Sidebar as 'drawing enabled'. 
           Usually Lab mode has drawing always available but hidden. 
           Let's match that: isDrawingActive controls canvas interaction, Sidebar controls tools. 
           Wait, DrawingCanvas 'active' prop controls pointer events. 
           If Setup is like Lab, we want DrawingCanvas active whenever we want to draw.
           But we must be able to click questions. 
           So we need a toggle to switch between 'Interact with Page' and 'Draw'.
           
           In DrawingSidebar.vue, the valid modes are 'pen', 'eraser', 'laser', etc.
           Maybe add a specific toggle in this view to enable/disable the canvas layer entirely.
      -->

       <button 
            class="fab-btn" 
            :class="{ active: isDrawingActive }" 
            @click="toggleDrawing"
            title="Toggle Drawing Mode"
        >
            {{ isDrawingActive ? '🖱️' : '✏️' }}
        </button>

    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { ref, computed, onMounted } from 'vue'
import { jeeQuestions } from '../../data/jee-questions.js'
import DrawingCanvas from '../../components/drawingTool/DrawingCanvas.vue'
import DrawingSidebar from '../../components/drawingTool/DrawingSidebar.vue'

const route = useRoute()
// Retrieve full parameters 
const unitId = computed(() => route.params.unitId)
const topicId = computed(() => route.params.topicId)

const topicTitle = ref('')
const questions = ref([])
const showAnswer = ref({})
const selectedOptions = ref({})
const isHindi = ref({})

// Zoom State
const zoomLevel = ref(1)

const zoomIn = () => {
    if (zoomLevel.value < 1.5) zoomLevel.value += 0.1
}

const zoomOut = () => {
    if (zoomLevel.value > 0.8) zoomLevel.value -= 0.1
}

const toggleLanguage = (qId) => {
    isHindi.value[qId] = !isHindi.value[qId]
}

// Drawing State
const isDrawingActive = ref(false) // Controls pointer-events on canvas
const isSidebarOpen = ref(false)
const drawingMode = ref('pen') 
const drawingColor = ref('#00d4ff')
const drawingThickness = ref(3)
const canvasRef = ref(null)

const toggleDrawing = () => {
    isDrawingActive.value = !isDrawingActive.value
    isSidebarOpen.value = isDrawingActive.value
}

const clearCanvas = () => {
    if (canvasRef.value) {
        canvasRef.value.clearAll()
    }
}

const loadQuestions = () => {
    // Basic slug matching. 
    // In real app, might need more robust lookup or exact ID match.
    // Syllabus slugs often have numbers like "1. Vernier...", let's handle that in navigation
    const slug = topicId.value
    
    // Attempt multiple cleanup strategies to match data keys
    // Our data key: 'vernier-calipers---internal-and-external-diameter'
    
    // Strategy: Look for the key in jeeQuestions that *contains* our core slug parts
    // or direct match
    
    const dataKey = Object.keys(jeeQuestions).find(k => k === slug)
    
    if (dataKey) {
        questions.value = jeeQuestions[dataKey]
    } else {
        // Fallback checks
        if (slug.includes('vernier')) {
             questions.value = jeeQuestions['vernier-calipers'] || []
        }
    }

    // Format title from slug
    if (slug.includes('vernier')) {
        topicTitle.value = "Vernier Caliper PYQ"
    } else {
        topicTitle.value = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    }
}

const toggleAnswer = (qId) => {
    showAnswer.value[qId] = !showAnswer.value[qId]
}

const selectOption = (qId, optIndex) => {
    if (showAnswer.value[qId]) return // prevent changing after answer shown
    selectedOptions.value[qId] = optIndex
}

onMounted(() => {
    loadQuestions()
})
</script>

<style scoped>
.topic-view {
  padding-top: 2rem; /* Reduced padding since navbar is gone */
  padding-bottom: 6rem;
  min-height: 100vh;
  position: relative;
}

/* Main Toggle Button */
.fab-btn {
    position: fixed;
    top: 2rem;
    right: 2rem;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: var(--primary-color, #3b82f6);
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
    transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    z-index: 101; /* Above sidebar */
}

.fab-btn:hover {
    transform: scale(1.1);
}

.fab-btn.active {
    background: #10b981; /* Green when active (Mouse mode) or maybe just toggle color */
}

/* Hide the built-in toggle of the sidebar since we use the FAB */
:deep(.drawing-sidebar .toggle-btn) {
    display: none !important;
}

/* Reusing grid from previous pages */
.background-grid {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    background-size: 40px 40px;
    background-image:
        linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    mask-image: linear-gradient(to bottom, black 30%, transparent 100%);
    pointer-events: none;
}

.container {
  position: relative;
  z-index: 1;
  max-width: 900px;
  margin: 0 auto;
  padding: 0 1rem;
}

.page-header {
  margin-bottom: 3rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.small-back-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.05);
    color: #fff;
    font-size: 1.2rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: 0.2s;
}

.small-back-btn:hover {
    background: rgba(255,255,255,0.15);
    transform: translateX(-3px);
}

.header-content h1 {
  font-size: 2rem;
  color: #fff;
  margin: 0; /* Updated to remove bottom margin since flex aligns it */
}

.header-content p {
    color: var(--text-secondary);
}

.questions-list {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.question-card {
    padding: 2rem;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.08);
    position: relative;
    overflow: hidden;
}

.question-card::before {
    content: 'PHYSICSIUM';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-15deg);
    font-size: 6rem;
    font-weight: 900;
    color: rgba(255, 255, 255, 0.08); /* Increased brightness from 0.04 */
    pointer-events: none;
    z-index: 0;
    letter-spacing: 10px;
    user-select: none;
}

/* Ensure content is above watermark */
.q-header, .q-content, .q-options, .q-footer {
    position: relative;
    z-index: 1;
}

.q-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1.5rem;
}

.q-number {
    font-weight: 700;
    color: var(--primary-glow);
    background: rgba(59, 130, 246, 0.1);
    padding: 0.2rem 0.6rem;
    border-radius: 6px;
}

.q-meta {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.q-year {
    font-size: 0.9rem;
    font-weight: 600;
    color: #fbbf24; /* Amber/Gold for visibility */
    background: rgba(251, 191, 36, 0.1);
    padding: 0.3rem 1rem;
    border-radius: 20px;
    border: 1px solid rgba(251, 191, 36, 0.2);
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.lang-toggle-btn {
    font-size: 0.85rem;
    color: var(--primary-color);
    background: transparent;
    border: 1px solid var(--primary-color);
    padding: 0.2rem 0.8rem;
    border-radius: 20px;
    cursor: pointer;
    transition: 0.3s;
}

.lang-toggle-btn:hover {
    background: var(--primary-color);
    color: white;
}

.q-content p {
    font-size: calc(1.35rem * var(--zoom-scale, 1)); /* Scalable */
    line-height: 1.7;
    margin-bottom: 1.5rem;
    color: #e0e0e0;
    font-weight: 500;
    transition: font-size 0.2s;
}

.opt-text {
    font-size: calc(1rem * var(--zoom-scale, 1));
}

.q-options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 2rem;
}

.option-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    cursor: pointer;
    transition: 0.2s;
}

.option-item:hover {
    background: rgba(255, 255, 255, 0.05);
}

.option-item.selected {
    border-color: var(--primary-color);
    background: rgba(59, 130, 246, 0.05);
}

.option-item.correct {
    border-color: #2ecc71;
    background: rgba(46, 204, 113, 0.1);
}

.option-item.wrong {
    border-color: #e74c3c;
    background: rgba(231, 76, 60, 0.1);
}

.opt-label {
    font-weight: 600;
    color: var(--text-secondary);
    background: rgba(255, 255, 255, 0.05);
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 0.8rem;
}

.toggle-ans-btn {
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    transition: 0.3s;
}

.toggle-ans-btn:hover {
    color: #fff;
    border-color: #fff;
}

.solution-box {
    margin-top: 1.5rem;
    padding: 1.5rem;
    background: rgba(46, 204, 113, 0.05);
    border-left: 3px solid #2ecc71;
    border-radius: 0 8px 8px 0;
    animation: fadeIn 0.3s ease;
}

.solution-box h4 {
    color: #2ecc71;
    margin-bottom: 0.5rem;
}

.solution-box p {
    font-size: 0.95rem;
    color: var(--text-primary);
    white-space: pre-line;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
}

.header-content {
    display: flex;
    align-items: center;
    gap: 2rem;
    flex-wrap: wrap;
}

.zoom-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255,255,255,0.05);
    padding: 0.3rem 0.6rem;
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.1);
}

.zoom-btn {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: none;
    background: rgba(255,255,255,0.1);
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    transition: 0.2s;
}

.zoom-btn:hover {
    background: var(--primary-color);
}

.zoom-label {
    font-size: 0.9rem;
    color: var(--text-secondary);
    min-width: 45px;
    text-align: center;
}

@media (max-width: 600px) {
    .q-options {
        grid-template-columns: 1fr;
    }
    
    .header-content {
        gap: 1rem;
    }
    
    .header-content h1 {
        font-size: 1.5rem;
    }
}
</style>
