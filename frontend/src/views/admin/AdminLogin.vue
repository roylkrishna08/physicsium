<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { LogIn, Loader2 } from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();

const identifier = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

const handleLogin = async () => {
  if (!identifier.value || !password.value) return;
  
  loading.value = true;
  error.value = '';
  
  try {
    await authStore.login({ identifier: identifier.value, password: password.value });
    
    // Check if user has admin role
    if (!authStore.isAdmin) {
      error.value = 'Access denied. Admin privileges required.';
      authStore.logout();
      return;
    }
    
    router.push('/admin');
  } catch (err) {
    error.value = err || 'Login failed';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="login-wrapper">
    <div class="login-card glass-card animate-fade-in">
      <div class="header">
        <h1 class="text-gradient">Physicsium Admin</h1>
        <p>Management Portal Access</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label>Email or Username</label>
          <input 
            v-model="identifier" 
            type="text" 
            placeholder="admin@physicsium.com" 
            required
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label>Password</label>
          <input 
            v-model="password" 
            type="password" 
            placeholder="••••••••" 
            required
            :disabled="loading"
          />
        </div>

        <div v-if="error" class="error-msg">
          {{ error }}
        </div>

        <button 
          type="submit" 
          class="btn btn-primary login-btn"
          :disabled="loading"
        >
          <template v-if="loading">
            <Loader2 class="spinner" :size="20" />
            Logging in...
          </template>
          <template v-else>
            <LogIn :size="20" />
            Sign In
          </template>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-wrapper {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top center, #1a1f35 0%, #0a0e1a 60%);
  background-attachment: fixed;
}

.login-card {
  width: 100%;
  max-width: 420px;
  padding: 3rem;
  text-align: center;
}

.header {
  margin-bottom: 2.5rem;
}

.header h1 {
  font-size: 2.2rem;
  margin-bottom: 0.5rem;
}

.header p {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.login-form {
  text-align: left;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
}

.login-btn {
  width: 100%;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
}

.error-msg {
  color: #ff4d4d;
  background: rgba(255, 77, 77, 0.1);
  padding: 0.8rem;
  border-radius: 8px;
  font-size: 0.85rem;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(255, 77, 77, 0.2);
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
