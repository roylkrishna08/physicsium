<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const handleLogin = () => {
    // Placeholder for future login logic
    console.log("Login clicked")
    // router.push('/login') // Example redirection
}
</script>

<template>
    <div class="profile-icon-container" @click="handleLogin" title="Login">
        <div class="icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="user-icon">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
        </div>
    </div>
</template>

<style scoped>
.profile-icon-container {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    z-index: 9999;
    cursor: pointer;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.profile-icon-container:hover {
    transform: scale(1.1);
}

.icon-wrapper {
    background-color: var(--primary-color, #4facfe);
    /* Fallback to a nice blue if var not defined */
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    color: white;
}

.user-icon {
    width: 24px;
    height: 24px;
}

/* Adjust for mobile if necessary */
@media (max-width: 768px) {
    .profile-icon-container {
        bottom: 1.5rem;
        right: 1.5rem;
    }

    .icon-wrapper {
        width: 45px;
        height: 45px;
    }
}
</style>
