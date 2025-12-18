<script setup>
import NavBar from './components/NavBar.vue'
import HeroSection from './components/HeroSection.vue'
import TopicCard from './components/TopicCard.vue'
import Footer from './components/Footer.vue'

const topics = [
    { 
        title: 'Mechanics I', 
        desc: 'Kinematics, Newton\'s Laws, Work Power Energy, Circular Motion.', 
        icon: '⚙️', 
        tags: ['Class 11', 'High Weightage'], 
        color: '#00d4ff' 
    },
    { 
        title: 'Electromagnetism', 
        desc: 'Electrostatics, Current Electricity, Magnetism, EMI & AC.', 
        icon: '⚡', 
        tags: ['Class 12', 'Major Unit'], 
        color: '#ffd700' 
    },
    { 
        title: 'Optics', 
        desc: 'Ray Optics, Wave Optics, Optical Instruments & Human Eye.', 
        icon: '🔦', 
        tags: ['Class 12', 'Scoring'], 
        color: '#ff0055' 
    },
    { 
        title: 'Modern Physics', 
        desc: 'Dual Nature, Atoms, Nuclei, Semiconductors, Logic Gates.', 
        icon: '⚛️', 
        tags: ['Class 12', 'Easy Kill'], 
        color: '#00ff9d' 
    },
    { 
        title: 'Thermodynamics', 
        desc: 'KTG, Laws of Thermodynamics, Heat Transfer, Calorimetry.', 
        icon: '🔥', 
        tags: ['Class 11', 'Conceptual'], 
        color: '#ff7f50' 
    },
    { 
        title: 'SHM & Waves', 
        desc: 'Simple Harmonic Motion, String Waves, Sound Waves, Doppler.', 
        icon: '〰️', 
        tags: ['Class 11', 'Tricky'], 
        color: '#a020f0' 
    },
]
</script>

<template>
  <div class="app-layout">
    <NavBar />
    <HeroSection />
    
    <main class="container">
      <section id="topics" class="section">
          <div class="section-header">
            <h2 class="section-title">Curated Modules</h2>
            <p class="section-desc">Structured learning paths designed for maximum retention.</p>
          </div>
          
          <div class="grid">
              <TopicCard 
                  v-for="topic in topics" 
                  :key="topic.title"
                  v-bind="topic"
              />
          </div>
      </section>
      
      <section id="banner" class="glass-card banner">
         <div class="banner-content">
             <h2>Ready to Test Your Knowledge?</h2>
             <p>Take full-length mock tests based on latest JEE/NEET patterns.</p>
         </div>
         <button class="btn-primary">Take Mock Test</button>
      </section>
    </main>
  
    <Footer />
  </div>
</template>

<style scoped>
.section {
    padding: 5rem 0;
}

.section-header {
    text-align: center;
    margin-bottom: 3rem;
}

.section-title {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
}

.section-desc {
    color: var(--text-secondary);
}

.grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 2rem;
}

.banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 3rem 4rem;
    margin: 4rem 0;
    position: relative;
    overflow: hidden;
}

.banner::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 300px;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.05));
    pointer-events: none;
}

@media (max-width: 768px) {
    .banner {
        flex-direction: column;
        text-align: center;
        gap: 2rem;
        padding: 2rem;
    }
}
</style>
