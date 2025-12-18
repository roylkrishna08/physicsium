<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { jeeSyllabus } from '../data/jee-syllabus.js'
import TopicCard from '../components/TopicCard.vue'
import TopicsBackground from '../components/TopicsBackground.vue'

// Sort: Experimental Content First, then others
const sortedTopics = [...jeeSyllabus].sort((a, b) => {
    const isExpA = a.title.toLowerCase().includes('experimental')
    const isExpB = b.title.toLowerCase().includes('experimental')
    if (isExpA && !isExpB) return -1
    if (!isExpA && isExpB) return 1
    return 0
})

const topics = ref(sortedTopics)

const getIcon = (index) => {
    const icons = ['⚛️', '🚀', '🛑', '🔋', '🎡', '🍎', '💧', '🔥', '💨', '〰️', '⚡', '💡', '🧲', '🔌', '📡', '🕶️', '✨', '☢️', '📟', '🔬']
    return icons[index % icons.length]
}

const getColor = (index) => {
    const colors = ['#00d4ff', '#ff0055', '#00ffaa', '#ffaa00', '#aa00ff']
    return colors[index % colors.length]
}

const router = useRouter()
const handleTopicClick = (topic) => {
    if (topic.title.toLowerCase().includes('experimental')) {
        router.push('/experiments')
    }
}
</script>

<template>
  <TopicsBackground />
  <div class="topics-page container">
    <header class="page-header">
      <h1 class="text-gradient">Explore Physics Topics</h1>
      <p class="subtitle">Comprehensive modules covering the entire syllabus</p>
    </header>

    <div class="topics-grid">
      <TopicCard 
        v-for="(topic, index) in topics" 
        :key="index"
        :title="topic.title"
        :desc="topic.content.slice(0, 100) + '...'"
        :tags="[topic.unit]"
        :icon="getIcon(index)"
        :color="getColor(index)"
        :compact="true"
        :index="index"
        @click="handleTopicClick(topic)"
      />
    </div>
  </div>
</template>

<style scoped>
.topics-page {
  padding-top: 2rem;
  padding-bottom: 4rem;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.page-header h1 {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 1.1rem;
}

.topics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

/* Special styling for the first item (Experimental Skills) */
.topics-grid > :first-child {
  grid-column: 1 / -1;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(0, 0, 0, 0));
  border: 1px solid rgba(255, 215, 0, 0.3);
  min-height: 200px;
}

.topics-grid > :first-child :deep(.title) {
  font-size: 2rem;
  color: #ffd700; /* Gold */
}

.topics-grid > :first-child :deep(.desc) {
  font-size: 1.1rem;
  max-width: 800px;
}

@media (max-width: 768px) {
  .page-header h1 {
    font-size: 2rem;
  }
}
</style>
