import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useMoodleAuthStore = defineStore('moodleAuth', () => {
  const session = ref(
    JSON.parse(localStorage.getItem('moodle_user'))
  )

  const user = computed(() => session.value?.user)
  const token = computed(() => session.value?.token)

  function logout() {
    localStorage.removeItem('moodle_user')
    session.value = null
    window.location.href = '/login'
  }

  return {
    session,
    user,
    token,
    isAuthenticated: () => !!token.value,
    isProfesor: () => user.value?.tipoUsuario === 'Profesor',
    isAlumno: () => user.value?.tipoUsuario === 'Estudiante',
    logout
  }
})
