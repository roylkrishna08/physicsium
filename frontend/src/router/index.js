import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/pages/Home.vue'
import Syllabus from '../views/course/Syllabus.vue'
import Topics from '../views/course/Topics.vue'
import Experiments from '../views/experimentalskill/Experiments.vue'
import Lab from '../views/experimentalskill/Lab.vue'
import Mission2027 from '../views/pages/Mission2027.vue'
// Electrostatics Module
import ElectrostaticsIndex from '../views/unit/electrostatics/Index.vue'
import ChargesAndFields from '../views/unit/electrostatics/ChargesAndFields.vue'
import FieldAndDipole from '../views/unit/electrostatics/FieldAndDipole.vue'
import GaussLaw from '../views/unit/electrostatics/GaussLaw.vue'
import Potential from '../views/unit/electrostatics/Potential.vue'
import Capacitors from '../views/unit/electrostatics/Capacitors.vue'
import FreeLabIndex from '../views/experimentalskill/freelab/FreeLabIndex.vue'
import PrivacyPolicy from '../views/pages/PrivacyPolicy.vue'
import DrawingView from '../views/drawingTools/DrawingView.vue'
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
            path: '/freelab',
            name: 'freelab',
            component: FreeLabIndex
        },
        {
            path: '/privacy-policy',
            name: 'privacy-policy',
            component: PrivacyPolicy
        },
        {
            path: '/drawing-test',
            name: 'drawing-test',
            component: DrawingView
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
