<template>
  <nav class="navbar">
    <RouterLink to="/moodle/ticket">Nuevo Ticket</RouterLink>
    <RouterLink to="/moodle/tickets">Mis Tickets</RouterLink>

    <div class="right">
      <span class="user">
        {{ auth.user?.name }}
        <small>({{ auth.user?.tipoUsuario }})</small>
      </span>

      <button @click="logout">Salir</button>
    </div>
  </nav>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useMoodleAuthStore } from '@/stores/moodleAuth'

const router = useRouter()
const auth = useMoodleAuthStore()

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  margin-bottom: 22px;
  background: #1e293b;
  color: white;
}

.navbar a {
  color: white;
  text-decoration: none;
  margin-right: 15px;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.navbar a:hover {
  background-color: #374151;
}

.navbar a.router-link-active {
  background-color: #4b5563;
  font-weight: bold;
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

button {
  padding: 5px 15px;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background: #b91c1c;
}
</style>