import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/pages/Home.vue'
// Last Build Trigger: 2026-02-08T01:23:00Z
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

// Kinematics Module
import KinematicsIndex from '../views/unit/kinematics/Index.vue'
import FrameOfReference from '../views/unit/kinematics/FrameOfReference.vue'
import StraightLineMotion from '../views/unit/kinematics/StraightLineMotion.vue'
import Acceleration from '../views/unit/kinematics/Acceleration.vue'
import KinematicGraphs from '../views/unit/kinematics/Graphs.vue'
import RelativeVelocity from '../views/unit/kinematics/RelativeVelocity.vue'
import ProjectileMotion from '../views/unit/kinematics/ProjectileMotion.vue'
import CircularMotion from '../views/unit/kinematics/CircularMotion.vue'

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
            component: Topics,
            meta: { requiresAuth: true }
        },
        {
            path: '/experiments',
            name: 'experiments',
            component: Experiments,
            meta: { requiresAuth: true }
        },
        {
            path: '/lab',
            name: 'lab-index',
            component: Lab,
            meta: { requiresAuth: true }
        },
        {
            path: '/lab/:id',
            name: 'lab',
            component: Lab,
            meta: { requiresAuth: true }
        },
        {
            path: '/mission-2027',
            name: 'mission-2027',
            component: Mission2027
        },
        {
            path: '/electrostatics',
            meta: { requiresAuth: true },
            children: [
                { path: '', name: 'electrostatics-index', component: ElectrostaticsIndex },
                { path: 'charges', name: 'charges', component: ChargesAndFields, meta: { hideNav: true, requiresAuth: true } },
                { path: 'dipole', name: 'dipole', component: FieldAndDipole, meta: { hideNav: true, requiresAuth: true } },
                { path: 'gauss', name: 'gauss', component: GaussLaw, meta: { hideNav: true, requiresAuth: true } },
                { path: 'gausslaw', name: 'gausslaw', component: GaussLaw, meta: { hideNav: true, requiresAuth: true } },
                { path: 'potential', name: 'potential', component: Potential, meta: { hideNav: true, requiresAuth: true } },
                { path: 'capacitors', name: 'capacitors', component: Capacitors, meta: { hideNav: true, requiresAuth: true } }
            ]
        },
        {
            path: '/kinematics',
            meta: { requiresAuth: true },
            children: [
                { path: '', name: 'kinematics-index', component: KinematicsIndex },
                { path: 'frame-of-reference', name: 'frame-of-reference', component: FrameOfReference, meta: { hideNav: true, requiresAuth: true } },
                { path: 'straight-line', name: 'straight-line', component: StraightLineMotion, meta: { hideNav: true, requiresAuth: true } },
                { path: 'acceleration', name: 'acceleration', component: Acceleration, meta: { hideNav: true, requiresAuth: true } },
                { path: 'graphs', name: 'kinematic-graphs', component: KinematicGraphs, meta: { hideNav: true, requiresAuth: true } },
                { path: 'relative-velocity', name: 'relative-velocity', component: RelativeVelocity, meta: { hideNav: true, requiresAuth: true } },
                { path: 'projectile', name: 'projectile', component: ProjectileMotion, meta: { hideNav: true, requiresAuth: true } },
                { path: 'circular', name: 'circular', component: CircularMotion, meta: { hideNav: true, requiresAuth: true } }
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
            meta: { requiresAuth: true },
            children: [
                { path: '', name: 'gravitation-index', component: () => import('../views/unit/gravitation/GravitationLayout.vue') },
                { path: 'universal-law', name: 'universal-law', component: () => import('../views/unit/gravitation/UniversalLaw.vue'), meta: { requiresAuth: true } },
                { path: 'acceleration', name: 'acceleration', component: () => import('../views/unit/gravitation/AccelerationGravity.vue'), meta: { requiresAuth: true } },
                { path: 'kepler', name: 'kepler', component: () => import('../views/unit/gravitation/KeplersLaws.vue'), meta: { requiresAuth: true } },
                { path: 'potential', name: 'potential', component: () => import('../views/unit/gravitation/GravitationalPotential.vue'), meta: { requiresAuth: true } },
                { path: 'satellite', name: 'satellite', component: () => import('../views/unit/gravitation/SatelliteMotion.vue'), meta: { requiresAuth: true } }
            ]
        },
        {
            path: '/freelab',
            name: 'freelab',
            component: FreeLabIndex,
            meta: { requiresAuth: true }
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
        },
        {
            path: '/login',
            name: 'login-selection',
            component: () => import('../views/auth/AuthSelection.vue'),
            meta: { guestOnly: true, hideNav: true }
        },
        {
            path: '/login-form',
            name: 'login',
            component: () => import('../views/auth/LoginForm.vue'),
            meta: { guestOnly: true, hideNav: true }
        },
        {
            path: '/signup',
            name: 'signup',
            component: () => import('../views/auth/Signup.vue'),
            meta: { guestOnly: true, hideNav: true }
        },
        {
            path: '/profile',
            name: 'profile',
            component: () => import('../views/user/Profile.vue'),
            meta: { requiresAuth: true, hideNav: true }
        },
        {
            path: '/settings',
            name: 'settings',
            component: () => import('../views/user/Settings.vue'),
            meta: { requiresAuth: true, hideNav: true }
        },
        {
            path: '/adminlogin',
            name: 'admin-login',
            component: () => import('@/views/admin/AdminLogin.vue'),
            meta: { guestOnly: true, hideNav: true }
        },
        {
            path: '/admin',
            component: () => import('@/views/admin/DashboardLayout.vue'),
            meta: { requiresAdmin: true, hideNav: true },
            children: [
                {
                    path: '',
                    name: 'admin-dashboard',
                    component: () => import('@/views/admin/AdminDashboard.vue')
                },
                {
                    path: 'users',
                    name: 'admin-users',
                    component: () => import('@/views/admin/UserManagement.vue')
                },
                {
                    path: 'simulations',
                    name: 'admin-simulations',
                    component: () => import('@/views/admin/SimulationManagement.vue')
                },
                {
                    path: 'units',
                    name: 'admin-units',
                    component: () => import('@/views/admin/UnitManagement.vue')
                }
            ]
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

// Navigation Guards
import { useAuthStore } from '../stores/auth'

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()

    // Initialize auth state on first load
    if (from.name === undefined) {
        authStore.init()
    }

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        next('/login')
    } else if (to.meta.guestOnly && authStore.isAuthenticated) {
        next('/')
    } else if (to.meta.requiresAdmin && !authStore.isAdmin) {
        next('/')
    } else if (to.meta.requiresOwner && !authStore.isOwner) {
        next('/')
    } else {
        next()
    }
})

export default router
