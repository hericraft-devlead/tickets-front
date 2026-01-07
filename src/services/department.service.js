import api from './api'

export default {
  getAll() {
    return api.get('/departments')
  },

  create(data) {
    return api.post('/departments', data)
  },
}
