<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import UniverseBg from '../../components/backgrounds/UniverseBg.vue'

const router = useRouter()
const authStore = useAuthStore()

// Form data
const isEditing = ref(false)
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const username = ref('')
const profilePicture = ref('')
const memberSince = ref('')

// UI state
const loading = ref(false)
const error = ref('')
const success = ref('')

// Load user data
onMounted(() => {
    if (!authStore.isAuthenticated) {
        router.push('/login')
        return
    }
    
    loadUserData()
})

const loadUserData = () => {
    if (authStore.user) {
        firstName.value = authStore.user.firstName || ''
        lastName.value = authStore.user.lastName || ''
        email.value = authStore.user.email || ''
        username.value = authStore.user.username || ''
        profilePicture.value = authStore.user.profilePicture || ''
        memberSince.value = new Date(authStore.user.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }
}

const toggleEdit = () => {
    if (isEditing.value) {
        // Cancel editing - reload original data
        loadUserData()
        error.value = ''
        success.value = ''
    }
    isEditing.value = !isEditing.value
}

const handleSave = async () => {
    loading.value = true
    error.value = ''
    success.value = ''
    
    try {
        await authStore.updateProfile({
            firstName: firstName.value,
            lastName: lastName.value
        })
        
        success.value = 'Profile updated successfully!'
        isEditing.value = false
        
        setTimeout(() => {
            success.value = ''
        }, 3000)
    } catch (err) {
        error.value = err || 'Failed to update profile'
    } finally {
        loading.value = false
    }
}

const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0]
    if (file) {
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            error.value = 'File size must be less than 5MB'
            return
        }
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            error.value = 'Please upload an image file'
            return
        }
        
        loading.value = true
        error.value = ''
        
        try {
            await authStore.uploadProfilePicture(file)
            profilePicture.value = authStore.user.profilePicture
            success.value = 'Profile picture updated successfully!'
            
            setTimeout(() => {
                success.value = ''
            }, 3000)
        } catch (err) {
            error.value = err || 'Failed to upload profile picture'
        } finally {
            loading.value = false
        }
    }
}

const getUserInitials = () => {
    const first = firstName.value?.[0] || ''
    const last = lastName.value?.[0] || ''
    return (first + last).toUpperCase() || 'U'
}
</script>

<template>
    <div class="profile-page">
        <UniverseBg />
        
        <div class="profile-container">
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

            <!-- Profile Card -->
            <div class="profile-card">
                <div class="card-border"></div>
                
                <!-- Header -->
                <div class="card-header">
                    <button class="back-btn" @click="router.push('/')">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                        Back
                    </button>
                    <h1>My Profile</h1>
                </div>
                
                <!-- Cover Section with Profile Picture -->
                <div class="cover-section">
                    <div class="cover-gradient"></div>
                    
                    <div class="profile-header-content">
                        <!-- Profile Picture -->
                        <div class="profile-picture-wrapper">
                            <div v-if="profilePicture && profilePicture !== 'no-photo.jpg'" class="profile-img-container">
                                <img :src="profilePicture" alt="Profile" class="profile-img" />
                            </div>
                            <div v-else class="profile-initials">
                                {{ getUserInitials() }}
                            </div>
                            
                            <label for="profile-upload" class="upload-btn">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                    <circle cx="12" cy="13" r="4"></circle>
                                </svg>
                            </label>
                            <input 
                                id="profile-upload" 
                                type="file" 
                                accept="image/*" 
                                @change="handleProfilePictureUpload"
                                style="display: none;"
                            />
                        </div>
                        
                        <!-- User Info -->
                        <div class="user-info-compact">
                            <h2>{{ firstName }} {{ lastName }}</h2>
                            <p class="username-neon">@{{ username }}</p>
                            <p class="member-since">Member since {{ memberSince }}</p>
                        </div>
                    </div>
                </div>

                <!-- Profile Form -->
                <form @submit.prevent="handleSave" class="profile-form">
                    <div class="form-section">
                        <h3>Personal Information</h3>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="firstName">First Name</label>
                                <input
                                    id="firstName"
                                    v-model="firstName"
                                    type="text"
                                    :disabled="!isEditing"
                                    required
                                />
                            </div>

                            <div class="form-group">
                                <label for="lastName">Last Name</label>
                                <input
                                    id="lastName"
                                    v-model="lastName"
                                    type="text"
                                    :disabled="!isEditing"
                                />
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="email">Email Address</label>
                                <input
                                    id="email"
                                    v-model="email"
                                    type="email"
                                    disabled
                                    title="Email cannot be changed"
                                />
                            </div>

                            <div class="form-group">
                                <label for="username">Username</label>
                                <input
                                    id="username"
                                    v-model="username"
                                    type="text"
                                    disabled
                                    title="Username cannot be changed"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="action-buttons">
                        <button 
                            v-if="!isEditing" 
                            type="button" 
                            class="btn-primary"
                            @click="toggleEdit"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Edit Profile
                        </button>

                        <template v-else>
                            <button 
                                type="submit" 
                                class="btn-primary"
                                :disabled="loading"
                            >
                                <svg v-if="!loading" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                <span v-if="loading" class="spinner"></span>
                                {{ loading ? 'Saving...' : 'Save Changes' }}
                            </button>

                            <button 
                                type="button" 
                                class="btn-secondary"
                                @click="toggleEdit"
                                :disabled="loading"
                            >
                                Cancel
                            </button>
                        </template>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<style scoped>
