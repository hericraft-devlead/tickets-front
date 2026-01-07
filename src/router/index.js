import { createRouter, createWebHistory } from 'vue-router'
import { useMoodleAuthStore } from '@/stores/moodleAuth'

// Layouts
import AuthLayout from '@/layouts/AuthLayout.vue'
import MoodleLayout from '@/layouts/MoodleLayout.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'

// Vistas
import Home from '@/views/public/Home.vue'
import Login from '@/views/auth/Login.vue'
import LoginLocal from '@/views/auth/LoginLocal.vue'
import TicketCreate from '@/views/moodle/TicketCreate.vue'
import TicketList from '@/views/moodle/TicketList.vue'
import AdminDashboard from '@/views/admin/Dashboard.vue'

const routes = [
  /* ================== PUBLIC / GUEST ================== */
  {
    path: '/',
    component: AuthLayout,
    meta: { guestOnly: true },
    children: [
      {
        path: '',
        name: 'home',
        component: Home
      }
    ]
  },

  {
    path: '/login',
    component: AuthLayout,
    meta: { guestOnly: true },
    children: [
      { path: '', component: Login }
    ]
  },

  {
    path: '/login/local',
    component: AuthLayout,
    meta: { guestOnly: true },
    children: [
      { path: '', component: LoginLocal }
    ]
  },

  /* ================== TICKET PÚBLICO ================== */
  {
    path: '/ticket',
    name: 'public-ticket',
    component: TicketCreate,
    meta: { guestOnly: true }
  },

  /* ================== MOODLE ================== */
  {
    path: '/moodle',
    component: MoodleLayout,
    meta: { requiresMoodle: true },
    children: [
      {
        path: 'tickets',
        name: 'moodle-tickets',
        component: TicketList
      },
      {
        path: 'ticket',
        name: 'moodle-ticket-create',
        component: TicketCreate
      },
      {
        path: '',
        redirect: 'tickets'
      }
    ]
  },

  /* ================== ADMIN ================== */
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAdmin: true },
    children: [
      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: AdminDashboard
      },
      {
        path: '',
        redirect: 'dashboard'
      }
    ]
  },

  /* ================== 404 ================== */
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})


router.beforeEach(async (to, from, next) => {
  const moodleAuth = useMoodleAuthStore()

  const adminSession = JSON.parse(localStorage.getItem('admin_session'))

  /* ================== MOODLE RESTORE ================== */
  if (
    localStorage.getItem('moodle_user') &&
    !moodleAuth.user &&
    !moodleAuth.loading
  ) {
    try {
      await moodleAuth.restoreSession()
      await moodleAuth.loadUserInfo()
    } catch {
      localStorage.removeItem('moodle_user')
    }
  }

  /* ================== GUEST ================== */
  if (to.meta.guestOnly) {
    if (adminSession?.token) {
      return next('/admin/dashboard')
    }
    if (moodleAuth.user) {
      return next('/moodle/tickets')
    }
    return next()
  }

  /* ================== MOODLE ================== */
  if (to.meta.requiresMoodle) {
    if (!moodleAuth.user) {
      return next('/')
    }
    return next()
  }

  /* ================== ADMIN ================== */
  if (to.meta.requiresAdmin) {
    if (!adminSession?.token) {
      return next('/login/local')
    }
    return next()
  }

  next()
})


export default router
