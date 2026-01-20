<template>
  <div class="department-tickets">
    <!-- Header -->
    <div class="page-header department-header">
      <div class="header-left">
        <h1><span class="header-icon">👨‍💼</span> Tickets del Departamento</h1>
        <p class="subtitle">Tickets de {{ departmentName || 'Mi Departamento' }}</p>
        <div class="user-badge department-head-badge">
          <span class="badge-icon">🎯</span>
          Jefe de Departamento
        </div>
      </div>
      
      <div class="header-right">
        <div class="department-stats">
          <div class="stat-item">
            <span class="stat-label">Total:</span>
            <span class="stat-value">{{ departmentStats.total || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Sin asignar:</span>
            <span class="stat-value warning">{{ departmentStats.unassigned || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Asignados:</span>
            <span class="stat-value success">{{ departmentStats.assigned || 0 }}</span>
          </div>
        </div>
        
        <div class="header-actions">
          <button 
            @click="refreshAllData" 
            class="refresh-btn"
            :disabled="isAnyLoading"
          >
            <span v-if="isAnyLoading">🔄 Cargando...</span>
            <span v-else>🔄 Actualizar todo</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Selector de vista -->
    <div class="view-selector">
      <div class="view-tabs">
        <button 
          v-for="view in views" 
          :key="view.id"
          @click="switchView(view.id)"
          :class="{ 'active': activeView === view.id }"
          class="view-tab"
        >
          <span class="tab-icon">{{ view.icon }}</span>
          {{ view.name }}
          <span v-if="view.count !== undefined" class="tab-count">
            ({{ view.count }})
          </span>
        </button>
      </div>
    </div>

    <!-- Contenido según vista -->
    <div class="view-content">
      <!-- Vista: Todos los tickets del departamento -->
      <div v-if="activeView === 'all'" class="view-section">
        <div class="view-header">
          <h3><span class="section-icon">📋</span> Todos los tickets del departamento</h3>
          <p class="section-description">
            Tickets de {{ departmentName || 'tu departamento' }} - Puedes asignarlos a miembros del equipo
          </p>
        </div>
        
        <!-- Filtros -->
        <div class="filters-section">
          <div class="filters-row">
            <div class="filter-group">
              <label for="status">Estado:</label>
              <select 
                id="status" 
                v-model="filters.status"
                @change="applyFilters"
                class="filter-select"
              >
                <option value="">Todos los estados</option>
                <option v-for="status in statuses" :key="status.id" :value="status.id">
                  {{ status.name }}
                </option>
              </select>
            </div>
            
            <div class="filter-group">
              <label for="priority">Prioridad:</label>
              <select 
                id="priority" 
                v-model="filters.priority"
                @change="applyFilters"
                class="filter-select"
              >
                <option value="">Todas las prioridades</option>
                <option v-for="priority in priorities" :key="priority.id" :value="priority.id">
                  {{ priority.name }}
                </option>
              </select>
            </div>
            
            <div class="filter-group">
              <label for="perPage">Mostrar:</label>
              <select 
                id="perPage" 
                v-model="filters.per_page"
                @change="applyFilters"
                class="filter-select"
              >
                <option value="10">10 tickets</option>
                <option value="25">25 tickets</option>
                <option value="50">50 tickets</option>
              </select>
            </div>
            
            <div class="filter-actions">
              <button @click="resetFilters" class="btn-secondary">
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>
        
        <!-- Tabla de tickets -->
        <div class="tickets-table-section">
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <p>Cargando tickets...</p>
          </div>
          
          <div v-else-if="error" class="error-state">
            <div class="error-icon">❌</div>
            <h3>Error al cargar tickets</h3>
            <p>{{ error }}</p>
            <button @click="loadDepartmentTickets" class="btn-primary">Reintentar</button>
          </div>
          
          <div v-else-if="departmentTickets.length === 0" class="empty-state">
            <div class="empty-icon">📭</div>
            <h3>No hay tickets en este departamento</h3>
            <p v-if="hasActiveFilters">No hay tickets con los filtros aplicados</p>
            <p v-else>No hay tickets asignados a este departamento</p>
            <button 
              v-if="hasActiveFilters" 
              @click="resetFilters" 
              class="btn-primary"
            >
              Ver todos
            </button>
          </div>
          
          <div v-else>
            <div class="table-responsive">
              <table class="tickets-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Título</th>
                    <th>Usuario</th>
                    <th>Estado</th>
                    <th>Prioridad</th>
                    <th>Categoría</th>
                    <th>Creado</th>
                    <th>Asignado a</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="ticket in departmentTickets" :key="ticket.id">
                    <td class="ticket-id">#{{ ticket.id }}</td>
                    <td class="ticket-title">
                      <strong>{{ ticket.title }}</strong>
                      <small class="truncated">{{ truncateText(ticket.description, 50) }}</small>
                    </td>
                    <td class="ticket-user">
                      <span v-if="ticket.moodle_user">
                        {{ ticket.moodle_user.name || ticket.moodle_user.email }}
                      </span>
                      <span v-else class="no-user">N/A</span>
                    </td>
                    <td>
                      <span class="status-badge" :class="getStatusClass(ticket.status)">
                        {{ ticket.status?.name || 'Sin estado' }}
                      </span>
                    </td>
                    <td>
                      <span class="priority-badge" :class="getPriorityClass(ticket.priority)">
                        {{ ticket.priority?.name || 'Sin prioridad' }}
                      </span>
                    </td>
                    <td>{{ ticket.category?.name || 'Sin categoría' }}</td>
                    <td class="ticket-date">
                      {{ formatDate(ticket.created_at) }}
                    </td>
                    <td class="ticket-assigned">
                      <span v-if="ticket.assigned_user">
                        {{ ticket.assigned_user.name }}
                      </span>
                      <span v-else class="unassigned-badge">
                        ⚠️ Sin asignar
                      </span>
                    </td>
                    <td class="ticket-actions">
                      <button 
                        v-if="canManageTicket(ticket)"
                        @click="openAssignModal(ticket)"
                        class="btn-action assign"
                        :title="ticket.assigned_user ? 'Reasignar ticket' : 'Asignar ticket'"
                      >
                        {{ ticket.assigned_user ? '🔄' : '👤' }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <!-- Paginación -->
            <div v-if="pagination && pagination.last_page > 1" class="pagination">
              <div class="pagination-info">
                Mostrando {{ departmentTickets.length }} de {{ pagination.total }} tickets
              </div>
              <div class="pagination-controls">
                <button 
                  @click="prevPage"
                  :disabled="!pagination.prev_page_url || filters.page === 1"
                  class="pagination-btn"
                >
                  ← Anterior
                </button>
                
                <span class="page-info">
                  Página {{ filters.page }} de {{ pagination.last_page }}
                </span>
                
                <button 
                  @click="nextPage"
                  :disabled="!pagination.next_page_url || filters.page === pagination.last_page"
                  class="pagination-btn"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Vista: Tickets sin asignar -->
      <div v-else-if="activeView === 'unassigned'" class="view-section">
        <div class="view-header">
          <h3><span class="section-icon">⚠️</span> Tickets sin asignar</h3>
          <p class="section-description">
            Tickets pendientes de asignación en {{ departmentName || 'tu departamento' }}
          </p>
        </div>
        
        <div class="unassigned-tickets-section">
          <div v-if="loadingUnassigned" class="loading-state">
            <div class="spinner"></div>
            <p>Cargando tickets sin asignar...</p>
          </div>
          
          <div v-else-if="unassignedTickets.length === 0" class="empty-state">
            <div class="empty-icon">🎉</div>
            <h3>¡Excelente trabajo!</h3>
            <p>Todos los tickets del departamento están asignados</p>
            <button @click="switchView('all')" class="btn-primary">
              Ver todos los tickets
            </button>
          </div>
          
          <div v-else class="tickets-grid">
            <div 
              v-for="ticket in unassignedTickets" 
              :key="ticket.id"
              class="ticket-card unassigned"
            >
              <div class="ticket-card-header">
                <span class="ticket-id">#{{ ticket.id }}</span>
                <span class="priority-badge" :class="getPriorityClass(ticket.priority)">
                  {{ ticket.priority?.name || 'Sin prioridad' }}
                </span>
                <span class="status-badge" :class="getStatusClass(ticket.status)">
                  {{ ticket.status?.name || 'Sin estado' }}
                </span>
              </div>
              
              <h4 class="ticket-title">{{ ticket.title }}</h4>
              <p class="ticket-description">{{ truncateText(ticket.description, 100) }}</p>
              
              <div class="ticket-meta">
                <span class="meta-item">
                  <strong>Categoría:</strong> {{ ticket.category?.name || 'Sin categoría' }}
                </span>
                <span class="meta-item">
                  <strong>Creado:</strong> {{ formatDate(ticket.created_at) }}
                </span>
                <span class="meta-item" v-if="ticket.moodle_user">
                  <strong>Usuario:</strong> {{ ticket.moodle_user.name || ticket.moodle_user.email }}
                </span>
              </div>
              
              <div class="ticket-actions">
                <button 
                  @click="openAssignModal(ticket)"
                  class="btn-action assign"
                >
                  👤 Asignar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Vista: Tickets asignados -->
      <div v-else-if="activeView === 'assigned'" class="view-section">
        <div class="view-header">
          <h3><span class="section-icon">✅</span> Tickets asignados</h3>
          <p class="section-description">
            Tickets asignados a miembros de {{ departmentName || 'tu departamento' }}
          </p>
        </div>
        
        <div class="assigned-tickets-section">
          <div v-if="loadingAssigned" class="loading-state">
            <div class="spinner"></div>
            <p>Cargando tickets asignados...</p>
          </div>
          
          <div v-else-if="assignedTickets.length === 0" class="empty-state">
            <div class="empty-icon">📭</div>
            <h3>No hay tickets asignados</h3>
            <p>Asigna tickets a los miembros de tu equipo para verlos aquí</p>
            <button @click="switchView('unassigned')" class="btn-primary">
              Ver tickets sin asignar
            </button>
          </div>
          
          <div v-else class="assigned-list">
            <div 
              v-for="ticket in assignedTickets" 
              :key="ticket.id"
              class="assigned-ticket-card"
            >
              <div class="ticket-header">
                <div class="ticket-info">
                  <span class="ticket-id">#{{ ticket.id }}</span>
                  <h4>{{ ticket.title }}</h4>
                  <p class="ticket-description">{{ truncateText(ticket.description, 80) }}</p>
                </div>
                <div class="ticket-status">
                  <span class="status-badge" :class="getStatusClass(ticket.status)">
                    {{ ticket.status?.name || 'Sin estado' }}
                  </span>
                </div>
              </div>
              
              <div class="ticket-details">
                <div class="detail-item">
                  <strong>Prioridad:</strong>
                  <span class="priority-badge" :class="getPriorityClass(ticket.priority)">
                    {{ ticket.priority?.name || 'Sin prioridad' }}
                  </span>
                </div>
                
                <div class="detail-item">
                  <strong>Asignado a:</strong>
                  <span v-if="ticket.assigned_user" class="assigned-user">
                    {{ ticket.assigned_user.name }}
                  </span>
                  <span v-else class="unassigned-badge">Sin asignar</span>
                </div>
                
                <div class="detail-item">
                  <strong>Creado:</strong>
                  {{ formatDateTime(ticket.created_at) }}
                </div>
                
                <div class="detail-item" v-if="ticket.moodle_user">
                  <strong>Solicitante:</strong>
                  {{ ticket.moodle_user.name || ticket.moodle_user.email }}
                </div>
              </div>
              
              <div class="ticket-actions">
                <button 
                  @click="openAssignModal(ticket)"
                  class="btn-secondary"
                >
                  🔄 Reasignar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de asignación/reasignación -->
    <div v-if="showAssignModal" class="modal-overlay" @click.self="closeAssignModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>
            <span class="modal-icon">{{ selectedTicket?.assigned_user ? '🔄' : '👤' }}</span>
            {{ selectedTicket?.assigned_user ? 'Reasignar' : 'Asignar' }} Ticket #{{ selectedTicket?.id }}
          </h3>
          <button @click="closeAssignModal" class="modal-close">×</button>
        </div>
        
        <div class="modal-body">
          <!-- Previa del ticket -->
          <div class="ticket-preview">
            <h4>{{ selectedTicket?.title }}</h4>
            <p class="ticket-description">{{ selectedTicket?.description }}</p>
            <div class="ticket-info-row">
              <span class="info-label">Prioridad:</span>
              <span class="priority-badge" :class="getPriorityClass(selectedTicket?.priority)">
                {{ selectedTicket?.priority?.name || 'Sin prioridad' }}
              </span>
            </div>
            <div class="ticket-info-row">
              <span class="info-label">Categoría:</span>
              <span>{{ selectedTicket?.category?.name || 'Sin categoría' }}</span>
            </div>
            <div class="ticket-info-row" v-if="selectedTicket?.assigned_user">
              <span class="info-label">Actualmente asignado a:</span>
              <span class="current-assigned">{{ selectedTicket.assigned_user.name }}</span>
            </div>
          </div>
          
          <!-- Selección de usuario -->
          <div class="assign-section">
            <label for="assignTo">
              <span class="label-icon">👥</span>
              {{ selectedTicket?.assigned_user ? 'Reasignar a:' : 'Asignar a:' }}
            </label>
            
            <select 
              id="assignTo"
              v-model="assignToUserId"
              class="assign-select"
              :disabled="availableUsers.length === 0 || assigning"
            >
              <option value="">-- Seleccionar usuario --</option>
              <option 
                v-for="user in availableUsers" 
                :key="user.id" 
                :value="user.id"
                :disabled="user.id === selectedTicket?.assigned_user_id"
              >
                {{ user.name }} 
                <span v-if="user.role_name">({{ user.role_name }})</span>
                {{ user.id === selectedTicket?.assigned_user_id ? '(Actual)' : '' }}
              </option>
            </select>
            
            <div v-if="availableUsers.length === 0" class="warning-message">
              ⚠️ No hay usuarios disponibles en este departamento
            </div>
            
            <div v-if="loadingUsers" class="loading-small">
              Cargando usuarios...
            </div>
            
            <!-- Campo para notas -->
            <div class="assign-notes">
              <label for="assignNotes">
                <span class="label-icon">📝</span>
                Notas (opcional):
              </label>
              <textarea 
                id="assignNotes"
                v-model="assignNotes"
                class="notes-textarea"
                placeholder="Motivo de la asignación/reasignación..."
                rows="3"
                :disabled="assigning"
              ></textarea>
            </div>
            
            <div class="modal-actions">
              <button 
                @click="confirmAssignment"
                :disabled="!assignToUserId || assignToUserId === selectedTicket?.assigned_user_id || assigning"
                class="btn-primary"
              >
                <span v-if="assigning">⌛ Procesando...</span>
                <span v-else>{{ selectedTicket?.assigned_user ? '🔄 Reasignar' : '✅ Asignar' }}</span>
              </button>
              <button 
                @click="closeAssignModal" 
                class="btn-secondary"
                :disabled="assigning"
              >
                Cancelar
              </button>
            </div>
          </div>
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

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useAdminAuthStore } from '@/stores/adminAuth'
import TicketService from '@/services/ticket.service.js'
import UserService from '@/services/user.service.js'

const authStore = useAdminAuthStore()

// Estados
const loading = ref(false)
const loadingUnassigned = ref(false)
const loadingAssigned = ref(false)
const loadingUsers = ref(false)
const assigning = ref(false)
const error = ref(null)

// Datos
const departmentTickets = ref([])
const unassignedTickets = ref([])
const assignedTickets = ref([])
const statuses = ref([])
const priorities = ref([])
const availableUsers = ref([])

// Paginación
const pagination = ref(null)

// Filtros
const activeView = ref('all')
const filters = ref({
  status: '',
  priority: '',
  page: 1,
  per_page: 10
})

// Asignación
const showAssignModal = ref(false)
const selectedTicket = ref(null)
const assignToUserId = ref('')
const assignNotes = ref('')

// Notificaciones
const notification = ref({
  show: false,
  message: '',
  type: 'info',
  icon: 'ℹ️'
})

// Computed
const departmentId = computed(() => authStore.user?.department_id)
const departmentName = computed(() => {
  if (!authStore.user?.department) return null
  return authStore.user.department.name || `Departamento ${departmentId.value}`
})

const departmentStats = computed(() => ({
  total: pagination.value?.total || 0,
  unassigned: unassignedTickets.value.length,
  assigned: assignedTickets.value.length
}))

const views = computed(() => [
  { 
    id: 'all', 
    name: 'Todos', 
    icon: '📋',
    count: departmentStats.value.total
  },
  { 
    id: 'unassigned', 
    name: 'Sin asignar', 
    icon: '⚠️',
    count: departmentStats.value.unassigned
  },
  { 
    id: 'assigned', 
    name: 'Asignados', 
    icon: '✅',
    count: departmentStats.value.assigned
  }
])

const hasActiveFilters = computed(() => {
  return filters.value.status || filters.value.priority
})

const isAnyLoading = computed(() => {
  return loading.value || loadingUnassigned.value || loadingAssigned.value
})

// Inicialización
onMounted(() => {
  console.log('Vista de Jefe de Departamento cargada')
  console.log('Usuario:', authStore.user)
  console.log('Departamento ID:', departmentId.value)
  
  if (!departmentId.value) {
    error.value = 'No tienes un departamento asignado'
    showNotification(error.value, 'error', '❌')
    return
  }
  
  loadInitialData()
})

// Métodos principales
const loadInitialData = async () => {
  try {
    await Promise.all([
      loadStatuses(),
      loadPriorities(),
      loadAvailableUsers(),
      refreshViewData()
    ])
  } catch (err) {
    console.error('Error cargando datos iniciales:', err)
    showNotification('Error al cargar datos del departamento', 'error', '❌')
  }
}

// Métodos de carga de datos
const loadData = async (serviceMethod, loadingRef, dataRef, params = null) => {
  loadingRef.value = true
  try {
    const response = await serviceMethod(params)
    
    // Manejar diferentes estructuras de respuesta
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      dataRef.value = response.data.data
      return response.data
    } else if (Array.isArray(response.data)) {
      dataRef.value = response.data
      return { data: response.data }
    } else if (Array.isArray(response)) {
      dataRef.value = response
      return { data: response }
    } else {
      dataRef.value = []
      return { data: [] }
    }
  } catch (err) {
    console.error('Error cargando datos:', err)
    dataRef.value = []
    return { data: [] }
  } finally {
    loadingRef.value = false
  }
}

const loadDepartmentTickets = async () => {
  const params = {
    page: filters.value.page,
    per_page: filters.value.per_page,
    ...(filters.value.status && { status_id: filters.value.status }),
    ...(filters.value.priority && { priority_id: filters.value.priority })
  }
  
  const response = await loadData(
    () => TicketService.getByDepartment(params),
    loading,
    departmentTickets
  )
  
  if (response.current_page) {
    pagination.value = {
      current_page: response.current_page,
      last_page: response.last_page,
      per_page: response.per_page,
      total: response.total,
      from: response.from,
      to: response.to,
      next_page_url: response.next_page_url,
      prev_page_url: response.prev_page_url
    }
  } else if (departmentTickets.value.length > 0) {
    pagination.value = {
      current_page: 1,
      last_page: 1,
      per_page: departmentTickets.value.length,
      total: departmentTickets.value.length,
      from: 1,
      to: departmentTickets.value.length
    }
  } else {
    pagination.value = null
  }
}

const loadUnassignedTickets = async () => {
  await loadData(
    TicketService.getUnassignedByDepartment,
    loadingUnassigned,
    unassignedTickets
  )
}

const loadAssignedTickets = async () => {
  await loadData(
    TicketService.getAssignedInDepartment,
    loadingAssigned,
    assignedTickets
  )
}

const loadStatuses = async () => {
  const response = await TicketService.getStatuses()
  if (Array.isArray(response.data)) {
    statuses.value = response.data
  } else if (Array.isArray(response)) {
    statuses.value = response
  } else {
    statuses.value = []
  }
}

const loadPriorities = async () => {
  const response = await TicketService.getPriorities()
  if (Array.isArray(response.data)) {
    priorities.value = response.data
  } else if (Array.isArray(response)) {
    priorities.value = response
  } else {
    priorities.value = []
  }
}

const loadAvailableUsers = async () => {
  if (!departmentId.value) {
    availableUsers.value = []
    return
  }
  
  loadingUsers.value = true
  try {
    const response = await UserService.getByDepartment(departmentId.value)
    
    if (response.data && response.data.users && Array.isArray(response.data.users)) {
      availableUsers.value = response.data.users
    } else if (Array.isArray(response.data)) {
      availableUsers.value = response.data
    } else {
      availableUsers.value = []
    }
  } catch (err) {
    console.error('Error cargando usuarios del departamento:', err)
    availableUsers.value = []
  } finally {
    loadingUsers.value = false
  }
}

// Métodos de UI y navegación
const switchView = (viewId) => {
  activeView.value = viewId
}

const refreshViewData = async () => {
  console.log('Refrescando datos de la vista actual...')
  
  const promises = [loadDepartmentTickets()]
  
  switch (activeView.value) {
    case 'unassigned':
      promises.push(loadUnassignedTickets())
      break
    case 'assigned':
      promises.push(loadAssignedTickets())
      break
    case 'all':
    default:
      promises.push(loadUnassignedTickets(), loadAssignedTickets())
      break
  }
  
  return Promise.all(promises)
}

const refreshAllData = async () => {
  const loadings = [loading, loadingUnassigned, loadingAssigned]
  const activeLoading = loadings[['all', 'unassigned', 'assigned'].indexOf(activeView.value)]
  
  if (activeLoading) activeLoading.value = true
  
  try {
    await Promise.all([
      loadDepartmentTickets(),
      loadUnassignedTickets(),
      loadAssignedTickets(),
      loadAvailableUsers()
    ])
    showNotification('Datos actualizados correctamente', 'success', '✅')
  } catch (err) {
    console.error('Error recargando datos:', err)
    showNotification('Error al actualizar datos', 'error', '❌')
  } finally {
    loadings.forEach(loadingRef => { loadingRef.value = false })
  }
}

// Métodos de filtros y paginación
const applyFilters = () => {
  filters.value.page = 1
  loadDepartmentTickets()
}

const resetFilters = () => {
  filters.value = {
    status: '',
    priority: '',
    page: 1,
    per_page: 10
  }
  loadDepartmentTickets()
}

const nextPage = () => {
  if (pagination.value && filters.value.page < pagination.value.last_page) {
    filters.value.page++
    loadDepartmentTickets()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const prevPage = () => {
  if (pagination.value && filters.value.page > 1) {
    filters.value.page--
    loadDepartmentTickets()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// Métodos de tickets
const canManageTicket = (ticket) => {
  return ticket.department_id === departmentId.value
}

const openAssignModal = async (ticket) => {
  if (!canManageTicket(ticket)) {
    showNotification('No puedes asignar tickets de otros departamentos', 'error', '❌')
    return
  }
  
  selectedTicket.value = ticket
  assignToUserId.value = ticket.assigned_user_id || ''
  assignNotes.value = ''
  
  if (availableUsers.value.length === 0) {
    await loadAvailableUsers()
  }
  
  showAssignModal.value = true
}

const confirmAssignment = async () => {
  if (!selectedTicket.value || !assignToUserId.value) return
  
  assigning.value = true
  
  try {
    const assignmentData = {
      ticketId: selectedTicket.value.id,
      userId: assignToUserId.value,
      notes: assignNotes.value || `Asignado por ${authStore.user?.name || 'Jefe de Departamento'}`
    }
    
    if (selectedTicket.value.assigned_user) {
      await TicketService.reassign(assignmentData.ticketId, assignmentData.userId, assignmentData.notes)
      showNotification(`Ticket #${selectedTicket.value.id} reasignado correctamente`, 'success', '✅')
    } else {
      await TicketService.assign(assignmentData.ticketId, assignmentData.userId, assignmentData.notes)
      showNotification(`Ticket #${selectedTicket.value.id} asignado correctamente`, 'success', '✅')
    }
    
    // Actualizar datos después de asignación exitosa
    await updateTicketAfterAssignment(selectedTicket.value.id, assignToUserId.value)
    
    closeAssignModal()
    await refreshViewData()
    
  } catch (err) {
    console.error('Error asignando/reasignando ticket:', err)
    
    // Mostrar error solo si realmente falló
    const message = err.response?.data?.message || 'Error al procesar la asignación'
    showNotification(message, 'error', '❌')
  } finally {
    assigning.value = false
  }
}

const updateTicketAfterAssignment = (ticketId, newUserId) => {
  const assignedUser = availableUsers.value.find(user => user.id === newUserId)
  
  // Actualizar en departmentTickets
  const ticketIndex = departmentTickets.value.findIndex(t => t.id === ticketId)
  if (ticketIndex !== -1) {
    departmentTickets.value[ticketIndex].assigned_user = assignedUser
    departmentTickets.value[ticketIndex].assigned_user_id = newUserId
  }
  
  // Actualizar en unassignedTickets
  const unassignedIndex = unassignedTickets.value.findIndex(t => t.id === ticketId)
  if (unassignedIndex !== -1) {
    unassignedTickets.value.splice(unassignedIndex, 1)
  }
  
  // Actualizar en assignedTickets
  if (assignedUser) {
    const assignedIndex = assignedTickets.value.findIndex(t => t.id === ticketId)
    if (assignedIndex !== -1) {
      assignedTickets.value[assignedIndex].assigned_user = assignedUser
    } else {
      const ticketToAdd = departmentTickets.value.find(t => t.id === ticketId)
      if (ticketToAdd) {
        assignedTickets.value.push(ticketToAdd)
      }
    }
  }
  
  // Forzar reactividad
  departmentTickets.value = [...departmentTickets.value]
  unassignedTickets.value = [...unassignedTickets.value]
  assignedTickets.value = [...assignedTickets.value]
}

const closeAssignModal = () => {
  showAssignModal.value = false
  selectedTicket.value = null
  assignToUserId.value = ''
  assignNotes.value = ''
}

// Utilidades
const truncateText = (text, length) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

const getStatusClass = (status) => {
  if (!status?.name) return 'unknown'
  const statusName = status.name.toLowerCase()
  if (statusName.includes('abierto') || statusName.includes('pendiente')) return 'pending'
  if (statusName.includes('progreso')) return 'in-progress'
  if (statusName.includes('resuelto') || statusName.includes('cerrado')) return 'resolved'
  return 'unknown'
}

const getPriorityClass = (priority) => {
  if (!priority?.name) return 'medium'
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
    return new Date(dateString).toLocaleDateString('es-ES', {
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
    return new Date(dateString).toLocaleString('es-ES', {
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
  
  setTimeout(hideNotification, 3000)
}

const hideNotification = () => {
  notification.value.show = false
}

// Watchers
watch(() => filters.value.per_page, () => {
  if (!loading.value) {
    applyFilters()
  }
})
</script>

<style scoped>
/* Estilos para la vista de departamento */
.department-tickets {
  padding: 1.5rem;
}

/* Header */
.department-header {
  background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
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

.subtitle {
  margin: 0.5rem 0;
  opacity: 0.9;
}

.department-head-badge {
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

.department-stats {
  display: flex;
  gap: 1.5rem;
  background: rgba(255, 255, 255, 0.15);
  padding: 0.75rem 1.25rem;
  border-radius: 0.75rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.8;
}

.stat-value {
  font-weight: bold;
  font-size: 1.25rem;
}

.stat-value.warning {
  color: #fbbf24;
}

.stat-value.success {
  color: #34d399;
}

.refresh-btn {
  background: white;
  color: #0ea5e9;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.refresh-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Selector de vistas */
.view-selector {
  background: white;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.view-tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
}

.view-tab {
  flex: 1;
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-weight: 500;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.view-tab:hover {
  background: #f9fafb;
  color: #374151;
}

.view-tab.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
  background: #eff6ff;
}

.tab-count {
  background: #e5e7eb;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  margin-left: 0.25rem;
}

.view-tab.active .tab-count {
  background: #3b82f6;
  color: white;
}

/* Contenido */
.view-content {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.view-section {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.view-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.section-description {
  color: #6b7280;
  margin-top: 0.5rem;
}

/* Filtros */
.filters-section {
  background: #f9fafb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.filters-row {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  flex-wrap: wrap;
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
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  min-width: 150px;
}

/* Tabla */
.tickets-table-section {
  margin-top: 1.5rem;
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 3rem;
}

.spinner {
  border: 3px solid #f3f4f6;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.table-responsive {
  overflow-x: auto;
}

.tickets-table {
  width: 100%;
  border-collapse: collapse;
}

.tickets-table th {
  background: #f9fafb;
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  white-space: nowrap;
}

.tickets-table td {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.tickets-table tr:hover {
  background: #f9fafb;
}

.ticket-id {
  font-weight: bold;
  color: #374151;
}

.ticket-title {
  max-width: 300px;
}

.truncated {
  display: block;
  color: #6b7280;
  margin-top: 0.25rem;
  font-size: 0.75rem;
}

.ticket-date {
  white-space: nowrap;
  color: #6b7280;
}

/* Badges */
.status-badge,
.priority-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
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
  background: #fde68a;
  color: #92400e;
}

.priority-badge.urgent {
  background: #fecaca;
  color: #991b1b;
}

.unassigned-badge {
  color: #f59e0b;
  font-weight: 500;
}

/* Tickets sin asignar */
.tickets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.ticket-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.25rem;
  transition: all 0.2s;
}

.ticket-card.unassigned {
  border-left: 4px solid #f59e0b;
}

.ticket-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.ticket-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.ticket-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 1rem 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.meta-item {
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
}

.ticket-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.btn-primary, .btn-secondary, .btn-success {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  flex: 1;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-secondary {
  background: #9ca3af;
  color: white;
}

.btn-success {
  background: #10b981;
  color: white;
}

/* Modal */
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
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
}

.modal-body {
  padding: 1.5rem;
}

.ticket-preview {
  background: #f9fafb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.ticket-info-row {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.875rem;
}

.assign-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.assign-select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
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
  margin-left: auto;
  opacity: 0.8;
}

.notification-close:hover {
  opacity: 1;
}

/* Estilos para tickets asignados */
.assigned-tickets-section {
  margin-top: 1rem;
}

.assigned-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.assigned-ticket-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.25rem;
  transition: all 0.2s;
  border-left: 4px solid #10b981;
}

.assigned-ticket-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.ticket-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.ticket-info {
  flex: 1;
}

.ticket-info h4 {
  margin: 0.5rem 0;
  color: #374151;
  font-size: 1.125rem;
}

.ticket-description {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0.5rem 0;
  line-height: 1.4;
}

.ticket-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.detail-item strong {
  color: #374151;
  font-weight: 600;
}

.assigned-user {
  color: #10b981;
  font-weight: 500;
  background: #d1fae5;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
}

/* Responsive */
@media (max-width: 768px) {
  .department-header {
    flex-direction: column;
  }
  
  .department-stats {
    width: 100%;
    justify-content: space-around;
  }
  
  .view-tabs {
    flex-direction: column;
  }
  
  .filters-row {
    flex-direction: column;
  }
  
  .filter-group {
    width: 100%;
  }
  
  .filter-select {
    width: 100%;
  }
  
  .tickets-grid {
    grid-template-columns: 1fr;
  }
}
</style>