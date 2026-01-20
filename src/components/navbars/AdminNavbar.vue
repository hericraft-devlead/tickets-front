<template>
  <nav class="admin-navbar">
    <div class="left">
      <span class="user-type-badge" :class="userTypeClass">
        {{ userTypeLabel }}
      </span>
      <span v-if="hasDepartment" class="department">
        {{ departmentName }}
      </span>
    </div>

    <div class="center">
   
      <RouterLink 
        v-if="isSuperAdmin" 
        to="/admin/tickets/all"
        :class="{ 'router-link-active': $route.path.includes('/tickets/all') }"
      >
        Todos los Tickets
      </RouterLink>
      
      <RouterLink 
        v-if="!isSupport" 
        to="/admin/tickets/department"
        :class="{ 'router-link-active': $route.path.includes('/tickets/department') }"
      >
        Tickets Departamento
      </RouterLink>
      
      <RouterLink 
        to="/admin/tickets/my-tickets"
        :class="{ 'router-link-active': $route.path.includes('/my-tickets') }"
      >
        Mis Tickets
      </RouterLink>
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

const authStore = useAdminAuthStore()

const userName = computed(() => authStore.user?.name || 'Usuario')
const departmentName = computed(() => authStore.departmentName)
const userTypeLabel = computed(() => authStore.userTypeLabel)
const hasDepartment = computed(() => authStore.user?.department_id !== null && authStore.user?.department_id !== undefined)

const isSuperAdmin = computed(() => authStore.isSuperAdmin)
const isDepartmentHead = computed(() => authStore.isDepartmentHead)
const isSupport = computed(() => authStore.isSupport)

const userTypeClass = computed(() => {
  switch(authStore.getUserType()) {
    case 'super_admin': return 'badge-super-admin';
    case 'department_head': return 'badge-department-head';
    case 'support': return 'badge-support';
    default: return '';
  }
})

const logout = () => {
  authStore.logout()
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
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-type-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: bold;
}

.badge-super-admin {
  background: #8b5cf6;
  color: white;
}

.badge-department-head {
  background: #0ea5e9;
  color: white;
}

.badge-support {
  background: #10b981;
  color: white;
}

.department {
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
