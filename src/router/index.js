import { createRouter, createWebHistory } from 'vue-router'
import { useMoodleAuthStore } from '@/stores/moodleAuth'
import { useAdminAuthStore } from '@/stores/adminAuth'

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

// Nuevas vistas de tickets para admin
import AdminTickets from '@/views/admin/AdminTickets.vue'
import DepartmentTickets from '@/views/admin/DepartmenTickets.vue'  // Asegúrate que el nombre es correcto
import MyTickets from '@/views/admin/MyTickets.vue'

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
        path: 'tickets/all',
        name: 'admin-tickets-all',
        component: AdminTickets,
        meta: { requiresAdmin: true, userType: 'super_admin' }
      },
      {
        path: 'tickets/department',
        name: 'admin-tickets-department',
        component: DepartmentTickets,
        meta: { requiresAdmin: true, userType: ['super_admin', 'department_head'] }
      },
      {
        path: 'tickets/my-tickets',
        name: 'admin-tickets-my',
        component: MyTickets,
        meta: { requiresAdmin: true, userType: ['super_admin', 'department_head', 'support'] }
      },
      {
        path: '',
        redirect: (to) => {
          // Redirigir según el tipo de usuario
          const adminAuth = useAdminAuthStore()
          return adminAuth.getDefaultRoute()
        }
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
  const adminAuth = useAdminAuthStore()

  // Restaurar sesión admin si existe
  if (!adminAuth.user && localStorage.getItem('admin_session')) {
    adminAuth.restoreSession()
  }

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
    if (adminAuth.isAuthenticated()) {
      // Redirigir según tipo de usuario
      return next(adminAuth.getDefaultRoute())
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
    if (!adminAuth.isAuthenticated()) {
      return next('/login/local')
    }

    // Verificar tipo de usuario si la ruta lo requiere
    if (to.meta.userType) {
      const userType = adminAuth.getUserType();
      
      if (!userType) {
        // Si no tiene tipo, redirigir a la vista por defecto
        return next(adminAuth.getDefaultRoute());
      }

      // Si userType es un array, verificar si el usuario está incluido
      if (Array.isArray(to.meta.userType)) {
        if (!to.meta.userType.includes(userType)) {
          return next(adminAuth.getDefaultRoute());
        }
      } 
      // Si userType es un string, verificar coincidencia exacta
      else if (to.meta.userType !== userType) {
        return next(adminAuth.getDefaultRoute());
      }
    }

    return next()
  }

  next()
})

export default router