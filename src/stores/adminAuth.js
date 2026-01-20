import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import AuthLocalService from '@/services/authLocal.service';

export const useAdminAuthStore = defineStore('adminAuth', () => {
  const session = ref(
    JSON.parse(localStorage.getItem('admin_session'))
  )

  const user = computed(() => session.value?.user)
  const token = computed(() => session.value?.token)

  // ============ NUEVA LÓGICA DE TIPOS DE USUARIO ============
  
  // Determinar tipo de usuario
  const getUserType = () => {
    if (!user.value) return null;
    
    if (user.value.role === 0 && !user.value.department_id) {
      return 'super_admin';
    } else if (user.value.role === 0 && user.value.department_id) {
      return 'department_head';
    } else if (user.value.role === 1 && user.value.department_id) {
      return 'support';
    }
    
    return null;
  }

  // Computed properties para tipos
  const userType = computed(() => getUserType())
  const isSuperAdmin = computed(() => getUserType() === 'super_admin')
  const isDepartmentHead = computed(() => getUserType() === 'department_head')
  const isSupport = computed(() => getUserType() === 'support')
  const isAdmin = computed(() => user.value?.role === 0)

  // Nombre del departamento
  const departmentName = computed(() => {
    if (!user.value) return 'Sin departamento'
    return user.value.department?.name || 'Sin departamento'
  })

  // Etiqueta del tipo de usuario
  const userTypeLabel = computed(() => {
    switch(getUserType()) {
      case 'super_admin': return 'Super Admin';
      case 'department_head': return 'Jefe de Depto';
      case 'support': return 'Soporte';
      default: return 'Usuario';
    }
  })

  // Redirección por defecto según tipo
  const getDefaultRoute = () => {
    const type = getUserType();
    switch(type) {
      case 'super_admin':
        return '/admin/tickets/all';
      case 'department_head':
        return '/admin/tickets/department';
      case 'support':
        return '/admin/tickets/my-tickets';
      default:
        return '/admin/dashboard';
    }
  }

  // ============ FUNCIONES EXISTENTES ============
  
  function login(payload) {
    session.value = payload
    localStorage.setItem('admin_session', JSON.stringify(payload))
  }

  async function logout() {
    try {
      await AuthLocalService.logout();
    } catch (error) {
      console.warn('Error en logout del backend, continuando...', error);
    } finally {
      localStorage.removeItem('admin_session');
      session.value = null;
      
      window.location.href = '/login/local';
    }
  }

  // Función para restaurar sesión (si es necesario)
  function restoreSession() {
    const stored = localStorage.getItem('admin_session');
    if (stored) {
      session.value = JSON.parse(stored);
    }
  }

  return {
    // Valores existentes
    session,
    user,
    token,
    departmentName,
    isAdmin,
    login,
    logout,
    isAuthenticated: () => !!token.value,
    
    // Nuevos valores para tipos de usuario
    getUserType,
    userType,
    isSuperAdmin,
    isDepartmentHead,
    isSupport,
    userTypeLabel,
    getDefaultRoute,
    restoreSession
  }
})