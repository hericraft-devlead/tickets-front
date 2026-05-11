<template>
  <div class="ticket-list">
    <!-- Header -->
    <div class="list-header">
      <div class="header-left">
        <h1>Mis Tickets</h1>
        <div class="header-stats">
          <div class="stat-item">
            <span class="stat-label">Total:</span>
            <span class="stat-value">{{ allTickets.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Abiertos:</span>
            <span class="stat-value">{{ openTicketsCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Resueltos:</span>
            <span class="stat-value">{{ resolvedTicketsCount }}</span>
          </div>
        </div>
      </div>
      
      <div class="header-actions">
        <RouterLink to="/moodle/ticket" class="btn-primary">
          <span class="icon">➕</span> Nuevo Ticket
        </RouterLink>
      </div>
    </div>


    <!-- Filtros -->
    <div class="filters" v-if="allTickets.length > 0 || hasActiveFilters">
      <div class="filter-group">
        <label>Buscar:</label>
        <input 
          v-model="search" 
          type="text" 
          placeholder="Buscar por título, descripción o nombre"
          @input="applyFilters"
        />
      </div>
      
      <div class="filter-group">
        <label>Estado:</label>
        <select v-model="selectedStatus" @change="applyFilters">
          <option value="">Todos</option>
          <option 
            v-for="status in statusOptions" 
            :key="status.id"
            :value="status.id"
          >
            {{ status.name }}
          </option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>Prioridad:</label>
        <select v-model="selectedPriority" @change="applyFilters">
          <option value="">Todas</option>
          <option 
            v-for="priority in priorityOptions" 
            :key="priority.id"
            :value="priority.id"
          >
            {{ priority.name }}
          </option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>Categoría:</label>
        <select v-model="selectedCategory" @change="applyFilters">
          <option value="">Todas</option>
          <option 
            v-for="category in categoryOptions" 
            :key="category.id"
            :value="category.id"
          >
            {{ category.name }}
          </option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>Periodo:</label>
        <select v-model="selectedTimeRange" @change="applyFilters">
          <option value="">Todos</option>
          <option value="today">Hoy</option>
          <option value="yesterday">Ayer</option>
          <option value="week">Esta semana</option>
          <option value="month">Este mes</option>
          <option value="last_month">Mes anterior</option>
          <option value="custom">Personalizado</option>
        </select>
      </div>
      
      <div v-if="selectedTimeRange === 'custom'" class="filter-group custom-dates">
        <label>Desde:</label>
        <input 
          type="date" 
          v-model="customStartDate"
          @change="applyFilters"
        />
        <label>Hasta:</label>
        <input 
          type="date" 
          v-model="customEndDate"
          @change="applyFilters"
        />
      </div>
      
      <div class="filter-group">
        <label>Ordenar por:</label>
        <div class="sort-controls">
          <select v-model="sortBy" @change="applyFilters">
            <option value="created_at">Fecha de creación</option>
            <option value="updated_at">Última actualización</option>
            <option value="title">Título</option>
            <option value="priority">Prioridad</option>
          </select>
          <button @click="toggleSortOrder" class="sort-btn">
            {{ sortOrder === 'desc' ? '⬇️' : '⬆️' }}
          </button>
        </div>
      </div>
      
      <div class="filter-group filter-actions">
        <button 
          v-if="hasActiveFilters" 
          @click="clearFilters" 
          class="btn-secondary"
        >
          🗑️ Limpiar filtros
        </button>
      </div>
    </div>

    <!-- Información de filtros activos -->
    <div v-if="hasActiveFilters" class="active-filters">
      <div class="filter-tags">
        <span class="filter-tag" v-if="search">
          Buscar: "{{ search }}"
          <span @click="search = ''; applyFilters()" class="remove-filter">×</span>
        </span>
        <span class="filter-tag" v-if="selectedStatus">
          Estado: {{ getStatusName(selectedStatus) }}
          <span @click="selectedStatus = ''; applyFilters()" class="remove-filter">×</span>
        </span>
        <span class="filter-tag" v-if="selectedPriority">
          Prioridad: {{ getPriorityName(selectedPriority) }}
          <span @click="selectedPriority = ''; applyFilters()" class="remove-filter">×</span>
        </span>
        <span class="filter-tag" v-if="selectedCategory">
          Categoría: {{ getCategoryName(selectedCategory) }}
          <span @click="selectedCategory = ''; applyFilters()" class="remove-filter">×</span>
        </span>
        <span class="filter-tag" v-if="selectedTimeRange && selectedTimeRange !== 'custom'">
          Periodo: {{ getTimeRangeName(selectedTimeRange) }}
          <span @click="selectedTimeRange = ''; applyFilters()" class="remove-filter">×</span>
        </span>
        <span class="filter-tag" v-if="selectedTimeRange === 'custom' && (customStartDate || customEndDate)">
          Periodo: {{ formatCustomDateRange() }}
          <span @click="selectedTimeRange = ''; customStartDate = ''; customEndDate = ''; applyFilters()" class="remove-filter">×</span>
        </span>
      </div>
      <div class="results-info">
        Mostrando {{ filteredTickets.length }} de {{ allTickets.length }} tickets
        <span v-if="filteredTickets.length < allTickets.length">
          ({{ allTickets.length - filteredTickets.length }} ocultos por filtros)
        </span>
      </div>
    </div>

    <!-- Control de vista -->
    <div class="view-controls" v-if="filteredTickets.length > 0">
      <div class="view-toggle">
        <span>Vista:</span>
        <button 
          @click="switchViewMode('list')" 
          :class="{ 'active': viewMode === 'list' }"
          class="view-btn"
          title="Vista de lista"
        >
          📋
        </button>
        <button 
          @click="switchViewMode('grid')" 
          :class="{ 'active': viewMode === 'grid' }"
          class="view-btn"
          title="Vista de tarjetas"
        >
          🗂️
        </button>
      </div>
      
      <div class="items-per-page">
        <label>Mostrar:</label>
        <select v-model="itemsPerPage" @change="currentPage = 1">
          <option value="5">5 tickets</option>
          <option value="10">10 tickets</option>
          <option value="20">20 tickets</option>
          <option value="50">50 tickets</option>
        </select>
      </div>
    </div>

    <!-- Estado de carga de opciones -->
    <div v-if="loadingOptions" class="loading-options">
      <div class="spinner small"></div>
      <p>Cargando opciones de filtro...</p>
    </div>

    <!-- Estado de carga de tickets -->
    <div v-else-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando tickets...</p>
    </div>

    <!-- Sin tickets -->
    <div v-else-if="!loading && allTickets.length === 0 && !hasActiveFilters" class="empty-state">
      <div class="empty-icon">📋</div>
      <h3>No hay tickets creados</h3>
      <p>Crea tu primer ticket para comenzar</p>
      <RouterLink to="/moodle/ticket" class="btn-primary">
        Crear Primer Ticket
      </RouterLink>
    </div>

    <!-- Sin resultados de búsqueda -->
    <div v-else-if="!loading && filteredTickets.length === 0 && hasActiveFilters" class="empty-state">
      <div class="empty-icon">🔍</div>
      <h3>No se encontraron tickets</h3>
      <p>No hay tickets que coincidan con tus criterios de búsqueda</p>
      <button @click="clearFilters" class="btn-primary">
        Limpiar filtros
      </button>
    </div>

    <!-- Vista: Lista -->
    <div v-else-if="viewMode === 'list'" class="tickets-list">
      <div class="table-header">
        <div class="table-row header-row">
          <div class="table-cell" @click="sortByColumn('id')">
            ID {{ sortBy === 'id' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}
          </div>
          <div class="table-cell" @click="sortByColumn('title')">
            Título {{ sortBy === 'title' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}
          </div>
          <div class="table-cell" @click="sortByColumn('status')">
            Estado {{ sortBy === 'status' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}
          </div>
          <div class="table-cell" @click="sortByColumn('priority')">
            Prioridad {{ sortBy === 'priority' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}
          </div>
          <div class="table-cell" @click="sortByColumn('created_at')">
            Creado {{ sortBy === 'created_at' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}
          </div>
          <div class="table-cell" @click="sortByColumn('updated_at')">
            Actualizado {{ sortBy === 'updated_at' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}
          </div>
        </div>
      </div>
      
      <div class="table-body">
        <div 
          v-for="ticket in paginatedTickets" 
          :key="ticket.id" 
          class="table-row ticket-row"
          :class="{ 
            'selected': selectedTicketId === ticket.id,
            'urgent': ticket.priority?.name?.toLowerCase().includes('urgente')
          }"
          @click="toggleTicketSelection(ticket.id)"
        >
          <div class="table-cell">
            <span class="ticket-id-cell">#{{ ticket.id }}</span>
          </div>
          <div class="table-cell">
            <div class="ticket-title-cell">
              <strong>{{ ticket.title }}</strong>
              <div class="ticket-meta-cell">
                <span class="category-badge">
                  {{ ticket.category?.name || 'Sin categoría' }}
                </span>
                <span v-if="ticket.tags && ticket.tags.length > 0" class="tags-count">
                  🏷️ {{ ticket.tags.length }}
                </span>
              </div>
            </div>
          </div>
          <div class="table-cell">
            <span class="status-badge" :class="getStatusClass(ticket.status)">
              {{ ticket.status?.name || 'Sin estado' }}
            </span>
          </div>
          <div class="table-cell">
            <span class="priority-badge" :class="getPriorityClass(ticket.priority)">
              {{ ticket.priority?.name || 'Sin prioridad' }}
            </span>
          </div>
          <div class="table-cell">
            <div class="date-cell">
              <div>{{ formatDateShort(ticket.created_at) }}</div>
              <small>{{ formatTime(ticket.created_at) }}</small>
            </div>
          </div>
          <div class="table-cell">
            <div class="date-cell">
              <div>{{ formatDateShort(ticket.updated_at) }}</div>
              <small>{{ formatTime(ticket.updated_at) }}</small>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- Vista: Tarjetas (Grid) -->
    <div v-else-if="viewMode === 'grid'" class="tickets-grid">
      <div 
        v-for="ticket in paginatedTickets" 
        :key="ticket.id"
        class="ticket-card-grid"
        :class="{ 
          'selected': selectedTicketId === ticket.id,
          'urgent': ticket.priority?.name?.toLowerCase().includes('urgente')
        }"
        @click="toggleTicketSelection(ticket.id)"
      >
        <div class="card-header">
          <div class="card-header-top">
            <span class="ticket-id">#{{ ticket.id }}</span>
            <div class="card-badges">
              <span class="priority-badge" :class="getPriorityClass(ticket.priority)">
                {{ ticket.priority?.name || 'Sin prioridad' }}
              </span>
              <span class="status-badge" :class="getStatusClass(ticket.status)">
                {{ ticket.status?.name || 'Sin estado' }}
              </span>
            </div>
          </div>
          <h3 class="ticket-title">{{ ticket.title }}</h3>
        </div>

        <div class="card-body">
          <p class="ticket-description">
            {{ truncateDescription(ticket.description, 120) }}
          </p>
          
          <div class="ticket-details-grid">
            <div class="detail-item">
              <span class="detail-label">Categoría:</span>
              <span class="detail-value">{{ ticket.category?.name || 'Sin categoría' }}</span>
            </div>
            
            <div class="detail-item">
              <span class="detail-label">Creado:</span>
              <span class="detail-value">{{ formatDateShort(ticket.created_at) }}</span>
            </div>
            
            <div v-if="ticket.assigned_user" class="detail-item">
              <span class="detail-label">Asignado a:</span>
              <span class="detail-value">{{ ticket.assigned_user.name }}</span>
            </div>
          </div>
          
          <!-- Tags -->
          <div v-if="ticket.tags && ticket.tags.length > 0" class="ticket-tags-grid">
            <span 
              v-for="tag in ticket.tags.slice(0, 3)" 
              :key="tag.id"
              class="tag"
            >
              {{ tag.name }}
            </span>
            <span v-if="ticket.tags.length > 3" class="tag-more">
              +{{ ticket.tags.length - 3 }}
            </span>
          </div>
        </div>

        <div class="card-footer">
          <div class="footer-left">
            <span class="last-updated">
              Actualizado: {{ formatTimeAgo(ticket.updated_at) }}
            </span>
          </div>
          <div class="footer-actions">
            
          </div>
        </div>
      </div>
    </div>

    <!-- Vista: Detalles -->
    <div v-else-if="viewMode === 'detail'" class="ticket-detail-view">
      <div class="detail-view-header">
        <button @click="switchViewMode('list')" class="btn-back">
          ← Volver a la lista
        </button>
        <h2>Detalles del Ticket</h2>
      </div>
      
      <div v-if="selectedTicketDetails" class="detail-view-content">
        <TicketDetailView 
          :ticket="selectedTicketDetails"
          @ticket-updated="handleTicketUpdated"
          @ticket-deleted="handleTicketDeleted"
        />
      </div>
      <div v-else class="loading-state">
        <div class="spinner"></div>
        <p>Cargando detalles del ticket...</p>
      </div>
    </div>

    <!-- Panel lateral de detalles -->
    <div v-if="selectedTicketId && selectedTicketDetails && viewMode !== 'detail'" 
         class="side-panel"
         :class="{ 'open': sidePanelOpen }">
      <div class="side-panel-header">
        <h3>Detalles del Ticket #{{ selectedTicketDetails.id }}</h3>
        <button @click="closeSidePanel" class="close-panel-btn">×</button>
      </div>
      
      <div class="side-panel-content">
        <TicketDetailPanel 
          :ticket="selectedTicketDetails"
          @ticket-updated="handleTicketUpdated"
          @view-full="switchViewMode('detail')"
        />
      </div>
    </div>

    <!-- Paginación -->
    <div v-if="filteredTickets.length > 0 && viewMode !== 'detail'" class="pagination">
      <button 
        :disabled="currentPage === 1" 
        @click="currentPage--"
        class="page-btn"
      >
        ← Anterior
      </button>
      
      <span class="page-info">
        Página {{ currentPage }} de {{ totalPages }}
        ({{ filteredTickets.length }} tickets)
      </span>
      
      <button 
        :disabled="currentPage === totalPages" 
        @click="currentPage++"
        class="page-btn"
      >
        Siguiente →
      </button>
    </div>

    <!-- Modal para vista rápida -->
    <div v-if="showQuickViewModal" class="modal-overlay" @click.self="closeQuickView">
      <div class="modal-content quick-view-modal">
        <div class="modal-header">
          <h3>Vista rápida - Ticket #{{ quickViewTicket?.id }}</h3>
          <button @click="closeQuickView" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <div v-if="quickViewTicket" class="quick-view-content">
            <QuickViewModal 
              :ticket="quickViewTicket"
              @close="closeQuickView"
              @edit="editTicket(quickViewTicket.id)"
              @view-full="viewTicketFull(quickViewTicket.id)"
            />
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
import { useRouter } from 'vue-router'
import api from '@/services/api'
import ticketService from '@/services/ticket.service'
import { useMoodleAuthStore } from '@/stores/moodleAuth'

import TicketDetailPanel from '@/components/tickets/TicketDetailPanel.vue'
import TicketDetailView from '@/components/tickets/TicketDetailView.vue'
import QuickViewModal from '@/components/tickets/QuickViewModal.vue'

const router = useRouter()
const auth = useMoodleAuthStore()

/* ===================== STATE ===================== */
const allTickets = ref([])
const filteredTickets = ref([]) 
const loading = ref(false)
const loadingOptions = ref(false)

// Filtros
const search = ref('')
const selectedStatus = ref('')
const selectedPriority = ref('')
const selectedCategory = ref('')
const selectedTimeRange = ref('')
const customStartDate = ref('')
const customEndDate = ref('')

// Ordenación
const sortBy = ref('created_at')
const sortOrder = ref('desc')

// Paginación
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Opciones desde la BD
const statusOptions = ref([])
const priorityOptions = ref([])
const categoryOptions = ref([])

// Nueva funcionalidad
const viewMode = ref('list') // 'list', 'grid', 'detail'
const selectedTicketId = ref(null)
const selectedTicketDetails = ref(null)
const sidePanelOpen = ref(false)
const showQuickViewModal = ref(false)
const quickViewTicket = ref(null)

// Notificaciones
const notification = ref({
  show: false,
  message: '',
  type: 'info',
  icon: 'ℹ️'
})

/* ===================== COMPUTED PROPERTIES ===================== */
const hasActiveFilters = computed(() => {
  return search.value || selectedStatus.value || selectedPriority.value || 
        selectedCategory.value || selectedTimeRange.value
})

const totalPages = computed(() => {
  return Math.ceil(filteredTickets.value.length / itemsPerPage.value)
})

const paginatedTickets = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredTickets.value.slice(start, end)
})

const openTicketsCount = computed(() => {
  return allTickets.value.filter(ticket => 
    ticket.status?.name?.toLowerCase().includes('abierto') ||
    ticket.status?.name?.toLowerCase().includes('pendiente')
  ).length
})

const resolvedTicketsCount = computed(() => {
  return allTickets.value.filter(ticket => 
    ticket.status?.name?.toLowerCase().includes('resuelto') ||
    ticket.status?.name?.toLowerCase().includes('cerrado')
  ).length
})

const pendingTicketsCount = computed(() => {
  return allTickets.value.filter(ticket => 
    ticket.status?.name?.toLowerCase().includes('pendiente')
  ).length
})

const inProgressTicketsCount = computed(() => {
  return allTickets.value.filter(ticket => 
    ticket.status?.name?.toLowerCase().includes('progreso')
  ).length
})

const urgentTicketsCount = computed(() => {
  return allTickets.value.filter(ticket => 
    ticket.priority?.name?.toLowerCase().includes('urgente')
  ).length
})

/* ===================== MÉTODOS DE UTILIDAD ===================== */
function getStatusName(statusId) {
  const status = statusOptions.value.find(s => s.id == statusId)
  return status ? status.name : ''
}

function getPriorityName(priorityId) {
  const priority = priorityOptions.value.find(p => p.id == priorityId)
  return priority ? priority.name : ''
}

function getCategoryName(categoryId) {
  const category = categoryOptions.value.find(c => c.id == categoryId)
  return category ? category.name : ''
}

function getTimeRangeName(timeRange) {
  const names = {
    'today': 'Hoy',
    'yesterday': 'Ayer',
    'week': 'Esta semana',
    'month': 'Este mes',
    'last_month': 'Mes anterior',
    'custom': 'Personalizado'
  }
  return names[timeRange] || timeRange
}

function formatCustomDateRange() {
  if (!customStartDate.value && !customEndDate.value) return 'Personalizado'
  
  const format = (dateStr) => {
    if (!dateStr) return '...'
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short'
    })
  }
  
  return `${format(customStartDate.value)} - ${format(customEndDate.value)}`
}

/* ===================== NUEVAS FUNCIONES DE UTILIDAD ===================== */
const formatDateShort = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short'
  })
}

const formatTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatTimeAgo = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffMins < 60) {
    return `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`
  } else if (diffHours < 24) {
    return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`
  } else if (diffDays < 7) {
    return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`
  } else {
    return formatDateShort(dateString)
  }
}

