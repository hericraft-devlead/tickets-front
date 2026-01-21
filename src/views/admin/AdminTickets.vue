<template>
  <div class="admin-tickets">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <h1><span class="header-icon">📋</span> Administración de Tickets</h1>
        <p class="subtitle">Todos los tickets del sistema - Solo vista, asignación y transferencia</p>
        <div class="user-badge admin-badge">
          <span class="badge-icon">👑</span>
          Administrador
        </div>
      </div>
      <div class="header-right">
        <div class="header-stats">
          <div class="stat-item">
            <span class="stat-label">Total:</span>
            <span class="stat-value">{{ pagination?.total || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Página:</span>
            <span class="stat-value">{{ pagination?.current_page || 1 }}/{{ pagination?.last_page || 1 }}</span>
          </div>
        </div>
        <button 
          @click="loadTickets" 
          class="refresh-btn"
          :disabled="loading"
        >
          <span v-if="loading">🔄 Cargando...</span>
          <span v-else>🔄 Actualizar</span>
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
        <!-- Primera fila de filtros -->
        <div class="filters-grid">
          <!-- Búsqueda -->
          <div class="filter-group">
            <label for="search">
              <span class="label-icon">🔎</span> Buscar:
            </label>
            <input 
              id="search"
              type="text" 
              v-model="search"
              @input="handleSearchInput"
              placeholder="Buscar en tickets..."
              class="search-input"
            />
          </div>
          
          <!-- Estado -->
          <div class="filter-group">
            <label for="status">
              <span class="label-icon">📊</span> Estado:
            </label>
            <select 
              id="status" 
              v-model="selectedStatus"
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
              v-model="selectedPriority"
              @change="applyFilters"
              class="select-input"
            >
              <option value="">Todas las prioridades</option>
              <option v-for="priority in priorities" :key="priority.id" :value="priority.id">
                {{ priority.name }}
              </option>
            </select>
          </div>
          
          <!-- Categoría -->
          <div class="filter-group">
            <label for="category">
              <span class="label-icon">🏷️</span> Categoría:
            </label>
            <select 
              id="category" 
              v-model="selectedCategory"
              @change="applyFilters"
              class="select-input"
            >
              <option value="">Todas las categorías</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
          </div>
        </div>
        
        <!-- Segunda fila de filtros -->
        <div class="filters-grid">
          <!-- Rango de tiempo -->
          <div class="filter-group">
            <label for="timeRange">
              <span class="label-icon">📅</span> Rango de tiempo:
            </label>
            <select 
              id="timeRange" 
              v-model="selectedTimeRange"
              @change="onTimeRangeChange"
              class="select-input"
            >
              <option value="">Todo el tiempo</option>
              <option value="today">Hoy</option>
              <option value="yesterday">Ayer</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mes</option>
              <option value="last_month">Mes anterior</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>
          
          <!-- Fechas personalizadas (solo visible cuando se selecciona "personalizado") -->
          <template v-if="selectedTimeRange === 'custom'">
            <div class="filter-group">
              <label>
                <span class="label-icon">📅</span> Desde:
              </label>
              <input 
                type="date" 
                v-model="customStartDate"
                @change="applyFilters"
                class="date-input"
              />
            </div>
            
            <div class="filter-group">
              <label>
                <span class="label-icon">📅</span> Hasta:
              </label>
              <input 
                type="date" 
                v-model="customEndDate"
                @change="applyFilters"
                class="date-input"
              />
            </div>
          </template>
          
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
              <option value="100">100 tickets</option>
            </select>
          </div>
          
          <!-- Ordenar por -->
          <div class="filter-group">
            <label for="sortBy">
              <span class="label-icon">↕️</span> Ordenar por:
            </label>
            <select 
              id="sortBy" 
              v-model="sortBy"
              @change="handleSortChange"
              class="select-input"
            >
              <option value="created_at">Fecha creación</option>
              <option value="updated_at">Última actualización</option>
              <option value="title">Título</option>
              <option value="priority">Prioridad</option>
            </select>
            <button 
              @click="toggleSortOrder" 
              class="sort-order-btn"
              :title="sortOrder === 'asc' ? 'Orden ascendente' : 'Orden descendente'"
            >
              {{ sortOrder === 'asc' ? '↑' : '↓' }}
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
        <h3>No hay tickets</h3>
        <p v-if="hasActiveFilters">No se encontraron tickets con los filtros aplicados</p>
        <p v-else>No hay tickets en el sistema</p>
        <button 
          v-if="hasActiveFilters" 
          @click="clearFilters" 
          class="reset-filters-btn"
        >
          <span class="btn-icon">🗑️</span> Limpiar filtros
        </button>
      </div>
      
      <!-- Tabla de tickets -->
      <div v-else class="tickets-container">
        <div class="table-info">
          <span class="table-count">
            Mostrando {{ filteredTickets.length }} de {{ pagination.total }} tickets
            <span v-if="hasActiveFilters" class="filtered-badge">(Filtrados)</span>
          </span>
        </div>
        
        <div class="table-responsive">
          <table class="tickets-table">
            <thead>
              <tr>
                <th @click="sortByColumn('id')" class="sortable">
                  ID
                  <span v-if="sortBy === 'id'" class="sort-indicator">
                    {{ sortOrder === 'asc' ? '↑' : '↓' }}
                  </span>
                </th>
                <th @click="sortByColumn('title')" class="sortable">
                  Título
                  <span v-if="sortBy === 'title'" class="sort-indicator">
                    {{ sortOrder === 'asc' ? '↑' : '↓' }}
                  </span>
                </th>
                <th>Usuario</th>
                <th>Departamento</th>
                <th>Categoría</th>
                <th @click="sortByColumn('status')" class="sortable">
                  Estado
                  <span v-if="sortBy === 'status'" class="sort-indicator">
                    {{ sortOrder === 'asc' ? '↑' : '↓' }}
                  </span>
                </th>
                <th @click="sortByColumn('priority')" class="sortable">
                  Prioridad
                  <span v-if="sortBy === 'priority'" class="sort-indicator">
                    {{ sortOrder === 'asc' ? '↑' : '↓' }}
                  </span>
                </th>
                <th>Asignado a</th>
                <th @click="sortByColumn('created_at')" class="sortable">
                  Fecha Creación
                  <span v-if="sortBy === 'created_at'" class="sort-indicator">
                    {{ sortOrder === 'asc' ? '↑' : '↓' }}
                  </span>
                </th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ticket in filteredTickets" :key="ticket.id">
                <!-- ID -->
                <td class="ticket-id-cell">
                  <span class="ticket-id">#{{ ticket.id }}</span>
                </td>
                
                <!-- Título y descripción -->
                <td class="ticket-title-cell">
                  <div class="ticket-title-wrapper">
                    <h4 class="ticket-title">{{ ticket.title }}</h4>
                    <p class="ticket-description" :title="ticket.description">
                      {{ truncateText(ticket.description, 80) }}
                    </p>
                  </div>
                </td>
                
                <!-- Usuario Moodle -->
                <td class="user-cell">
                  <div v-if="ticket.moodle_user" class="user-info">
                    <div class="user-avatar">
                      {{ getInitials(ticket.moodle_user.name || ticket.moodle_user.email) }}
                    </div>
                    <div class="user-details">
                      <span class="user-name">{{ ticket.moodle_user.name || 'Sin nombre' }}</span>
                      <span class="user-email">{{ ticket.moodle_user.email }}</span>
                    </div>
                  </div>
                  <span v-else class="no-user">N/A</span>
                </td>
                
                <!-- Departamento -->
                <td class="department-cell">
                  <span v-if="ticket.department" class="department-badge">
                    {{ ticket.department.name }}
                  </span>
                  <span v-else-if="ticket.department_id" class="department-badge">
                    Depto {{ ticket.department_id }}
                  </span>
                  <span v-else class="no-department">Sin departamento</span>
                </td>
                
                <!-- Categoría -->
                <td class="category-cell">
                  <span v-if="ticket.category" class="category-badge">
                    {{ ticket.category.name }}
                  </span>
                  <span v-else class="no-category">Sin categoría</span>
                </td>
                
                <!-- Estado -->
                <td class="status-cell">
                  <span 
                    class="status-badge"
                    :class="getStatusClass(ticket.status)"
                  >
                    {{ ticket.status?.name || 'Sin estado' }}
                  </span>
                </td>
                
                <!-- Prioridad -->
                <td class="priority-cell">
                  <span 
                    class="priority-badge"
                    :class="getPriorityClass(ticket.priority)"
                  >
                    {{ ticket.priority?.name || 'Sin prioridad' }}
                  </span>
                </td>
                
                <!-- Asignado a -->
                <td class="assigned-cell">
                  <div v-if="ticket.assigned_user" class="assigned-user">
                    <div class="user-avatar assigned">
                      {{ getInitials(ticket.assigned_user.name) }}
                    </div>
                    <div class="user-details">
                      <span class="user-name">{{ ticket.assigned_user.name }}</span>
                    </div>
                  </div>
                  <span v-else class="unassigned-badge">
                    ⚠️ Sin asignar
                  </span>
                </td>
                
                <!-- Fecha creación -->
                <td class="date-cell">
                  <div class="date-wrapper">
                    <span class="date">{{ formatDate(ticket.created_at) }}</span>
                    <span class="time">{{ formatTime(ticket.created_at) }}</span>
                  </div>
                </td>
                
                <!-- Acciones -->
                <td class="actions-cell">
                  <div class="action-buttons">
                    <!-- Botón para ver -->
                    <button 
                      @click="openViewModal(ticket)"
                      class="action-btn view-btn"
                      title="Ver detalles"
                    >
                      <span class="btn-icon">👁️</span>
                    </button>
                    
                    <!-- Botón para asignar/reasignar -->
                    <button 
                      @click="openAssignModal(ticket)"
                      class="action-btn assign-btn"
                      :title="ticket.assigned_user ? 'Reasignar ticket' : 'Asignar ticket'"
                    >
                      <span class="btn-icon">{{ ticket.assigned_user ? '🔄' : '👤' }}</span>
                    </button>
                    
                    <!-- Botón para transferir -->
                    <button 
                      @click="openTransferModal(ticket)"
                      class="action-btn transfer-btn"
                      title="Transferir a otro departamento"
                    >
                      <span class="btn-icon">📤</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Paginación -->
        <div v-if="pagination && pagination.last_page > 1" class="pagination">
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

    <!-- Modal para Ver Ticket -->
    <div v-if="showViewModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal-container">
        <div class="modal-header">
          <h3>
            <span class="modal-icon">👁️</span>
            Ticket #{{ selectedTicket?.id }}
          </h3>
          <button @click="closeModals" class="modal-close">×</button>
        </div>
        
        <div class="modal-body">
          <div class="ticket-detail">
            <div class="detail-section">
              <h4>Título</h4>
              <p class="ticket-title">{{ selectedTicket?.title }}</p>
            </div>
            
            <div class="detail-section">
              <h4>Descripción</h4>
              <p class="ticket-description">{{ selectedTicket?.description }}</p>
            </div>
            
            <div class="detail-grid">
              <div class="detail-item">
                <h4>Usuario Solicitante</h4>
                <div v-if="selectedTicket?.moodle_user" class="user-info">
                  <div class="user-details">
                    <span class="user-name">{{ selectedTicket.moodle_user.name || 'Sin nombre' }}</span>
                    <span class="user-email">{{ selectedTicket.moodle_user.email }}</span>
                  </div>
                </div>
                <p v-else class="no-info">No disponible</p>
              </div>
              
              <div class="detail-item">
                <h4>Departamento</h4>
                <p>{{ selectedTicket?.department?.name || 'Sin departamento' }}</p>
              </div>
              
              <div class="detail-item">
                <h4>Categoría</h4>
                <p>{{ selectedTicket?.category?.name || 'Sin categoría' }}</p>
              </div>
              
              <div class="detail-item">
                <h4>Estado</h4>
                <span 
                  class="status-badge"
                  :class="getStatusClass(selectedTicket?.status)"
                >
                  {{ selectedTicket?.status?.name || 'Sin estado' }}
                </span>
              </div>
              
              <div class="detail-item">
                <h4>Prioridad</h4>
                <span 
                  class="priority-badge"
                  :class="getPriorityClass(selectedTicket?.priority)"
                >
                  {{ selectedTicket?.priority?.name || 'Sin prioridad' }}
                </span>
              </div>
              
              <div class="detail-item">
                <h4>Asignado a</h4>
                <div v-if="selectedTicket?.assigned_user" class="assigned-user">
                  <span class="user-name">{{ selectedTicket.assigned_user.name }}</span>
                </div>
                <span v-else class="unassigned-badge">Sin asignar</span>
              </div>
              
              <div class="detail-item">
                <h4>Fecha de creación</h4>
                <p>{{ formatDateTime(selectedTicket?.created_at) }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeModals" class="btn-secondary">
            Cerrar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Asignación/Reasignación -->
    <div v-if="showAssignModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal-container">
        <div class="modal-header">
          <h3>
            <span class="modal-icon">{{ selectedTicket?.assigned_user ? '🔄' : '👤' }}</span>
            {{ selectedTicket?.assigned_user ? 'Reasignar' : 'Asignar' }} Ticket #{{ selectedTicket?.id }}
          </h3>
          <button @click="closeModals" class="modal-close">×</button>
        </div>
        
        <div class="modal-body">
          <!-- Info del ticket -->
          <div class="ticket-info">
            <h4>{{ selectedTicket?.title }}</h4>
            <div class="ticket-meta">
              <span><strong>Departamento:</strong> {{ selectedTicket?.department?.name || 'Sin departamento' }}</span>
              <span><strong>Prioridad:</strong> {{ selectedTicket?.priority?.name || 'Sin prioridad' }}</span>
            </div>
          </div>
          
          <!-- Formulario de asignación -->
          <div class="form-group">
            <label for="assign-user">
              <span class="label-icon">👥</span> 
              Seleccionar usuario:
            </label>
            <select 
              id="assign-user"
              v-model="assignData.userId"
              class="form-select"
              :disabled="loadingUsers"
            >
              <option value="">-- Seleccionar usuario --</option>
              <option 
                v-for="user in departmentUsers" 
                :key="user.id" 
                :value="user.id"
              >
                {{ user.name }} ({{ user.role_name }})
              </option>
            </select>
            <div v-if="loadingUsers" class="loading-small">
              Cargando usuarios...
            </div>
            <div v-if="!loadingUsers && departmentUsers.length === 0" class="warning-message">
              No hay usuarios en este departamento
            </div>
          </div>
          
          <div class="form-group">
            <label for="assign-notes">
              <span class="label-icon">📝</span> 
              Notas (opcional):
            </label>
            <textarea 
              id="assign-notes"
              v-model="assignData.notes"
              class="form-textarea"
              placeholder="Motivo de la asignación/reasignación..."
              rows="3"
            ></textarea>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeModals" class="btn-secondary">
            Cancelar
          </button>
          <button 
            @click="processAssignTicket" 
            class="btn-primary"
            :disabled="!assignData.userId || assignLoading"
          >
            <span v-if="assignLoading">⌛ Procesando...</span>
            <span v-else>{{ selectedTicket?.assigned_user ? 'Reasignar' : 'Asignar' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Transferencia -->
    <div v-if="showTransferModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal-container">
        <div class="modal-header">
          <h3>
            <span class="modal-icon">📤</span>
            Transferir Ticket #{{ selectedTicket?.id }}
          </h3>
          <button @click="closeModals" class="modal-close">×</button>
        </div>
        
        <div class="modal-body">
          <!-- Info del ticket -->
          <div class="ticket-info">
            <h4>{{ selectedTicket?.title }}</h4>
            <div class="ticket-meta">
              <span><strong>Departamento actual:</strong> {{ selectedTicket?.department?.name || 'Sin departamento' }}</span>
            </div>
          </div>
          
          <!-- Formulario de transferencia -->
          <div class="form-group">
            <label for="transfer-department">
              <span class="label-icon">🏢</span> 
              Nuevo departamento:
            </label>
            <select 
              id="transfer-department"
              v-model="transferData.departmentId"
              class="form-select"
              @change="onDepartmentChange"
              :disabled="loadingDepartments"
            >
              <option value="">-- Seleccionar departamento --</option>
              <option 
                v-for="dept in departments" 
                :key="dept.id" 
                :value="dept.id"
                :disabled="dept.id === selectedTicket?.department_id"
              >
                {{ dept.name }}
                {{ dept.id === selectedTicket?.department_id ? '(Actual)' : '' }}
              </option>
            </select>
            <div v-if="loadingDepartments" class="loading-small">
              Cargando departamentos...
            </div>
          </div>
          
          <div class="form-group" v-if="transferData.departmentId">
            <label for="transfer-user">
              <span class="label-icon">👤</span> 
              Asignar a usuario (opcional):
            </label>
            <select 
              id="transfer-user"
              v-model="transferData.userId"
              class="form-select"
              :disabled="loadingUsers"
            >
              <option value="">-- No asignar ahora --</option>
              <option 
                v-for="user in transferDepartmentUsers" 
                :key="user.id" 
                :value="user.id"
              >
                {{ user.name }} ({{ user.role_name }})
              </option>
            </select>
            <div v-if="loadingUsers" class="loading-small">
              Cargando usuarios...
            </div>
          </div>
          
          <div class="form-group">
            <label for="transfer-reason">
              <span class="label-icon">📝</span> 
              Razón de la transferencia:
            </label>
            <textarea 
              id="transfer-reason"
              v-model="transferData.reason"
              class="form-textarea"
              placeholder="Motivo de la transferencia..."
              rows="3"
            ></textarea>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeModals" class="btn-secondary">
            Cancelar
          </button>
          <button 
            @click="processTransferTicket" 
            class="btn-primary"
            :disabled="!transferData.departmentId || transferLoading"
          >
            <span v-if="transferLoading">⌛ Procesando...</span>
            <span v-else>Transferir</span>
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

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import TicketService from '@/services/ticket.service.js'
import UserService from '@/services/user.service.js'
import DepartmentService from '@/services/department.service.js'
import useTicketFilters from '@/composables/useTicketFilters.js'
import categoryService from '@/services/category.service'
import { useAdminAuthStore } from '@/stores/adminAuth'

const authStore = useAdminAuthStore()
const loading = ref(false)
const error = ref(null)
const tickets = ref([])
const pagination = ref(null)
const statuses = ref([])
const priorities = ref([])
const categories = ref([])

// Variables para debounce
let searchTimeout = null

// Usar el composable de filtros
const filterComposable = useTicketFilters(tickets.value)
const {
  search,
  selectedStatus,
  selectedPriority,
  selectedCategory,
  selectedTimeRange,
  customStartDate,
  customEndDate,
  sortBy,
  sortOrder,
  hasActiveFilters,
  applyFilters: applyLocalFilters,
  clearFilters: clearLocalFilters,
  toggleSortOrder,
  sortByColumn
} = filterComposable

// Modales
const showViewModal = ref(false)
const showAssignModal = ref(false)
const showTransferModal = ref(false)
const selectedTicket = ref(null)
const departmentUsers = ref([])
const departments = ref([])
const transferDepartmentUsers = ref([])

// Estados de carga
const assignLoading = ref(false)
const transferLoading = ref(false)
const loadingUsers = ref(false)
const loadingDepartments = ref(false)

// Datos para formularios
const assignData = ref({
  userId: '',
  notes: ''
})

const transferData = ref({
  departmentId: '',
  userId: '',
  reason: ''
})

// Filtros para el backend
const filters = ref({
  status: '',
  priority: '',
  category: '',
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

// Computed
const filteredTickets = computed(() => {
  return applyLocalFilters(tickets.value)
})

const visiblePages = computed(() => {
  if (!pagination.value) return []
  const current = pagination.value.current_page
  const last = pagination.value.last_page
  const delta = 2
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

onMounted(() => {
  console.log('Admin Tickets view mounted')
  loadStatuses()
  loadPriorities()
  loadCategories()
  loadTickets()
})

// Métodos principales
const loadTickets = async () => {
  loading.value = true
  error.value = null
  
  try {
    const params = {
      page: filters.value.page,
      per_page: filters.value.per_page,
      with: 'department,category,priority,status,moodle_user,assigned_user'
    }
    
    // Aplicar filtros del backend
    if (selectedStatus.value) {
      params.status_id = selectedStatus.value
    }
    
    if (selectedPriority.value) {
      params.priority_id = selectedPriority.value
    }
    
    if (selectedCategory.value) {
      params.category_id = selectedCategory.value
    }
    
    // Filtro por fecha
    if (selectedTimeRange.value) {
      const { startDate, endDate } = filterComposable.getDateRange()
      if (startDate) {
        params.start_date = startDate.toISOString().split('T')[0]
      }
      if (endDate) {
        params.end_date = endDate.toISOString().split('T')[0]
      }
    }
    
    // Filtro de búsqueda
    if (search.value.trim()) {
      params.search = search.value.trim()
    }
    
    // Ordenación
    params.sort_by = sortBy.value
    params.sort_order = sortOrder.value
    
    const response = await TicketService.getAll(params)
    
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      tickets.value = response.data.data
    } else if (Array.isArray(response.data)) {
      tickets.value = response.data
    } else {
      tickets.value = []
    }
    
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
    
  } catch (err) {
    console.error('Error cargando tickets:', err)
    
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

const loadCategories = async () => {
  try {
    const response = await categoryService.getAll()
    if (response.data && Array.isArray(response.data)) {
      categories.value = response.data
    } else if (Array.isArray(response)) {
      categories.value = response
    } else {
      categories.value = []
    }
  } catch (err) {
    console.error('Error cargando categorías:', err)
    categories.value = []
  }
}

// Métodos para modales
const openViewModal = (ticket) => {
  selectedTicket.value = ticket
  showViewModal.value = true
}

const openAssignModal = async (ticket) => {
  selectedTicket.value = ticket
  assignData.value = {
    userId: ticket.assigned_user_id || '',
    notes: ''
  }
  
  try {
    loadingUsers.value = true
    if (ticket.department_id) {
      const response = await UserService.getByDepartment(ticket.department_id)
      departmentUsers.value = response.data.users || []
    } else {
      departmentUsers.value = []
    }
    
    showAssignModal.value = true
  } catch (error) {
    console.error('Error cargando usuarios:', error)
    showNotification('Error al cargar usuarios', 'error', '❌')
  } finally {
    loadingUsers.value = false
  }
}

const openTransferModal = async (ticket) => {
  selectedTicket.value = ticket
  transferData.value = {
    departmentId: '',
    userId: '',
    reason: ''
  }
  
  try {
    loadingDepartments.value = true
    const response = await DepartmentService.getAll()
    departments.value = response.data || []
    transferDepartmentUsers.value = []
    
    showTransferModal.value = true
  } catch (error) {
    console.error('Error cargando departamentos:', error)
    showNotification('Error al cargar departamentos', 'error', '❌')
  } finally {
    loadingDepartments.value = false
  }
}

const onDepartmentChange = async () => {
  if (!transferData.value.departmentId) {
    transferDepartmentUsers.value = []
    return
  }
  
  try {
    loadingUsers.value = true
    const response = await UserService.getByDepartment(transferData.value.departmentId)
    transferDepartmentUsers.value = response.data.users || []
  } catch (error) {
    console.error('Error cargando usuarios:', error)
    transferDepartmentUsers.value = []
  } finally {
    loadingUsers.value = false
  }
}

const processAssignTicket = async () => {
  if (!selectedTicket.value || !assignData.value.userId) return
  
  assignLoading.value = true
  
  try {
    if (selectedTicket.value.assigned_user) {
      // Reasignar
      await TicketService.reassign(
        selectedTicket.value.id,
        assignData.value.userId,
        assignData.value.notes
      )
      showNotification('Ticket reasignado correctamente', 'success', '✅')
    } else {
      // Asignar por primera vez
      await TicketService.assign(
        selectedTicket.value.id,
        assignData.value.userId,
        assignData.value.notes
      )
      showNotification('Ticket asignado correctamente', 'success', '✅')
    }
    
    await loadTickets()
    closeModals()
    
  } catch (error) {
    console.error('Error al asignar/reasignar ticket:', error)
    const message = error.response?.data?.message || 'Error al procesar la asignación'
    showNotification(message, 'error', '❌')
  } finally {
    assignLoading.value = false
  }
}

const processTransferTicket = async () => {
  if (!selectedTicket.value || !transferData.value.departmentId) return
  
  transferLoading.value = true
  
  try {
    // Transferir el ticket
    await TicketService.transfer(
      selectedTicket.value.id,
      transferData.value.departmentId,
      transferData.value.reason
    )
    
    // Si se seleccionó un usuario, asignarlo también
    if (transferData.value.userId) {
      await TicketService.assign(
        selectedTicket.value.id,
        transferData.value.userId,
        'Ticket transferido y asignado'
      )
    }
    
    showNotification('Ticket transferido correctamente', 'success', '✅')
    await loadTickets()
    closeModals()
    
  } catch (error) {
    console.error('Error al transferir ticket:', error)
    const message = error.response?.data?.message || 'Error al procesar la transferencia'
    showNotification(message, 'error', '❌')
  } finally {
    transferLoading.value = false
  }
}

const closeModals = () => {
  showViewModal.value = false
  showAssignModal.value = false
  showTransferModal.value = false
  selectedTicket.value = null
  assignData.value = { userId: '', notes: '' }
  transferData.value = { departmentId: '', userId: '', reason: '' }
  departmentUsers.value = []
  transferDepartmentUsers.value = []
}

// Filtros
const applyFilters = () => {
  filters.value.page = 1
  loadTickets()
}

const clearFilters = () => {
  clearLocalFilters()
  filters.value = {
    status: '',
    priority: '',
    category: '',
    page: 1,
    per_page: 10
  }
  loadTickets()
}

// Debounce manual para búsqueda
const handleSearchInput = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    applyFilters()
  }, 500)
}

// Cambiar rango de tiempo
const onTimeRangeChange = () => {
  if (selectedTimeRange.value !== 'custom') {
    customStartDate.value = ''
    customEndDate.value = ''
  }
  applyFilters()
}

// Ordenación
const handleSortChange = () => {
  applyFilters()
}

// Paginación
const nextPage = () => {
  if (pagination.value && filters.value.page < pagination.value.last_page) {
    filters.value.page++
    loadTickets()
  }
}

const prevPage = () => {
  if (pagination.value && filters.value.page > 1) {
    filters.value.page--
    loadTickets()
  }
}

const goToPage = (page) => {
  if (page !== '...') {
    filters.value.page = page
    loadTickets()
  }
}

const changePerPage = () => {
  filters.value.page = 1
  loadTickets()
}

// Utilidades
const truncateText = (text, length) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

const getInitials = (name) => {
  if (!name) return '??'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
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
</script>

<style scoped>
.admin-tickets {
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

.refresh-btn:disabled {
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

/* Tabla */
.table-responsive {
  overflow-x: auto;
}

.tickets-table {
  width: 100%;
  border-collapse: collapse;
}

.tickets-table th {
  background: #f9fafb;
  padding: 0.875rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  font-size: 0.875rem;
  white-space: nowrap;
}

.tickets-table td {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  vertical-align: top;
}

.tickets-table tr:hover {
  background: #f9fafb;
}

.tickets-table tr:last-child td {
  border-bottom: none;
}

/* Celdas específicas */
.ticket-id-cell {
  font-weight: bold;
  color: #374151;
  white-space: nowrap;
}

.ticket-title-cell {
  min-width: 300px;
  max-width: 400px;
}

.ticket-title-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ticket-title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.ticket-description {
  margin: 0;
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.4;
}

/* Celdas de usuario */
.user-cell,
.assigned-cell {
  min-width: 200px;
}

.user-info,
.assigned-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
  flex-shrink: 0;
}

.user-avatar.assigned {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 500;
  font-size: 0.875rem;
  color: #111827;
}

.user-email {
  font-size: 0.75rem;
  color: #6b7280;
}

.no-user,
.no-category {
  color: #9ca3af;
  font-style: italic;
  font-size: 0.875rem;
}

/* Badges */
.category-badge,
.status-badge,
.priority-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.category-badge {
  background: #e0e7ff;
  color: #3730a3;
}

/* Status badges */
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
  color: #374151;
}

.status-badge.unknown {
  background: #f3f4f6;
  color: #6b7280;
}

/* Priority badges */
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

/* Asignado */
.unassigned-badge {
  background: #fef3c7;
  color: #92400e;
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
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
  gap: 0.25rem;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.375rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.view-btn:hover {
  background: #dbeafe;
  color: #1e40af;
}

.assign-btn:hover {
  background: #d1fae5;
  color: #065f46;
}

.transfer-btn:hover {
  background: #e0e7ff;
  color: #3730a3;
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
}

.modal-header h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #111827;
}

.modal-icon {
  font-size: 1.25rem;
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
}

/* Estilos específicos para cada modal */
.ticket-detail {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-section h4 {
  margin: 0 0 0.5rem 0;
  color: #374151;
  font-size: 1rem;
}

.detail-section p {
  margin: 0;
  color: #4b5563;
  line-height: 1.5;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.detail-item {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
}

.detail-item h4 {
  margin: 0 0 0.5rem 0;
  color: #374151;
  font-size: 0.875rem;
}

.ticket-info {
  margin-bottom: 1.5rem;
}

.ticket-info h4 {
  margin: 0 0 0.5rem 0;
  color: #111827;
}

.ticket-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.875rem;
}

/* Estilos del formulario */
.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.form-select,
.form-textarea {
  width: 100%;
  padding: 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.loading-small {
  padding: 0.5rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
}

.warning-message {
  padding: 0.5rem;
  color: #92400e;
  background: #fef3c7;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  text-align: center;
}

/* Botones */
.btn-primary,
.btn-secondary {
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 0.875rem;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #e5e7eb;
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
  
  .filters-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}

@media (max-width: 768px) {
  .admin-tickets {
    padding: 1rem;
  }
  
  .page-header,
  .filters-card,
  .content-card {
    padding: 1rem;
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
}
.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

/* Campos de entrada */
.search-input {
  padding: 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
  width: 100%;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.date-input {
  padding: 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
  width: 100%;
}

.sort-order-btn {
  background: none;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  margin-left: 0.5rem;
  transition: all 0.2s;
}

.sort-order-btn:hover {
  background: #f3f4f6;
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

/* Encabezados ordenables */
.sortable {
  cursor: pointer;
  user-select: none;
  position: relative;
  padding-right: 1.5rem !important;
}

.sortable:hover {
  background: #f0f9ff;
}

.sort-indicator {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.875rem;
  color: #3b82f6;
}

/* Números de página */
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
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.page-number:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>