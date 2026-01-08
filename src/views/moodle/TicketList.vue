<template>
  <div class="ticket-list">
    <!-- Header -->
    <div class="list-header">
      <h1>Mis Tickets</h1>
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

    <!-- Lista de tickets -->
    <div v-else class="tickets-container">
      <div v-for="ticket in paginatedTickets" :key="ticket.id" class="ticket-card">
        <div class="ticket-header">
          <div class="ticket-title">
            <h3>{{ ticket.title }}</h3>
            <span class="ticket-id">#{{ ticket.id }}</span>
          </div>
          <div class="ticket-meta">
            <span class="badge" :class="getPriorityClass(ticket.priority)">
              {{ ticket.priority?.name || 'Sin prioridad' }}
            </span>
            <span class="badge" :class="getStatusClass(ticket.status)">
              {{ ticket.status?.name || 'Sin estado' }}
            </span>
          </div>
        </div>

        <div class="ticket-body">
          <p class="ticket-description">{{ truncateDescription(ticket.description) }}</p>
          
          <div class="ticket-details">
            <div class="detail">
              <span class="detail-label">Categoría:</span>
              <span class="detail-value">{{ ticket.category?.name || 'Sin categoría' }}</span>
            </div>
            
            <div class="detail">
              <span class="detail-label">Creado:</span>
              <span class="detail-value">{{ formatDate(ticket.created_at) }}</span>
            </div>
            
            <div class="detail">
              <span class="detail-label">Actualizado:</span>
              <span class="detail-value">{{ formatDate(ticket.updated_at) }}</span>
            </div>
            
            <div v-if="ticket.assigned_user" class="detail">
              <span class="detail-label">Asignado a:</span>
              <span class="detail-value">{{ ticket.assigned_user.name }}</span>
            </div>
          </div>
          
          <!-- Tags -->
          <div v-if="ticket.tags && ticket.tags.length > 0" class="ticket-tags">
            <span 
              v-for="tag in ticket.tags" 
              :key="tag.id"
              class="tag"
            >
              {{ tag.name }}
            </span>
          </div>
        </div>

        <div class="ticket-actions">
          <RouterLink 
            :to="`/moodle/ticket/${ticket.id}`" 
            class="btn-view"
          >
            Ver detalles
          </RouterLink>
          <button 
            v-if="canEditTicket(ticket)"
            @click="editTicket(ticket.id)"
            class="btn-edit"
          >
            Editar
          </button>
        </div>
      </div>
    </div>

    <!-- Paginación -->
    <div v-if="filteredTickets.length > 0" class="pagination">
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import ticketService from '@/services/ticket.service'
import categoryService from '@/services/category.service' // Asumiendo que tienes este servicio
import { useMoodleAuthStore } from '@/stores/moodleAuth'

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
    const response = await ticketService.getByMoodleUser(auth.user.id)
    
    if (response.data) {
      allTickets.value = response.data.data || response.data
      applyFilters()
      console.log('Tickets cargados:', allTickets.value.length)
    }
  } catch (error) {
    console.error('Error cargando tickets:', error)
    allTickets.value = []
    filteredTickets.value = []
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

onMounted(() => {
  if (auth.user?.id) {
    init()
  }
})

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
</script>

<style scoped>

.loading-options {
  text-align: center;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
  margin: 20px 0;
}

.spinner.small {
  width: 24px;
  height: 24px;
  border-width: 2px;
  display: inline-block;
  margin-right: 10px;
}

.loading-options p {
  display: inline-block;
  color: #64748b;
  margin: 0;
}


.sort-controls {
  display: flex;
  gap: 8px;
}

.filter-actions {
  align-items: flex-end;
}

.custom-dates {
  grid-column: span 2;
  display: grid;
  grid-template-columns: auto 1fr auto 1fr;
  gap: 10px;
  align-items: center;
}

.custom-dates label {
  font-size: 0.85rem;
  white-space: nowrap;
}

.custom-dates input[type="date"] {
  padding: 8px 12px;
  font-size: 0.9rem;
}

.btn-secondary {
  padding: 10px 15px;
  background: #64748b;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.btn-secondary:hover {
  background: #475569;
}


.active-filters {
  background: #e0e7ff;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  border: 1px solid #c7d2fe;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}

.filter-tag {
  background: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #c7d2fe;
}

.remove-filter {
  cursor: pointer;
  font-size: 1.2rem;
  color: #64748b;
  font-weight: bold;
  line-height: 1;
  padding: 0 4px;
}

.remove-filter:hover {
  color: #dc2626;
}

.results-info {
  font-size: 0.9rem;
  color: #475569;
  font-weight: 500;
}

.ticket-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 15px;
}

.list-header h1 {
  color: #1e293b;
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
}

.header-actions {
  display: flex;
  gap: 15px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #4f46e5;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
  transition: background 0.3s, transform 0.2s;
  border: none;
  cursor: pointer;
  font-size: 1rem;
}

.btn-primary:hover {
  background: #4338ca;
  transform: translateY(-1px);
}

.btn-primary .icon {
  font-size: 1.2rem;
}

.filters {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group label {
  font-weight: 600;
  color: #475569;
  font-size: 0.9rem;
}

.filter-group input,
.filter-group select {
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.95rem;
  background: white;
  transition: border-color 0.3s;
}

.filter-group input:focus,
.filter-group select:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.sort-btn {
  padding: 10px 12px;
  background: #e2e8f0;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: background 0.3s;
  min-width: 50px;
}

.sort-btn:hover {
  background: #cbd5e1;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: #f8fafc;
  border-radius: 12px;
  margin: 20px 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 2px dashed #cbd5e1;
  margin: 20px 0;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.empty-state h3 {
  color: #334155;
  margin-bottom: 10px;
  font-size: 1.5rem;
  font-weight: 600;
}

.empty-state p {
  color: #64748b;
  margin-bottom: 25px;
  font-size: 1.1rem;
  line-height: 1.5;
}

.tickets-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 20px 0;
}

.ticket-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  border-left: 4px solid #4f46e5;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid #e2e8f0;
}

.ticket-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.ticket-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 15px;
}

