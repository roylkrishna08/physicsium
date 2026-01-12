<template>
  <footer class="app-footer">
    <div class="container footer-content">
        <div class="brand">
            <h3>Physicsium</h3>
            <p>Empowering the next generation of scientists and engineers.</p>
        </div>
        <div class="links">
            <router-link to="/syllabus">Syllabus</router-link>
            <router-link to="/experiments">Experiments</router-link>
            <router-link to="/pyq">Previous Year Papers</router-link>
            <router-link to="/privacy-policy">Privacy Policy</router-link>
            <a href="#">Contact</a>
        </div>
        <div class="copy">
            &copy; 2026 Physicsium. All rights reserved.
        </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
    background: var(--bg-surface);
    padding: 2rem 0 1.5rem;
    margin-top: 2rem;
    border-top: 1px solid rgba(255,255,255,0.05);
}

.footer-content {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
}

.brand h3 {
    margin-bottom: 0.5rem;
    color: var(--text-primary);
    font-size: 1.4rem;
    font-weight: 700;
}

.brand p {
    color: var(--text-secondary);
    font-size: 0.9rem;
    max-width: 300px;
    line-height: 1.4;
}

.links {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
}

.links a {
    color: var(--text-secondary);
    text-decoration: none;
    transition: 0.3s;
    font-size: 0.9rem;
}

.links a:hover {
    color: var(--primary-glow);
}

.copy {
    width: 100%;
    margin-top: 1.5rem;
    text-align: center;
    color: var(--text-secondary);
    font-size: 0.8rem;
    border-top: 1px solid rgba(255,255,255,0.05);
    padding-top: 1.5rem;
}

@media (max-width: 768px) {
    .footer-content {
        flex-direction: column;
        text-align: center;
        gap: 2.5rem;
    }

    .brand p {
        margin: 0 auto;
    }

    .links {
        justify-content: center;
        gap: 1.5rem;
    }
}
</style>
