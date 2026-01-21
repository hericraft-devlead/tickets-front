<template>
  <div class="admin-users">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1><span class="header-icon">👥</span> Administración de Usuarios</h1>
        <p class="subtitle">Gestiona todos los usuarios del sistema - Administradores y Agentes de Soporte</p>
        <div class="user-badge admin-badge">
          <span class="badge-icon">👑</span>
          Administrador
        </div>
      </div>
      <div class="header-right">
        <div class="header-stats">
          <div class="stat-item">
            <span class="stat-label">Total:</span>
            <span class="stat-value">{{ pagination.total || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Página:</span>
            <span class="stat-value">{{ filters.page || 1 }}/{{ pagination.last_page || 1 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Mostrando:</span>
            <span class="stat-value">{{ pagination.from || 0 }} - {{ pagination.to || 0 }}</span>
          </div>
        </div>
        <button 
          @click="openCreateModal" 
          class="btn-create-user"
        >
          <span class="btn-icon">➕</span> Nuevo Usuario
        </button>
      </div>
    </div>

    <!-- Filtros avanzados -->
    <div class="filters-card">
      <div class="filters-header">
        <h3><span class="filter-icon">🔍</span> Filtros Avanzados</h3>
        <button 
          v-if="hasActiveFilters" 
          @click="clearFilters" 
          class="reset-filters-btn"
        >
          <span class="btn-icon">🗑️</span> Limpiar filtros
        </button>
      </div>
      
      <div class="filters-body">
        <div class="filters-grid">
          <!-- Búsqueda -->
          <div class="filter-group">
            <label for="search">
              <span class="label-icon">🔎</span> Buscar:
            </label>
            <input 
              id="search"
              type="text" 
              v-model="filters.search"
              @input="handleSearchInput"
              placeholder="Buscar por nombre o email..."
              class="search-input"
            />
          </div>
          
          <!-- Departamento -->
          <div class="filter-group">
            <label for="department">
              <span class="label-icon">🏢</span> Departamento:
            </label>
            <select 
              id="department" 
              v-model="filters.department_id"
              @change="applyFilters"
              class="select-input"
            >
              <option value="">Todos los departamentos</option>
              <option v-for="dept in departments" :key="dept.id" :value="dept.id">
                {{ dept.name }}
              </option>
            </select>
          </div>
          
          <!-- Rol -->
          <div class="filter-group">
            <label for="role">
              <span class="label-icon">👤</span> Rol:
            </label>
            <select 
              id="role" 
              v-model="filters.role"
              @change="applyFilters"
              class="select-input"
            >
              <option value="">Todos los roles</option>
              <option value="0">Administrador</option>
              <option value="1">Agente de Soporte</option>
            </select>
          </div>
          
          <!-- Items por página -->
          <div class="filter-group">
            <label for="per_page">
              <span class="label-icon">📄</span> Mostrar:
            </label>
            <select 
              id="per_page" 
              v-model="filters.per_page"
              @change="changePerPage"
              class="select-input"
            >
              <option value="10">10 usuarios</option>
              <option value="25">25 usuarios</option>
              <option value="50">50 usuarios</option>
              <option value="100">100 usuarios</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Contenido Principal -->
    <div class="content-card">
      <!-- Estados de carga/error -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Cargando usuarios...</p>
      </div>
      
      <div v-else-if="error" class="error-state">
        <div class="error-icon">❌</div>
        <h3>Error al cargar usuarios</h3>
        <p>{{ error }}</p>
        <button @click="fetchUsers" class="retry-btn">
          <span class="btn-icon">🔄</span> Reintentar
        </button>
      </div>
      
      <div v-else-if="users.length === 0" class="empty-state">
        <div class="empty-icon">👤</div>
        <h3>No hay usuarios</h3>
        <p v-if="hasActiveFilters">No se encontraron usuarios con los filtros aplicados</p>
        <p v-else>No hay usuarios registrados en el sistema</p>
        <button 
          v-if="hasActiveFilters" 
          @click="clearFilters" 
          class="reset-filters-btn"
        >
          <span class="btn-icon">🗑️</span> Limpiar filtros
        </button>
        <button 
          @click="openCreateModal" 
          class="btn-create-user empty"
        >
          <span class="btn-icon">➕</span> Crear primer usuario
        </button>
      </div>
      
      <!-- Tabla de usuarios -->
      <div v-else class="users-container">
        <div class="table-info">
          <span class="table-count">
            Mostrando {{ pagination.from }} a {{ pagination.to }} de {{ pagination.total }} usuarios
            <span v-if="hasActiveFilters" class="filtered-badge">(Filtrados)</span>
          </span>
        </div>
        
        <div class="table-responsive">
          <table class="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Departamento</th>
                <th>Fecha Creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <!-- ID -->
                <td class="user-id-cell">
                  <span class="user-id">#{{ user.id }}</span>
                </td>
                
                <!-- Nombre -->
                <td class="user-name-cell">
                  <div class="user-info">
                    <div class="user-avatar">
                      {{ getInitials(user.name) }}
                    </div>
                    <div class="user-details">
                      <h4 class="user-name">{{ user.name }}</h4>
                      <span class="user-email-mobile">{{ user.email }}</span>
                    </div>
                  </div>
                </td>
                
                <!-- Email -->
                <td class="user-email-cell">
                  <span class="user-email">{{ user.email }}</span>
                </td>
                
                <!-- Rol -->
                <td class="role-cell">
                  <span 
                    class="role-badge"
                    :class="getRoleBadgeClass(user.role)"
                  >
                    {{ getRoleName(user.role) }}
                  </span>
                </td>
                
                <!-- Departamento -->
                <td class="department-cell">
                  <span v-if="user.department" class="department-badge">
                    {{ user.department.name }}
                  </span>
                  <span v-else class="no-department">Sin departamento</span>
                </td>
                
                <!-- Fecha creación -->
                <td class="date-cell">
                  <div class="date-wrapper">
                    <span class="date">{{ formatDate(user.created_at) }}</span>
                    <span class="time">{{ formatTime(user.created_at) }}</span>
                  </div>
                </td>
                
                <!-- Acciones -->
                <td class="actions-cell">
                  <div class="action-buttons">
                    <!-- Botón para editar -->
                    <button 
                      @click="openEditModal(user)"
                      class="action-btn edit-btn"
                      title="Editar usuario"
                    >
                      <span class="btn-icon">✏️</span>
                    </button>
                    
                    <!-- Botón para eliminar -->
                    <button 
                      @click="confirmDelete(user)"
                      class="action-btn delete-btn"
                      title="Eliminar usuario"
                    >
                      <span class="btn-icon">🗑️</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Paginación -->
        <div v-if="pagination.last_page > 1" class="pagination">
          <div class="pagination-info">
            Página {{ filters.page }} de {{ pagination.last_page }}
          </div>
          <div class="pagination-controls">
            <button 
              @click="prevPage"
              :disabled="filters.page === 1"
              class="pagination-btn prev"
            >
              ‹ Anterior
            </button>
            
            <div class="page-numbers">
              <button 
                v-for="page in visiblePages"
                :key="page"
                @click="goToPage(page)"
                class="page-number"
                :class="{ active: filters.page === page }"
                :disabled="page === '...'"
              >
                {{ page }}
              </button>
            </div>
            
            <button 
              @click="nextPage"
              :disabled="filters.page === pagination.last_page"
              class="pagination-btn next"
            >
              Siguiente ›
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Crear/Editar Usuario -->
    <UserModal
      v-model:visible="showUserModal"
      :is-editing="isEditing"
      :user-data="selectedUser"
      :departments="departments"
      :loading="saving"
      :errors="modalErrors"
      @close="handleModalClose"
      @submit="handleUserSubmit"
    />

    <!-- Modal Confirmación Eliminar -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-container">
        <div class="modal-header">
          <h3>
            <span class="modal-icon">⚠️</span>
            Confirmar Eliminación
          </h3>
          <button @click="closeDeleteModal" class="modal-close">×</button>
        </div>
        
        <div class="modal-body">
          <div class="warning-section">
            <div class="warning-icon">🗑️</div>
            <h4>¿Está seguro de eliminar este usuario?</h4>
            <p>Esta acción eliminará permanentemente al usuario:</p>
            <div class="user-to-delete">
              <div class="user-avatar large">
                {{ getInitials(userToDelete?.name) }}
              </div>
              <div class="user-info-details">
                <h5>{{ userToDelete?.name }}</h5>
                <p>{{ userToDelete?.email }}</p>
                <span class="role-badge" :class="getRoleBadgeClass(userToDelete?.role)">
                  {{ getRoleName(userToDelete?.role) }}
                </span>
              </div>
            </div>
            <p class="text-danger">
              <strong>⚠️ Advertencia:</strong> Esta acción no se puede deshacer. 
              El usuario no podrá acceder al sistema después de la eliminación.
            </p>
          </div>
        </div>
        
        <div class="modal-footer">
          <button
            type="button"
            @click="closeDeleteModal"
            class="btn-secondary"
            :disabled="deleting"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="deleteUser"
            class="btn-danger"
            :disabled="deleting"
          >
            <span v-if="deleting" class="spinner-small"></span>
            Eliminar
          </button>
        </div>
      </div>
    </div>

    <!-- Notificación -->
    <div v-if="notification.show" class="notification" :class="notification.type">
      <span class="notification-icon">{{ notification.icon }}</span>
      <span class="notification-message">{{ notification.message }}</span>
      <button @click="hideNotification" class="notification-close">×</button>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import userService from '@/services/user.service'
import departmentService from '@/services/department.service'
import UserModal from '@/components/usersModal/UserModal.vue'

export default {
  name: 'AdminUsers',
  components: {
    UserModal
  },
  setup() {
    // Estados
    const loading = ref(false)
    const saving = ref(false)
    const deleting = ref(false)
    const error = ref(null)
    const users = ref([])
    const departments = ref([])
    
    // Filtros
    const filters = reactive({
      search: '',
      department_id: '',
      role: '',
      page: 1,
      per_page: 10
    })
    
    // Paginación
    const pagination = reactive({
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: 0,
      from: 0,
      to: 0
    })
    
    // Modales
    const showUserModal = ref(false)
    const showDeleteModal = ref(false)
    const selectedUser = ref(null)
    const userToDelete = ref(null)
    const isEditing = ref(false)
    const modalErrors = ref({})
    
    // Variables para debounce
    let searchTimeout = null
    
    // Notificaciones
    const notification = ref({
      show: false,
      message: '',
      type: 'info',
      icon: 'ℹ️'
    })
    
    // Computed
    const hasActiveFilters = computed(() => {
      return filters.search || filters.department_id || filters.role
    })
    
    const visiblePages = computed(() => {
      if (!pagination.last_page || pagination.last_page <= 1) return [1]
      const current = filters.page
      const last = pagination.last_page
      const delta = 1
      const range = []
      
      for (let i = Math.max(2, current - delta); i <= Math.min(last - 1, current + delta); i++) {
        range.push(i)
      }
      
      if (current - delta > 2) {
        range.unshift('...')
      }
      if (current + delta < last - 1) {
        range.push('...')
      }
      
      range.unshift(1)
      if (last > 1) {
        range.push(last)
      }
      
      return range
    })
    
    // Métodos principales
    const loadInitialData = async () => {
      try {
        const response = await departmentService.getAll()
        departments.value = response.data || []
      } catch (error) {
        console.error('Error cargando departamentos:', error)
        showNotification('Error al cargar departamentos', 'error', '❌')
      }
    }
    
    const fetchUsers = async () => {
      loading.value = true
      error.value = null
      
      try {
        const params = {
          page: filters.page,
          limit: filters.per_page
        }
        
        // Aplicar filtros
        if (filters.search.trim()) {
          params.search = filters.search.trim()
        }
        
        if (filters.department_id) {
          params.department_id = filters.department_id
        }
        
        if (filters.role !== '') {
          params.role = filters.role
        }
        
        const response = await userService.getAll(params)
        
        // Manejar diferentes formatos de respuesta
        if (response.data && Array.isArray(response.data.data)) {
          users.value = response.data.data
        } else if (Array.isArray(response.data)) {
          users.value = response.data
        } else {
          users.value = []
        }
        
        // Actualizar paginación
        if (response.data) {
          Object.assign(pagination, {
            current_page: response.data.current_page || filters.page,
            last_page: response.data.last_page || 1,
            per_page: response.data.per_page || filters.per_page,
            total: response.data.total || users.value.length,
            from: response.data.from || ((filters.page - 1) * filters.per_page) + 1,
            to: response.data.to || Math.min(filters.page * filters.per_page, response.data.total || users.value.length)
          })
        }
        
      } catch (err) {
        console.error('Error cargando usuarios:', err)
        
        if (err.response) {
          error.value = err.response.data?.message || `Error ${err.response.status}`
        } else if (err.request) {
          error.value = 'Error de conexión con el servidor'
        } else {
          error.value = err.message || 'Error desconocido al cargar usuarios'
        }
        
        users.value = []
        pagination.total = 0
        
        showNotification(error.value, 'error', '❌')
      } finally {
        loading.value = false
      }
    }
    
    // Debounce manual para búsqueda
    const handleSearchInput = () => {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        filters.page = 1
        fetchUsers()
      }, 500)
    }
    
    // Aplicar filtros
    const applyFilters = () => {
      filters.page = 1
      fetchUsers()
    }
    
    const clearFilters = () => {
      filters.search = ''
      filters.department_id = ''
      filters.role = ''
      filters.page = 1
      fetchUsers()
    }
    
    // Paginación
    const nextPage = () => {
      if (filters.page < pagination.last_page) {
        filters.page++
        fetchUsers()
      }
    }
    
    const prevPage = () => {
      if (filters.page > 1) {
        filters.page--
        fetchUsers()
      }
    }
    
    const goToPage = (page) => {
      if (page !== '...' && page !== filters.page) {
        filters.page = page
        fetchUsers()
      }
    }
    
    const changePerPage = () => {
      filters.page = 1
      fetchUsers()
    }
    
    // Métodos para modales de usuario
    const openCreateModal = () => {
      isEditing.value = false
      selectedUser.value = null
      modalErrors.value = {}
      showUserModal.value = true
    }
    
    const openEditModal = (user) => {
      isEditing.value = true
      selectedUser.value = user
      modalErrors.value = {}
      showUserModal.value = true
    }
    
    const handleModalClose = () => {
      showUserModal.value = false
      modalErrors.value = {}
    }
    
    const handleUserSubmit = async (userData) => {
      saving.value = true
      modalErrors.value = {}
      
      try {
        if (isEditing.value) {
          await userService.update(userData.id, userData)
          showNotification('Usuario actualizado correctamente', 'success', '✅')
        } else {
          await userService.create(userData)
          showNotification('Usuario creado correctamente', 'success', '✅')
        }
        
        showUserModal.value = false
        fetchUsers()
      } catch (err) {
        if (err.response?.status === 422) {
          modalErrors.value = err.response.data.errors || {}
          showNotification('Por favor, corrija los errores en el formulario', 'error', '❌')
        } else {
          const message = err.response?.data?.message || 'Error al guardar el usuario'
          showNotification(message, 'error', '❌')
        }
      } finally {
        saving.value = false
      }
    }
    
    // Métodos para modal de eliminar
    const confirmDelete = (user) => {
      userToDelete.value = user
      showDeleteModal.value = true
    }
    
    const closeDeleteModal = () => {
      showDeleteModal.value = false
      userToDelete.value = null
    }
    
    const deleteUser = async () => {
      deleting.value = true
      try {
        await userService.delete(userToDelete.value.id)
        showNotification('Usuario eliminado correctamente', 'success', '✅')
        closeDeleteModal()
        fetchUsers()
      } catch (err) {
        const message = err.response?.data?.message || 'Error al eliminar el usuario'
        showNotification(message, 'error', '❌')
      } finally {
        deleting.value = false
      }
    }
    
    // Utilidades
    const getInitials = (name) => {
      if (!name) return '??'
      return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    }
    
    const getRoleBadgeClass = (role) => {
      switch (parseInt(role)) {
        case 0: return 'admin'
        case 1: return 'agent'
        default: return 'unknown'
      }
    }
    
    const getRoleName = (role) => {
      switch (parseInt(role)) {
        case 0: return 'Administrador'
        case 1: return 'Agente'
        default: return 'Usuario'
      }
    }
    
    const formatDate = (dateString) => {
      if (!dateString) return ''
      try {
        const date = new Date(dateString)
        return date.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      } catch {
        return dateString
      }
    }
    
    const formatTime = (dateString) => {
      if (!dateString) return ''
      try {
        const date = new Date(dateString)
        return date.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        })
      } catch {
        return ''
      }
    }
    
    // Notificaciones
    const showNotification = (message, type = 'info', icon = 'ℹ️') => {
      notification.value = {
        show: true,
        message,
        type,
        icon
      }
      
      setTimeout(() => {
        hideNotification()
      }, 3000)
    }
    
    const hideNotification = () => {
      notification.value.show = false
    }
    
    // Inicializar
    onMounted(async () => {
      await loadInitialData()
      await fetchUsers()
    })
    
    // Watch para cambios en filtros
    watch(() => filters.page, fetchUsers)
    watch(() => filters.per_page, fetchUsers)
    
    return {
      // Estados
      loading,
      saving,
      deleting,
      error,
      users,
      departments,
      
      // Filtros y paginación
      filters,
      pagination,
      
      // Computed
      hasActiveFilters,
      visiblePages,
      
      // Modales
      showUserModal,
      showDeleteModal,
      selectedUser,
      userToDelete,
      isEditing,
      modalErrors,
      
      // Métodos
      fetchUsers,
      handleSearchInput,
      applyFilters,
      clearFilters,
      nextPage,
      prevPage,
      goToPage,
      changePerPage,
      openCreateModal,
      openEditModal,
      handleModalClose,
      handleUserSubmit,
      confirmDelete,
      closeDeleteModal,
      deleteUser,
      getInitials,
      getRoleBadgeClass,
      getRoleName,
      formatDate,
      formatTime,
      showNotification,
      hideNotification,
      notification
    }
  }
}
</script>

