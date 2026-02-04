<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import UniverseBg from '../../components/backgrounds/UniverseBg.vue';

const authStore = useAuthStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const error = ref('');
const loading = ref(false);

const handleLogin = async () => {
    loading.value = true;
    error.value = '';
    
    try {
        await authStore.login({
            email: email.value,
            password: password.value,
        });
        router.push('/');
    } catch (err) {
        error.value = err;
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="auth-page">
        <UniverseBg />
        
        <!-- Floating Orbs -->
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
        
        <div class="auth-container">
            <div class="auth-card">
                <!-- Animated Border -->
                <div class="card-border"></div>
                
                <!-- Header -->
                <div class="auth-header">
                    <div class="icon-badge">
                        <div class="icon-glow"></div>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                            <polyline points="10 17 15 12 10 7"></polyline>
                            <line x1="15" y1="12" x2="3" y2="12"></line>
                        </svg>
                    </div>
                    <h1>Welcome Back</h1>
                    <p>Continue your journey through the cosmos of knowledge</p>
                </div>

                <!-- Error Message -->
                <div v-if="error" class="error-banner">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>{{ error }}</span>
                </div>

                <!-- Form -->
                <form @submit.prevent="handleLogin" class="auth-form">
                    <div class="form-group">
                        <label for="email">Email Address</label>
                        <div class="input-wrapper">
                            <div class="input-glow"></div>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                            <input
                                id="email"
                                v-model="email"
                                type="email"
                                placeholder="your.email@example.com"
                                required
                                autocomplete="email"
                            />
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="password">Password</label>
                        <div class="input-wrapper">
                            <div class="input-glow"></div>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            <input
                                id="password"
                                v-model="password"
                                :type="showPassword ? 'text' : 'password'"
                                placeholder="Enter your password"
                                required
                                autocomplete="current-password"
                            />
                            <button
                                type="button"
                                class="toggle-password"
                                @click="showPassword = !showPassword"
                                tabindex="-1"
                            >
                                <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                                <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <button type="submit" class="submit-btn" :disabled="loading">
                        <div class="btn-glow"></div>
                        <span v-if="!loading">Sign In</span>
                        <span v-else class="loading-spinner">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10" opacity="0.25"></circle>
                                <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
                            </svg>
                            Signing in...
                        </span>
                    </button>
                </form>

                <!-- Footer Links -->
                <div class="auth-footer">
                    <router-link to="/signup" class="link-primary">
                        Don't have an account? <strong>Sign up</strong>
                    </router-link>
                    <router-link to="/login" class="link-secondary">
                        ← Back to Selection
                    </router-link>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.auth-page {
    min-height: 100vh;
    max-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    padding: 0.5rem;
}

/* Floating Orbs */
.orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.3;
    animation: float 20s ease-in-out infinite;
    pointer-events: none;
}

.orb-1 {
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(0, 212, 255, 0.4), transparent);
    top: -200px;
    right: -200px;
    animation-delay: 0s;
}

.orb-2 {
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(99, 102, 241, 0.4), transparent);
    bottom: -150px;
    left: -150px;
    animation-delay: 7s;
}

.orb-3 {
    width: 250px;
    height: 250px;
    background: radial-gradient(circle, rgba(34, 211, 238, 0.3), transparent);
    top: 50%;
    left: 50%;
    animation-delay: 14s;
}

@keyframes float {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(100px, -100px) scale(1.1); }
    66% { transform: translate(-100px, 100px) scale(0.9); }
}

.auth-container {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 460px;
}

.auth-card {
    position: relative;
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(40px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 1.25rem 1.5rem;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), 0 0 100px rgba(0, 212, 255, 0.1);
    overflow: hidden;
}

/* Animated Border */
.card-border {
    position: absolute;
    inset: 0;
    border-radius: 32px;
    padding: 1px;
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.5), rgba(99, 102, 241, 0.5), rgba(34, 211, 238, 0.5));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0.5;
    animation: borderRotate 3s linear infinite;
    pointer-events: none;
    z-index: 0;
}

@keyframes borderRotate {
    to { transform: rotate(360deg); }
}

/* Header */
.auth-header {
    text-align: center;
    margin-bottom: 1rem;
    position: relative;
    z-index: 1;
}

.icon-badge {
    position: relative;
    width: 55px;
    height: 55px;
    margin: 0 auto 0.75rem;
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(99, 102, 241, 0.15));
    border: 2px solid rgba(0, 212, 255, 0.4);
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #00d4ff;
    animation: iconPulse 2s ease-in-out infinite;
}

.icon-glow {
    position: absolute;
    inset: -20px;
    background: radial-gradient(circle, rgba(0, 212, 255, 0.3), transparent 70%);
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
}

@keyframes iconPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}

@keyframes pulse {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.2); }
}

.icon-badge svg {
    width: 26px;
    height: 26px;
    position: relative;
    z-index: 1;
}

