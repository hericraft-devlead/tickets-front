import api from './api'

class MoodleService {
  async getCourses() {
    try {
      const response = await api.get('/moodle/courses')
      return response.data
    } catch (error) {
      throw new Error(`Error al obtener cursos: ${error.message}`)
    }
  }

  async getUser(userId) {
    try {
      const response = await api.get(`/moodle/user/${userId}`)
      return response.data
    } catch (error) {
      throw new Error(`Error al obtener usuario: ${error.message}`)
    }
  }

  async getUserCourses(userId) {
    try {
      const response = await api.get(`/moodle/user/${userId}/courses`)
      return response.data
    } catch (error) {
      throw new Error(`Error al obtener cursos del usuario: ${error.message}`)
    }
  }

  async getUserByUsername(username) {
    try {
      const response = await api.get(`/moodle/user/username/${username}`)
      return response.data
    } catch (error) {
      throw new Error(`Error al obtener usuario por username: ${error.message}`)
    }
  }

  async callFunction(functionName, params = {}) {
    try {
      const response = await api.post('/moodle/call', {
        function: functionName,
        params: params
      })
      return response.data
    } catch (error) {
      throw new Error(`Error en función ${functionName}: ${error.message}`)
    }
  }

    async getUserInfoData(userId) {
    try {
      const response = await api.get(`/moodle/user/${userId}/info-data`)
      return response.data
    } catch (error) {
      throw new Error(`Error al obtener información adicional del usuario: ${error.message}`)
    }
  }

}

export default new MoodleService()