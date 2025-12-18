import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Syllabus from '../views/Syllabus.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: Home
        },
        {
            path: '/syllabus',
            name: 'syllabus',
            component: Syllabus
        }
    ],
    scrollBehavior(to, from, savedPosition) {
        if (to.hash) {
            return {
                el: to.hash,
                behavior: 'smooth',
            }
        }
        return { top: 0 }
    }
})

export default router
