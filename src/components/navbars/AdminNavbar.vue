<template>
  <nav class="admin-navbar">
    
    <div class="left">
      <span class="department">
        {{ department }}
      </span>
    </div>


    <div class="center">
      <RouterLink to="/admin/dashboard">Dashboard</RouterLink>
      <RouterLink v-if="isAdmin" to="/admin/users">Usuarios</RouterLink>
      <RouterLink to="/admin/tickets">Tickets</RouterLink>
    </div>


    <div class="right">
      <span class="user">
        {{ userName }}
      </span>
      <button @click="logout">Salir</button>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useAdminAuthStore } from '@/stores/adminAuth'

const auth = useAdminAuthStore()

const userName = computed(() => auth.user?.name || 'Usuario')
const department = computed(() => auth.departmentName)
const isAdmin = computed(() => auth.isAdmin)

const logout = () => {
  auth.logout()
}
</script>

<style scoped>
.admin-navbar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  background: #111827;
  color: white;
  padding: 0.75rem 1.5rem;
}

.left {
  font-weight: 600;
}

.center {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
}

.center a {
  color: #d1d5db;
  text-decoration: none;
  font-weight: 500;
}

.center a.router-link-active {
  color: white;
  border-bottom: 2px solid white;
}

.right {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
}

.right button {
  background: #ef4444;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  color: white;
  cursor: pointer;
}
</style>
