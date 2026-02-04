<script setup>
import { useRouter } from 'vue-router';
import UniverseBg from '../../components/backgrounds/UniverseBg.vue';

const router = useRouter();

const navigateTo = (path) => {
    router.push(path);
};

const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    card.style.setProperty('--x', `${x}px`);
    card.style.setProperty('--y', `${y}px`);

    // Dynamic Tilt and Lift
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Tilt (smaller degrees for smoother feel)
    const rotateX = ((y - centerY) / centerY) * -12; 
    const rotateY = ((x - centerX) / centerX) * 12;

    // Lift based on cursor distance from center (optional subtle effect)
    card.style.setProperty('--rotateX', `${rotateX}deg`);
    card.style.setProperty('--rotateY', `${rotateY}deg`);
    card.style.setProperty('--translateY', `-15px`);
    card.style.setProperty('--opacity', `1`);
};

const handleMouseLeave = (e) => {
    const card = e.currentTarget;
    card.style.setProperty('--rotateX', `0deg`);
    card.style.setProperty('--rotateY', `0deg`);
    card.style.setProperty('--translateY', `0px`);
};
</script>

<template>
    <div class="auth-selection-container">
        <UniverseBg />
        
        <div class="content-wrapper">
            <div class="header-section">
                <h1 class="title">Choose Your Path</h1>
                <p class="subtitle">Enter the realm of infinite possibilities</p>
            </div>

            <div class="cards-grid">
                <!-- Sign Up Card -->
                <div class="auth-card signup-card" @click="navigateTo('/signup')" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave">
                    <div class="card-glow"></div>
                    <div class="card-inner">
                        <div class="icon-box">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="floating-icon">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                            </svg>
                        </div>
                        <h3>New Explorer</h3>
                        <p>Create an account to start your personalized physics journey from scratch.</p>
                        <div class="action-hint">Begin Discovery →</div>
                    </div>
                </div>

                <!-- Login Card -->
                <div class="auth-card login-card" @click="navigateTo('/login-form')" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave">
                    <div class="card-glow"></div>
                    <div class="card-inner">
                        <div class="icon-box">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="floating-icon">
                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                                <polyline points="10 17 15 12 10 7"></polyline>
                                <line x1="15" y1="12" x2="3" y2="12"></line>
                            </svg>
                        </div>
                        <h3>Returning Physicist</h3>
                        <p>Welcome back! Pick up exactly where you left off in your simulations and labs.</p>
                        <div class="action-hint">Resume Journey →</div>
                    </div>
                </div>
            </div>

            <div class="footer-links">
                <router-link to="/" class="back-link">← Back to World Map</router-link>
            </div>
        </div>
    </div>
</template>

<style scoped>
.auth-selection-container {
    min-height: 100vh;
    max-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    padding: 1.5rem 1rem;
    overflow: hidden;
    color: #fff;
}

.content-wrapper {
    position: relative;
    z-index: 10;
    max-width: 1000px;
    width: 100%;
    text-align: center;
}

.header-section {
    margin-bottom: 2.5rem;
}

.title {
    font-size: 3rem;
    font-weight: 900;
    letter-spacing: -2px;
    background: linear-gradient(135deg, #fff 0%, #818cf8 50%, #22d3ee 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0.5rem;
    filter: drop-shadow(0 0 30px rgba(129, 140, 248, 0.3));
}

.subtitle {
    font-size: 1.1rem;
    color: #94a3b8;
    font-weight: 500;
    letter-spacing: 0.5px;
}

.cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 2rem;
}

.auth-card {
    position: relative;
    cursor: pointer;
    perspective: 1000px;
    --rotateX: 0deg;
    --rotateY: 0deg;
    --translateY: 0px;
    opacity: 0;
    transform: translateY(30px);
    animation: slideUpFade 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

.signup-card { animation-delay: 0.2s; }
.login-card { animation-delay: 0.4s; }

@keyframes slideUpFade {
    to { opacity: 1; transform: translateY(0); }
}

.card-inner {
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(25px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 32px;
    padding: 2.5rem 2rem;
    height: 100%;
    transition: transform 0.15s ease-out, border-color 0.4s, box-shadow 0.4s, background 0.4s;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    z-index: 2;
    transform: translateY(var(--translateY)) rotateX(var(--rotateX)) rotateY(var(--rotateY));
}

.card-glow {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 32px;
    background: radial-gradient(circle at var(--x, 50%) var(--y, 50%), rgba(99, 102, 241, 0.25) 0%, transparent 60%);
    opacity: 0;
    transition: opacity 0.3s;
    z-index: 1;
}

.signup-card .card-glow {
    background: radial-gradient(circle at var(--x, 50%) var(--y, 50%), rgba(129, 140, 248, 0.45) 0%, transparent 65%);
}

.login-card .card-glow {
    background: radial-gradient(circle at var(--x, 50%) var(--y, 50%), rgba(34, 211, 238, 0.45) 0%, transparent 65%);
}

.signup-card .card-inner:hover {
    border-color: rgba(129, 140, 248, 0.5);
    background: rgba(15, 23, 42, 0.6);
    box-shadow: 0 20px 50px -10px rgba(129, 140, 248, 0.25);
}

.login-card .card-inner:hover {
    border-color: rgba(34, 211, 238, 0.5);
    background: rgba(15, 23, 42, 0.6);
    box-shadow: 0 20px 50px -10px rgba(34, 211, 238, 0.25);
}

.auth-card:hover .card-glow {
    opacity: 1;
}

.icon-box {
    width: 90px;
    height: 90px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2.5rem;
    transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.02);
}

.signup-card .icon-box { color: #818cf8; }
.login-card .icon-box { color: #22d3ee; }

.auth-card:hover .icon-box {
    transform: scale(1.1) rotate(5deg);
}

.floating-icon {
    width: 40px;
    height: 40px;
    animation: float 3s ease-in-out infinite;
}

@keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
}

h3 {
    font-size: 1.75rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: #f1f5f9;
}

p {
    color: #94a3b8;
    line-height: 1.6;
    margin-bottom: 2rem;
    font-size: 1rem;
}

.action-hint {
    font-weight: 600;
    font-size: 1rem;
    transition: transform 0.3s;
}

.signup-card .action-hint { color: #818cf8; }
.login-card .action-hint { color: #22d3ee; }

.auth-card:hover .action-hint {
    transform: translateX(5px);
}

.footer-links {
    margin-top: 2.5rem;
}

.back-link {
    color: #64748b;
    text-decoration: none;
    font-size: 0.95rem;
    transition: color 0.3s;
}

.back-link:hover {
    color: #94a3b8;
}

@media (max-width: 768px) {
    .title {
        font-size: 2.5rem;
    }
    .cards-grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
    }
    .auth-card {
        max-width: 400px;
        margin: 0 auto;
    }
}
</style>
