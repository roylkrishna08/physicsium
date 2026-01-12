<template>
  <div class="jee-mains-view">
    <div class="background-grid"></div>
    <div class="container">
      <header class="page-header">
        <div class="header-content">
            <h1>JEE Main PYQ</h1>
        </div>
      </header>

      <div class="units-grid">
        <div 
            v-for="(unit) in units" 
            :key="unit.id" 
            class="unit-card"
            @click="navigateToUnit(unit)"
        >
          <div class="unit-icon">{{ unit.icon }}</div>
          <div class="unit-info">
            <h3>{{ unit.title }}</h3>
            <span class="topic-count">{{ unit.topics }} Topics</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const navigateToUnit = (unit) => {
    // Create a slug from title (e.g., "Experimental Skills" -> "experimental-skills")
    const slug = unit.title.toLowerCase().replace(/ /g, '-').replace(/&/g, '').replace(/,/g, '').replace(/--/g, '-')
    router.push(`/pyq/jee-mains/${slug}`)
}

const units = [
  { id: 20, title: 'Experimental Skills', icon: '🧪', topics: 18 },
  { id: 10, title: 'Kinematics', icon: '🏃', topics: 4 },
  { id: 11, title: 'Laws of Motion', icon: '🎢', topics: 3 },
  { id: 12, title: 'Work, Energy & Power', icon: '💪', topics: 3 },
  { id: 13, title: 'Rotational Motion', icon: '🎡', topics: 5 },
  { id: 14, title: 'Gravitation', icon: '🌍', topics: 2 },
  { id: 15, title: 'Solids & Fluids', icon: '💧', topics: 4 },
  { id: 16, title: 'Thermal Physics', icon: '🔥', topics: 5 },
  { id: 17, title: 'Oscillations & Waves', icon: '〰️', topics: 4 },
  { id: 1, title: 'Electrostatics', icon: '⚡', topics: 5 },
  { id: 2, title: 'Current Electricity', icon: '🔋', topics: 4 },
  { id: 3, title: 'Magnetism', icon: '🧲', topics: 6 },
  { id: 4, title: 'EMI & AC', icon: '🔌', topics: 3 },
  { id: 5, title: 'Optics', icon: '🕯️', topics: 7 },
  { id: 6, title: 'Dual Nature of Matter', icon: '⚛️', topics: 2 },
  { id: 7, title: 'Atoms & Nuclei', icon: '☢️', topics: 3 },
  { id: 8, title: 'Electronic Devices', icon: '💾', topics: 3 },
  { id: 9, title: 'Communication Systems', icon: '📡', topics: 1 },
]
</script>

<style scoped>
.jee-mains-view {
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
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  text-align: center;
}

.back-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.95rem;
  transition: 0.3s;
  display: inline-flex;
  align-items: center;
}

.back-link:hover {
  color: #fff;
  transform: translateX(-3px);
}

.header-content h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: #fff;
}

.header-content p {
    color: var(--text-secondary);
}

.units-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 0 1rem;
}

.unit-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08); /* Crisp border */
  cursor: pointer;
  transition: all 0.2s ease;
}

.unit-card:hover {
  background: rgba(255, 255, 255, 0.05); /* Simple lighten */
  border-color: rgba(255, 255, 255, 0.2);
}

.unit-icon {
  font-size: 1.8rem;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  color: #ccc;
}

.unit-info h3 {
  font-size: 1.1rem;
  margin-bottom: 0.2rem;
  color: var(--text-primary);
  font-weight: 500;
}

.topic-count {
  font-size: 0.85rem;
  color: var(--text-secondary);
}
</style>
