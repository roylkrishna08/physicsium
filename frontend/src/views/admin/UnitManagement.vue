<script setup>
import { onMounted, ref, computed } from 'vue';
import { useAdminStore } from '../../stores/admin';
import { useAuthStore } from '../../stores/auth';
import { BookOpen, Eye, EyeOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-vue-next';

const adminStore = useAdminStore();
const authStore = useAuthStore();
const activeCategory = ref('all');

onMounted(async () => {
    await adminStore.fetchUnits();
});

const categories = ['all', 'mechanics', 'thermodynamics', 'electromagnetism', 'optics', 'modern-physics', 'other'];

const handleToggleVisibility = async (id) => {
  await adminStore.toggleUnit(id);
};

const handleSync = async () => {
    const allUnits = [
        { unitId: 'unit-1', unitNumber: 'UNIT 1', title: 'Units and Measurements', title_hi: 'मात्रक और मापन', category: 'other', hasSimulations: false },
        { unitId: 'unit-2', unitNumber: 'UNIT 2', title: 'Kinematics', title_hi: 'शुद्धगतिकी', category: 'mechanics', hasSimulations: true },
        { unitId: 'unit-3', unitNumber: 'UNIT 3', title: 'Laws of Motion', title_hi: 'गति के नियम', category: 'mechanics', hasSimulations: false },
        { unitId: 'unit-4', unitNumber: 'UNIT 4', title: 'Work, Energy and Power', title_hi: 'कार्य, ऊर्जा और शक्ति', category: 'mechanics', hasSimulations: false },
        { unitId: 'unit-5', unitNumber: 'UNIT 5', title: 'Rotational Motion', title_hi: 'घूर्णन गति', category: 'mechanics', hasSimulations: false },
        { unitId: 'unit-6', unitNumber: 'UNIT 6', title: 'Gravitation', title_hi: 'गुरुत्वाकर्षण', category: 'mechanics', hasSimulations: true },
        { unitId: 'unit-7', unitNumber: 'UNIT 7', title: 'Properties of Solids and Liquids', title_hi: 'ठोस और द्रवों के गुण', category: 'mechanics', hasSimulations: false },
        { unitId: 'unit-8', unitNumber: 'UNIT 8', title: 'Thermodynamics', title_hi: 'ऊष्मागतिकी', category: 'thermodynamics', hasSimulations: false },
        { unitId: 'unit-9', unitNumber: 'UNIT 9', title: 'Kinetic Theory of Gases', title_hi: 'गैसों का अणुगति सिद्धांत', category: 'thermodynamics', hasSimulations: false },
        { unitId: 'unit-10', unitNumber: 'UNIT 10', title: 'Oscillations and Waves', title_hi: 'दोलन और तरंगें', category: 'mechanics', hasSimulations: false },
        { unitId: 'unit-11', unitNumber: 'UNIT 11', title: 'Electrostatics', title_hi: 'स्थिरवैद्युतिकी', category: 'electromagnetism', hasSimulations: true },
        { unitId: 'unit-12', unitNumber: 'UNIT 12', title: 'Current Electricity', title_hi: 'विद्युत धारा', category: 'electromagnetism', hasSimulations: false },
        { unitId: 'unit-13', unitNumber: 'UNIT 13', title: 'Magnetic Effects of Current', title_hi: 'धारा का चुंबकीय प्रभाव', category: 'electromagnetism', hasSimulations: false },
        { unitId: 'unit-14', unitNumber: 'UNIT 14', title: 'Electromagnetic Induction', title_hi: 'विद्युत चुंबकीय प्रेरण', category: 'electromagnetism', hasSimulations: false }
    ];
    
    if (confirm(`Sync ${allUnits.length} units? This will add new ones and update existing metadata.`)) {
        const success = await adminStore.syncUnits(allUnits);
        if (success) {
            alert('✅ Units synced successfully!');
        }
    }
};

const filteredUnits = computed(() => {
    let units = activeCategory.value === 'all' 
        ? adminStore.units 
        : adminStore.units.filter(u => u.category === activeCategory.value);
    
    // Sort by unit number (extract numeric part from "UNIT 1", "UNIT 2", etc.)
    return units.sort((a, b) => {
        const numA = parseInt(a.unitNumber.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.unitNumber.replace(/\D/g, '')) || 0;
        return numA - numB;
    });
});
</script>

<template>
  <div class="unit-management">
    <div class="header">
      <div class="title-section">
        <BookOpen :size="28" />
        <h1>Unit Management</h1>
      </div>
      
      <div class="controls">
        <button 
          v-if="authStore.isOwner" 
          class="btn btn-secondary sync-btn" 
          @click="() => handleSync()"
        >
          <RefreshCw :size="18" />
          Sync Units
        </button>
      </div>
    </div>
    
    <div class="category-tabs">
      <button
        v-for="cat in categories"
        :key="cat"
        :class="['tab', { active: activeCategory === cat }]"
        @click="activeCategory = cat"
      >
        {{ cat }}
      </button>
    </div>

    <div class="stats-bar">
      <span>Total: {{ adminStore.units.length }}</span>
      <span>Visible: {{ adminStore.units.filter(u => u.isVisible).length }}</span>
      <span>With Simulations: {{ adminStore.units.filter(u => u.hasSimulations).length }}</span>
    </div>

    <div class="units-grid">
      <div 
        v-for="unit in filteredUnits" 
        :key="unit._id"
        class="unit-card"
      >
        <div class="unit-header">
          <div class="unit-number">{{ unit.unitNumber }}</div>
          <button 
            :class="['toggle-btn', unit.isVisible ? 'visible' : 'hidden']"
            @click="handleToggleVisibility(unit._id)"
            :title="unit.isVisible ? 'Hide Unit' : 'Show Unit'"
          >
            <Eye v-if="unit.isVisible" :size="18" />
            <EyeOff v-else :size="18" />
          </button>
        </div>
        
        <h3>{{ unit.title }}</h3>
        <p class="title-hi">{{ unit.title_hi }}</p>
        
        <div class="unit-meta">
          <span class="category-badge">{{ unit.category }}</span>
          <span :class="['sim-badge', unit.hasSimulations ? 'has-sims' : 'no-sims']">
            <CheckCircle2 v-if="unit.hasSimulations" :size="14" />
            <AlertCircle v-else :size="14" />
            {{ unit.hasSimulations ? 'Has Simulations' : 'No Simulations' }}
          </span>
        </div>
        
        <div class="status-footer">
          <span :class="['status', unit.isVisible ? 'visible' : 'hidden']">
            {{ unit.isVisible ? 'Visible on Site' : 'Hidden from Site' }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="filteredUnits.length === 0" class="empty-state">
      <AlertCircle :size="48" />
      <p>No units found in this category</p>
      <button v-if="authStore.isOwner" class="btn btn-primary" @click="handleSync">
        Sync Units
      </button>
    </div>
  </div>
</template>

<style scoped>
.unit-management {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.title-section h1 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}

.controls {
  display: flex;
  gap: 1rem;
}

.sync-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.category-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.tab {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  text-transform: capitalize;
  transition: all 0.2s;
}

.tab:hover {
  background: rgba(255, 255, 255, 0.1);
}

.tab.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.stats-bar {
  display: flex;
  gap: 2rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  margin-bottom: 2rem;
  font-size: 0.95rem;
}

.stats-bar span {
  color: var(--text-secondary);
}

.units-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.unit-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s;
}

.unit-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.unit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.unit-number {
  font-size: 0.85rem;
  color: var(--primary);
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 6px;
}

.unit-card h3 {
  margin: 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.title-hi {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.unit-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin: 1rem 0;
}

.category-badge {
  padding: 0.25rem 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  font-size: 0.8rem;
  text-transform: capitalize;
}

.sim-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
}

.sim-badge.has-sims {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.sim-badge.no-sims {
  background: rgba(251, 191, 36, 0.1);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.toggle-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.toggle-btn.visible {
  color: #22c55e;
}

.toggle-btn.hidden {
  color: #ef4444;
}

.status-footer {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.status {
  font-size: 0.85rem;
  font-weight: 500;
}

.status.visible {
  color: #22c55e;
}

.status.hidden {
  color: #ef4444;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-secondary);
}

.empty-state svg {
  margin-bottom: 1rem;
  opacity: 0.5;
}

@media (max-width: 768px) {
  .unit-management {
    padding: 1rem;
  }
  
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .units-grid {
    grid-template-columns: 1fr;
  }
}
</style>
