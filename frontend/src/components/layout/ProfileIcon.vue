<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const showDropdown = ref(false)

const handleClick = () => {
    if (authStore.isAuthenticated) {
        showDropdown.value = !showDropdown.value
    } else {
        router.push('/login')
    }
}

const handleLogout = () => {
    authStore.logout()
    showDropdown.value = false
    router.push('/login')
}

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
    const container = event.target.closest('.profile-icon-container')
    if (!container && showDropdown.value) {
        showDropdown.value = false
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
})

// Get user initials for fallback
const getUserInitials = () => {
    if (!authStore.user) return 'U'
    const first = authStore.user.firstName?.[0] || ''
    const last = authStore.user.lastName?.[0] || ''
    return (first + last).toUpperCase() || 'U'
}
</script>

<template>
    <div class="profile-icon-container">
        <div class="icon-wrapper" @click="handleClick" :title="authStore.isAuthenticated ? 'Profile Menu' : 'Login'">
            <!-- Glow Effect -->
            <div class="icon-glow"></div>
            
            <!-- Profile Picture or Initials -->
            <template v-if="authStore.isAuthenticated">
                <div v-if="authStore.user?.profilePicture && authStore.user.profilePicture !== 'no-photo.jpg'" class="profile-img-wrapper">
                    <img :src="authStore.user.profilePicture" class="profile-img" alt="Profile" />
                </div>
                <div v-else class="initials-wrapper">
                    {{ getUserInitials() }}
                </div>
            </template>
            
            <!-- Login Icon for Guests -->
            <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="user-icon">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
            
            <!-- Online Indicator -->
            <div v-if="authStore.isAuthenticated" class="online-indicator"></div>
        </div>

        <!-- Dropdown Menu -->
        <Transition name="dropdown">
            <div v-if="showDropdown && authStore.isAuthenticated" class="dropdown-menu">
                <!-- User Info -->
                <div class="user-info">
                    <div class="user-avatar">
                        <div v-if="authStore.user?.profilePicture && authStore.user.profilePicture !== 'no-photo.jpg'" class="avatar-img-wrapper">
                            <img :src="authStore.user.profilePicture" class="avatar-img" alt="Profile" />
                        </div>
                        <div v-else class="avatar-initials">
                            {{ getUserInitials() }}
                        </div>
                    </div>
                    <div class="user-details">
                        <p class="name">{{ authStore.user?.firstName }} {{ authStore.user?.lastName }}</p>
                        <p class="username">@{{ authStore.user?.username }}</p>
                    </div>
                </div>
                
                <div class="divider"></div>
                
                <!-- Menu Items -->
                <div class="menu-items">
                    <button class="dropdown-item" @click="router.push('/profile'); showDropdown = false">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span>My Profile</span>
                    </button>
                    
                    <button class="dropdown-item" @click="router.push('/settings'); showDropdown = false">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M12 1v6m0 6v6M5.6 5.6l4.2 4.2m4.2 4.2l4.2 4.2M1 12h6m6 0h6M5.6 18.4l4.2-4.2m4.2-4.2l4.2-4.2"></path>
                        </svg>
                        <span>Settings</span>
                    </button>
                    
                    <div class="divider"></div>
                    
                    <button class="dropdown-item logout-item" @click="handleLogout">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.profile-icon-container {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    z-index: 9999;
}

.icon-wrapper {
    position: relative;
    background: linear-gradient(135deg, #00d4ff, #0ea5e9);
    width: 56px;
    height: 56px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 24px rgba(0, 212, 255, 0.4), 0 0 40px rgba(0, 212, 255, 0.2);
    color: white;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
}

.icon-wrapper:hover {
    transform: scale(1.1);
    box-shadow: 0 12px 32px rgba(0, 212, 255, 0.5), 0 0 60px rgba(0, 212, 255, 0.3);
}

.icon-wrapper:active {
    transform: scale(1.05);
}

/* Glow Effect */
.icon-glow {
    position: absolute;
    inset: -20px;
    background: radial-gradient(circle, rgba(0, 212, 255, 0.4), transparent 70%);
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
    pointer-events: none;
}

@keyframes pulse {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.2); }
}