.profile-page {
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
    padding: 1.5rem 1rem;
}

.profile-container {
    position: relative;
    z-index: 10;
    max-width: 900px;
    margin: 0 auto;
}

/* Messages */
.message {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1.25rem;
    border-radius: 12px;
    margin-bottom: 1.5rem;
    animation: slideIn 0.3s ease-out;
}

.message svg {
    width: 18px;
    height: 18px;
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

/* Profile Card */
.profile-card {
    position: relative;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(40px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), 0 0 100px rgba(0, 212, 255, 0.1);
    overflow: hidden;
}

.card-border {
    position: absolute;
    inset: 0;
    border-radius: 20px;
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

@keyframes borderRotate {
    to { transform: rotate(360deg); }
}

/* Card Header */
.card-header {
    position: relative;
    z-index: 1;
    padding: 1rem 1.5rem 0.75rem;
}

.back-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: #e2e8f0;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.3s;
    margin-bottom: 0.75rem;
}

.back-btn svg {
    width: 16px;
    height: 16px;
}

.back-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(0, 212, 255, 0.3);
    color: #00d4ff;
}

.card-header h1 {
    font-size: 1.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, #fff, #00d4ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;
}

/* Cover Section */
.cover-section {
    position: relative;
    z-index: 1;
    padding: 0;
}

.cover-gradient {
    height: 100px;
    background: linear-gradient(135deg, #00d4ff, #7928ca, #0ea5e9);
    position: relative;
}

.profile-header-content {
    display: flex;
    align-items: flex-end;
    gap: 1.5rem;
    padding: 0 2rem 1.5rem;
    margin-top: -50px;
    position: relative;
}

/* Profile Picture */
.profile-picture-wrapper {
    position: relative;
    flex-shrink: 0;
}

.profile-img-container,
.profile-initials {
    width: 140px;
    height: 140px;
    border-radius: 50%;
    overflow: hidden;
    border: 4px solid rgba(15, 23, 42, 0.9);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    background: rgba(15, 23, 42, 0.9);
}

.profile-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.profile-initials {
    background: linear-gradient(135deg, #00d4ff, #0ea5e9);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 3rem;
    font-weight: 700;
    color: white;
}

.upload-btn {
    position: absolute;
    bottom: 8px;
    right: 8px;
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #00d4ff, #0ea5e9);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 4px 12px rgba(0, 212, 255, 0.4);
}

.upload-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 16px rgba(0, 212, 255, 0.6);
}

.upload-btn svg {
    width: 20px;
    height: 20px;
    color: white;
}

/* User Info Compact */
.user-info-compact {
    flex: 1;
    padding-bottom: 0.5rem;
}

.user-info-compact h2 {
    font-size: 1.875rem;
    font-weight: 700;
    color: #f3f4f6;
    margin: 0 0 0.25rem 0;
}

.username-neon {
    font-size: 1rem;
    color: #00d4ff;
    font-weight: 600;
    margin: 0 0 0.25rem 0;
    text-shadow: 0 0 10px rgba(0, 212, 255, 0.8), 
                 0 0 20px rgba(0, 212, 255, 0.5);
}

.member-since {
    font-size: 0.875rem;
    color: #9ca3af;
    margin: 0;
}

/* Form */
.profile-form {
    position: relative;
    z-index: 1;
    padding: 2rem;
}

.form-section {
    margin-bottom: 2rem;
}

.form-section h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #e2e8f0;
    margin: 0 0 1.25rem 0;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
    margin-bottom: 1.25rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-group label {
    font-size: 0.8125rem;
    font-weight: 600;
    color: #cbd5e1;
}

.form-group input {
    padding: 0.75rem 1rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    color: #fff;
    font-size: 0.9375rem;
    transition: all 0.3s;
}

.form-group input:focus {
    outline: none;
    border-color: rgba(0, 212, 255, 0.5);
    background: rgba(15, 23, 42, 0.8);
    box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
}

.form-group input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Action Buttons */
.action-buttons {
    display: flex;
    gap: 1rem;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.btn-primary,
.btn-secondary {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.875rem 1.5rem;
    border: none;
    border-radius: 10px;
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
}

.btn-primary {
    background: linear-gradient(90deg, #00d4ff, #7928ca);
    color: white;
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
}

.btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(0, 212, 255, 0.5);
}

.btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.btn-primary svg {
    width: 18px;
    height: 18px;
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
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* Mobile Responsive */
@media (max-width: 768px) {
    .profile-page {
        padding: 1rem 0.5rem;
    }

    .card-header {
        padding: 1rem 1.25rem 0.75rem;
    }

    .card-header h1 {
        font-size: 1.375rem;
    }

    .cover-gradient {
        height: 90px;
    }

    .profile-header-content {
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 0 1.5rem 1.5rem;
        margin-top: -60px;
    }

    .profile-img-container,
    .profile-initials {
        width: 120px;
        height: 120px;
    }

    .user-info-compact h2 {
        font-size: 1.5rem;
    }

    .profile-form {
        padding: 1.5rem;
    }

    .form-row {
        grid-template-columns: 1fr;
        gap: 1rem;
    }

    .action-buttons {
        flex-direction: column;
    }
}
</style>
