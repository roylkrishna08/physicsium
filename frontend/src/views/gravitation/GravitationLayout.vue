<script setup>
import { useRouter } from 'vue-router'
import GravitationBackground from '../../components/gravitation/GravitationBackground.vue'
import GravitationNavBar from '../../components/gravitation/GravitationNavBar.vue'
import TopicCard from '../../components/ui/TopicCard.vue'

const router = useRouter()

const topics = [
    {
        title: "Universal Law of Gravitation",
        content: "Understanding Newton's law, gravitational force formula, and its significance.",
        route: '/gravitation/universal-law',
        icon: '🌌',
        color: '#60a5fa'
    },
    {
        title: "Acceleration Due to Gravity",
        content: "Variation with altitude and depth, relation between g and G.",
        route: '/gravitation/acceleration',
        icon: '📉',
        color: '#34d399'
    },
    {
        title: "Kepler's Laws",
        content: "The three laws of planetary motion governing orbits.",
        route: '/gravitation/kepler',
        icon: '🪐',
        color: '#f472b6'
    },
    {
        title: "Gravitational Potential",
        content: "Potential energy, potential difference, and escape velocity.",
        route: '/gravitation/potential',
        icon: '⛰️',
        color: '#fbbf24'
    },
    {
        title: "Satellite Motion",
        content: "Orbital velocity, time period, and energy of satellites.",
        route: '/gravitation/satellite',
        icon: '🛰️',
        color: '#a78bfa'
    }
]

const navigateTo = (path) => {
    router.push(path)
}
</script>

<template>
  <div class="gravitation-layout">
    <GravitationBackground />
    <GravitationNavBar :show-menu-toggle="false" />
    
    <div class="content-container container">
        <header class="hero-section">
            <div class="pill">UNIT 6</div>
            <h1 class="title">Gravitation</h1>
            <p class="subtitle">Explore the invisible force that binds the universe together, from apples to galaxies.</p>
        </header>

        <div class="topics-grid">
            <TopicCard 
                v-for="(topic, index) in topics"
                :key="index"
                :title="topic.title"
                :desc="topic.content"
                :tags="['Topic ' + (index + 1)]"
                :icon="topic.icon"
                :color="topic.color"
                :index="index"
                @click="navigateTo(topic.route)"
            />
        </div>
    </div>
  </div>
</template>

<style scoped>
.gravitation-layout {
    position: relative;
    min-height: 100vh;
    padding-top: 4rem;
    padding-bottom: 4rem;
    overflow: hidden;
}

.content-container {
    position: relative;
    z-index: 10;
}

.hero-section {
    text-align: center;
    margin-bottom: 4rem;
}

.pill {
    display: inline-block;
    padding: 6px 16px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    font-size: 0.9rem;
    color: #60a5fa;
    margin-bottom: 1rem;
    backdrop-filter: blur(5px);
}

.title {
    font-size: 4rem;
    font-weight: 700;
    color: white;
    margin-bottom: 1rem;
    text-shadow: 0 0 30px rgba(96, 165, 250, 0.5);
}

.content {
  position: relative;
  z-index: 10;
  padding: 2rem;
  padding-top: 150px; /* Increased for floating navbar */
  max-width: 1200px;
  margin: 0 auto;
}

.subtitle {
    color: #94a3b8;
    font-size: 1.2rem;
    max-width: 600px;
    margin: 0 auto;
}

.topics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    padding: 0 1rem;
}

@media (max-width: 768px) {
    .title {
        font-size: 2.5rem;
    }
}
</style>