.auth-header h1 {
    font-size: 1.625rem;
    font-weight: 800;
    background: linear-gradient(135deg, #fff, #00d4ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0.25rem;
}

.auth-header p {
    color: #94a3b8;
    font-size: 0.8125rem;
}

/* Error Banner */
.error-banner {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.625rem 0.875rem;
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.4);
    border-radius: 10px;
    color: #fca5a5;
    margin-bottom: 0.875rem;
    font-size: 0.8125rem;
    animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}

.error-banner svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
}

/* Form */
.auth-form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    position: relative;
    z-index: 1;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
}

.form-group label {
    font-size: 0.8125rem;
    font-weight: 600;
    color: #e2e8f0;
    letter-spacing: 0.3px;
}

.input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.input-glow {
    position: absolute;
    inset: -2px;
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.3), rgba(99, 102, 241, 0.3));
    border-radius: 14px;
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none;
}

.input-wrapper:focus-within .input-glow {
    opacity: 1;
}

.input-wrapper svg {
    position: absolute;
    left: 1rem;
    width: 20px;
    height: 20px;
    color: #64748b;
    pointer-events: none;
    z-index: 1;
    transition: color 0.3s;
}

.input-wrapper:focus-within svg {
    color: #00d4ff;
}

.input-wrapper input {
    position: relative;
    width: 100%;
    padding: 0.75rem 0.875rem 0.75rem 2.75rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: #fff;
    font-size: 0.875rem;
    transition: all 0.3s;
}

.input-wrapper input::placeholder {
    color: #64748b;
}

.input-wrapper input:focus {
    outline: none;
    border-color: rgba(0, 212, 255, 0.5);
    background: rgba(15, 23, 42, 0.8);
    box-shadow: 0 0 0 4px rgba(0, 212, 255, 0.1);
}

.toggle-password {
    position: absolute;
    right: 1rem;
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    transition: all 0.3s;
    z-index: 1;
}

.toggle-password:hover {
    color: #00d4ff;
    transform: scale(1.1);
}

.toggle-password svg {
    width: 20px;
    height: 20px;
    position: static;
}

/* Submit Button */
.submit-btn {
    position: relative;
    margin-top: 0.125rem;
    padding: 0.875rem;
    background: linear-gradient(90deg, #00d4ff, #7928ca);
    border: none;
    border-radius: 30px;
    color: #fff;
    font-size: 0.9375rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
    overflow: hidden;
}

.btn-glow {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), transparent);
    opacity: 0;
    transition: opacity 0.3s;
}

.submit-btn:hover:not(:disabled) .btn-glow {
    opacity: 1;
}

.submit-btn:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 0 30px rgba(0, 212, 255, 0.5);
}

.submit-btn:active:not(:disabled) {
    transform: scale(1.02);
}

.submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.loading-spinner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.loading-spinner svg {
    width: 20px;
    height: 20px;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* Footer */
.auth-footer {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
    position: relative;
    z-index: 1;
}

.link-primary {
    color: #94a3b8;
    text-decoration: none;
    font-size: 0.875rem;
    transition: color 0.3s;
}

.link-primary strong {
    color: #00d4ff;
    transition: color 0.3s;
}

.link-primary:hover {
    color: #cbd5e1;
}

.link-primary:hover strong {
    color: #22d3ee;
}

.link-secondary {
    color: #64748b;
    text-decoration: none;
    font-size: 0.8125rem;
    transition: color 0.3s;
}

.link-secondary:hover {
    color: #94a3b8;
}

@media (max-width: 640px) {
    .auth-page {
        padding: 0.25rem;
    }
    
    .auth-card {
        padding: 1rem 1.25rem;
        border-radius: 16px;
    }
    
    .auth-header {
        margin-bottom: 0.875rem;
    }
    
    .icon-badge {
        width: 50px;
        height: 50px;
        margin: 0 auto 0.625rem;
        border-radius: 16px;
    }
    
    .icon-badge svg {
        width: 24px;
        height: 24px;
    }
    
    .auth-header h1 {
        font-size: 1.5rem;
    }
    
    .auth-header p {
        font-size: 0.75rem;
    }
    
    .error-banner {
        padding: 0.5rem 0.75rem;
        margin-bottom: 0.75rem;
        font-size: 0.75rem;
    }
    
    .auth-form {
        gap: 0.625rem;
    }
    
    .form-group {
        gap: 0.25rem;
    }
    
    .form-group label {
        font-size: 0.75rem;
    }
    
    .input-wrapper input {
        padding: 0.625rem 0.75rem 0.625rem 2.5rem;
        font-size: 0.8125rem;
        border-radius: 8px;
    }
    
    .input-wrapper svg {
        left: 0.75rem;
        width: 18px;
        height: 18px;
    }
    
    .toggle-password svg {
        width: 18px;
        height: 18px;
    }
    
    .submit-btn {
        padding: 0.75rem;
        font-size: 0.875rem;
        margin-top: 0;
    }
    
    .auth-footer {
        margin-top: 0.875rem;
        padding-top: 0.875rem;
        gap: 0.375rem;
    }
    
    .link-primary {
        font-size: 0.8125rem;
    }
    
    .link-secondary {
        font-size: 0.75rem;
    }
    
    .orb {
        filter: blur(60px);
        opacity: 0.2;
    }
}
</style>
