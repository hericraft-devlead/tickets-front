import api from './api';

class AuthService {
  async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials);
      
      if (response.data.success) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('token', response.data.token);
        
        sessionStorage.setItem('user', JSON.stringify(response.data.user));
        sessionStorage.setItem('token', response.data.token);
      }
      
      return response.data;
    } catch (error) {
      throw new Error(`Error en login: ${error.response?.data?.message || error.message}`);
    }
  }

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
  }

  isAuthenticated() {
    return !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
  }

  getCurrentUser() {
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  async checkAuth() {
    try {
      const response = await api.get('/auth/check');
      return response.data.success;
    } catch (error) {
      this.logout();
      return false;
    }
  }

  async getProfile() {
    try {
      const user = this.getCurrentUser();
      if (!user) throw new Error('No hay usuario autenticado');

      const response = await api.get('/auth/profile?user_id=' + user.id);
      return response.data;
    } catch (error) {
      throw new Error(`Error al obtener perfil: ${error.message}`);
    }
  }
}

export default new AuthService();