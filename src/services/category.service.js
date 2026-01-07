import api from './api'

export default {
  getAll() {
    return api.get('/categories')
  },

  create(data) {
    return api.post('/categories', data)
  },
}
