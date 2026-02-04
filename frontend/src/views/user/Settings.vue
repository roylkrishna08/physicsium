<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import UniverseBg from '../../components/backgrounds/UniverseBg.vue'

const router = useRouter()
const authStore = useAuthStore()

// Password change form
const currentPassword = ref('')
const newPassword = ref('')
const confirmNewPassword = ref('')
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// UI state
const loading = ref(false)
const error = ref('')
const success = ref('')
const showDeleteConfirm = ref(false)
const deletePassword = ref('')

onMounted(() => {
    if (!authStore.isAuthenticated) {
        router.push('/login')
    }
})

const handlePasswordChange = async () => {
    error.value = ''
    success.value = ''
    
    // Validation
    if (newPassword.value.length < 6) {
        error.value = 'New password must be at least 6 characters'
        return
    }
    
    if (newPassword.value !== confirmNewPassword.value) {
        error.value = 'New passwords do not match'
        return
    }
    
    loading.value = true
    
    try {
        await authStore.changePassword({
            currentPassword: currentPassword.value,
            newPassword: newPassword.value
        })
        
        success.value = 'Password changed successfully!'
        currentPassword.value = ''
        newPassword.value = ''
        confirmNewPassword.value = ''
        
        setTimeout(() => {
            success.value = ''
        }, 3000)
    } catch (err) {
        error.value = err || 'Failed to change password'
    } finally {
        loading.value = false
    }
}

const handleDeleteAccount = async () => {
    if (!deletePassword.value) {
        error.value = 'Please enter your password to confirm'
        return
    }
    
    loading.value = true
    error.value = ''
    
    try {
        await authStore.deleteAccount(deletePassword.value)
        // User is logged out and redirected by the store
        router.push('/login')
    } catch (err) {
        error.value = err || 'Failed to delete account'
        loading.value = false
    }
}
</script>

<template>
    <div class="settings-page">
        <UniverseBg />
        
        <div class="settings-container">
            <!-- Success/Error Messages -->
            <div v-if="success" class="message success-message">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                {{ success }}
            </div>

            <div v-if="error" class="message error-message">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {{ error }}
            </div>

            <div class="settings-content">
                <!-- Security Section -->
                <div class="settings-card">
                    <div class="card-border"></div>
                    
                    <!-- Page Header Inside Card -->
                    <div class="page-header-inside">
                        <button class="back-btn" @click="router.push('/')">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M19 12H5M12 19l-7-7 7-7"/>
                            </svg>
                            Back
                        </button>
                        <h1>Settings</h1>
                    </div>
                    
                    <div class="card-header">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        </svg>
                        <h2>Security</h2>
                    </div>

                    <form @submit.prevent="handlePasswordChange" class="settings-form">
                        <div class="form-group">
                            <label for="currentPassword">Current Password</label>
                            <div class="input-wrapper">
                                <input
                                    id="currentPassword"
                                    v-model="currentPassword"
                                    :type="showCurrentPassword ? 'text' : 'password'"
                                    placeholder="Enter current password"
                                    required
                                />
                                <button
                                    type="button"
                                    class="toggle-password"
                                    @click="showCurrentPassword = !showCurrentPassword"
                                >
                                    <svg v-if="!showCurrentPassword" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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

                        <div class="form-group">
                            <label for="newPassword">New Password</label>
                            <div class="input-wrapper">
                                <input
                                    id="newPassword"
                                    v-model="newPassword"
                                    :type="showNewPassword ? 'text' : 'password'"
                                    placeholder="Enter new password (min 6 characters)"
                                    required
                                />
                                <button
                                    type="button"
                                    class="toggle-password"
                                    @click="showNewPassword = !showNewPassword"
                                >
                                    <svg v-if="!showNewPassword" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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

                        <div class="form-group">
                            <label for="confirmNewPassword">Confirm New Password</label>
                            <div class="input-wrapper">
                                <input
                                    id="confirmNewPassword"
                                    v-model="confirmNewPassword"
                                    :type="showConfirmPassword ? 'text' : 'password'"
                                    placeholder="Re-enter new password"
                                    required
                                />
                                <button
                                    type="button"
                                    class="toggle-password"
                                    @click="showConfirmPassword = !showConfirmPassword"
                                >
                                    <svg v-if="!showConfirmPassword" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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

                        <button type="submit" class="btn-primary" :disabled="loading">
                            <svg v-if="!loading" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            <span v-if="loading" class="spinner"></span>
                            {{ loading ? 'Changing...' : 'Change Password' }}
                        </button>
                    </form>
                </div>

                <!-- Danger Zone -->
                <div class="settings-card danger-card">
                    <div class="card-border danger-border"></div>
                    
                    <div class="card-header">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                            <line x1="12" y1="9" x2="12" y2="13"></line>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                        <h2>Danger Zone</h2>
                    </div>

                    <div class="danger-content">
                        <p class="danger-warning">
                            Once you delete your account, there is no going back. Please be certain.
                        </p>

                        <button 
                            v-if="!showDeleteConfirm"
                            type="button" 
                            class="btn-danger"
                            @click="showDeleteConfirm = true"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                            Delete Account
                        </button>

                        <div v-else class="delete-confirm">
                            <div class="form-group">
                                <label for="deletePassword">Enter your password to confirm</label>
                                <input
                                    id="deletePassword"
                                    v-model="deletePassword"
                                    type="password"
                                    placeholder="Your password"
                                    required
                                />
                            </div>

                            <div class="action-buttons">
                                <button 
                                    type="button" 
                                    class="btn-danger"
                                    @click="handleDeleteAccount"
                                    :disabled="loading"
                                >
                                    <span v-if="loading" class="spinner"></span>
                                    {{ loading ? 'Deleting...' : 'Confirm Delete' }}
                                </button>
                                <button 
                                    type="button" 
                                    class="btn-secondary"
                                    @click="showDeleteConfirm = false; deletePassword = ''"
                                    :disabled="loading"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.settings-page {
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
    padding: 2rem 1rem;
}

