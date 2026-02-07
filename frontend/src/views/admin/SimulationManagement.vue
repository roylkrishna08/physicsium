<script setup>
import { onMounted, ref, computed } from 'vue';
import { useAdminStore } from '../../stores/admin';
import { useAuthStore } from '../../stores/auth';
import { Eye, EyeOff, RefreshCw, CircleAlert } from 'lucide-vue-next';

const adminStore = useAdminStore();
const authStore = useAuthStore();
const activeCategory = ref('all');
const isAutoSyncing = ref(false);

onMounted(async () => {
    await adminStore.fetchSimulations();
    
    // Auto-discover simulations if configured
    if (adminStore.simulations.length > 0 && authStore.isAdmin) {
        console.log('Auto-discovering new simulations...');
        await adminStore.autoDiscoverSimulations();
        await adminStore.fetchSimulations();
    }
});

const categories = ['all', 'kinematics', 'electrostatics', 'gravitation', 'experimental'];

const filteredSimulations = computed(() => {
  if (activeCategory.value === 'all') return adminStore.simulations;
  return adminStore.simulations.filter(sim => sim.category === activeCategory.value);
});

const handleToggleVisibility = async (id) => {
  await adminStore.toggleSimulation(id);
};

const handleSync = async (silent = false) => {
    const allSimulations = [
        // Experimental Skills
        { simulationId: 'freelab', name: 'Free Lab (Multipurpose)', category: 'experimental' },
        { simulationId: 'vernier-calipers', name: 'Vernier Calipers', category: 'experimental' },
        { simulationId: 'screw-gauge', name: 'Screw Gauge', category: 'experimental' },
        { simulationId: 'simple-pendulum', name: 'Simple Pendulum', category: 'experimental' },
        { simulationId: 'ohms-law', name: "Ohm's Law", category: 'experimental' },
        { simulationId: 'meter-bridge', name: 'Meter Bridge', category: 'experimental' },
        { simulationId: 'sonometer', name: 'Sonometer', category: 'experimental' },
        { simulationId: 'focal-length-concave', name: 'Focal Length of Concave Mirror', category: 'experimental' },
        { simulationId: 'focal-length-convex', name: 'Focal Length of Convex Lens', category: 'experimental' },
        { simulationId: 'youngs-modulus', name: "Young's Modulus", category: 'experimental' },
        { simulationId: 'surface-tension', name: 'Surface Tension by Capillary Rise', category: 'experimental' },
        { simulationId: 'viscosity', name: 'Coefficient of Viscosity', category: 'experimental' },
        { simulationId: 'refractive-index', name: 'Refractive Index of Glass', category: 'experimental' },
        { simulationId: 'resistance-thermometer', name: 'Resistance of Thermometer', category: 'experimental' },
        { simulationId: 'potentiometer-emf', name: 'Potentiometer - EMF of Cell', category: 'experimental' },
        { simulationId: 'resistivity', name: 'Resistivity of Material', category: 'experimental' },
        
        // Kinematics
        { simulationId: 'projectile-motion', name: 'Projectile Motion', category: 'kinematics' },
        { simulationId: 'relative-velocity', name: 'Relative Velocity', category: 'kinematics' },
        { simulationId: 'circular-motion', name: 'Uniform Circular Motion', category: 'kinematics' },
        
        // Electrostatics
        { simulationId: 'coulombs-law', name: "Coulomb's Law", category: 'electrostatics' },
        { simulationId: 'electric-field', name: 'Electric Field', category: 'electrostatics' },
        { simulationId: 'gauss-law', name: "Gauss's Law", category: 'electrostatics' },
        { simulationId: 'electric-potential', name: 'Electric Potential', category: 'electrostatics' },
        { simulationId: 'capacitors', name: 'Capacitors', category: 'electrostatics' },
        { simulationId: 'dipole', name: 'Electric Dipole', category: 'electrostatics' },
        
        // Gravitation
        { simulationId: 'keplers-laws', name: "Kepler's Laws", category: 'gravitation' },
        { simulationId: 'gravitational-field', name: 'Gravitational Field', category: 'gravitation' },
        { simulationId: 'satellite-motion', name: 'Satellite Motion', category: 'gravitation' },
        { simulationId: 'gravitational-potential', name: 'Gravitational Potential', category: 'gravitation' },
    ];
    
    if (silent || confirm(`Sync ${allSimulations.length} simulations? This will add new ones and update existing metadata.`)) {
        isAutoSyncing.value = true;
        const success = await adminStore.syncSimulations(allSimulations);
        isAutoSyncing.value = false;
        
        if (success && !silent) {
            alert('✅ Simulations synced successfully!');
        }
    }
};

