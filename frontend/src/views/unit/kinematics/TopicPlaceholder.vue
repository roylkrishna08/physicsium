<template>
  <div class="kinematics-topic-page">
    <KinematicsBackground />
    <KinematicsNavBar :experimentName="topicTitle" />
    
    <main class="content">
      <div class="glass-panel main-lab-container">
        <h1>{{ topicTitle }}</h1>
        <p>This module is currently under development. Stay tuned for interactive simulations!</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import KinematicsBackground from '../../../components/backgrounds/KinematicsBackground.vue'
import KinematicsNavBar from '../../../components/kinematics/KinematicsNavBar.vue'

defineProps({
  topicTitle: {
    type: String,
    default: 'Motion in a Straight Line'
  }
})
</script>

<style scoped>
.kinematics-topic-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  z-index: 1;
}

.main-lab-container {
  width: 100%;
  max-width: 1000px;
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 2rem;
}

h1 {
  font-size: 3rem;
  background: linear-gradient(135deg, #fff, #00ff9d);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

p {
  color: #94a3b8;
  font-size: 1.2rem;
}
</style>
