<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useAdminStore } from '../stores/admin';
import { useAuthStore } from '../stores/auth';
import { Search, ShieldAlert, ShieldCheck, Mail, Calendar, Clock } from 'lucide-vue-next';

const adminStore = useAdminStore();
const authStore = useAuthStore();
const searchQuery = ref('');

onMounted(() => {
  adminStore.fetchUsers();
});

const filteredUsers = computed(() => {
  return adminStore.users.filter(user => 
    user.firstName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const handleToggleRestriction = async (id: string, currentStatus: boolean) => {
  if (confirm(`Are you sure you want to ${currentStatus ? 'unrestrict' : 'restrict'} this user?`)) {
    await adminStore.toggleUserRestriction(id, !currentStatus);
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};
</script>

<template>
  <div class="user-management animate-fade-in">
    <header class="header">
      <div class="title-section">
        <h1 class="text-gradient">User Management</h1>
        <p>Monitor activity and enforce restrictions</p>
      </div>

      <div class="search-container glass-card">
        <Search :size="20" class="search-icon" />
        <input v-model="searchQuery" type="text" placeholder="Search users by name, email, or username..." />
      </div>
    </header>

    <div class="users-table-container glass-card">
      <div v-if="adminStore.loading" class="loading">Fetching users...</div>
      <table v-else class="users-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Status</th>
            <th>Activity</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user._id">
            <td>
              <div class="user-cell">
                <div class="avatar">
                  {{ user.firstName[0] }}
                </div>
                <div class="info">
                  <p class="name">{{ user.firstName }} {{ user.lastName }}</p>
                  <p class="username">@{{ user.username }}</p>
                </div>
              </div>
            </td>
            <td>
              <span :class="['role-badge', user.role]">{{ user.role }}</span>
            </td>
            <td>
              <span :class="['status-badge', user.isRestricted ? 'restricted' : 'active']">
                {{ user.isRestricted ? 'Restricted' : 'Active' }}
              </span>
            </td>
            <td>
              <div class="activity-cell">
                <div class="detail">
                  <Calendar :size="14" />
                  <span>Last: {{ formatDate(user.lastLogin) }}</span>
                </div>
                <div class="detail">
                  <Clock :size="14" />
                  <span>Logins: {{ user.loginCount || 0 }}</span>
                </div>
              </div>
            </td>
            <td>
              <button 
                v-if="authStore.isOwner || (authStore.isAdmin && user.role === 'user')"
                @click="handleToggleRestriction(user._id, user.isRestricted)"
                :class="['action-btn', user.isRestricted ? 'btn-success' : 'btn-danger']"
              >
                <component :is="user.isRestricted ? ShieldCheck : ShieldAlert" :size="16" />
                {{ user.isRestricted ? 'Unrestrict' : 'Restrict' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.user-management {
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2rem;
  gap: 2rem;
}

.title-section h1 {
  font-size: 2rem;
}

.search-container {
  display: flex;
  align-items: center;
  padding: 0 1rem;
  flex: 1;
  max-width: 400px;
  border-radius: 12px;
}

.search-icon {
  color: var(--text-secondary);
}

.search-container input {
  background: transparent;
  border: none;
  box-shadow: none;
}

.users-table-container {
  overflow-x: auto;
  border-radius: 16px;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

th, td {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

th {
  font-size: 0.85rem;
  text-transform: uppercase;
  color: var(--text-secondary);
  font-weight: 600;
  letter-spacing: 0.5px;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar {
  width: 36px;
  height: 36px;
  background: var(--primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.name {
  font-weight: 600;
  display: block;
}

.username {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.role-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.role-badge.owner { background: rgba(255, 170, 0, 0.2); color: #ffaa00; }
.role-badge.manager { background: rgba(0, 212, 255, 0.2); color: #00d4ff; }
.role-badge.user { background: rgba(255, 255, 255, 0.1); color: #fff; }

.status-badge {
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-badge.active { background: rgba(0, 255, 163, 0.1); color: #00ffa3; }
.status-badge.restricted { background: rgba(255, 77, 77, 0.1); color: #ff4d4d; }

.activity-cell {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.detail {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: 0.2s;
}

.btn-success { background: rgba(0, 255, 163, 0.1); color: #00ffa3; border: 1px solid rgba(0, 255, 163, 0.2); }
.btn-success:hover { background: #00ffa3; color: #000; }

.btn-danger { background: rgba(255, 77, 77, 0.1); color: #ff4d4d; border: 1px solid rgba(255, 77, 77, 0.2); }
.btn-danger:hover { background: #ff4d4d; color: #fff; }

.loading {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: stretch;
  }
  .search-container {
    max-width: none;
  }
}
</style>
