<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { jeeSyllabus } from '../../data/jee-syllabus.js'
import TopicCard from '../../components/ui/TopicCard.vue'
import TopicsBackground from '../../components/backgrounds/TopicsBackground.vue'
import { useSearch } from '../../composables/useSearch.js'

defineProps(['activeExam'])

// Sort: Experimental Content First, then others
const sortedTopics = [...jeeSyllabus].sort((a, b) => {
    const isExpA = a.title.toLowerCase().includes('experimental')
    const isExpB = b.title.toLowerCase().includes('experimental')
    if (isExpA && !isExpB) return -1
    if (!isExpA && isExpB) return 1
    return 0
})

const { searchQuery } = useSearch()
const router = useRouter()

const filteredTopics = computed(() => {
    if (!searchQuery.value) return sortedTopics
    const query = searchQuery.value.toLowerCase()
    return sortedTopics.filter(topic => 
        topic.title.toLowerCase().includes(query) ||
        topic.content.toLowerCase().includes(query) ||
        topic.unit.toLowerCase().includes(query)
    )
})

const getIcon = (index) => {
    const icons = ['⚛️', '🚀', '🛑', '🔋', '🎡', '🍎', '💧', '🔥', '💨', '〰️', '⚡', '💡', '🧲', '🔌', '📡', '🕶️', '✨', '☢️', '📟', '🔬']
    return icons[index % icons.length]
}

const getColor = (index) => {
    const colors = ['#00d4ff', '#ff0055', '#00ffaa', '#ffaa00', '#aa00ff']
    return colors[index % colors.length]
}

const handleTopicClick = (topic) => {
    const title = topic.title.toLowerCase()
    if (title.includes('experimental')) {
        router.push('/experiments')
    } else if (title.includes('kinematics')) {
        router.push('/lab/projectile')
    } else if (title.includes('electrostatics')) {
        router.push('/electrostatics')
    } else {
        // Placeholder for future modules
        alert(`${topic.title} module is coming soon!`)
    }
}

const isExperimental = (topic) => topic.title.toLowerCase().includes('experimental')
</script>

<template>
  <TopicsBackground />
  <div class="topics-page container">
    <header class="page-header">
      <h1 class="text-gradient">Explore Physics Topics</h1>
      <p class="subtitle">Comprehensive modules covering the entire syllabus</p>
    </header>

    <div class="topics-grid" v-if="filteredTopics.length > 0">
      <template v-for="(topic, index) in filteredTopics" :key="topic.unit">
        <!-- Experimental Skills: Direct Link to Experiments Page -->
        <router-link 
            v-if="isExperimental(topic)"
            to="/experiments"
            class="topic-link-wrapper"
        >
            <TopicCard 
                :title="topic.title"
                :desc="topic.content.slice(0, 100) + '...'"
                :tags="[topic.unit]"
                :icon="getIcon(index)"
                :color="getColor(index)"
                :compact="true"
                :index="index"
                class="experimental-card"
            />
        </router-link>

        <!-- Other Topics: Click Handler -->
        <TopicCard 
            v-else
            :title="topic.title"
            :desc="topic.content.slice(0, 100) + '...'"
            :tags="[topic.unit]"
            :icon="getIcon(index)"
            :color="getColor(index)"
            :compact="true"
            :index="index"
            @click="handleTopicClick(topic)"
        />
      </template>
    </div>
    
    <div v-else class="no-results">
        <p>No topics found matching "{{ searchQuery }}"</p>
    </div>
  </div>
</template>

<style scoped>
.topics-page {
  padding-top: 8rem;
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

/* Special styling for Experimental Skills */
/* Link Wrapper */
.topic-link-wrapper {
    text-decoration: none;
    color: inherit;
    display: block;
    grid-column: 1 / -1; /* Experimental card spans full width */
}

/* Ensure the card inside creates the height */
.experimental-card {
  /* grid-column moved to wrapper */
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(0, 0, 0, 0));
  border: 1px solid rgba(255, 215, 0, 0.3);
  min-height: 200px;
}

.experimental-card :deep(.title) {
  font-size: 2rem;
  color: #ffd700; /* Gold */
}

.experimental-card :deep(.desc) {
  font-size: 1.1rem;
  max-width: 800px;
}

.no-results {
    text-align: center;
    padding: 3rem;
    color: var(--text-secondary);
    font-size: 1.1rem;
    background: rgba(255,255,255,0.05);
    border-radius: 12px;
}

@media (max-width: 768px) {
  .page-header h1 {
    font-size: 2rem;
  }
}
</style>
