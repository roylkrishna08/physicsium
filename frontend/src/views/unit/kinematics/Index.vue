<script setup>
import { useRouter } from 'vue-router'
import KinematicsBackground from '../../../components/backgrounds/KinematicsBackground.vue'
import TopicCard from '../../../components/ui/TopicCard.vue'

const router = useRouter()

const kinematicsTopics = [
  {
    title: "Frame of Reference",
    content: "Understanding the coordinate system and observer's perspective in motion.",
    route: '/kinematics/frame-of-reference',
    icon: '📍',
    color: '#00d4ff'
  },
  {
    title: "Straight Line Motion",
    content: "Analysis of speed and velocity in one dimension.",
    route: '/kinematics/straight-line',
    icon: '📏',
    color: '#00ff9d'
  },
  {
    title: "Acceleration & Motion",
    content: "Average speed, instantaneous velocity, and uniformly accelerated motion.",
    route: '/kinematics/acceleration',
    icon: '🏎️',
    color: '#ff0055'
  },
  {
    title: "Kinematic Graphs",
    content: "Position-time and velocity-time graphs, and equations of motion.",
    route: '/kinematics/graphs',
    icon: '📈',
    color: '#ffaa00'
  },
  {
    title: "Relative Velocity",
    content: "Motion of an object as observed from another moving frame.",
    route: '/kinematics/relative-velocity',
    icon: '🚆',
    color: '#aa00ff'
  },
  {
    title: "Projectile Motion",
    content: "Motion in a plane under the influence of gravity.",
    route: '/kinematics/projectile',
    icon: '☄️',
    color: '#ffcc00'
  },
  {
    title: "Circular Motion",
    content: "Study of uniform circular motion and centripetal acceleration.",
    route: '/kinematics/circular',
    icon: '🔄',
    color: '#00ffcc'
  }
]

const navigateTo = (route) => {
    router.push(route)
}
</script>

<template>
  <div class="kinematics-page">
    <KinematicsBackground />
    
    <div class="content-container container">
      <header class="hero-section">
        <div class="pill">UNIT 12</div>
        <h1 class="title">Kinematics</h1>
        <p class="subtitle">Exploring the mathematics of motion without considering its causes.</p>
      </header>

      <div class="syllabus-grid">
        <TopicCard 
            v-for="(item, index) in kinematicsTopics" 
            :key="index"
            :title="item.title"
            :desc="item.content"
            :tags="['Topic ' + (index + 1)]"
            :icon="item.icon"
            :color="item.color"
            :index="index"
            @click="navigateTo(item.route)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.kinematics-page {
  position: relative;
  min-height: 100vh;
  padding-top: 2rem;
  padding-bottom: 4rem;
  overflow: hidden;
  perspective: 1000px;
}

.content-container { position: relative; z-index: 1; }
.hero-section { text-align: center; margin-bottom: 4rem; }
.pill { display: inline-block; padding: 6px 16px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 20px; font-size: 0.9rem; color: #00ff9d; margin-bottom: 1rem; }
.title { font-size: 4rem; font-weight: 700; background: linear-gradient(135deg, #fff, #a5f3fc); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 1rem; text-shadow: 0 0 30px rgba(0, 255, 157, 0.3); }
.subtitle { color: #94a3b8; font-size: 1.2rem; max-width: 600px; margin: 0 auto; }

.syllabus-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
  gap: 2rem; 
}

@media (max-width: 768px) {
  .kinematics-page { padding-top: 2rem; }
  .title { font-size: 2.5rem; }
  .syllabus-grid { grid-template-columns: 1fr; gap: 1.5rem; padding: 0 1rem; }
}
</style>
