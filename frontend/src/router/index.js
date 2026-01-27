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
                { path: 'charges', name: 'charges', component: ChargesAndFields, meta: { hideNav: true } },
                { path: 'dipole', name: 'dipole', component: FieldAndDipole, meta: { hideNav: true } },
                { path: 'gauss', name: 'gauss', component: GaussLaw, meta: { hideNav: true } },
                { path: 'gausslaw', name: 'gausslaw', component: GaussLaw, meta: { hideNav: true } },
                { path: 'potential', name: 'potential', component: Potential, meta: { hideNav: true } },
                { path: 'capacitors', name: 'capacitors', component: Capacitors, meta: { hideNav: true } }
            ]
        },
        {
            path: '/electrostatic/gausslaw',
            redirect: '/electrostatics/gausslaw'
        },
        {
            path: '/gausslaw',
            redirect: '/electrostatics/gausslaw'
        },
        {
            path: '/gravitation',
            children: [
                { path: '', name: 'gravitation-index', component: () => import('../views/gravitation/GravitationLayout.vue') },
                { path: 'universal-law', name: 'universal-law', component: () => import('../views/gravitation/UniversalLaw.vue') },
                { path: 'acceleration', name: 'acceleration', component: () => import('../views/gravitation/AccelerationGravity.vue') },
                { path: 'kepler', name: 'kepler', component: () => import('../views/gravitation/KeplersLaws.vue') },
                { path: 'potential', name: 'potential', component: () => import('../views/gravitation/GravitationalPotential.vue') },
                { path: 'satellite', name: 'satellite', component: () => import('../views/gravitation/SatelliteMotion.vue') }
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
        },
        {
            path: '/pyq',
            name: 'pyq',
            component: () => import('../views/pyq/PYQView.vue')
        },
        {
            path: '/pyq/jee-mains',
            name: 'jee-mains-pyq',
            component: () => import('../views/pyq/JEEMainsView.vue')
        },
        {
            path: '/pyq/jee-mains/:unitId',
            name: 'jee-mains-unit-detail',
            component: () => import('../views/pyq/JEEMainsUnitView.vue')
        },
        {
            path: '/pyq/jee-mains/:unitId/:topicId',
            name: 'jee-mains-topic-questions',
            component: () => import('../views/pyq/JEEMainsTopicView.vue')
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