/* ===================== MÉTODOS DE FILTRADO ===================== */
function getDateRange() {
  const now = new Date()
  let startDate = null
  let endDate = null

  switch (selectedTimeRange.value) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
      break
    case 'yesterday':
      const yesterday = new Date(now)
      yesterday.setDate(now.getDate() - 1)
      startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
      endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59)
      break
    case 'week':
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      startDate = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate())
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
      break
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      break
    case 'last_month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
      break
    case 'custom':
      if (customStartDate.value && customEndDate.value) {
        startDate = new Date(customStartDate.value)
        endDate = new Date(customEndDate.value)
        endDate.setHours(23, 59, 59)
      } else if (customStartDate.value) {
        startDate = new Date(customStartDate.value)
        endDate = new Date(startDate)
        endDate.setHours(23, 59, 59)
      } else if (customEndDate.value) {
        endDate = new Date(customEndDate.value)
        endDate.setHours(23, 59, 59)
        startDate = new Date(0) 
      }
      break
    default:
      return { startDate: null, endDate: null }
  }

  return { startDate, endDate }
}

function applyFilters() {
  currentPage.value = 1
  
  if (allTickets.value.length === 0) return
  
  let filtered = [...allTickets.value]
  
  if (search.value.trim()) {
    const searchTerm = search.value.trim().toLowerCase()
    filtered = filtered.filter(ticket => {
      return (
        (ticket.title && ticket.title.toLowerCase().includes(searchTerm)) ||
        (ticket.description && ticket.description.toLowerCase().includes(searchTerm)) ||
        (ticket.contact_name && ticket.contact_name.toLowerCase().includes(searchTerm)) ||
        (ticket.tags && ticket.tags.some(tag => 
          tag.name.toLowerCase().includes(searchTerm)
        )) ||
        (ticket.category?.name && ticket.category.name.toLowerCase().includes(searchTerm))
      )
    })
  }
  
  // Filtro por estado
  if (selectedStatus.value) {
    filtered = filtered.filter(ticket => 
      ticket.status_id == selectedStatus.value
    )
  }
  
  // Filtro por prioridad
  if (selectedPriority.value) {
    filtered = filtered.filter(ticket => 
      ticket.priority_id == selectedPriority.value
    )
  }
  
  // Filtro por categoría
  if (selectedCategory.value) {
    filtered = filtered.filter(ticket => 
      ticket.category_id == selectedCategory.value
    )
  }
  
  // Filtro por tiempo
  if (selectedTimeRange.value) {
    const dateRange = getDateRange()
    if (dateRange.startDate && dateRange.endDate) {
      filtered = filtered.filter(ticket => {
        const ticketDate = new Date(ticket.created_at)
        return ticketDate >= dateRange.startDate && ticketDate <= dateRange.endDate
      })
    } else if (dateRange.startDate) {
      filtered = filtered.filter(ticket => {
        const ticketDate = new Date(ticket.created_at)
        return ticketDate >= dateRange.startDate
      })
    } else if (dateRange.endDate) {
      filtered = filtered.filter(ticket => {
        const ticketDate = new Date(ticket.created_at)
        return ticketDate <= dateRange.endDate
      })
    }
  }
  
  filtered = sortTickets(filtered)
  
  filteredTickets.value = filtered
}

