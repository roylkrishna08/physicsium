<script setup>
import { ref, computed } from 'vue'
import { jeeSyllabus } from '../data/jee-syllabus.js'
import TopicCard from '../components/TopicCard.vue'
import LabBackground from '../components/LabBackground.vue'
import { useSearch } from '../composables/useSearch.js'

import { useRouter } from 'vue-router'

// Search state
const { searchQuery } = useSearch()
const router = useRouter()

const props = defineProps({
  activeExam: String
})

// ...

const handleExperimentClick = (id) => {
    router.push(`/lab/${id}`)
}

// Extract Experimental Skills Unit
const experimentUnit = jeeSyllabus.find(u => u.title.toLowerCase().includes('experimental'))

// Parse the numbered list
const experiments = computed(() => {
    if (!experimentUnit) return []
    
    // Split by numbered list pattern (e.g., "1. ", "2. ")
    const rawText = experimentUnit.content
    const matches = rawText.split(/\d+\.\s+/)
    
    return matches
        .filter(t => t.trim().length > 0)
        .filter(t => !t.includes('Familiarity with the basic approach')) // Exclude header text
        .map((text, index) => {
            const endOfFirstSentence = text.indexOf('.')
            const title = endOfFirstSentence > -1 ? text.substring(0, endOfFirstSentence) : text
            
            return {
                id: index + 1,
                title: title.trim(),
                desc: text.trim(),
                unit: 'Experimental Skills'
            }
        })
})

const filteredExperiments = computed(() => {
    if (!searchQuery.value) return experiments.value
    const query = searchQuery.value.toLowerCase()
    return experiments.value.filter(exp => 
        exp.title.toLowerCase().includes(query) || 
        exp.desc.toLowerCase().includes(query)
    )
})

const getIcon = (title) => {
    const t = title.toLowerCase()
    if (t.includes('vernier')) return '📏'
    if (t.includes('screw')) return '🔩'
    if (t.includes('pendulum')) return '⏱️'
    if (t.includes('scale') || t.includes('moments')) return '⚖️'
    if (t.includes('young')) return '〰️'
    if (t.includes('surface tension') || t.includes('capillary')) return '💧'
    if (t.includes('viscosity')) return '🍯'
    if (t.includes('sound') || t.includes('resonance')) return '🔊'
    if (t.includes('specific heat')) return '🔥'
    if (t.includes('metre bridge') || t.includes('resistivity')) return '⚡'
    if (t.includes('ohm')) return '🔋'
    if (t.includes('galvanometer')) return '🧭'
    if (t.includes('focal length') || t.includes('mirror') || t.includes('lens')) return '🔍'
    if (t.includes('prism')) return '🌈'
    if (t.includes('refractive')) return '💎'
    // Diode (Schematic)
    if (t.includes('p-n junction') || t.includes('diode')) return `<svg viewBox="0 0 24 24" fill="none" class="w-full h-full" stroke="currentColor" stroke-width="2"><path d="M22 12h-6M2 12h6m0-8l8 8-8 8V4zm8 0v16"/></svg>`
    
    // Zener (Schematic)
    if (t.includes('zener')) return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-6M2 12h6m0-8l8 8-8 8V4zm8 0v16m-2-2h4m-4-12h4"/></svg>`
    
    // Identification / Puzzle
    if (t.includes('identification')) return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 2h4a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2a2 2 0 0 0-2 2v2a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2a2 2 0 0 0-2-2H6a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h2a2 2 0 0 0 2-2V4a2 2 0 0 1 2-2z"/></svg>`
    
    return '🧪'
}

const getColor = (index) => {
    const colors = ['#00d4ff', '#ff0055', '#00ffaa', '#ffaa00', '#aa00ff']
    return colors[index % colors.length]
}
</script>

<template>
  <LabBackground />
  <div class="experiments-page container">
    <header class="page-header">
      <div class="back-link">
          <router-link to="/topics">← Back to Topics</router-link>
      </div>
      <h1 class="text-gradient">Experimental Skills</h1>
      <p class="subtitle">Practical applications and laboratory techniques</p>
      
      <p class="subtitle">Practical applications and laboratory techniques</p>
    </header>

    <div class="experiments-grid">
      <TransitionGroup name="staggered-fade" tag="div" class="grid-layout">
          <TopicCard 
            v-for="(exp, index) in filteredExperiments" 
            :key="exp.id"
            :title="exp.title"
            :desc="exp.desc"
            :tags="['Experiment ' + exp.id]"
            :icon="getIcon(exp.title)"
            :color="getColor(index)"
            class="animated-card"
            :style="{ '--i': index }"
            :compact="true"
            @click="handleExperimentClick(exp.id)"
          />
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.experiments-page {
  padding-top: 2rem;
  padding-bottom: 4rem;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
  position: relative;
}

.back-link {
    position: absolute;
    left: 0;
    top: 0;
}

.back-link a {
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 0.9rem;
    transition: 0.3s;
}

.back-link a:hover {
    color: var(--primary-glow);
}

.page-header h1 {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  margin-top: 1rem;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 1.1rem;
}

.experiments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.card-link {
    text-decoration: none;
    color: inherit;
    display: block;
}

@media (max-width: 768px) {
  .page-header h1 {
    font-size: 2rem;
  }
  .back-link {
      position: static;
      margin-bottom: 1rem;
      display: block;
      text-align: left;
  }
}

/* Search Bar */
.search-container {
    max-width: 600px;
    margin: 2rem auto 0;
}

.search-bar {
    width: 100%;
    padding: 12px 20px;
    border-radius: 30px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    color: white;
    font-size: 1rem;
    font-family: var(--font-main);
    transition: 0.3s;
}

.search-bar:focus {
    outline: none;
    border-color: var(--primary-glow);
    background: rgba(255,255,255,0.1);
    box-shadow: 0 0 15px rgba(0, 212, 255, 0.2);
}

/* Grid Layout Fix since TransitionGroup renders a div */
.grid-layout {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  width: 100%;
}

.experiments-grid {
    /* Reset display since grid is now on the inner div */
    display: block; 
}

/* Animations */
.animated-card {
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.animated-card:hover {
    transform: translateY(-5px) scale(1.02);
    z-index: 10;
}

/* Staggered Fade Entrance */
.staggered-fade-enter-active {
  transition: all 0.5s ease-out;
  transition-delay: calc(var(--i) * 0.05s); /* Stagger delay based on index */
}

.staggered-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
  position: absolute; /* Useful for smooth removal */
}

.staggered-fade-enter-from,
.staggered-fade-leave-to {
  transform: translateY(20px);
  opacity: 0;
}

.staggered-fade-move {
  transition: transform 0.5s ease;
}
</style>
