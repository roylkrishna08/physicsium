<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import {
  Home,
  Users,
  FlaskConical,
  BookOpen,
  LogOut,
  Menu
} from 'lucide-vue-next';
import { ref } from 'vue';

const router = useRouter();
const authStore = useAuthStore();
const isSidebarOpen = ref(true);

const navItems = [
  { name: 'Dashboard', icon: Home, path: '/admin' },
  { name: 'Users', icon: Users, path: '/admin/users' },
  { name: 'Simulations', icon: FlaskConical, path: '/admin/simulations' },
  { name: 'Units', icon: BookOpen, path: '/admin/units' },
];

const handleLogout = () => {
  authStore.logout();
  router.push('/adminlogin');
};
</script>

<template>
  <div class="dashboard-layout">
    <!-- Sidebar -->
    <aside :class="['sidebar', 'glass-card', { 'closed': !isSidebarOpen }]">
      <div class="logo">
        <h2 class="text-gradient" v-if="isSidebarOpen">Physicsium</h2>
        <span v-else>P</span>
      </div>

      <nav class="nav-links">
        <router-link 
          v-for="item in navItems" 
          :key="item.name" 
          :to="item.path"
          class="nav-item"
          active-class="active"
        >
          <component :is="item.icon" :size="20" />
          <span v-if="isSidebarOpen">{{ item.name }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <button @click="handleLogout" class="logout-btn">
          <LogOut :size="20" />
          <span v-if="isSidebarOpen">Log Out</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <header class="top-nav glass-card">
        <button @click="isSidebarOpen = !isSidebarOpen" class="toggle-btn">
          <Menu :size="24" />
        </button>
        
        <div class="user-info">
          <span>{{ authStore.user?.firstName }} {{ authStore.user?.lastName }}</span>
          <div class="role-badge">{{ authStore.user?.role }}</div>
        </div>
      </header>

      <div class="content-wrapper">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<style scoped>
.dashboard-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 280px;
  height: 100vh;
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  border-radius: 0;
  border-left: none;
  transition: width 0.3s ease;
  z-index: 100;
}

.sidebar.closed {
  width: 80px;
}

.logo {
  padding: 2.5rem 1.5rem;
  text-align: center;
}

.logo h2 {
  font-size: 1.5rem;
}

.nav-links {
  flex: 1;
  padding: 1rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: 12px;
  margin-bottom: 0.5rem;
  transition: 0.3s;
}

.nav-item:hover, .nav-item.active {
  background: rgba(0, 212, 255, 0.1);
  color: var(--primary);
}

.nav-item.active {
  border-left: 3px solid var(--primary);
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid var(--border-color);
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: transparent;
  border: none;
  color: #ff4d4d;
  cursor: pointer;
  border-radius: 12px;
  transition: 0.3s;
}

.logout-btn:hover {
  background: rgba(255, 77, 77, 0.1);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: transparent;
}

.top-nav {
  height: 70px;
  margin: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  border-radius: 12px;
}

.toggle-btn {
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.role-badge {
  background: rgba(0, 212, 255, 0.2);
  color: var(--primary);
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 700;
}

.content-wrapper {
  padding: 1rem;
  flex: 1;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