function sortTickets(tickets) {
  return [...tickets].sort((a, b) => {
    let valueA, valueB
    
    switch (sortBy.value) {
      case 'title':
        valueA = a.title ? a.title.toLowerCase() : ''
        valueB = b.title ? b.title.toLowerCase() : ''
        break
      case 'priority':
        valueA = a.priority?.level || 0
        valueB = b.priority?.level || 0
        break
      case 'updated_at':
        valueA = new Date(a.updated_at).getTime()
        valueB = new Date(b.updated_at).getTime()
        break
      case 'created_at':
      default:
        valueA = new Date(a.created_at).getTime()
        valueB = new Date(b.created_at).getTime()
    }
    
    if (sortOrder.value === 'asc') {
      return valueA < valueB ? -1 : valueA > valueB ? 1 : 0
    } else {
      return valueA > valueB ? -1 : valueA < valueB ? 1 : 0
    }
  })
}

function clearFilters() {
  search.value = ''
  selectedStatus.value = ''
  selectedPriority.value = ''
  selectedCategory.value = ''
  selectedTimeRange.value = ''
  customStartDate.value = ''
  customEndDate.value = ''
  sortBy.value = 'created_at'
  sortOrder.value = 'desc'
  applyFilters()
}

/* ===================== NUEVOS MÉTODOS ===================== */
const toggleTicketSelection = async (ticketId) => {
  if (selectedTicketId.value === ticketId) {
    selectedTicketId.value = null
    selectedTicketDetails.value = null
    sidePanelOpen.value = false
  } else {
    selectedTicketId.value = ticketId
    sidePanelOpen.value = true
    
    // Cargar detalles del ticket
    try {
      const response = await ticketService.getById(ticketId)
      selectedTicketDetails.value = response.data
    } catch (error) {
      console.error('Error cargando detalles del ticket:', error)
      // Si falla, buscar en los tickets ya cargados
      selectedTicketDetails.value = allTickets.value.find(t => t.id === ticketId)
    }
  }
}

