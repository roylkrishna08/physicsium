<template>
  <div class="mission-page container">
    <div class="content-wrapper">
        <header class="page-header">
            <h1 class="text-gradient">IIT JEE 2027</h1>
            <p class="subtitle">The Complete 15-Month Master Guide</p>
        </header>

        <!-- Exam Overview -->
        <section class="section glass-card">
            <h2>Exam Overview</h2>
            <div class="grid-2">
                <div class="info-block">
                    <h3>JEE MAIN</h3>
                    <p><strong>Purpose:</strong> Nit, IIIT, GFTI & Advanced Eligibility</p>
                    <p><strong>Pattern:</strong> 300 Marks (20 MCQs + 10 Num per subject)</p>
                    <p><strong>Focus:</strong> Speed, Accuracy, Syllabus Coverage</p>
                </div>
                <div class="info-block">
                    <h3>JEE ADVANCED</h3>
                    <p><strong>Purpose:</strong> Admission to 23 IITs</p>
                    <p><strong>Pattern:</strong> Variable (Two 3-hour papers)</p>
                    <p><strong>Focus:</strong> Conceptual Depth, Logic, Problem Solving</p>
                </div>
            </div>
        </section>

        <!-- Roadmap Phases -->
        <section class="section">
            <h2 class="section-title">Strategic Roadmap (Jan 2026 - May 2027)</h2>
            <div class="timeline">
                <div class="phase-card glass-panel" style="--accent: #00d4ff">
                    <div class="phase-header">
                        <span class="phase-tag">PHASE 1</span>
                        <h3>The Bridge</h3>
                        <span class="phase-date">Jan 2026 - Mar 2026</span>
                    </div>
                    <p><strong>Goal:</strong> Fix Class 11th Backlogs & Build Foundation</p>
                    <ul>
                        <li>NCERT & H.C. Verma for Mechanics</li>
                        <li>Master Basic Algebra & Chemical Bonding</li>
                        <li><strong>Daily:</strong> Solve 30 problems per subject</li>
                    </ul>
                </div>

                <div class="phase-card glass-panel" style="--accent: #00ffaa">
                    <div class="phase-header">
                        <span class="phase-tag">PHASE 2</span>
                        <h3>Vertical Rise</h3>
                        <span class="phase-date">Apr 2026 - Sept 2026</span>
                    </div>
                    <p><strong>Goal:</strong> Class 12th Syllabus Dominance</p>
                    <ul>
                        <li>Focus: Calculus (Math) & Electrodynamics (Phy)</li>
                        <li>Target: Finish 80% syllabus by Sept end</li>
                        <li>Complete L1 & L2 of standard modules</li>
                    </ul>
                </div>

                <div class="phase-card glass-panel" style="--accent: #ffaa00">
                    <div class="phase-header">
                        <span class="phase-tag">PHASE 3</span>
                        <h3>Consolidation</h3>
                        <span class="phase-date">Oct 2026 - Jan 2027</span>
                    </div>
                    <p><strong>Goal:</strong> Speed & Test Temperament</p>
                    <ul>
                        <li>Start PYQs (2020-2026)</li>
                        <li>Full-length Mock Tests every Sunday</li>
                        <li>Maintain 'Error Log' for every mistake</li>
                    </ul>
                </div>

                <div class="phase-card glass-panel" style="--accent: #ff0055">
                    <div class="phase-header">
                        <span class="phase-tag">PHASE 4</span>
                        <h3>The Peak</h3>
                        <span class="phase-date">Feb 2027 - May 2027</span>
                    </div>
                    <p><strong>Goal:</strong> Boards + Advanced Final Leap</p>
                    <ul>
                        <li>Bridge gap between Boards and Advanced</li>
                        <li>Focus on Multi-concept problems</li>
                        <li>Resources: I.E. Irodov & M.S. Chauhan</li>
                    </ul>
                </div>
            </div>
        </section>

        <!-- Subject Weightage -->
        <section class="section glass-card">
            <h2>High-Yield Topics</h2>
            <div class="subjects-grid">
                <div class="subject-col">
                    <h3 style="color: #00d4ff">Physics</h3>
                    <ul>
                        <li>Mechanics (30%)</li>
                        <li>Electrostatics (25%)</li>
                        <li>Modern Physics (20%)</li>
                        <li>Optics (25%)</li>
                    </ul>
                </div>
                <div class="subject-col">
                    <h3 style="color: #ff0055">Chemistry</h3>
                    <ul>
                        <li>Organic: GOC & Mechanisms (35%)</li>
                        <li>Inorganic: NCERT & Bonding (30%)</li>
                        <li>Physical: Thermo & Mole (35%)</li>
                    </ul>
                </div>
                <div class="subject-col">
                    <h3 style="color: #ffaa00">Maths</h3>
                    <ul>
                        <li>Calculus (30%)</li>
                        <li>Algebra (25%)</li>
                        <li>Coordinate Geometry (20%)</li>
                        <li>Vectors & 3D (15%)</li>
                    </ul>
                </div>
            </div>
        </section>
        
        <div class="action-area">
            <router-link to="/" class="btn-primary">Back to Home</router-link>
        </div>
    </div>
  </div>
</template>

<style scoped>
.mission-page {
    padding-top: 2rem;
    padding-bottom: 4rem;
    color: white;
}

.content-wrapper {
    max-width: 900px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 3rem;
}

.page-header {
    text-align: center;
}

.page-header h1 {
    font-size: 3rem;
    margin-bottom: 0.5rem;
}

.subtitle {
    font-size: 1.2rem;
    color: var(--text-secondary);
}

.section h2 {
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    padding-bottom: 0.5rem;
}

.section.glass-card {
    padding: 2rem;
}

/* Grid Layouts */
.grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
}

.subjects-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 2rem;
}

.info-block h3, .subject-col h3 {
    font-size: 1.2rem;
    margin-bottom: 0.8rem;
    font-weight: 700;
}

.info-block p, .subject-col li, .phase-card li {
    color: var(--text-secondary);
    font-size: 0.95rem;
    line-height: 1.6;
    margin-bottom: 0.4rem;
}

ul {
    padding-left: 1.2rem;
}

/* Timeline/Phases */
.timeline {
    display: grid;
    gap: 1.5rem;
}

.phase-card {
    padding: 1.5rem;
    border-left: 4px solid var(--accent);
    background: linear-gradient(90deg, rgba(255,255,255,0.03) 0%, transparent 100%);
}

.phase-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.phase-tag {
    background: var(--accent);
    color: black;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: bold;
}

.phase-date {
    font-size: 0.9rem;
    color: white;
    opacity: 0.8;
}

.action-area {
    text-align: center;
    margin-top: 2rem;
}

@media (max-width: 768px) {
    .grid-2, .subjects-grid {
        grid-template-columns: 1fr;
    }
    
    .page-header h1 {
        font-size: 2.2rem;
    }
    
    .phase-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }
}
</style>
