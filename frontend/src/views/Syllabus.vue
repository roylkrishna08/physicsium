<script setup>
import { computed } from 'vue'
import { jeeSyllabus } from '../data/jee-syllabus.js'
import { neetSyllabus } from '../data/neet-syllabus.js'
import { useSearch } from '../composables/useSearch.js' // Import useSearch

const { searchQuery } = useSearch()

const props = defineProps({
  activeExam: {
    type: String,
    required: true
  }
})

const currentSyllabus = computed(() => {
  return props.activeExam === 'NEET' ? neetSyllabus : jeeSyllabus
})

const filteredSyllabus = computed(() => {
    if (!searchQuery.value) return currentSyllabus.value
    const query = searchQuery.value.toLowerCase()
    return currentSyllabus.value.filter(unit => 
        unit.title.toLowerCase().includes(query) ||
        unit.unit.toLowerCase().includes(query) ||
        unit.content.toLowerCase().includes(query)
    )
})

const title = computed(() => {
  return props.activeExam === 'NEET' ? 'NEET 2025 Syllabus' : 'JEE Mains 2025 Syllabus'
})
</script>

<template>
  <div class="syllabus-page container">
    <header class="page-header">
      <h1 class="page-title text-gradient">{{ title }}</h1>
      <p class="page-desc">Official Physics Syllabus (Detailed)</p>
    </header>

    <div class="syllabus-content">
      <div class="units-list" v-if="filteredSyllabus.length > 0">
        <div v-for="(unit, index) in filteredSyllabus" :key="index" class="unit-card glass-card">
          <div class="unit-header">
            <span class="unit-number">{{ unit.unit }}</span>
            <h2 class="unit-title">{{ unit.title }}</h2>
          </div>
          <div class="unit-body">
            <p>{{ unit.content }}</p>
          </div>
        </div>
      </div>
      
      <div v-else class="no-results">
        <p>No units found matching "{{ searchQuery }}"</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.syllabus-page {
  padding-top: 2rem;
  padding-bottom: 4rem;
}

.page-header {
  text-align: center;
  margin-bottom: 4rem;
  animation: fadeInDown 0.8s ease-out;
}

.page-title {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.page-desc {
  color: var(--text-secondary);
  font-size: 1.2rem;
}

.units-list {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 900px;
  margin: 0 auto;
}

.unit-card {
  padding: 2rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.03);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  overflow: hidden;
  position: relative;
}

.unit-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.15);
}

.unit-header {
  display: flex;
  align-items: baseline;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 1rem;
}

.unit-number {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--primary-glow);
  text-transform: uppercase;
  letter-spacing: 1px;
  background: rgba(0, 212, 255, 0.1);
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  white-space: nowrap;
}

.unit-title {
  font-size: 1.6rem;
  color: #fff;
  margin: 0;
}

.unit-body p {
  white-space: pre-line;
  color: var(--text-secondary);
  line-height: 1.8;
  font-size: 1.05rem;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .page-header {
      margin-bottom: 2rem;
  }
  
  .page-title {
      font-size: 2rem;
  }
  
  .unit-card {
      padding: 1.5rem;
  }

  .unit-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
  
  .unit-title {
    font-size: 1.3rem;
  }
  
  .unit-body p {
      font-size: 0.95rem;
      line-height: 1.6;
  }
}

.no-results {
    text-align: center;
    padding: 3rem;
    color: var(--text-secondary);
    font-size: 1.1rem;
    background: rgba(255,255,255,0.05);
    border-radius: 12px;
    margin-top: 2rem;
}
</style>