const closeSidePanel = () => {
  sidePanelOpen.value = false
  selectedTicketId.value = null
  selectedTicketDetails.value = null
}

const openQuickView = (ticket) => {
  quickViewTicket.value = ticket
  showQuickViewModal.value = true
}

const closeQuickView = () => {
  showQuickViewModal.value = false
  quickViewTicket.value = null
}

const sortByColumn = (column) => {
  if (sortBy.value === column) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = column
    sortOrder.value = 'asc'
  }
  applyFilters()
}

const cloneTicket = (ticket) => {
  // Clonar ticket
  router.push({
    path: '/moodle/ticket',
    query: { 
      clone: ticket.id,
      title: ticket.title,
      description: ticket.description,
      category_id: ticket.category_id,
      priority_id: ticket.priority_id
    }
  })
}



const printTickets = () => {
  window.print()
}

const handleTicketUpdated = (updatedTicket) => {
  const index = allTickets.value.findIndex(t => t.id === updatedTicket.id)
  if (index !== -1) {
    allTickets.value[index] = updatedTicket
    applyFilters()
    
    if (selectedTicketId.value === updatedTicket.id) {
      selectedTicketDetails.value = updatedTicket
    }
    
    showNotification('Ticket actualizado correctamente', 'success', '✅')
  }
}

