<template>
  <header class="hero container">
    <div class="hero-content">
      <div class="pill">🚀 Physics for Top Rankers</div>
      <h1 class="hero-title">
        Decode the <br />
        <span class="text-gradient">Universe</span>
      </h1>
      <p class="hero-subtitle">
        Visualise concepts, master properties, and ace your JEE & NEET exams with our premium interactive learning platform.
      </p>
      <div class="hero-actions">
        <button class="btn-primary">Start Learning Free</button>
        <button class="btn-outline">Watch Demo</button>
      </div>
      
      <div class="stats-row">
        <div class="stat">
            <span class="num">150+</span>
            <span class="label">Chapters</span>
        </div>
         <div class="stat">
            <span class="num">10k+</span>
            <span class="label">Questions</span>
        </div>
      </div>
    </div>
    
    <div class="hero-visual">
       <div class="atom-container">
         <div class="core"></div>
         <div class="orbit orbit-1"><div class="electron"></div></div>
         <div class="orbit orbit-2"><div class="electron"></div></div>
         <div class="orbit orbit-3"><div class="electron"></div></div>
       </div>
       <div class="glow-backdrop"></div>
    </div>
  </header>
</template>

<style scoped>
.hero {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  align-items: center;
  min-height: 80vh;
  padding-top: 2rem;
}

.hero-content {
  z-index: 2;
}

.pill {
  display: inline-block;
  padding: 8px 16px;
  background: rgba(0, 212, 255, 0.1);
  color: var(--primary-glow);
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(0, 212, 255, 0.2);
}

.hero-title {
  font-size: 4rem;
  line-height: 1.1;
  font-weight: 700;
  margin-bottom: 1.5rem;
}

.hero-subtitle {
  font-size: 1.2rem;
  color: var(--text-secondary);
  max-width: 500px;
  margin-bottom: 2.5rem;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 3rem;
}

.btn-outline {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.2);
  padding: 12px 32px;
  border-radius: 30px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: 0.3s;
  font-family: var(--font-main);
}

.btn-outline:hover {
  border-color: #fff;
  background: rgba(255,255,255,0.05);
}

.stats-row {
    display: flex;
    gap: 3rem;
    border-top: 1px solid rgba(255,255,255,0.1);
    padding-top: 1.5rem;
}

.stat {
    display: flex;
    flex-direction: column;
}

.stat .num {
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
}

.stat .label {
    font-size: 0.9rem;
    color: var(--text-secondary);
}

/* Atom Animation */
.hero-visual {
  position: relative;
  height: 500px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.atom-container {
  position: relative;
  width: 300px;
  height: 300px;
  transform-style: preserve-3d;
  perspective: 1000px;
}

.core {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  background: radial-gradient(circle at 30% 30%, #fff, var(--primary-glow));
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 30px var(--primary-glow);
  z-index: 10;
}

.orbit {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 300px;
  height: 300px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.orbit-1 { transform: translate(-50%, -50%) rotateX(70deg) rotateY(10deg); animation: rotate 4s linear infinite; }
.orbit-2 { transform: translate(-50%, -50%) rotateX(70deg) rotateY(70deg); animation: rotate 5s linear infinite reverse; }
.orbit-3 { transform: translate(-50%, -50%) rotateX(70deg) rotateY(130deg); animation: rotate 6s linear infinite; }

.electron {
  position: absolute;
  top: 0;
  left: 50%;
  width: 12px;
  height: 12px;
  background: var(--accent-green);
  border-radius: 50%;
  transform: translate(-50%, -6px);
  box-shadow: 0 0 10px var(--accent-green);
}

@keyframes rotate {
  0% { transform: translate(-50%, -50%) rotateX(70deg) rotateY(var(--y-angle, 0deg)) rotateZ(0deg); }
  100% { transform: translate(-50%, -50%) rotateX(70deg) rotateY(var(--y-angle, 0deg)) rotateZ(360deg); }
}

/* Fix animation rotation context */
.orbit-1 { --y-angle: 10deg; }
.orbit-2 { --y-angle: 70deg; }
.orbit-3 { --y-angle: 130deg; }

/* Overwrite animation for simplicity in keyed frames */
@keyframes rotate {
    to { transform: translate(-50%, -50%) rotateX(70deg) rotateY(var(--y-angle)) rotateZ(360deg); }
}

.glow-backdrop {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(0, 212, 255, 0.15) 0%, transparent 70%);
    transform: translate(-50%, -50%);
    z-index: -1;
    pointer-events: none;
}

@media (max-width: 768px) {
    .hero {
        grid-template-columns: 1fr;
        text-align: center;
        padding-top: 1rem;
    }
    .hero-actions, .stats-row {
        justify-content: center;
    }
    .hero-title {
        font-size: 2.5rem;
    }
    .hero-visual {
        height: 300px;
    }
    .atom-container {
        transform: scale(0.7);
    }
}
</style>
