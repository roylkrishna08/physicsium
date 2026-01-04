<script setup>
import HeroSection from '../../components/home/HeroSection.vue'
import UniverseBg from '../../components/backgrounds/UniverseBg.vue'

const props = defineProps({
  activeExam: {
    type: String,
    required: true
  }
})
</script>

<template>
  <div class="home-view">
    <UniverseBg />
    <HeroSection />
    
    <main class="container">
      <section class="features-section">
          <div class="scroll-reveal">
            <h2 class="section-title">Your Ambition. Our Fuel.</h2>
            <p class="section-desc">It's not just about the syllabus. It's about who you become at the finish line.</p>
          </div>
          
          <div class="holo-grid">
              <div class="holo-card" style="--delay: 0s">
                  <div class="card-content">
                      <div class="icon-ring">💡</div>
                      <h3>Understand, Don't Memorize</h3>
                      <p>Physics is beautiful when it clicks. We turn confusion into clarity, so you never have to blindly memorize a formula again.</p>
                  </div>
                  <div class="card-glitch"></div>
              </div>

              <div class="holo-card" style="--delay: 0.2s">
                  <div class="card-content">
                      <div class="icon-ring">🔥</div>
                      <h3>Kill the Fear</h3>
                      <p>Anxiety comes from the unknown. We cover everything so thoroughly that by exam day, you'll have nothing left to fear.</p>
                  </div>
                   <div class="card-glitch"></div>
              </div>

              <div class="holo-card" style="--delay: 0.4s">
                  <div class="card-content">
                      <div class="icon-ring">🎓</div>
                      <h3>Claim Your Rank</h3>
                      <p>Your dream college is waiting. We provide the map, the tools, and the belief. All you need to do is walk the path.</p>
                  </div>
                   <div class="card-glitch"></div>
              </div>
          </div>
      </section>
      
      <section id="banner" class="glass-card banner floating">
         <div class="banner-content">
             <h2>Ready to decode the universe?</h2>
             <p>Start your journey with the complete {{ activeExam }} syllabus breakdown.</p>
         </div>
         <router-link to="/syllabus" class="btn-primary">View Syllabus</router-link>
      </section>
    </main>
  </div>
</template>

<style scoped>
.features-section {
    padding: 4rem 0;
    position: relative;
    perspective: 1000px;
}

.section-title {
    font-size: 3rem;
    text-align: center;
    margin-bottom: 0.5rem;
    background: linear-gradient(to right, #fff, var(--primary-glow));
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

.section-desc {
    text-align: center;
    color: var(--text-secondary);
    margin-bottom: 4rem;
    font-size: 1.1rem;
}

/* Holographic Grid */
.holo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 3rem;
    padding: 1rem;
}

.holo-card {
    position: relative;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 20px;
    padding: 2.5rem;
    overflow: hidden;
    transition: 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    transform-style: preserve-3d;
    animation: float 6s ease-in-out infinite;
    animation-delay: var(--delay);
}

.holo-card:hover {
    transform: translateY(-10px) rotateX(5deg);
    background: rgba(255, 255, 255, 0.05);
    border-color: var(--primary-glow);
    box-shadow: 0 0 30px rgba(0, 212, 255, 0.15);
}

.icon-ring {
    width: 60px;
    height: 60px;
    background: radial-gradient(circle, rgba(0,212,255,0.2), transparent);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    margin-bottom: 1.5rem;
    border: 1px solid rgba(0,212,255,0.3);
    box-shadow: 0 0 15px rgba(0,212,255,0.2);
}

.holo-card h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: #fff;
}

.holo-card p {
    color: var(--text-secondary);
    line-height: 1.6;
}

/* Glitch/Scanline Effect */
.card-glitch {
    position: absolute;
    top: -100%;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
        transparent,
        rgba(0, 212, 255, 0.1),
        transparent
    );
    transition: 0.5s;
    pointer-events: none;
}

.holo-card:hover .card-glitch {
    animation: scan 1.5s linear infinite;
}

@keyframes scan {
    0% { top: -100%; }
    100% { top: 200%; }
}

@keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
}

/* Banner Floating */
.floating {
    animation: float 8s ease-in-out infinite reverse;
}

.banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 3rem 4rem;
    margin: 6rem 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.03), rgba(0,0,0,0.4));
    border: 1px solid rgba(255,255,255,0.1);
}

.btn-primary {
  text-decoration: none;
  display: inline-block;
}

@media (max-width: 768px) {
    .features-section {
        padding: 2rem 0;
    }
    
    .section-title {
        font-size: 2rem;
    }
    
    .section-desc {
        font-size: 1rem;
        margin-bottom: 2rem;
    }
    
    .holo-grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
    }
    
    .holo-card {
        padding: 1.5rem;
    }
    
    .banner {
        flex-direction: column;
        text-align: center;
        gap: 2rem;
        padding: 2rem;
        margin: 3rem 0;
    }
}
</style>
