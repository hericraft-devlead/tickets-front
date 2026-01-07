import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

/* ================= REQUEST ================= */
api.interceptors.request.use(config => {
  const moodleSession = JSON.parse(localStorage.getItem('moodle_user'))
  const adminToken =
    localStorage.getItem('token') || sessionStorage.getItem('token')

  const token = moodleSession?.token || adminToken

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

/* ================= RESPONSE ================= */
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      // ❗ SOLO limpia Moodle si es Moodle
      if (err.config?.url?.includes('/tickets')) {
        localStorage.removeItem('moodle_user')
      }
    }

    return Promise.reject(err)
  }
)

export default api
