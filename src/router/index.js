import { createRouter, createWebHistory } from 'vue-router'

// Auth
import Login from '@/views/auth/Login.vue'
import LoginLocal from '@/views/auth/LoginLocal.vue'

// Moodle
import AlumnoDashboard from '@/views/admin/Dashboard.vue'
import ProfesorDashboard from '@/views/admin/Dashboard.vue'
import MoodleLayout from '@/layouts/MoodleLayout.vue'

// Admin
import AdminDashboard from '@/views/admin/Dashboard.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'

const routes = [
  // LOGIN
  {
    path: '/login',
    component: Login,
    meta: { guestOnly: true }
  },
  {
    path: '/login/local',
    component: LoginLocal,
    meta: { guestOnly: true }
  },

  // MOODLE
  {
    path: '/alumno',
    component: MoodleLayout,
    meta: { requiresMoodle: true, role: 'Estudiante' },
    children: [
      {
        path: 'dashboard',
        component: AlumnoDashboard
      }
    ]
  },
  {
    path: '/profesor',
    component: MoodleLayout,
    meta: { requiresMoodle: true, role: 'Profesor' },
    children: [
      {
        path: 'dashboard',
        component: ProfesorDashboard
      }
    ]
  },


  //  ADMIN
  {
    path: '/admin',
    meta: { requiresAdmin: true },
    component: AdminLayout,
    children: [
      {
        path: 'dashboard',
        component: AdminDashboard
      }
    ]
  },

  // DEFAULT
  {
    path: '/',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

/* GUARD GLOBAL */
router.beforeEach((to, from, next) => {
  const moodleSession = JSON.parse(localStorage.getItem('moodle_user'))
  const adminSession = JSON.parse(localStorage.getItem('admin_session'))

  // RUTAS DE INVITADO
  if (to.meta.guestOnly && (moodleSession || adminSession)) {
    if (adminSession) return next('/admin/dashboard')

    const tipo = moodleSession?.user?.tipoUsuario
    if (tipo === 'Profesor') return next('/profesor/dashboard')
    if (tipo === 'Estudiante') return next('/alumno/dashboard')
  }

  // RUTAS MOODLE
  if (to.meta.requiresMoodle) {
    if (!moodleSession?.user) {
      localStorage.removeItem('moodle_user')
      return next('/login')
    }

    if (to.meta.role && moodleSession.user.tipoUsuario !== to.meta.role) {
      return next('/login')
    }
  }

  // RUTAS ADMIN
  if (to.meta.requiresAdmin) {
    if (!adminSession?.token) {
      return next('/login/local')
    }
  }

  next()
})



export default router