/* User Icon */
.user-icon {
    width: 28px;
    height: 28px;
    position: relative;
    z-index: 1;
}

/* Profile Image */
.profile-img-wrapper {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    overflow: hidden;
    position: relative;
    z-index: 1;
}

.profile-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* Initials */
.initials-wrapper {
    font-size: 1.25rem;
    font-weight: 700;
    color: white;
    position: relative;
    z-index: 1;
}

/* Online Indicator */
.online-indicator {
    position: absolute;
    bottom: 4px;
    right: 4px;
    width: 14px;
    height: 14px;
    background: #10b981;
    border: 2px solid white;
    border-radius: 50%;
    z-index: 2;
    animation: blink 2s ease-in-out infinite;
}

@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
}

/* Dropdown Menu */
.dropdown-menu {
    position: absolute;
    bottom: 70px;
    right: 0;
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    min-width: 280px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 100px rgba(0, 212, 255, 0.1);
    overflow: hidden;
}

/* Dropdown Transition */
.dropdown-enter-active,
.dropdown-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-enter-from {
    opacity: 0;
    transform: translateY(10px) scale(0.95);
}

.dropdown-leave-to {
    opacity: 0;
    transform: translateY(10px) scale(0.95);
}

/* User Info */
.user-info {
    padding: 1.25rem;
    display: flex;
    gap: 1rem;
    align-items: center;
}

.user-avatar {
    flex-shrink: 0;
}

.avatar-img-wrapper {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    overflow: hidden;
    border: 2px solid rgba(0, 212, 255, 0.3);
}

.avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.avatar-initials {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #00d4ff, #0ea5e9);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.125rem;
    font-weight: 700;
    color: white;
    border: 2px solid rgba(0, 212, 255, 0.3);
}

.user-details {
    flex: 1;
    min-width: 0;
}

.name {
    font-weight: 600;
    font-size: 0.9375rem;
    color: #f3f4f6;
    margin: 0 0 0.25rem 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.username {
    font-size: 0.75rem;
    color: #00d4ff;
    margin: 0 0 0.25rem 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 600;
    text-shadow: 0 0 10px rgba(0, 212, 255, 0.8), 
                 0 0 20px rgba(0, 212, 255, 0.5),
                 0 0 30px rgba(0, 212, 255, 0.3);
}

.role {
    font-size: 0.6875rem;
    color: #00d4ff;
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.5px;
    margin: 0;
}

/* Divider */
.divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
}

/* Menu Items */
.menu-items {
    padding: 0.5rem;
}

.dropdown-item {
    width: 100%;
    padding: 0.75rem 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    border: none;
    background: none;
    color: #e5e7eb;
    font-size: 0.875rem;
    cursor: pointer;
    text-align: left;
    border-radius: 8px;
    transition: all 0.2s;
}

.dropdown-item svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
}

.dropdown-item:hover {
    background: rgba(0, 212, 255, 0.1);
    color: #00d4ff;
}

.logout-item:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
}

/* Mobile Responsive */
@media (max-width: 768px) {
    .profile-icon-container {
        bottom: 1.5rem;
        right: 1.5rem;
    }

    .icon-wrapper {
        width: 50px;
        height: 50px;
    }

    .user-icon {
        width: 24px;
        height: 24px;
    }

    .dropdown-menu {
        min-width: 260px;
        bottom: 65px;
    }
}

@media (max-width: 480px) {
    .profile-icon-container {
        bottom: 1rem;
        right: 1rem;
    }

    .icon-wrapper {
        width: 46px;
        height: 46px;
    }

    .dropdown-menu {
        min-width: 240px;
        right: -10px;
    }
}
</style>
