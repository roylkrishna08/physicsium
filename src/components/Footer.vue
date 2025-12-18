<template>
  <footer class="footer">
    <div class="container footer-content">
        <div class="brand">
            <h3>Physicsium</h3>
            <p>Empowering the next generation of scientists and engineers.</p>
        </div>
        <div class="links">
            <a href="#">About</a>
            <a href="#">Syllabus</a>
            <a href="#">Privacy</a>
            <a href="#">Contact</a>
        </div>
        <div class="copy">
            &copy; 2025 Physicsium. All rights reserved.
        </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
    background: var(--bg-surface);
    padding: 3rem 0;
    margin-top: 4rem;
    border-top: 1px solid rgba(255,255,255,0.05);
}

.footer-content {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 2rem;
}

.brand h3 {
    margin-bottom: 0.5rem;
    color: var(--text-primary);
}

.brand p {
    color: var(--text-secondary);
    font-size: 0.9rem;
}

.links {
    display: flex;
    gap: 1.5rem;
}

.links a {
    color: var(--text-secondary);
    text-decoration: none;
    transition: 0.3s;
}

.links a:hover {
    color: var(--primary-glow);
}

.copy {
    width: 100%;
    margin-top: 2rem;
    text-align: center;
    color: var(--text-secondary);
    font-size: 0.8rem;
    border-top: 1px solid rgba(255,255,255,0.05);
    padding-top: 1rem;
}
</style>
