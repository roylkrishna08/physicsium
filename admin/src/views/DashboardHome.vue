<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useAdminStore } from '../stores/admin';
import { Users, FlaskConical, Activity, ShieldCheck } from 'lucide-vue-next';

const adminStore = useAdminStore();

onMounted(() => {
  adminStore.fetchUsers();
  adminStore.fetchSimulations();
});

const stats = computed(() => [
  { name: 'Total Users', value: adminStore.users.length, icon: Users, color: '#00d4ff' },
  { name: 'Restricted Users', value: adminStore.users.filter(u => u.isRestricted).length, icon: Activity, color: '#ff4d4d' },
  { name: 'Active Simulations', value: adminStore.simulations.filter(s => s.isVisible).length, icon: FlaskConical, color: '#00ffa3' },
  { name: 'Total Managers', value: adminStore.users.filter(u => u.role === 'manager').length, icon: ShieldCheck, color: '#ffaa00' },
]);
</script>

<template>
  <div class="dashboard-home animate-fade-in">
    <header class="header">
      <h1 class="text-gradient">Operational Overview</h1>
      <p>System status and key metrics</p>
    </header>

    <div class="stats-grid">
      <div v-for="stat in stats" :key="stat.name" class="stat-card glass-card">
        <div class="stat-icon" :style="{ color: stat.color, background: `${stat.color}15` }">
          <component :is="stat.icon" :size="24" />
        </div>
        <div class="stat-info">
          <span class="stat-name">{{ stat.name }}</span>
          <h2 class="stat-value">{{ stat.value }}</h2>
        </div>
      </div>
    </div>

    <div class="recent-activity glass-card">
      <div class="card-header">
        <h3>Recent User Logins</h3>
      </div>
      <div class="activity-list">
        <div v-if="adminStore.loading" class="loading">Loading activity...</div>
        <div v-else v-for="user in adminStore.users.filter(u => u.lastLogin).slice(0, 5).sort((a, b) => new Date(b.lastLogin!).getTime() - new Date(a.lastLogin!).getTime())" :key="user._id" class="activity-item">
          <div class="user-avatar">
            {{ user.firstName[0] }}{{ user.lastName ? user.lastName[0] : '' }}
          </div>
          <div class="activity-info">
            <p class="activity-text"><strong>{{ user.firstName }} {{ user.lastName }}</strong> logged in</p>
            <span class="activity-time">{{ new Date(user.lastLogin!).toLocaleString() }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-home {
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-name {
  color: var(--text-secondary);
  font-size: 0.85rem;
  display: block;
}

.stat-value {
  font-size: 1.8rem;
}

.recent-activity {
  padding: 1.5rem;
}

.card-header {
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1rem;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem;
  border-radius: 8px;
  transition: 0.2s;
}

.activity-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: var(--primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.8rem;
}

.activity-text {
  font-size: 0.95rem;
}

.activity-time {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.loading {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}
</style>
