<template>
  <div class="pyq-view">
    <div class="background-grid"></div>
    <div class="container">
      <div class="header">
        <h1>Previous Year Questions</h1>
        <p>Access the most comprehensive collection of past papers for engineering and medical entrance exams.</p>
      </div>
      
      <div class="cards-grid">
        <div 
            class="exam-card jee-mains" 
            @click="navigateTo('jee-mains')"
        >
          <div class="card-content">
            <div class="icon-wrapper">
              <span class="icon">📝</span>
            </div>
            <div class="text-content">
                <h2>JEE Mains</h2>
                <p>Chapter-wise previous year questions with detailed solutions for mastery.</p>
            </div>
            <div class="action-row">
                <span class="explore-link">Explore Papers <span class="arrow">→</span></span>
            </div>
          </div>
        </div>

        <div class="exam-card jee-adv disabled">
            <div class="badge">Coming Soon</div>
            <div class="card-content">
                <div class="icon-wrapper">
                <span class="icon">🚀</span>
                </div>
                <div class="text-content">
                    <h2>JEE Advanced</h2>
                    <p>Challenging problems from past decades to test your conceptual depth.</p>
                </div>
                <div class="action-row">
                    <span class="explore-link disabled">Coming Soon</span>
                </div>
            </div>
        </div>

        <div class="exam-card neet disabled">
            <div class="badge">Coming Soon</div>
            <div class="card-content">
                <div class="icon-wrapper">
                <span class="icon">⚕️</span>
                </div>
                <div class="text-content">
                    <h2>NEET</h2>
                    <p>extensive papers for medical aspirants covering all key topics.</p>
                </div>
                <div class="action-row">
                    <span class="explore-link disabled">Coming Soon</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const navigateTo = (exam) => {
  if (exam === 'jee-mains') {
    router.push('/pyq/jee-mains')
  }
}
</script>

<style scoped>
.pyq-view {
  padding-top: 1rem;
  padding-bottom: 6rem;
  min-height: 100vh;
  position: relative;
  /* Removed overflow: hidden to prevent double scrollbar if body handles it, 
     or setting it to hidden if content fits, but usually auto is best unless using custom scroll */
}

/* Subtle Grid Background */
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
    mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
    pointer-events: none;
}

.container {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 5rem;
  animation: fadeIn 0.8s ease-out;
}

.header h1 {
  font-size: 3rem;
  margin-bottom: 1.5rem;
  color: #fff;
  font-weight: 700;
  letter-spacing: -1px;
}

.header p {
  color: var(--text-secondary);
  font-size: 1.2rem;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 2rem;
  padding: 0 1rem;
}

.exam-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08); /* Crisp border */
  border-radius: 12px; /* Less rounded */
  padding: 2rem;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.exam-card:not(.disabled):hover {
  background: rgba(255, 255, 255, 0.04);
  transform: translateY(-4px);
  /* Colored borders on hover */
}

.jee-mains:not(.disabled):hover { border-color: #4285f4; box-shadow: 0 0 20px rgba(66, 133, 244, 0.15); }

.card-content {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  transition: 0.3s;
}

.jee-mains:not(.disabled):hover .icon-wrapper { background: rgba(66, 133, 244, 0.2); }

.text-content h2 {
  font-size: 1.5rem;
  margin-bottom: 0.8rem;
  color: var(--text-primary);
  font-weight: 600;
}

.text-content p {
  color: var(--text-secondary);
  line-height: 1.6;
  font-size: 1rem;
  margin-bottom: 2rem;
  flex-grow: 1;
}

.action-row {
    margin-top: auto;
}

.explore-link {
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: 0.3s;
}

.jee-mains:not(.disabled) .explore-link { color: #4285f4; }

.arrow {
    transition:transform 0.3s;
}

.exam-card:hover .arrow {
    transform: translateX(5px);
}

.exam-card.disabled {
    opacity: 0.6;
    cursor: default;
    border-style: dashed;
}

.badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-size: 0.75rem;
  color: var(--text-secondary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