const handleTicketDeleted = (deletedTicketId) => {
  // Eliminar el ticket de la lista
  allTickets.value = allTickets.value.filter(t => t.id !== deletedTicketId)
  applyFilters()
  
  // Si es el ticket seleccionado, limpiar
  if (selectedTicketId.value === deletedTicketId) {
    selectedTicketId.value = null
    selectedTicketDetails.value = null
    sidePanelOpen.value = false
  }
  
  showNotification('Ticket eliminado correctamente', 'success', '🗑️')
}

const switchViewMode = (mode) => {
  viewMode.value = mode
  if (mode === 'detail' && !selectedTicketId.value && filteredTickets.value.length > 0) {
    // Seleccionar el primer ticket si no hay ninguno seleccionado
    toggleTicketSelection(filteredTickets.value[0].id)
  }
}

const viewTicketFull = (ticketId) => {
  selectedTicketId.value = ticketId
  switchViewMode('detail')
  closeQuickView()
}

/* ===================== MÉTODOS EXISTENTES ===================== */
function truncateDescription(text, maxLength = 150) {
  if (!text) return 'Sin descripción'
  return text.length > maxLength
    ? text.substring(0, maxLength) + '...'
    : text
}

function formatDate(dateString) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffMins < 60) {
    return `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`
  } else if (diffHours < 24) {
    return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`
  } else if (diffDays < 7) {
    return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`
  } else {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }
}

function getPriorityClass(priority) {
  if (!priority) return 'priority-default'
  const priorityName = priority.name.toLowerCase()
  if (priorityName.includes('urgente')) return 'priority-high'
  if (priorityName.includes('alta')) return 'priority-high'
  if (priorityName.includes('media')) return 'priority-medium'
  if (priorityName.includes('baja')) return 'priority-low'
  return 'priority-default'
}

function getStatusClass(status) {
  if (!status) return 'status-default'
  const statusName = status.name.toLowerCase()
  if (statusName.includes('abierto')) return 'status-open'
  if (statusName.includes('progreso')) return 'status-progress'
  if (statusName.includes('pendiente')) return 'status-pending'
  if (statusName.includes('resuelto')) return 'status-resolved'
  if (statusName.includes('cerrado')) return 'status-closed'
  return 'status-default'
}

function canEditTicket(ticket) {
  return [1, 2, 3].includes(ticket.status_id)
}

function editTicket(ticketId) {
  router.push(`/moodle/ticket/${ticketId}/edit`)
}

function toggleSortOrder() {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
  applyFilters()
}

/* ===================== MÉTODOS DE CARGA ===================== */
async function loadOptions() {
  loadingOptions.value = true
  try {
    const [statusesRes, prioritiesRes, categoriesRes] = await Promise.all([
      ticketService.getStatuses(), 
      api.get('/priorities'), 
      api.get('/categories') 
    ])

    statusOptions.value = statusesRes.data || []
    priorityOptions.value = prioritiesRes.data || []
    categoryOptions.value = categoriesRes.data || []
    
    console.log('Opciones cargadas:', {
      statuses: statusOptions.value.length,
      priorities: priorityOptions.value.length,
      categories: categoryOptions.value.length
    })
  } catch (error) {
    console.error('Error cargando opciones:', error)
    // Valores por defecto en caso de error
    statusOptions.value = [
      { id: 1, name: 'Abierto' },
      { id: 2, name: 'En progreso' },
      { id: 3, name: 'Pendiente' },
      { id: 4, name: 'Resuelto' },
      { id: 5, name: 'Cerrado' }
    ]
    
    priorityOptions.value = [
      { id: 1, name: 'Baja', level: 1 },
      { id: 2, name: 'Media', level: 2 },
      { id: 3, name: 'Urgente', level: 3 },
      { id: 4, name: 'Muy Urgente', level: 4 }
    ]
    
    categoryOptions.value = []
  } finally {
    loadingOptions.value = false
  }
}

