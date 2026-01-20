import api from './api'

export default {
  create(data) {
    return api.post('/tickets', data)
  },
  
  getAll(params = {}) {
    return api.get('/tickets', { params })
  },
  
  getByDepartment(params = {}) {
    return api.get('/department-tickets', { params })
  },
  
  getUnassignedByDepartment(params = {}) {
    return api.get('/department-tickets/unassigned', { params })
  },
  
  getAssignedInDepartment(params = {}) {
    return api.get('/department-tickets/assigned', { params })
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
  },

  getStatuses() {
    return api.get('/ticket-statuses')
  },
  
  getPriorities() {
    return api.get('/priorities') 
  },
  
  assign(ticketId, assignedUserId, notes = null) {
    return api.post(`/tickets/${ticketId}/assign`, {
      assigned_user_id: assignedUserId,
      notes: notes
    })
  },
  
  transfer(ticketId, departmentId, reason = null, notifyUsers = true) {
    return api.post(`/tickets/${ticketId}/transfer`, {
      department_id: departmentId,
      reason: reason,
      notify_users: notifyUsers
    })
  },
  
  reassign(ticketId, newUserId, reason = null) {
    return api.post(`/tickets/${ticketId}/reassign`, {
      assigned_user_id: newUserId,
      reason: reason
    })
  }
}