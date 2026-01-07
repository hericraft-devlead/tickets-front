import { defineStore } from 'pinia'
import api from '@/services/api'
import MoodleService from '@/services/moodleService'

export const useMoodleAuthStore = defineStore('moodleAuth', {
  state: () => ({
    token: null,
    user: null,
    loading: false,
  }),

  actions: {
    /* ===== LOGIN ===== */
    async login(credentials) {
      const { data } = await api.post('/moodle/login', credentials)

      this.token = data.token
      this.user = data.user

      localStorage.setItem(
        'moodle_user',
        JSON.stringify({ token: this.token, user: this.user })
      )
    },

    /* ===== RESTAURAR SESIÓN ===== */
    restoreSession() {
      const data = JSON.parse(localStorage.getItem('moodle_user'))
      if (data?.token && data?.user) {
        this.token = data.token
        this.user = data.user
      }
    },

    /* ===== INFO EXTRA (tipoUsuario) ===== */
    async loadUserInfo() {
      if (!this.user?.id || this.user?.tipoUsuario) return

      const info = await MoodleService.getUserInfoData(this.user.id)

      this.user.tipoUsuario = info.tipoUsuario

      localStorage.setItem(
        'moodle_user',
        JSON.stringify({ token: this.token, user: this.user })
      )
    },

    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('moodle_user')
    },
  },
})
