import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/login',
            name: 'login',
            component: () => import('../views/Login.vue'),
            meta: { guestOnly: true }
        },
        {
            path: '/',
            component: () => import('../views/DashboardLayout.vue'),
            meta: { requiresAuth: true },
            children: [
                {
                    path: '',
                    name: 'dashboard',
                    component: () => import('../views/DashboardHome.vue'),
                },
                {
                    path: 'users',
                    name: 'users',
                    component: () => import('../views/UserManagement.vue'),
                },
                {
                    path: 'simulations',
                    name: 'simulations',
                    component: () => import('../views/SimulationManagement.vue'),
                },
                {
                    path: 'units',
                    name: 'units',
                    component: () => import('../views/UnitManagement.vue'),
                }
            ]
        }
    ]
});

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        next('/login');
    } else if (to.meta.guestOnly && authStore.isAuthenticated) {
        next('/');
    } else {
        next();
    }
});

export default router;
