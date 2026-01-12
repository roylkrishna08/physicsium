<template>
  <div class="unit-detail-view">
    <div class="background-grid"></div>
    <div class="container">
      <header class="page-header">
        <div class="header-content" v-if="unitData">
            <h1>{{ unitData.title }}</h1>
        </div>
      </header>

      <div class="topics-list" v-if="unitData">
        <div 
            v-for="(topic, index) in unitData.topics" 
            :key="index" 
            class="topic-card"
            :style="getCardStyle(index)"
            @click="navigateToTopic(topic.name)"
        >
          <div class="topic-number" :style="{ color: getAccentColor(index) }">{{ index + 1 }}</div>
          <div class="topic-info">
            <h3>{{ topic.name }}</h3>
          </div>
          <button class="practice-btn" :style="{ borderColor: getAccentColor(index), color: getAccentColor(index) }">Practice</button>
        </div>
      </div>
      
      <div v-else class="loading">
        Loading...
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, computed, onMounted, watch } from 'vue'
import { jeeSyllabus } from '../../data/jee-syllabus.js'

const route = useRoute()
const router = useRouter()
const unitId = computed(() => route.params.unitId)
const unitData = ref(null)

const navigateToTopic = (topicName) => {
    // Generate slug from topic name
    let topicSlug = topicName.toLowerCase()
        .replace(/ /g, '-')
        .replace(/&/g, 'and')
        .replace(/,/g, '')
        .replace(/[(){}]/g, '')
        .replace(/--+/g, '-') // clean up multiple hyphens

    // Specific overrides for long titles
    if (topicSlug.includes('vernier-calipers')) {
        topicSlug = 'vernier-calipers'
    } else if (topicSlug.includes('screw-gauge')) {
        topicSlug = 'screw-gauge'
    }

    router.push(`/pyq/jee-mains/${unitId.value}/${topicSlug}`)
}

const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', 
    '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71'
]

const getAccentColor = (index) => {
    return colors[index % colors.length]
}

const getCardStyle = (index) => {
    const color = getAccentColor(index)
    return {
        borderLeft: `3px solid ${color}`,
        background: `linear-gradient(90deg, ${color}11 0%, rgba(255,255,255,0.02) 100%)`
    }
}

const loadUnitData = () => {
    const slug = unitId.value
    if (!slug) return

    // Find matching unit from syllabus
    // Strategy: slugify syllabus titles and match
    const foundUnit = jeeSyllabus.find(u => {
        const uSlug = u.title.toLowerCase()
            .replace(/ /g, '-')
            .replace(/&/g, '')
            .replace(/,/g, '')
            .replace(/--/g, '-')
        
        // Handle special cases or partial matches if needed
        return uSlug === slug || slug.includes(uSlug) || uSlug.includes(slug)
    })

    if (foundUnit) {
        unitData.value = {
            title: foundUnit.title,
            topics: parseTopics(foundUnit.content)
        }
    } else {
        // Fallback for "Experimental Skills" if it's not in the main array index or named differently
        // Depending on how syllabus file is structured, "Experimental Skills" might be unit 20.
        // Let's check if we can find it by specific keywords if exact match fails
        if (slug.includes('experimental')) {
             const expUnit = jeeSyllabus.find(u => u.title.includes('Experimental'))
             if (expUnit) {
                unitData.value = {
                    title: expUnit.title,
                    topics: parseTopics(expUnit.content)
                }
                return;
             }
        }
        
        unitData.value = { 
            title: renderTitle(slug), 
            topics: [] // No data found
        }
    }
}

const parseTopics = (content) => {
    if (!content) return []
    
    // Check if content has numbered list (like Experimental Skills)
    if (content.includes('1.')) {
        // match "1. Text", "2. Text" etc.
        const lines = content.split('\n')
        const topics = []
        lines.forEach(line => {
            const trimmed = line.trim()
            // simple check for starting with number
            if (/^\d+\./.test(trimmed)) {
                topics.push({ name: trimmed.replace(/^\d+\.\s*/, '') })
            }
        })
        if (topics.length > 0) return topics
    }

    // Default: Split by commas or newlines, but handle smart splitting
    // simple split by comma for now
    return content.split(/,|\n/)
        .map(t => t.trim())
        .filter(t => t.length > 3) // filter out tiny fragments
        .map(t => ({ name: t }))
}

const renderTitle = (slug) => {
    return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

onMounted(() => {
    loadUnitData()
})

watch(() => route.params.unitId, () => {
    loadUnitData()
})

</script>

<style scoped>
.unit-detail-view {
  padding-top: 1rem;
  padding-bottom: 6rem;
  min-height: 100vh;
  position: relative;
}

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
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 1rem;
}

.page-header {
  margin-bottom: 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.back-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.95rem;
  transition: 0.3s;
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
}

.back-link:hover {
  color: #fff;
  transform: translateX(-3px);
}

.header-content {
    text-align: center;
}

.header-content h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: #fff;
}

.header-content p {
    color: var(--text-secondary);
}

.topics-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.topic-card {
    display: flex;
    align-items: center;
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    transition: all 0.2s ease;
}

.topic-card:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.15);
}

.topic-number {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--text-secondary);
    width: 50px;
    opacity: 0.5;
}

.topic-info {
    flex-grow: 1;
}

.topic-info h3 {
    font-size: 1.1rem;
    color: var(--text-primary);
    font-weight: 500;
}

.practice-btn {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.2);
    color: #fff;
    padding: 0.5rem 1.2rem;
    border-radius: 20px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: 0.3s;
}

.practice-btn:hover {
    background: var(--primary-glow);
    border-color: var(--primary-glow);
    color: #000;
}

.loading {
    color: var(--text-secondary);
    text-align: center;
    margin-top: 4rem;
}

@media (max-width: 600px) {
    .topic-card {
        padding: 1rem;
    }
    .topic-number {
        width: 30px;
        font-size: 1rem;
    }
    .practice-btn {
        padding: 0.4rem 0.8rem;
        font-size: 0.8rem;
    }
}
</style>
