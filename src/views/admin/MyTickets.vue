<template>
  <div class="support-tickets">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1><span class="header-icon">🎯</span> Mis Tickets Asignados</h1>
        <p class="subtitle">Tickets asignados a ti para gestionar</p>
        <div class="user-badge support-badge">
          <span class="badge-icon">👨‍💻</span> Usuario del Departamento
        </div>
      </div>
      <div class="header-right">
        <div class="header-stats">
          <div class="stat-item">
            <span class="stat-label">Total:</span>
            <span class="stat-value">{{ pagination?.total || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Pendientes:</span>
            <span class="stat-value">{{ pendingCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">En proceso:</span>
            <span class="stat-value">{{ inProgressCount }}</span>
          </div>
        </div>
        <button 
          @click="loadTickets" 
          class="refresh-btn"
          :disabled="loading"
          :class="{ 'refreshing': loading }"
        >
          <span v-if="loading">🔄 Cargando...</span>
          <span v-else>🔄 Actualizar</span>
        </button>
      </div>
    </div>

    <!-- Filtros simples -->
    <div class="filters-card">
      <div class="filters-header">
        <h3><span class="filter-icon">🔍</span> Filtros</h3>
      </div>
      
      <div class="filters-body">
        <div class="filters-grid">
          <!-- Estado -->
          <div class="filter-group">
            <label for="status">
              <span class="label-icon">📊</span> Estado:
            </label>
            <select 
              id="status" 
              v-model="filters.status"
              @change="applyFilters"
              class="select-input"
            >
              <option value="">Todos los estados</option>
              <option v-for="status in statuses" :key="status.id" :value="status.id">
                {{ status.name }}
              </option>
            </select>
          </div>
          
          <!-- Prioridad -->
          <div class="filter-group">
            <label for="priority">
              <span class="label-icon">⚠️</span> Prioridad:
            </label>
            <select 
              id="priority" 
              v-model="filters.priority"
              @change="applyFilters"
              class="select-input"
            >
              <option value="">Todas las prioridades</option>
              <option v-for="priority in priorities" :key="priority.id" :value="priority.id">
                {{ priority.name }}
              </option>
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
              <option value="10">10 tickets</option>
              <option value="25">25 tickets</option>
              <option value="50">50 tickets</option>
            </select>
          </div>
          
          <!-- Botón para limpiar filtros -->
          <div class="filter-group">
            <button @click="resetFilters" class="reset-filters-btn">
              <span class="btn-icon">🗑️</span> Limpiar filtros
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Contenido Principal -->
    <div class="content-card">
      <!-- Estados de carga/error -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Cargando tickets...</p>
      </div>
      
      <div v-else-if="error" class="error-state">
        <div class="error-icon">❌</div>
        <h3>Error al cargar tickets</h3>
        <p>{{ error }}</p>
        <button @click="loadTickets" class="retry-btn">
          <span class="btn-icon">🔄</span> Reintentar
        </button>
      </div>
      
      <div v-else-if="tickets.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>No hay tickets asignados</h3>
        <p v-if="hasActiveFilters">No se encontraron tickets con los filtros aplicados</p>
        <p v-else>No tienes tickets asignados en este momento</p>
        <button 
          v-if="hasActiveFilters" 
          @click="resetFilters" 
          class="reset-filters-btn"
        >
          <span class="btn-icon">🗑️</span> Limpiar filtros
        </button>
      </div>
      
      <!-- Tarjetas de tickets -->
      <div v-else class="tickets-container">
        <div class="tickets-grid">
          <div 
            v-for="ticket in tickets" 
            :key="ticket.id" 
            class="ticket-card"
            :class="getPriorityClass(ticket.priority)"
          >
            <div class="ticket-card-header">
              <div class="ticket-header-left">
                <span class="ticket-id">#{{ ticket.id }}</span>
                <span 
                  class="status-badge"
                  :class="getStatusClass(ticket.status)"
                >
                  {{ ticket.status?.name || 'Sin estado' }}
                </span>
                <span 
                  class="priority-badge"
                  :class="getPriorityClass(ticket.priority)"
                >
                  {{ ticket.priority?.name || 'Sin prioridad' }}
                </span>
              </div>
              <div class="ticket-header-right">
                <span class="ticket-date">
                  {{ formatDate(ticket.created_at) }}
                </span>
              </div>
            </div>
            
            <div class="ticket-card-body">
              <h3 class="ticket-title" @click="openTicketDetail(ticket)">
                {{ ticket.title }}
              </h3>
              <p class="ticket-description">
                {{ truncateText(ticket.description, 150) }}
              </p>
              
              <div class="ticket-meta">
                <div class="meta-item">
                  <span class="meta-label">Categoría:</span>
                  <span class="meta-value">{{ ticket.category?.name || 'Sin categoría' }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Departamento:</span>
                  <span class="meta-value">{{ ticket.department?.name || 'Sin departamento' }}</span>
                </div>
                <div class="meta-item" v-if="ticket.moodle_user">
                  <span class="meta-label">Solicitante:</span>
                  <span class="meta-value">{{ ticket.moodle_user.name || ticket.moodle_user.email }}</span>
                </div>
              </div>
            </div>
            
            <div class="ticket-card-footer">
              <div class="ticket-actions">
                <button 
                  @click="openTicketDetail(ticket)"
                  class="action-btn view-btn"
                  title="Ver detalles"
                >
                  <span class="btn-icon">👁️</span> Ver
                </button>
                
                
              </div>
            </div>
          </div>
        </div>
        
        <!-- Paginación simplificada -->
        <div v-if="pagination && pagination.last_page > 1" class="pagination">
          <div class="pagination-info">
            Mostrando {{ tickets.length }} de {{ pagination.total }} tickets
          </div>
          <div class="pagination-controls">
            <button 
              @click="prevPage"
              :disabled="filters.page === 1"
              class="pagination-btn prev"
            >
              ‹ Anterior
            </button>
            
            <span class="page-info">
              Página {{ filters.page }} de {{ pagination.last_page }}
            </span>
            
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

    <!-- Modal de Detalle del Ticket (Simplificado) -->
    <div v-if="showTicketDetail" class="modal-overlay" @click.self="closeTicketDetail">
      <div class="modal-container ticket-detail-modal">
        <div class="modal-header">
          <h3>
            <span class="modal-icon">👁️</span>
            Ticket #{{ selectedTicket?.id }}
            <span 
              class="status-badge modal-status"
              :class="getStatusClass(selectedTicket?.status)"
            >
              {{ selectedTicket?.status?.name || 'Sin estado' }}
            </span>
          </h3>
          <button @click="closeTicketDetail" class="modal-close">×</button>
        </div>
        
        <div class="modal-body">
          <div class="ticket-detail-info">
            <!-- Información principal -->
            <div class="detail-header">
              <h2>{{ selectedTicket?.title }}</h2>
              <div class="detail-meta">
                <span class="meta-item">
                  <strong>Prioridad:</strong>
                  <span 
                    class="priority-badge"
                    :class="getPriorityClass(selectedTicket?.priority)"
                  >
                    {{ selectedTicket?.priority?.name || 'Sin prioridad' }}
                  </span>
                </span>
                <span class="meta-item">
                  <strong>Fecha creación:</strong>
                  {{ formatDateTime(selectedTicket?.created_at) }}
                </span>
              </div>
            </div>
            
            <!-- Descripción completa -->
            <div class="detail-section">
              <h4>📝 Descripción</h4>
              <p class="ticket-description-full">{{ selectedTicket?.description }}</p>
            </div>
            
            <!-- Información adicional -->
            <div class="detail-grid">
              <div class="detail-item">
                <h4>👤 Usuario Solicitante</h4>
                <div v-if="selectedTicket?.moodle_user" class="user-info">
                  <div class="user-details">
                    <span class="user-name">{{ selectedTicket.moodle_user.name || 'Sin nombre' }}</span>
                    <span class="user-email">{{ selectedTicket.moodle_user.email }}</span>
                  </div>
                </div>
                <p v-else class="no-info">No disponible</p>
              </div>
              
              <div class="detail-item">
                <h4>🏢 Departamento</h4>
                <p>{{ selectedTicket?.department?.name || 'Sin departamento' }}</p>
              </div>
              
              <div class="detail-item">
                <h4>📂 Categoría</h4>
                <p>{{ selectedTicket?.category?.name || 'Sin categoría' }}</p>
              </div>
            </div>
            
            <!-- Cambiar estado -->
            <div class="detail-section">
              <h4>🔄 Cambiar Estado</h4>
              <div class="status-actions">
                <div class="status-current">
                  <strong>Estado actual:</strong>
                  <span class="current-status" :class="getStatusClass(selectedTicket?.status)">
                    {{ selectedTicket?.status?.name || 'Sin estado' }}
                  </span>
                </div>
                
                <div class="status-options">
                  <button 
                    v-if="selectedTicket?.status_id === 1"
                    @click="changeTicketStatus(selectedTicket, 2)"
                    class="status-btn start-btn"
                    :disabled="updatingStatus"
                  >
                    <span class="btn-icon">▶️</span> Iniciar trabajo
                  </button>
                  
                  <button 
                    v-if="selectedTicket?.status_id === 2"
                    @click="changeTicketStatus(selectedTicket, 3)"
                    class="status-btn resolve-btn"
                    :disabled="updatingStatus"
                  >
                    <span class="btn-icon">✅</span> Marcar como resuelto
                  </button>
                  
                  <button 
                    v-if="selectedTicket?.status_id === 3 && !selectedTicket?.status?.is_final"
                    @click="changeTicketStatus(selectedTicket, 4)"
                    class="status-btn close-btn"
                    :disabled="updatingStatus"
                  >
                    <span class="btn-icon">🔒</span> Cerrar ticket
                  </button>
                  
                  <button 
                    v-if="selectedTicket?.status_id === 4 && selectedTicket?.status?.is_final"
                    @click="changeTicketStatus(selectedTicket, 1)"
                    class="status-btn reopen-btn"
                    :disabled="updatingStatus"
                  >
                    <span class="btn-icon">🔄</span> Reabrir ticket
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeTicketDetail" class="btn-secondary">
            Cerrar
          </button>
        </div>
      </div>
    </div>

    <!-- Notificación -->
    <div v-if="notification.show" class="snackbar" :class="notification.type">
      <span class="snackbar-icon">{{ notification.icon }}</span>
      <span class="snackbar-message">{{ notification.message }}</span>
      <button @click="hideNotification" class="snackbar-close">×</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import TicketService from '@/services/ticket.service.js'
import { useAdminAuthStore } from '@/stores/adminAuth'

const authStore = useAdminAuthStore()
const loading = ref(false)
const error = ref(null)
const tickets = ref([])
const pagination = ref(null)
const statuses = ref([])
const priorities = ref([])

// Ticket detalle
const showTicketDetail = ref(false)
const selectedTicket = ref(null)
const updatingStatus = ref(false)

// Filtros
const filters = ref({
  status: '',
  priority: '',
  page: 1,
  per_page: 10
})

// Notificaciones
const notification = ref({
  show: false,
  message: '',
  type: 'info',
  icon: 'ℹ️'
})

onMounted(() => {
  console.log('Vista de tickets asignados cargada')
  console.log('Usuario:', authStore.user)
  
  loadStatuses()
  loadPriorities()
  loadTickets()
})

// Computed
const hasActiveFilters = computed(() => {
  return filters.value.status || filters.value.priority
})

const pendingCount = computed(() => {
  return tickets.value.filter(t => t.status_id === 1).length
})

const inProgressCount = computed(() => {
  return tickets.value.filter(t => t.status_id === 2).length
})

// Métodos principales
const loadTickets = async () => {
  loading.value = true
  error.value = null
  
  try {
    const userId = authStore.user?.id
    if (!userId) {
      throw new Error('Usuario no autenticado')
    }
    
    const params = {
      page: filters.value.page,
      per_page: filters.value.per_page
    }
    
    if (filters.value.status) {
      params.status_id = filters.value.status
    }
    
    if (filters.value.priority) {
      params.priority_id = filters.value.priority
    }
    
    console.log('Cargando tickets asignados...')
    console.log('Parámetros:', params)
    
    const response = await TicketService.getAssignedToLocalUser(userId, params)
    
    console.log('Respuesta de tickets asignados:', response)
    
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      tickets.value = response.data.data
    } else if (Array.isArray(response.data)) {
      tickets.value = response.data
    } else {
      tickets.value = []
      console.warn('Estructura de respuesta inesperada:', response)
    }
    
    // Extraer paginación
    const responseData = response.data
    if (responseData) {
      pagination.value = {
        current_page: responseData.current_page || 1,
        last_page: responseData.last_page || 1,
        per_page: responseData.per_page || 10,
        total: responseData.total || tickets.value.length,
        from: responseData.from || 1,
        to: responseData.to || tickets.value.length
      }
    }
    
    console.log(`Tickets asignados cargados: ${tickets.value.length}`)
    
    if (tickets.value.length > 0) {
      showNotification(`Cargados ${tickets.value.length} tickets`, 'success', '✅')
    }
    
  } catch (err) {
    console.error('Error cargando tickets asignados:', err)
    
    if (err.response) {
      error.value = err.response.data?.message || `Error ${err.response.status}`
    } else if (err.request) {
      error.value = 'Error de conexión con el servidor'
    } else {
      error.value = err.message || 'Error desconocido al cargar tickets'
    }
    
    tickets.value = []
    pagination.value = null
    
    showNotification(error.value, 'error', '❌')
  } finally {
    loading.value = false
  }
}

const loadStatuses = async () => {
  try {
    const response = await TicketService.getStatuses()
    
    if (response.data && Array.isArray(response.data)) {
      statuses.value = response.data
    } else if (Array.isArray(response)) {
      statuses.value = response
    } else {
      statuses.value = []
    }
    
  } catch (err) {
    console.error('Error cargando estados:', err)
    statuses.value = []
  }
}

const loadPriorities = async () => {
  try {
    const response = await TicketService.getPriorities()
    
    if (response.data && Array.isArray(response.data)) {
      priorities.value = response.data
    } else if (Array.isArray(response)) {
      priorities.value = response
    } else {
      priorities.value = []
    }
    
  } catch (err) {
    console.error('Error cargando prioridades:', err)
    priorities.value = []
  }
}

// Métodos para estados
const changeTicketStatus = async (ticket, newStatusId) => {
  if (!ticket || !newStatusId) return
  
  updatingStatus.value = true
  
  try {
    // Encontrar nombre del estado
    const status = statuses.value.find(s => s.id === newStatusId)
    const statusName = status ? status.name : `Estado ${newStatusId}`
    
    // Mostrar confirmación
    if (!confirm(`¿Estás seguro de cambiar el estado a "${statusName}"?`)) {
      updatingStatus.value = false
      return
    }
    
    // Actualizar estado del ticket
    await TicketService.update(ticket.id, {
      status_id: newStatusId
    })
    
    showNotification(`Ticket marcado como "${statusName}"`, 'success', '✅')
    
    // Recargar tickets
    await loadTickets()
    
    // Si está abierto el detalle, actualizarlo
    if (showTicketDetail.value && selectedTicket.value?.id === ticket.id) {
      selectedTicket.value.status = status
      selectedTicket.value.status_id = newStatusId
    }
    
  } catch (err) {
    console.error('Error cambiando estado del ticket:', err)
    showNotification('Error al cambiar estado', 'error', '❌')
  } finally {
    updatingStatus.value = false
  }
}

// Métodos para UI
const openTicketDetail = (ticket) => {
  selectedTicket.value = ticket
  showTicketDetail.value = true
}

const closeTicketDetail = () => {
  showTicketDetail.value = false
  selectedTicket.value = null
}

// Filtros
const applyFilters = () => {
  filters.value.page = 1
  loadTickets()
}

const resetFilters = () => {
  filters.value = {
    status: '',
    priority: '',
    page: 1,
    per_page: 10
  }
  loadTickets()
}

// Paginación
const nextPage = () => {
  if (pagination.value && filters.value.page < pagination.value.last_page) {
    filters.value.page++
    loadTickets()
    scrollToTop()
  }
}

const prevPage = () => {
  if (pagination.value && filters.value.page > 1) {
    filters.value.page--
    loadTickets()
    scrollToTop()
  }
}

const changePerPage = () => {
  filters.value.page = 1
  loadTickets()
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Utilidades
const truncateText = (text, length) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

const getStatusClass = (status) => {
  if (!status || !status.name) return 'unknown'
  
  const statusName = status.name.toLowerCase()
  if (statusName.includes('abierto') || statusName.includes('pendiente')) return 'pending'
  if (statusName.includes('proceso')) return 'in-progress'
  if (statusName.includes('resuelto')) return 'resolved'
  if (statusName.includes('cerrado')) return 'closed'
  return 'unknown'
}

const getPriorityClass = (priority) => {
  if (!priority || !priority.name) return 'medium'
  
  const priorityName = priority.name.toLowerCase()
  if (priorityName.includes('baja')) return 'low'
  if (priorityName.includes('media')) return 'medium'
  if (priorityName.includes('alta')) return 'high'
  if (priorityName.includes('urgente')) return 'urgent'
  return 'medium'
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

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateString
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

// Watchers
watch(() => filters.value.per_page, () => {
  if (!loading.value) {
    changePerPage()
  }
})
</script>

<style scoped>
.support-tickets {
  padding: 1.5rem;
  max-width: 100%;
}

/* Header */
.page-header {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
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

.support-badge {
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
  gap: 1rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.8;
}

.stat-value {
  font-weight: bold;
  font-size: 1.125rem;
}

.refresh-btn {
  background: white;
  color: #3b82f6;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.refresh-btn:disabled,
.refresh-btn.refreshing {
  opacity: 0.7;
  cursor: not-allowed;
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
  gap: 1rem;
  margin-bottom: 1.5rem;
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

.select-input {
  padding: 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
  background: white;
  cursor: pointer;
}

.select-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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
  align-self: flex-end;
  margin-top: 1.5rem;
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
  border-top: 3px solid #3b82f6;
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

/* Grid de tickets */
.tickets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.ticket-card {
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.ticket-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border-color: #d1d5db;
}

.ticket-card.low {
  border-left: 4px solid #10b981;
}

.ticket-card.medium {
  border-left: 4px solid #f59e0b;
}

.ticket-card.high {
  border-left: 4px solid #ef4444;
}

.ticket-card.urgent {
  border-left: 4px solid #dc2626;
}

.ticket-card-header {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9fafb;
}

.ticket-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.ticket-id {
  font-weight: bold;
  color: #374151;
  font-size: 0.875rem;
}

.status-badge,
.priority-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.in-progress {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.resolved {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.closed {
  background: #e5e7eb;
  color: #4b5563;
}

.status-badge.unknown {
  background: #f3f4f6;
  color: #6b7280;
}

.priority-badge.low {
  background: #d1fae5;
  color: #065f46;
}

.priority-badge.medium {
  background: #fef3c7;
  color: #92400e;
}

.priority-badge.high {
  background: #fecaca;
  color: #991b1b;
}

.priority-badge.urgent {
  background: #fecaca;
  color: #991b1b;
  font-weight: bold;
}

.ticket-date {
  font-size: 0.75rem;
  color: #6b7280;
}

.ticket-card-body {
  padding: 1.5rem;
}

.ticket-title {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  cursor: pointer;
  transition: color 0.2s;
}

.ticket-title:hover {
  color: #3b82f6;
}

.ticket-description {
  margin: 0 0 1.5rem 0;
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
}

.ticket-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.meta-item {
  display: flex;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.meta-label {
  font-weight: 500;
  color: #374151;
  min-width: 100px;
}

.meta-value {
  color: #6b7280;
}

.ticket-card-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.ticket-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.view-btn {
  background: #3b82f6;
  color: white;
}

.view-btn:hover:not(:disabled) {
  background: #2563eb;
}

.start-btn {
  background: #10b981;
  color: white;
}

.start-btn:hover:not(:disabled) {
  background: #059669;
}

.resolve-btn {
  background: #10b981;
  color: white;
}

.resolve-btn:hover:not(:disabled) {
  background: #059669;
}

.close-btn {
  background: #6b7280;
  color: white;
}

.close-btn:hover:not(:disabled) {
  background: #4b5563;
}

.reopen-btn {
  background: #f59e0b;
  color: white;
}

.reopen-btn:hover:not(:disabled) {
  background: #d97706;
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

.page-info {
  color: #6b7280;
  font-size: 0.875rem;
}

/* Modal de detalle */
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

.ticket-detail-modal {
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 0.75rem;
  overflow: hidden;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9fafb;
}

.modal-header h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #111827;
  font-size: 1.25rem;
}

.modal-status {
  font-size: 0.875rem;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0.25rem;
  border-radius: 0.25rem;
  line-height: 1;
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
}

/* Estilos específicos del detalle */
.ticket-detail-info {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.detail-header {
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.detail-header h2 {
  margin: 0 0 1rem 0;
  color: #111827;
  font-size: 1.5rem;
}

.detail-meta {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.detail-meta .meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.detail-section {
  padding: 1.5rem;
  border-radius: 0.5rem;
  background: #f9fafb;
}

.detail-section h4 {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1.125rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ticket-description-full {
  margin: 0;
  color: #4b5563;
  line-height: 1.6;
  white-space: pre-line;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.detail-item {
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.detail-item h4 {
  margin: 0 0 0.75rem 0;
  color: #374151;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 500;
  color: #111827;
}

.user-email {
  font-size: 0.875rem;
  color: #6b7280;
}

.no-info {
  color: #9ca3af;
  font-style: italic;
  margin: 0;
}

/* Cambiar estado */
.status-actions {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.status-current {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
}

.current-status {
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-weight: 500;
}

.status-options {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.status-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.status-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Botones generales */
.btn-secondary {
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #d1d5db;
  background: #f3f4f6;
  color: #374151;
  font-size: 0.875rem;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

/* Snackbar */
.snackbar {
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

.snackbar.success {
  background: #10b981;
  color: white;
}

.snackbar.error {
  background: #ef4444;
  color: white;
}

.snackbar.info {
  background: #3b82f6;
  color: white;
}

.snackbar-close {
  background: none;
  border: none;
  color: inherit;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  margin-left: auto;
  opacity: 0.8;
}

.snackbar-close:hover {
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
  
  .tickets-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .support-tickets {
    padding: 1rem;
  }
  
  .page-header,
  .filters-card,
  .content-card {
    padding: 1rem;
  }
  
  .tickets-grid {
    grid-template-columns: 1fr;
  }
  
  .ticket-card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .ticket-header-left {
    width: 100%;
    justify-content: space-between;
  }
  
  .pagination {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .pagination-controls {
    justify-content: center;
  }
  
  .snackbar {
    left: 1rem;
    right: 1rem;
    bottom: 1rem;
    max-width: none;
  }
  
  .modal-container {
    max-width: 100%;
    max-height: 80vh;
  }
  
  .status-options {
    flex-direction: column;
  }
  
  .status-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .ticket-actions {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
    justify-content: center;
  }
  
  .filters-grid {
    grid-template-columns: 1fr;
  }
  
  .detail-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>