const getCategoryColor = (cat) => {
    const colors = {
        kinematics: '#ff0055',
        electrostatics: '#00d4ff',
        gravitation: '#aa00ff',
        experimental: '#00ffa3',
        others: '#ffaa00'
    };
    return colors[cat] || '#888';
};
</script>

<template>
  <div class="simulation-management animate-fade-in">
    <header class="header">
      <div class="title-section">
        <h1 class="text-gradient">Simulation Control</h1>
        <p>Manage visibility and structure of laboratory content</p>
      </div>

      <div class="controls">
        <button 
          v-if="authStore.isOwner" 
          class="btn btn-secondary sync-btn" 
          @click="() => handleSync(false)"
        >
          <RefreshCw :size="18" />
          Sync Metadata
        </button>
      </div>
    </header>

    <div class="filter-bar glass-card">
      <button 
        v-for="cat in categories" 
        :key="cat" 
        @click="activeCategory = cat"
        :class="['filter-btn', { active: activeCategory === cat }]"
      >
        {{ cat }}
      </button>
    </div>

    <div v-if="adminStore.loading" class="loading">Loading simulations...</div>
    <div v-else-if="filteredSimulations.length === 0" class="empty-state glass-card">
      <CircleAlert :size="48" />
      <h3>No Simulations Found</h3>
      <p>Try syncing to populate the list or change your filters.</p>
    </div>
    
    <div v-else class="sims-grid">
      <div v-for="sim in filteredSimulations" :key="sim._id" class="sim-card glass-card">
        <div class="sim-header">
          <div class="sim-category" :style="{ background: `${getCategoryColor(sim.category)}20`, color: getCategoryColor(sim.category) }">
            {{ sim.category }}
          </div>
          <span :class="['status-dot', { active: sim.isVisible }]"></span>
        </div>
        
        <div class="sim-body">
          <h3 class="sim-name">{{ sim.name }}</h3>
          <p class="sim-id">ID: {{ sim.simulationId }}</p>
        </div>

        <div class="sim-footer">
          <div class="visibility-info">
            <component :is="sim.isVisible ? Eye : EyeOff" :size="16" />
            <span>{{ sim.isVisible ? 'Publicly Visible' : 'Hidden from Users' }}</span>
          </div>
          <button @click="handleToggleVisibility(sim._id)" :class="['toggle-btn', { 'is-visible': sim.isVisible }]">
            {{ sim.isVisible ? 'Hide' : 'Show' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.simulation-management {
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2rem;
}

.title-section h1 { font-size: 2rem; }

.sync-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-bar {
  display: flex;
  gap: 1rem;
  padding: 0.8rem;
  margin-bottom: 2rem;
  border-radius: 12px;
}

.filter-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  padding: 0.5rem 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  text-transform: capitalize;
  font-weight: 600;
  transition: 0.3s;
}

.filter-btn:hover {
  color: white;
  background: rgba(255, 255, 255, 0.05);
}

.filter-btn.active {
  background: var(--primary);
  color: black;
}

.sims-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.sim-card {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sim-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sim-category {
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-weight: 700;
  text-transform: uppercase;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff4d4d;
}

.status-dot.active {
  background: #00ffa3;
  box-shadow: 0 0 8px #00ffa3;
}

.sim-name {
  margin-bottom: 0.3rem;
  font-size: 1.1rem;
}

.sim-id {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.sim-footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.visibility-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.toggle-btn {
  padding: 0.4rem 1rem;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: rgba(255, 255, 255, 0.05);
  color: white;
  cursor: pointer;
  font-weight: 600;
  transition: 0.2s;
}

.toggle-btn.is-visible {
  color: #ff4d4d;
  border-color: rgba(255, 77, 77, 0.3);
}

.toggle-btn:hover {
  background: white;
  color: black;
}

.empty-state {
  text-align: center;
  padding: 5rem;
  color: var(--text-secondary);
}

.empty-state h3 {
  margin: 1rem 0;
  color: white;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}
</style>