async function loadTickets() {
  if (!auth.user?.id) {
    allTickets.value = []
    filteredTickets.value = []
    return
  }

  loading.value = true

  try {
    const response = await ticketService.getByMoodleUser(auth.user.id, {
      include: 'category,priority,status,tags,assigned_user,department'
    })
    
    if (response.data) {
      allTickets.value = response.data.data || response.data
      applyFilters()
      console.log('Tickets cargados con detalles:', allTickets.value.length)
    }
  } catch (error) {
    console.error('Error cargando tickets:', error)
    allTickets.value = []
    filteredTickets.value = []
    showNotification('Error al cargar tickets', 'error', '❌')
  } finally {
    loading.value = false
  }
}

async function init() {
  try {
    await loadOptions()
    await loadTickets()
  } catch (error) {
    console.error('Error en inicialización:', error)
  }
}

/* ===================== NOTIFICACIONES ===================== */
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

/* ===================== LIFECYCLE ===================== */
onMounted(() => {
  if (auth.user?.id) {
    init()
  }
})

/* ===================== WATCHERS ===================== */
watch(
  () => auth.user,
  (user) => {
    if (user?.id) {
      currentPage.value = 1
      init()
    } else {
      allTickets.value = []
      filteredTickets.value = []
    }
  },
  { immediate: true }
)

watch(currentPage, () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

watch(selectedTicketId, (newId) => {
  if (newId && viewMode.value === 'detail') {
    // Cargar detalles completos si estamos en vista de detalle
    loadTicketDetails(newId)
  }
})

watch(viewMode, (newMode) => {
  if (newMode !== 'detail') {
    // No hacer nada especial cuando cambiamos de vista
  }
})

async function loadTicketDetails(ticketId) {
  try {
    const response = await ticketService.getById(ticketId, {
      include: 'category,priority,status,tags,assigned_user,department,comments,attachments'
    })
    selectedTicketDetails.value = response.data
  } catch (error) {
    console.error('Error cargando detalles del ticket:', error)
  }
}
</script>

<style scoped>
/* Estilos base */
.ticket-list {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 20px;
}

.header-left {
  flex: 1;
}

.list-header h1 {
  color: #1e293b;
  margin: 0 0 15px 0;
  font-size: 2.2rem;
  font-weight: 700;
}

.header-stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f8fafc;
  padding: 10px 20px;
  border-radius: 10px;
  min-width: 100px;
  border: 1px solid #e2e8f0;
}

.stat-label {
  font-size: 0.9rem;
  color: #64748b;
  margin-bottom: 5px;
  font-weight: 500;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #4f46e5;
}

.header-actions {
  display: flex;
  gap: 15px;
  align-items: center;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #4f46e5;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);
}

.btn-primary:hover {
  background: #4338ca;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(79, 70, 229, 0.3);
}

.btn-primary .icon {
  font-size: 1.2rem;
}

/* Resumen rápido */
.quick-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 25px;
  border-radius: 12px;
  margin-bottom: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 20px;
}

.summary-icon {
  font-size: 3.5rem;
  opacity: 0.9;
}

.summary-content h4 {
  margin: 0 0 10px 0;
  font-size: 1.3rem;
  font-weight: 600;
}

.summary-stats {
  display: flex;
  gap: 25px;
}

