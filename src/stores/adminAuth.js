import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import AuthLocalService from '@/services/authLocal.service';

export const useAdminAuthStore = defineStore('adminAuth', () => {
  const session = ref(
    JSON.parse(localStorage.getItem('admin_session'))
  )

  const user = computed(() => session.value?.user)
  const token = computed(() => session.value?.token)

  const departmentName = computed(() => {
    if (!user.value) return 'Sin departamento'
    return user.value.department?.name || 'Sin departamento'
  })

  const isAdmin = computed(() => user.value?.role === 0)

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

  return {
    session,
    user,
    token,
    departmentName,
    isAdmin,
    login,
    logout,
    isAuthenticated: () => !!token.value
  }
})