<template>
  <div class="home-page">
    <!-- Hero section -->
    <section class="hero">
      <h1>Sistema de Soporte Técnico</h1>
      <p>Crea tickets de soporte para reportar problemas o solicitar ayuda</p>
    </section>

    <!-- Ticket público -->
    <section class="ticket-section">
      <div class="section-header">
        <h2>Crear Ticket de Soporte</h2>
        <p>Completa el formulario para crear un nuevo ticket. Puedes hacerlo sin iniciar sesión.</p>
      </div>
      
      <TicketCreate />
    </section>

    <!-- Info adicional -->
    <section class="info-section">
      <div class="info-cards">
        <div class="card">
          <h3>🎓 Usuarios Moodle</h3>
          <p>Si eres estudiante o profesor, inicia sesión con Moodle para vincular tus tickets a tu cuenta.</p>
          <RouterLink to="/login" class="card-link">Iniciar Sesión Moodle</RouterLink>
        </div>
        
        <div class="card">
          <h3>🔧 Administradores</h3>
          <p>Accede al panel de administración para gestionar todos los tickets del sistema.</p>
          <RouterLink to="/login/local" class="card-link">Login Administrador</RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import TicketCreate from '@/views/moodle/TicketCreate.vue'
</script>

<style scoped>
.home-page {
  max-width: 1000px;
  margin: 0 auto;
}

.hero {
  text-align: center;
  padding: 3rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  margin-bottom: 2rem;
}

.hero h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.hero p {
  font-size: 1.2rem;
  opacity: 0.9;
}

.ticket-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.section-header {
  text-align: center;
  margin-bottom: 2rem;
}

.section-header h2 {
  color: #333;
  margin-bottom: 0.5rem;
}

.section-header p {
  color: #666;
}

.info-section {
  margin-top: 3rem;
}

.info-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  text-align: center;
}

.card h3 {
  color: #333;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.card p {
  color: #666;
  margin-bottom: 1.5rem;
}

.card-link {
  display: inline-block;
  padding: 0.5rem 1.5rem;
  background: #4f46e5;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
  transition: background 0.3s;
}

.card-link:hover {
  background: #4338ca;
}
</style>