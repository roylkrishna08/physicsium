import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Syllabus from '../views/Syllabus.vue'
import Topics from '../views/Topics.vue'
import Experiments from '../views/Experiments.vue'
import Lab from '../views/Lab.vue'
import Mission2027 from '../views/Mission2027.vue'
// Electrostatics Module
import ElectrostaticsIndex from '../views/electrostatics/Index.vue'
import ChargesAndFields from '../views/electrostatics/ChargesAndFields.vue'
import FieldAndDipole from '../views/electrostatics/FieldAndDipole.vue'
import GaussLaw from '../views/electrostatics/GaussLaw.vue'
import Potential from '../views/electrostatics/Potential.vue'
import Capacitors from '../views/electrostatics/Capacitors.vue'
import PrivacyPolicy from '../views/PrivacyPolicy.vue'
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
        },
        {
            path: '/mission-2027',
            name: 'mission-2027',
            component: Mission2027
        },
        {
            path: '/electrostatics',
            children: [
                { path: '', name: 'electrostatics-index', component: ElectrostaticsIndex },
                { path: 'charges', name: 'charges', component: ChargesAndFields },
                { path: 'dipole', name: 'dipole', component: FieldAndDipole },
                { path: 'gauss', name: 'gauss', component: GaussLaw },
                { path: 'potential', name: 'potential', component: Potential },
                { path: 'capacitors', name: 'capacitors', component: Capacitors }
            ]
        },
        {
            path: '/privacy-policy',
            name: 'privacy-policy',
            component: PrivacyPolicy
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