.summary-stats .stat {
  font-size: 1rem;
  opacity: 0.9;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.summary-stats .stat strong {
  font-size: 1.5rem;
  margin-bottom: 5px;
  font-weight: 700;
}

.summary-actions {
  display: flex;
  gap: 12px;
}

.btn-outline {
  background: transparent;
  border: 2px solid white;
  color: white;
  padding: 10px 18px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-outline:hover {
  background: white;
  color: #4f46e5;
  transform: translateY(-2px);
}

/* Filtros */
.filters {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 25px;
  padding: 25px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.filter-group label {
  font-weight: 600;
  color: #475569;
  font-size: 0.95rem;
}

.filter-group input,
.filter-group select {
  padding: 12px 15px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  transition: all 0.3s;
}

.filter-group input:focus,
.filter-group select:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}

.sort-controls {
  display: flex;
  gap: 10px;
}

.sort-btn {
  padding: 12px 15px;
  background: #e2e8f0;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.3s;
  min-width: 55px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sort-btn:hover {
  background: #cbd5e1;
  transform: translateY(-1px);
}

.filter-actions {
  align-items: flex-end;
}

.custom-dates {
  grid-column: span 2;
  display: grid;
  grid-template-columns: auto 1fr auto 1fr;
  gap: 12px;
  align-items: center;
}

.custom-dates label {
  font-size: 0.9rem;
  white-space: nowrap;
}

.custom-dates input[type="date"] {
  padding: 10px 12px;
  font-size: 0.95rem;
}

.btn-secondary {
  padding: 12px 18px;
  background: #64748b;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.btn-secondary:hover {
  background: #475569;
  transform: translateY(-2px);
}

/* Información de filtros activos */
.active-filters {
  background: #e0e7ff;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 25px;
  border: 1px solid #c7d2fe;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 15px;
}

.filter-tag {
  background: white;
  padding: 8px 15px;
  border-radius: 20px;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #c7d2fe;
  font-weight: 500;
}

.remove-filter {
  cursor: pointer;
  font-size: 1.3rem;
  color: #64748b;
  font-weight: bold;
  line-height: 1;
  padding: 0 5px;
  transition: color 0.3s;
}

.remove-filter:hover {
  color: #dc2626;
}

.results-info {
  font-size: 0.95rem;
  color: #475569;
  font-weight: 600;
}

/* Controles de vista */
.view-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 25px 0;
  padding: 18px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.view-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
}

.view-toggle span {
  color: #475569;
  font-weight: 600;
  font-size: 0.95rem;
}

.view-btn {
  background: white;
  border: 1px solid #cbd5e1;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.3rem;
  transition: all 0.3s;
  min-width: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.view-btn.active {
  background: #4f46e5;
  color: white;
  border-color: #4f46e5;
}

.view-btn:hover:not(.active) {
  background: #e2e8f0;
  transform: translateY(-1px);
}

.items-per-page {
  display: flex;
  align-items: center;
  gap: 12px;
}

.items-per-page label {
  font-weight: 500;
  color: #475569;
  font-size: 0.95rem;
}

.items-per-page select {
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: white;
  font-size: 0.95rem;
}

/* Estados de carga */
.loading-options {
  text-align: center;
  padding: 30px;
  background: #f8fafc;
  border-radius: 10px;
  margin: 20px 0;
  border: 1px solid #e2e8f0;
}

.spinner.small {
  width: 28px;
  height: 28px;
  border-width: 3px;
  border: 3px solid #e2e8f0;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
  margin-right: 15px;
}

.loading-options p {
  display: inline-block;
  color: #64748b;
  margin: 0;
  font-size: 1.1rem;
  font-weight: 500;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  background: #f8fafc;
  border-radius: 12px;
  margin: 30px 0;
  border: 1px solid #e2e8f0;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e2e8f0;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 25px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: #64748b;
  font-size: 1.2rem;
  font-weight: 500;
}

/* Estados vacíos */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 2px dashed #cbd5e1;
  margin: 30px 0;
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 25px;
  opacity: 0.7;
}

.empty-state h3 {
  color: #334155;
  margin-bottom: 15px;
  font-size: 1.8rem;
  font-weight: 600;
}

.empty-state p {
  color: #64748b;
  margin-bottom: 30px;
  font-size: 1.2rem;
  line-height: 1.6;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

/* Vista de lista (tabla) */
.tickets-list {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 30px;
}

.table-header {
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
}

.header-row {
  font-weight: 600;
  color: #475569;
  font-size: 0.95rem;
}

.table-row {
  display: grid;
  grid-template-columns: 80px 2fr 120px 120px 150px 150px 140px;
  gap: 15px;
  padding: 18px;
  border-bottom: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.3s;
  align-items: center;
}

.header-row .table-cell {
  cursor: pointer;
  user-select: none;
  padding: 12px 0;
}

.header-row .table-cell:hover {
  background: #e2e8f0;
}

.ticket-row:hover {
  background: #f8fafc;
}

.ticket-row.selected {
  background: #e0e7ff;
  border-left: 4px solid #4f46e5;
}

.ticket-row.urgent {
  border-left: 4px solid #dc2626;
}

.table-cell {
  display: flex;
  align-items: center;
  padding: 8px 0;
}

.ticket-id-cell {
  font-family: monospace;
  font-weight: bold;
  color: #4f46e5;
  font-size: 1.1rem;
}

.ticket-title-cell {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ticket-title-cell strong {
  font-size: 1.1rem;
  color: #1e293b;
  font-weight: 600;
  line-height: 1.3;
}

.ticket-meta-cell {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.category-badge {
  background: #e0e7ff;
  color: #4f46e5;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.tags-count {
  color: #64748b;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-badge,
.priority-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
  min-width: 90px;
  text-align: center;
}

.status-badge {
  padding: 6px 14px;
}

.priority-badge {
  padding: 6px 14px;
}

.status-open { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
.status-progress { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
.status-pending { background: #f3e8ff; color: #7c3aed; border: 1px solid #e9d5ff; }
.status-resolved { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
.status-closed { background: #e2e8f0; color: #475569; border: 1px solid #cbd5e1; }
.status-default { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }

.priority-high { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
.priority-medium { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
.priority-low { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
.priority-default { background: #e2e8f0; color: #475569; border: 1px solid #cbd5e1; }

.date-cell {
  display: flex;
  flex-direction: column;
  font-size: 0.95rem;
  gap: 4px;
}

.date-cell div {
  font-weight: 500;
  color: #1e293b;
}

.date-cell small {
  color: #64748b;
  font-size: 0.85rem;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: flex-start;
}

.btn-action {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
}

.btn-action.view {
  background: #3b82f6;
  color: white;
}

.btn-action.edit {
  background: #10b981;
  color: white;
}

.btn-action.clone {
  background: #f59e0b;
  color: white;
}

.btn-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* Vista de tarjetas (Grid) */
.tickets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 25px;
  margin-bottom: 30px;
}

.ticket-card-grid {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.ticket-card-grid:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.ticket-card-grid.selected {
  border: 2px solid #4f46e5;
  background: #f8fafc;
  box-shadow: 0 4px 15px rgba(79, 70, 229, 0.2);
}

.ticket-card-grid.urgent {
  border-left: 5px solid #dc2626;
}

.card-header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.ticket-id {
  font-family: monospace;
  font-weight: bold;
  color: #4f46e5;
  font-size: 1.2rem;
  background: #f1f5f9;
  padding: 5px 12px;
  border-radius: 6px;
}

.card-badges {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.ticket-title {
  color: #1e293b;
  margin: 0 0 15px 0;
  font-size: 1.4rem;
  font-weight: 600;
  line-height: 1.3;
}

.card-body {
  flex: 1;
  margin-bottom: 20px;
}

.ticket-description {
  color: #475569;
  line-height: 1.6;
  margin-bottom: 20px;
  font-size: 1.05rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ticket-details-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 20px 0;
  padding: 18px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-weight: 500;
  color: #64748b;
  font-size: 0.95rem;
}

.detail-value {
  font-weight: 600;
  color: #334155;
  font-size: 1rem;
  text-align: right;
  max-width: 60%;
  word-break: break-word;
}

.ticket-tags-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;
}

.tag {
  background: #e0e7ff;
  color: #4f46e5;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.9rem;
  font-weight: 500;
  border: 1px solid #c7d2fe;
  transition: background 0.3s;
}

.tag:hover {
  background: #c7d2fe;
}

.tag-more {
  background: #cbd5e1;
  color: #475569;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.9rem;
  font-weight: 500;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.footer-left {
  flex: 1;
}

.last-updated {
  font-size: 0.9rem;
  color: #64748b;
  font-style: italic;
}

.footer-actions {
  display: flex;
  gap: 10px;
}

/* Vista de detalles */
.ticket-detail-view {
  background: white;
  border-radius: 12px;
  padding: 30px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 30px;
}

.detail-view-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
}

.btn-back {
  padding: 10px 20px;
  background: #64748b;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-back:hover {
  background: #475569;
  transform: translateY(-2px);
}

.detail-view-header h2 {
  color: #1e293b;
  margin: 0;
  font-size: 1.8rem;
  font-weight: 600;
}

/* Panel lateral */
.side-panel {
  position: fixed;
  top: 0;
  right: -450px;
  width: 450px;
  height: 100vh;
  background: white;
  box-shadow: -4px 0 25px rgba(0, 0, 0, 0.15);
  transition: right 0.3s ease;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.side-panel.open {
  right: 0;
}

.side-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.side-panel-header h3 {
  color: #1e293b;
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
}

.close-panel-btn {
  background: none;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  color: #64748b;
  padding: 5px;
  transition: color 0.3s;
}

.close-panel-btn:hover {
  color: #dc2626;
}

.side-panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 25px;
}

/* Modal de vista rápida */
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
  z-index: 1100;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.modal-header h3 {
  color: #1e293b;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  color: #64748b;
  padding: 5px;
  transition: color 0.3s;
}

.modal-close:hover {
  color: #dc2626;
}

.modal-body {
  padding: 25px;
}

/* Paginación */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 25px;
  margin-top: 40px;
  padding-top: 25px;
  border-top: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

.page-btn {
  padding: 12px 24px;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  cursor: pointer;
  color: #475569;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s;
  min-width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-btn:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #94a3b8;
  transform: translateY(-2px);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #64748b;
  font-weight: 600;
  font-size: 1.05rem;
  text-align: center;
  padding: 0 15px;
}

/* Notificación */
.notification {
  position: fixed;
  bottom: 30px;
  right: 30px;
  padding: 18px 24px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 15px;
  animation: slideIn 0.3s ease-out;
  z-index: 1200;
  max-width: 450px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
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

.notification.warning {
  background: #f59e0b;
  color: white;
}

.notification-icon {
  font-size: 1.5rem;
}

.notification-message {
  flex: 1;
  font-weight: 500;
}

.notification-close {
  background: none;
  border: none;
  color: inherit;
  font-size: 1.5rem;
  cursor: pointer;
  margin-left: 15px;
  opacity: 0.8;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-close:hover {
  opacity: 1;
}

/* Responsive */
@media (max-width: 1200px) {
  .tickets-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
  
  .side-panel {
    width: 400px;
    right: -400px;
  }
}

@media (max-width: 992px) {
  .tickets-list .table-row {
    grid-template-columns: 70px 1.5fr 110px 110px 130px 130px 130px;
    font-size: 0.9rem;
  }
  
  .tickets-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
  
  .quick-summary {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }
  
  .summary-stats {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .ticket-list {
    padding: 15px;
  }
  
  .list-header {
    flex-direction: column;
    gap: 20px;
    align-items: stretch;
  }
  
  .header-left {
    text-align: center;
  }
  
  .list-header h1 {
    font-size: 1.8rem;
  }
  
  .header-stats {
    justify-content: center;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .filters {
    grid-template-columns: 1fr;
    padding: 20px;
  }
  
  .custom-dates {
    grid-template-columns: 1fr;
    grid-column: span 1;
  }
  
  .sort-controls {
    flex-direction: column;
  }
  
  .filter-actions {
    align-items: stretch;
  }
  
  .btn-secondary {
    width: 100%;
  }
  
  .view-controls {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .view-toggle {
    justify-content: center;
  }
  
  .items-per-page {
    justify-content: center;
  }
  
  .tickets-list {
    overflow-x: auto;
  }
  
  .tickets-list .table-row {
    min-width: 900px;
  }
  
  .tickets-grid {
    grid-template-columns: 1fr;
  }
  
  .side-panel {
    width: 100%;
    right: -100%;
  }
  
  .pagination {
    flex-direction: column;
    gap: 15px;
  }
  
  .page-btn {
    width: 100%;
    max-width: 200px;
  }
  
  .notification {
    left: 15px;
    right: 15px;
    max-width: none;
  }
}

@media (max-width: 576px) {
  .list-header h1 {
    font-size: 1.6rem;
  }
  
  .stat-item {
    min-width: 80px;
    padding: 8px 15px;
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
  
  .btn-primary {
    padding: 10px 20px;
    font-size: 0.95rem;
    width: 100%;
    justify-content: center;
  }
  
  .summary-stats {
    flex-direction: column;
    gap: 15px;
  }
  
  .ticket-card-grid {
    padding: 20px;
  }
  
  .ticket-title {
    font-size: 1.2rem;
  }
  
  .detail-view-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .btn-back {
    width: 100%;
    justify-content: center;
  }
  
  .detail-view-header h2 {
    font-size: 1.5rem;
    text-align: center;
  }
  
  .modal-content {
    width: 95%;
  }
  
  .modal-header h3 {
    font-size: 1.3rem;
  }
}
</style>