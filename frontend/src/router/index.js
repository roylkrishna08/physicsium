import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Syllabus from '../views/Syllabus.vue'
import Topics from '../views/Topics.vue'
import Experiments from '../views/Experiments.vue'
import Lab from '../views/Lab.vue'
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
        },
        {
            path: '/topics',
            name: 'topics',
            component: Topics
        },
        {
            path: '/experiments',
            name: 'experiments',
            component: Experiments
        },
        {
            path: '/lab',
            name: 'lab-index',
            component: Lab
        },
        {
            path: '/lab/:id',
            name: 'lab',
            component: Lab
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
