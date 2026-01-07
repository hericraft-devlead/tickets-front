import api from './api'
import { useMoodleAuthStore } from '@/stores/moodleAuth'

class AuthService {
  async login(credentials) {
    const response = await api.post('/auth/moodle/login', credentials)

    if (response.data.success) {
      const store = useMoodleAuthStore()
      store.session = response.data
      localStorage.setItem(
        'moodle_user',
        JSON.stringify(response.data)
      )
    await store.loadUserInfo()
    }

    return response.data
  }

  async checkAuth() {
    const response = await api.get('/auth/moodle/check')
    return response.data.success
  }

  async getProfile() {
    const response = await api.get('/auth/moodle/profile')
    return response.data
  }

  async logout() {
    await api.post('/auth/moodle/logout')
  }
}

export default new AuthService()