<style scoped>
.admin-users {
  padding: 1.5rem;
  max-width: 100%;
}

/* Header */
.page-header {
  background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
  border-radius: 0.75rem;
  padding: 1.5rem 2rem;
  color: white;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left h1 {
  margin: 0;
  font-size: 1.875rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-icon {
  font-size: 2rem;
}

.subtitle {
  margin: 0.5rem 0;
  opacity: 0.9;
}

.admin-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  margin-top: 0.5rem;
}

.header-right {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: flex-end;
}

.header-stats {
  display: flex;
  gap: 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-weight: bold;
  font-size: 1.25rem;
}

.btn-create-user {
  background: white;
  color: #7c3aed;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-create-user:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.btn-create-user.empty {
  margin-top: 1rem;
  align-self: center;
}

/* Filtros */
.filters-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.filters-header h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #374151;
}

.filters-body {
  border-top: 1px solid #e5e7eb;
  padding-top: 1.5rem;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-input,
.select-input {
  padding: 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
  background: white;
  cursor: pointer;
}

.search-input:focus,
.select-input:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.reset-filters-btn,
.retry-btn {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.reset-filters-btn:hover,
.retry-btn:hover {
  background: #e5e7eb;
}

/* Contenido principal */
.content-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Estados */
.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 3rem;
}

.loading-spinner {
  border: 3px solid #f3f4f6;
  border-top: 3px solid #7c3aed;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.spinner-small {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 0.5rem;
}

.error-icon,
.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-state .error-icon {
  color: #ef4444;
}

.empty-state .empty-icon {
  color: #9ca3af;
}

/* Tabla */
.table-responsive {
  overflow-x: auto;
  margin-bottom: 1.5rem;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th {
  background: #f9fafb;
  padding: 0.875rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  font-size: 0.875rem;
  white-space: nowrap;
}

.users-table td {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  vertical-align: middle;
}

.users-table tr:hover {
  background: #f9fafb;
}

.users-table tr:last-child td {
  border-bottom: none;
}

/* Celdas específicas */
.user-id-cell {
  font-weight: bold;
  color: #374151;
  white-space: nowrap;
}

.user-name-cell {
  min-width: 250px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: bold;
  flex-shrink: 0;
}

.user-avatar.large {
  width: 48px;
  height: 48px;
  font-size: 1rem;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.user-email-mobile {
  display: none;
  font-size: 0.75rem;
  color: #6b7280;
}

.user-email-cell {
  color: #6b7280;
  font-size: 0.875rem;
}

/* Badges */
.role-badge {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.role-badge.admin {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: #78350f;
}

.role-badge.agent {
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  color: #1e40af;
}

.role-badge.unknown {
  background: #e5e7eb;
  color: #374151;
}

.department-badge {
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.no-department {
  color: #9ca3af;
  font-style: italic;
  font-size: 0.875rem;
}

/* Fecha */
.date-cell {
  white-space: nowrap;
}

.date-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.date {
  font-size: 0.875rem;
  color: #111827;
}

.time {
  font-size: 0.75rem;
  color: #6b7280;
}

/* Acciones */
.actions-cell {
  white-space: nowrap;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
}

.edit-btn:hover {
  background: #dbeafe;
  color: #1e40af;
}

.delete-btn:hover {
  background: #fecaca;
  color: #dc2626;
}

/* Información de tabla */
.table-info {
  margin-bottom: 1rem;
  padding: 0.5rem 0;
}

.table-count {
  font-size: 0.875rem;
  color: #6b7280;
}

.filtered-badge {
  background: #e0e7ff;
  color: #3730a3;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  margin-left: 0.5rem;
}

/* Paginación */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
  margin-top: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.pagination-info {
  color: #6b7280;
  font-size: 0.875rem;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  color: #374151;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
  margin: 0 0.5rem;
}

.page-number {
  padding: 0.375rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  background: white;
  cursor: pointer;
  font-size: 0.875rem;
  min-width: 2.5rem;
}

.page-number:hover:not(.active):not(:disabled) {
  background: #f3f4f6;
}

.page-number.active {
  background: #7c3aed;
  color: white;
  border-color: #7c3aed;
}

.page-number:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal de eliminación (estilos específicos) */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  background: white;
  border-radius: 0.75rem;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-radius: 0.75rem 0.75rem 0 0;
}

.modal-header h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #111827;
  font-size: 1.25rem;
  font-weight: 600;
}

.modal-icon {
  font-size: 1.5rem;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.75rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0.25rem;
  border-radius: 0.25rem;
  line-height: 1;
  transition: all 0.2s;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #111827;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex-grow: 1;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  background: #f9fafb;
  border-radius: 0 0 0.75rem 0.75rem;
}

/* Estilos específicos para modal de eliminación */
.warning-section {
  text-align: center;
}

.warning-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.user-to-delete {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  margin: 1rem 0;
}

.user-info-details {
  text-align: left;
}

.user-info-details h5 {
  margin: 0;
  font-size: 1rem;
  color: #111827;
}

.user-info-details p {
  margin: 0.25rem 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.text-danger {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 1rem;
  padding: 0.75rem;
  background: #fef2f2;
  border-radius: 0.375rem;
  border-left: 4px solid #ef4444;
}

/* Botones para modal de eliminación */
.btn-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 100px;
}

.btn-danger:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3);
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Notificación */
.notification {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  animation: slideIn 0.3s ease-out;
  z-index: 1000;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification.success {
  background: #10b981;
  color: white;
}

.notification.error {
  background: #ef4444;
  color: white;
}

.notification.info {
  background: #3b82f6;
  color: white;
}

.notification-close {
  background: none;
  border: none;
  color: inherit;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  margin-left: auto;
  opacity: 0.8;
}

.notification-close:hover {
  opacity: 1;
}

/* Responsive */
@media (max-width: 1024px) {
  .page-header {
    flex-direction: column;
  }
  
  .header-right {
    width: 100%;
    align-items: stretch;
  }
  
  .header-stats {
    justify-content: space-around;
  }
  
  .filters-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}

@media (max-width: 768px) {
  .admin-users {
    padding: 1rem;
  }
  
  .page-header,
  .filters-card,
  .content-card {
    padding: 1rem;
  }
  
  .user-email-mobile {
    display: block;
  }
  
  .user-email-cell {
    display: none;
  }
  
  .pagination {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .pagination-controls {
    justify-content: center;
  }
  
  .notification {
    left: 1rem;
    right: 1rem;
    bottom: 1rem;
    max-width: none;
  }
  
  .modal-container {
    max-width: 100%;
    max-height: 80vh;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .action-btn {
    width: 32px;
    height: 32px;
  }
}

@media (max-width: 480px) {
  .header-stats {
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
  }
  
  .stat-item {
    flex-direction: row;
    gap: 0.5rem;
  }
  
  .filters-grid {
    grid-template-columns: 1fr;
  }
  
  .users-table th,
  .users-table td {
    padding: 0.75rem 0.5rem;
  }
  
  .btn-primary,
  .btn-secondary,
  .btn-danger {
    padding: 0.625rem 1rem;
    min-width: 80px;
    font-size: 0.75rem;
  }
  
  .modal-header {
    padding: 1rem;
  }
  
  .modal-body {
    padding: 1rem;
  }
  
  .modal-footer {
    padding: 1rem;
  }
}
</style>