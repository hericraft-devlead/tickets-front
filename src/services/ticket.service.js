import api from './api'

export default {
  create(data) {
    return api.post('/tickets', data)
  },
  
  getAll(params = {}) {
    return api.get('/tickets', { params })
  },
  

  getByMoodleUser(moodleUserId, params = {}) {
    return api.get(`/tickets/moodle-user/${moodleUserId}`, { params })
  },
  
  getAssignedToLocalUser(userId, params = {}) {
    return api.get(`/tickets/assigned-to/${userId}`, { params })
  },
  
  getUnassigned(params = {}) {
    return api.get('/tickets/unassigned', { params })
  },
  
  getById(ticketId) {
    return api.get(`/tickets/${ticketId}`)
  },
  

  update(ticketId, data) {
    return api.put(`/tickets/${ticketId}`, data)
  },
  

  delete(ticketId) {
    return api.delete(`/tickets/${ticketId}`)
  }
}