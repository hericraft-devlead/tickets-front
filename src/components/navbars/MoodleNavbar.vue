<template>
  <nav class="navbar">
    <RouterLink to="/moodle/tickets">Mis Tickets</RouterLink>
    <RouterLink to="/moodle/tickets/nuevo">Nuevo Ticket</RouterLink>

    <div class="right">
      <span class="user">
        {{ auth.user?.fullname }}
        <small>({{ auth.user?.tipoUsuario }})</small>
      </span>

      <button @click="auth.logout">Salir</button>
    </div>
  </nav>
</template>

<script setup>
import { useMoodleAuthStore } from '@/stores/moodleAuth'

const auth = useMoodleAuthStore()
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: #1e293b;
  color: white;
}
.right {
  display: flex;
  gap: 15px;
  align-items: center;
}
.user small {
  opacity: 0.7;
  font-size: 0.75rem;
}
</style>
