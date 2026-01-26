<script setup>
import { useRouter } from 'vue-router'
import ElectrostaticsBackground from '../../../components/backgrounds/ElectrostaticsBackground.vue'
import TopicCard from '../../../components/ui/TopicCard.vue'

defineProps(['activeExam'])

const router = useRouter()

// Syllabus Data (Unit 11) - Mapped to routes
const syllabusPoints = [
  {
    title: "Electric Charges & Fields",
    content: "Conservation of charge, Coulomb's law, forces between multiple charges, superposition principle, continuous charge distribution.",
    route: '/electrostatics/charges',
    icon: '⚡',
    color: '#00d4ff'
  },
  {
    title: "Electric Field & Dipole",
    content: "Electric field due to point charge & dipole, electric field lines, torque on a dipole in uniform electric field.",
    route: '/electrostatics/dipole',
    icon: '🧲',
    color: '#ff0055'
  },
  {
    title: "Gauss's Law",
    content: "Electric flux, Gauss's law applications: infinite wire, infinite plane sheet, thin spherical shell.",
    route: '/electrostatics/gausslaw',
    icon: '🌐',
    color: '#00ff9d'
  },
  {
    title: "Electric Potential",
    content: "Potential due to point charge & dipole, equipotential surfaces, electrical potential energy of system of charges.",
    route: '/electrostatics/potential',
    icon: '🔋',
    color: '#ffaa00'
  },
  {
    title: "Capacitors & Dielectrics",
    content: "Conductors/insulators, dielectrics, polarization, capacitance, series/parallel combination, energy stored in capacitor.",
    route: '/electrostatics/capacitors',
    icon: '🔌',
    color: '#aa00ff'
  }
]

const navigateTo = (route) => {
    router.push(route)
}


</script>

<template>
  <div class="electrostatics-page">
    <ElectrostaticsBackground />
    
    <div class="content-container container">
      <header class="hero-section">
        <div class="pill">UNIT 11</div>
        <h1 class="title">Electrostatics</h1>
        <p class="subtitle">Master the forces that bind the universe. From Coulomb's Law to Capacitors.</p>
      </header>

      <div class="syllabus-grid">
        <TopicCard 
            v-for="(item, index) in syllabusPoints" 
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
.electrostatics-page {
  position: relative;
  min-height: 100vh;
  padding-top: 2rem;
  padding-bottom: 4rem;
  overflow: hidden;
  perspective: 1000px;
}

/* ... (previous structural styles remain same, replacing card styles) ... */
.content-container { position: relative; z-index: 1; }
.hero-section { text-align: center; margin-bottom: 4rem; }
.pill { display: inline-block; padding: 6px 16px; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 20px; font-size: 0.9rem; color: var(--primary-glow); margin-bottom: 1rem; }
.title { font-size: 4rem; font-weight: 700; background: linear-gradient(135deg, #fff, #a5f3fc); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 1rem; text-shadow: 0 0 30px rgba(0, 212, 255, 0.3); }
.subtitle { color: var(--text-secondary); font-size: 1.2rem; max-width: 600px; margin: 0 auto; }
/* Standard Grid Styles */
.syllabus-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }

@media (max-width: 768px) {
  .electrostatics-page {
    padding-top: 2rem;
  }
  
  .title {
    font-size: 2.5rem;
  }
  
  .pill {
    margin-bottom: 0.5rem;
  }
  
  .syllabus-grid {
    grid-template-columns: 1fr; /* Single column on mobile */
    gap: 1.5rem;
    padding: 0 1rem;
  }
}
</style>