.ticket-title {
  flex: 1;
  min-width: 250px;
}

.ticket-title h3 {
  color: #1e293b;
  margin: 0 0 8px 0;
  font-size: 1.4rem;
  font-weight: 600;
  line-height: 1.3;
}

.ticket-id {
  color: #64748b;
  font-size: 0.95rem;
  font-family: monospace;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 4px;
  display: inline-block;
}

.ticket-meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.badge {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
  display: inline-block;
}

.priority-high { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
.priority-medium { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
.priority-low { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
.priority-default { background: #e2e8f0; color: #475569; border: 1px solid #cbd5e1; }

.status-open { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
.status-progress { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
.status-pending { background: #f3e8ff; color: #7c3aed; border: 1px solid #e9d5ff; }
.status-resolved { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
.status-closed { background: #e2e8f0; color: #475569; border: 1px solid #cbd5e1; }
.status-default { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }

.ticket-body {
  margin-bottom: 20px;
}

.ticket-description {
  color: #475569;
  line-height: 1.6;
  margin-bottom: 20px;
  font-size: 1.05rem;
}

.ticket-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 500;
}

.detail-value {
  color: #334155;
  font-weight: 600;
  font-size: 1rem;
}

.ticket-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 15px;
}

.tag {
  display: inline-block;
  padding: 6px 12px;
  background: #e0e7ff;
  color: #3730a3;
  border-radius: 16px;
  font-size: 0.9rem;
  font-weight: 500;
  border: 1px solid #c7d2fe;
  transition: background 0.3s;
}

.tag:hover {
  background: #c7d2fe;
}

.ticket-actions {
  display: flex;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.btn-view {
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  transition: background 0.3s, transform 0.2s;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-view:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn-edit {
  padding: 10px 20px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.3s, transform 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-edit:hover {
  background: #059669;
  transform: translateY(-1px);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
  flex-wrap: wrap;
}

.page-btn {
  padding: 10px 20px;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  cursor: pointer;
  color: #475569;
  font-weight: 500;
  font-size: 1rem;
  transition: all 0.3s;
  min-width: 100px;
}

.page-btn:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #94a3b8;
  transform: translateY(-1px);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #64748b;
  font-weight: 500;
  font-size: 1rem;
  text-align: center;
  padding: 0 10px;
}

@media (max-width: 768px) {
  .ticket-list {
    padding: 15px;
  }
  
  .list-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .list-header h1 {
    font-size: 1.8rem;
  }
  
  .filters {
    grid-template-columns: 1fr;
    padding: 15px;
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
  
  .ticket-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .ticket-title h3 {
    font-size: 1.2rem;
  }
  
  .ticket-meta {
    width: 100%;
    justify-content: flex-start;
  }
  
  .ticket-details {
    grid-template-columns: 1fr;
    padding: 12px;
  }
  
  .ticket-card {
    padding: 18px;
  }
  
  .pagination {
    flex-direction: column;
    gap: 10px;
  }
  
  .ticket-actions {
    flex-direction: column;
  }
  
  .btn-view, .btn-edit {
    width: 100%;
    text-align: center;
  }
  
  .page-btn {
    width: 100%;
    max-width: 150px;
  }
}

@media (max-width: 480px) {
  .list-header h1 {
    font-size: 1.5rem;
  }
  
  .btn-primary {
    padding: 8px 16px;
    font-size: 0.9rem;
    width: 100%;
    justify-content: center;
  }
  
  .ticket-title h3 {
    font-size: 1.1rem;
  }
  
  .badge {
    padding: 5px 10px;
    font-size: 0.85rem;
  }
  
  .tag {
    padding: 4px 10px;
    font-size: 0.85rem;
  }
  
  .ticket-description {
    font-size: 1rem;
  }
}
</style> 