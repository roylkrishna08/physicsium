<script setup>
import { computed } from 'vue'

const props = defineProps({
  activeTopic: String
})

const theoryContent = {
  'flux': {
    title: "Electric Flux (Φ)",
    derivation: [
      "Electric flux is the measure of the 'flow' of electric field through a given surface.",
      "Mathematically: Φ = ∮ E · dA",
      "For a closed surface enclosing a charge q, Gauss's Law states: Φ = q / ε₀"
    ],
    diagramType: 'flux'
  },
  'wire': {
    title: "Infinite Line Charge",
    derivation: [
      "Consider an infinitely long wire with linear charge density λ.",
      "Choose a cylindrical Gaussian surface of radius r and length L.",
      "The flux through the curved surface is E(2πrL). Flux through ends is zero.",
      "By Gauss's Law: E(2πrL) = (λL) / ε₀",
      "Result: E = λ / (2πε₀r)"
    ],
    diagramType: 'wire'
  },
  'sheet': {
    title: "Infinite Plane Sheet",
    derivation: [
      "Consider an infinite plane sheet with surface charge density σ.",
      "Choose a pillbox Gaussian surface area A cutting through the sheet.",
      "Flux through two ends: Φ = 2EA.",
      "By Gauss's Law: 2EA = (σA) / ε₀",
      "Result: E = σ / (2ε₀) (Independent of distance!)"
    ],
    diagramType: 'sheet'
  },
  'shell': {
    title: "Thin Spherical Shell",
    derivation: [
      "Case 1: Outside (r > R). Surface area A = 4πr².",
      "E(4πr²) = Q / ε₀ => E = Q / (4πε₀r²)",
      "Case 2: Inside (r < R). Enclosed charge is zero.",
      "E(4πr²) = 0 => E = 0"
    ],
    diagramType: 'shell'
  }
}

const activeContent = computed(() => theoryContent[props.activeTopic])
</script>

<template>
  <div class="theory-view">
    <div class="content-wrapper">
      <div class="text-section">
        <h2>{{ activeContent.title }}</h2>
        <div class="derivation-steps">
          <p v-for="(step, index) in activeContent.derivation" :key="index">
            {{ step }}
          </p>
        </div>
      </div>
      
      <div class="diagram-section">
        <div class="diagram-placeholder">
          <!-- SVG Diagram for the specific topic -->
          <svg viewBox="0 0 400 300" class="diagram-svg">
            <!-- Simplified 2D representations -->
            <g v-if="props.activeTopic === 'wire'">
              <line x1="200" y1="50" x2="200" y2="250" stroke="#ff0055" stroke-width="4" />
              <rect x="150" y="80" width="100" height="140" fill="rgba(0, 255, 157, 0.1)" stroke="#00ff9d" stroke-dasharray="5,5" />
              <text x="220" y="150" fill="white">E ⟶</text>
            </g>
            <g v-if="props.activeTopic === 'sheet'">
              <rect x="195" y="50" width="10" height="200" fill="#ff0055" />
              <rect x="100" y="120" width="200" height="60" fill="rgba(0, 255, 157, 0.1)" stroke="#00ff9d" stroke-dasharray="5,5" />
              <text x="310" y="150" fill="white">E ⟶</text>
              <text x="50" y="150" fill="white">⟵ E</text>
            </g>
            <g v-if="props.activeTopic === 'shell'">
              <circle cx="200" cy="150" r="60" fill="none" stroke="#ff0055" stroke-width="2" />
              <circle cx="200" cy="150" r="100" fill="none" stroke="#00ff9d" stroke-dasharray="5,5" />
              <text x="310" y="150" fill="white">r > R</text>
              <circle cx="200" cy="150" r="40" fill="none" stroke="#00ff9d" stroke-dasharray="5,5" />
              <text x="210" y="160" font-size="10" fill="white">r < R</text>
            </g>
            <g v-if="props.activeTopic === 'flux'">
              <circle cx="200" cy="150" r="5" fill="#ff0055" />
              <circle cx="200" cy="150" r="80" fill="none" stroke="#00ff9d" stroke-dasharray="5,5" />
              <line x1="200" y1="150" x2="300" y2="150" stroke="white" stroke-width="1" marker-end="url(#arrow)" />
              <line x1="200" y1="150" x2="100" y2="150" stroke="white" stroke-width="1" />
              <line x1="200" y1="150" x2="200" y2="50" stroke="white" stroke-width="1" />
              <line x1="200" y1="150" x2="200" y2="250" stroke="white" stroke-width="1" />
              <text x="210" y="140" fill="white">q</text>
            </g>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.theory-view {
  width: 100%;
  padding: 4rem 2rem;
  background: transparent;
}

.content-wrapper {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: start;
}

.text-section h2 {
  color: #00ff9d;
  font-size: 2.8rem;
  margin-bottom: 2rem;
  font-weight: 800;
  letter-spacing: -1px;
}

.derivation-steps p {
  line-height: 1.8;
  font-size: 1.15rem;
  color: #94a3b8;
  margin-bottom: 1.5rem;
  position: relative;
  padding-left: 1.5rem;
}

.derivation-steps p::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #00ff9d;
  font-weight: bold;
}

.diagram-section {
    position: sticky;
    top: 100px;
}

.diagram-placeholder {
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.05) 0%, transparent 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 2rem;
  aspect-ratio: 4/3;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 20px 50px rgba(0,0,0,0.3);
}

.diagram-svg {
  width: 100%;
  height: 100%;
}

@media (max-width: 992px) {
  .content-wrapper {
    grid-template-columns: 1fr;
    gap: 3rem;
  }
  
  .diagram-section {
      position: static;
  }
}
</style>