.settings-container {
    position: relative;
    z-index: 10;
    max-width: 800px;
    margin: 0 auto;
}

/* Page Header Inside Card */
.page-header-inside {
    position: relative;
    z-index: 1;
    margin-bottom: 2rem;
}

.back-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: #e2e8f0;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.3s;
    margin-bottom: 1.5rem;
}

.back-btn svg {
    width: 18px;
    height: 18px;
}

.back-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(0, 212, 255, 0.3);
    color: #00d4ff;
}

.page-header-inside h1 {
    font-size: 2.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, #fff, #00d4ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;
}

/* Messages */
.message {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    border-radius: 12px;
    margin-bottom: 1.5rem;
    animation: slideIn 0.3s ease-out;
}

.message svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
}

.success-message {
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.4);
    color: #6ee7b7;
}

.error-message {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.4);
    color: #fca5a5;
}

@keyframes slideIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Settings Content */
.settings-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

/* Settings Card */
.settings-card {
    position: relative;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(40px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    padding: 2rem;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), 0 0 100px rgba(0, 212, 255, 0.1);
    overflow: hidden;
}

.card-border {
    position: absolute;
    inset: 0;
    border-radius: 24px;
    padding: 1px;
    background: linear-gradient(135deg, rgba(0, 212, 255, 0.5), rgba(99, 102, 241, 0.5));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0.5;
    animation: borderRotate 3s linear infinite;
    pointer-events: none;
    z-index: 0;
}

.danger-border {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.5), rgba(220, 38, 38, 0.5));
}

@keyframes borderRotate {
    to { transform: rotate(360deg); }
}

.card-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    position: relative;
    z-index: 1;
}

.card-header svg {
    width: 24px;
    height: 24px;
    color: #00d4ff;
}

.danger-card .card-header svg {
    color: #ef4444;
}

.card-header h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #f3f4f6;
    margin: 0;
}

/* Form */
.settings-form {
    position: relative;
    z-index: 1;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
}

.form-group label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #e2e8f0;
}

.input-wrapper {
    position: relative;
}

.input-wrapper input,
.form-group input {
    width: 100%;
    padding: 0.875rem 1rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: #fff;
    font-size: 0.9375rem;
    transition: all 0.3s;
}

.input-wrapper input {
    padding-right: 3rem;
}

.input-wrapper input:focus,
.form-group input:focus {
    outline: none;
    border-color: rgba(0, 212, 255, 0.5);
    background: rgba(15, 23, 42, 0.8);
    box-shadow: 0 0 0 4px rgba(0, 212, 255, 0.1);
}

.toggle-password {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    transition: color 0.3s;
}

.toggle-password:hover {
    color: #00d4ff;
}

.toggle-password svg {
    width: 20px;
    height: 20px;
}

/* Buttons */
.btn-primary,
.btn-secondary,
.btn-danger {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
}

.btn-primary {
    width: 100%;
    background: linear-gradient(90deg, #00d4ff, #7928ca);
    color: white;
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
}

.btn-primary:hover:not(:disabled) {
    transform: scale(1.02);
    box-shadow: 0 0 30px rgba(0, 212, 255, 0.5);
}

.btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn-primary svg {
    width: 20px;
    height: 20px;
}

.btn-danger {
    width: 100%;
    background: linear-gradient(90deg, #ef4444, #dc2626);
    color: white;
    box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
}

.btn-danger:hover:not(:disabled) {
    transform: scale(1.02);
    box-shadow: 0 0 30px rgba(239, 68, 68, 0.5);
}

.btn-danger:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn-danger svg {
    width: 20px;
    height: 20px;
}

.btn-secondary {
    background: rgba(255, 255, 255, 0.05);
    color: #e2e8f0;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
}

.spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* Danger Zone */
.danger-content {
    position: relative;
    z-index: 1;
}

.danger-warning {
    color: #fca5a5;
    font-size: 0.9375rem;
    margin: 0 0 1.5rem 0;
    padding: 1rem;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 12px;
}

.delete-confirm {
    margin-top: 1.5rem;
}

.action-buttons {
    display: flex;
    gap: 1rem;
}

.action-buttons .btn-danger,
.action-buttons .btn-secondary {
    flex: 1;
}

/* Mobile Responsive */
@media (max-width: 768px) {
    .settings-page {
        padding: 1rem 0.5rem;
    }

    .page-header-inside h1 {
        font-size: 2rem;
    }

    .settings-card {
        padding: 1.5rem;
    }

    .action-buttons {
        flex-direction: column;
    }
}
</style>
