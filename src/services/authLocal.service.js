import api from './api';

class AuthLocalService {

  async login(credentials) {

    try {
      const response = await api.post('/auth/local/login', credentials);

      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Error en login local'
      );
    }
  }

  async logout() {
    try {
      await api.post('/logout');
    } catch (error) {
      console.warn('Error en logout backend, limpiando frontend:', error);
    } finally {
      this.clearAuthData();
    }
  }

  isAuthenticated() {
    return !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
  }

  getCurrentUser() {
    const user =
      localStorage.getItem('user') ||
      sessionStorage.getItem('user');

    return user ? JSON.parse(user) : null;
  }

  getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  }

  async getProfile() {
    try {
      const response = await api.get('/profile');
      return response.data;
    } catch (error) {
      throw new Error('No se pudo obtener el perfil');
    }
  }
}

export default new AuthLocalService();
