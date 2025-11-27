<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <h1>Dashboard</h1>
      <div class="user-info">
        <span>Bienvenido, {{ user?.fullname }}</span>
        <button @click="handleLogout" class="logout-btn">Cerrar Sesión</button>
      </div>
    </header>

    <main class="dashboard-content">
      <div class="welcome-section">
        <h2>Hola, {{ user?.firstname }}!</h2>
        <p>Has iniciado sesión exitosamente en el sistema.</p>
      </div>

      <div class="user-details">
        <h3>Tu información:</h3>
        <div class="details-grid">
          <div class="detail-item">
            <strong>Usuario:</strong> {{ user?.username }}
          </div>
          <div class="detail-item">
            <strong>Email:</strong> {{ user?.email }}
          </div>
          <div class="detail-item">
            <strong>Nombre completo:</strong> {{ user?.fullname }}
          </div>
          <div class="detail-item">
            <strong>ID Moodle:</strong> {{ user?.id }}
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import AuthService from '@/services/authService';

export default {
  name: 'Dashboard',
  data() {
    return {
      user: null
    };
  },
  mounted() {
    this.user = AuthService.getCurrentUser();
    
    if (!this.user) {
      this.$router.push('/login');
    }
  },
  methods: {
    handleLogout() {
      AuthService.logout();
      this.$router.push('/login');
    }
  }
};
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.dashboard-header {
  background: white;
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logout-btn {
  padding: 0.5rem 1rem;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.logout-btn:hover {
  background-color: #c82333;
}

.dashboard-content {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.welcome-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  text-align: center;
}

.user-details {
  background: white;
  padding: 2rem;
  border-radius: 8px;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.detail-item {
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  border-left: 4px solid #007bff;
}
</style>