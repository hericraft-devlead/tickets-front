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
    <div class="filters" v-if="tickets.length > 0">
      <div class="filter-group">
        <label>Buscar:</label>
        <input 
          v-model="search" 
          type="text" 
          placeholder="Buscar por título o descripción"
          @input="loadTickets"
        />
      </div>
      
      <div class="filter-group">
        <label>Estado:</label>
        <select v-model="selectedStatus" @change="loadTickets">
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
        <label>Ordenar por:</label>
        <select v-model="sortBy" @change="loadTickets">
          <option value="created_at">Fecha de creación</option>
          <option value="updated_at">Última actualización</option>
          <option value="title">Título</option>
        </select>
        <button @click="toggleSortOrder" class="sort-btn">
          {{ sortOrder === 'desc' ? '⬇️' : '⬆️' }}
        </button>
      </div>
    </div>

    <!-- Estado de carga -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando tickets...</p>
    </div>

    <!-- Sin tickets -->
    <div v-else-if="!loading && tickets.length === 0" class="empty-state">
      <div class="empty-icon">📋</div>
      <h3>No hay tickets creados</h3>
      <p>Crea tu primer ticket para comenzar</p>
      <RouterLink to="/moodle/ticket" class="btn-primary">
        Crear Primer Ticket
      </RouterLink>
    </div>

    <!-- Lista de tickets -->
    <div v-else class="tickets-container">
      <div v-for="ticket in tickets" :key="ticket.id" class="ticket-card">
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
            
            <div v-if="ticket.assignedUser" class="detail">
              <span class="detail-label">Asignado a:</span>
              <span class="detail-value">{{ ticket.assignedUser.name }}</span>
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
    <div v-if="tickets.length > 0" class="pagination">
      <button 
        :disabled="!pagination.prev_page_url" 
        @click="changePage(pagination.current_page - 1)"
        class="page-btn"
      >
        ← Anterior
      </button>
      
      <span class="page-info">
        Página {{ pagination.current_page }} de {{ pagination.last_page }}
      </span>
      
      <button 
        :disabled="!pagination.next_page_url" 
        @click="changePage(pagination.current_page + 1)"
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
import ticketService from '@/services/ticket.service'
import { useMoodleAuthStore } from '@/stores/moodleAuth'

const router = useRouter()
const auth = useMoodleAuthStore()

/* ===================== STATE ===================== */
const tickets = ref([])
const loading = ref(false)
const search = ref('')
const selectedStatus = ref('')
const sortBy = ref('created_at')
const sortOrder = ref('desc')

const pagination = ref({
  current_page: 1,
  last_page: 1,
  prev_page_url: null,
  next_page_url: null,
  total: 0
})

/* ===================== STATUS OPTIONS ===================== */
const statusOptions = ref([
  { id: 1, name: 'Abierto' },
  { id: 2, name: 'En progreso' },
  { id: 3, name: 'Pendiente' },
  { id: 4, name: 'Resuelto' },
  { id: 5, name: 'Cerrado' }
])

/* ===================== COMPUTED ===================== */
const searchParams = computed(() => ({
  page: pagination.value.current_page,
  search: search.value,
  status_id: selectedStatus.value,
  sort_by: sortBy.value,
  sort_order: sortOrder.value
}))

/* ===================== METHODS ===================== */
function truncateDescription(text, maxLength = 150) {
  if (!text) return 'Sin descripción'
  return text.length > maxLength
    ? text.substring(0, maxLength) + '...'
    : text
}

function formatDate(dateString) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getPriorityClass(priority) {
  if (!priority?.name) return 'priority-default'
  return `priority-${priority.name.toLowerCase()}`
}

function getStatusClass(status) {
  if (!status?.name) return 'status-default'
  return `status-${status.name.toLowerCase().replace(' ', '-')}`
}

function canEditTicket(ticket) {
  return [1, 2, 3].includes(ticket.status_id)
}

function editTicket(ticketId) {
  router.push(`/moodle/ticket/${ticketId}/edit`)
}

function toggleSortOrder() {
  sortOrder.value = sortOrder.value === 'desc' ? 'asc' : 'desc'
  loadTickets()
}

function changePage(page) {
  if (page >= 1 && page <= pagination.value.last_page) {
    pagination.value.current_page = page
    loadTickets()
  }
}

/* ===================== API ===================== */
async function loadTickets() {
  if (!auth.user?.id) return

  loading.value = true

  try {
    const { data } = await ticketService.getByMoodleUser(
      auth.user.id,
      searchParams.value
    )

    tickets.value = data.data ?? data
    pagination.value = {
      current_page: data.current_page ?? 1,
      last_page: data.last_page ?? 1,
      prev_page_url: data.prev_page_url,
      next_page_url: data.next_page_url,
      total: data.total ?? 0
    }
  } catch (error) {
    console.error('Error cargando tickets:', error)
    tickets.value = []
  } finally {
    loading.value = false
  }
}

/* ===================== LIFECYCLE ===================== */
onMounted(() => {
  // El router ya garantiza auth
  if (auth.user?.id) {
    loadTickets()
  }
})

/* ===================== WATCH ===================== */
watch(
  () => auth.user,
  (user) => {
    if (user?.id) {
      loadTickets()
    }
  },
  { immediate: true }
)
</script>


<style scoped>
.ticket-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.list-header h1 {
  color: #333;
  margin: 0;
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
  transition: background 0.3s;
}

.btn-primary:hover {
  background: #4338ca;
}

.filters {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 200px;
}

.filter-group label {
  font-weight: 600;
  color: #475569;
  font-size: 0.9rem;
}

.filter-group input,
.filter-group select {
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.95rem;
}

.sort-btn {
  padding: 8px 12px;
  background: #e2e8f0;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.2rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
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
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.empty-state h3 {
  color: #334155;
  margin-bottom: 10px;
}

.empty-state p {
  color: #64748b;
  margin-bottom: 20px;
}

.tickets-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ticket-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  border-left: 4px solid #4f46e5;
  transition: transform 0.2s, box-shadow 0.2s;
}

.ticket-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.ticket-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.ticket-title {
  flex: 1;
}

.ticket-title h3 {
  color: #1e293b;
  margin: 0 0 5px 0;
  font-size: 1.25rem;
}

.ticket-id {
  color: #64748b;
  font-size: 0.9rem;
  font-family: monospace;
}

.ticket-meta {
  display: flex;
  gap: 10px;
}

.badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

/* Clases de prioridad */
.priority-alta { background: #fee2e2; color: #991b1b; }
.priority-media { background: #fef3c7; color: #92400e; }
.priority-baja { background: #d1fae5; color: #065f46; }
.priority-default { background: #e2e8f0; color: #475569; }

/* Clases de estado */
.status-abierto { background: #dbeafe; color: #1e40af; }
.status-en-progreso { background: #fef3c7; color: #92400e; }
.status-pendiente { background: #f3e8ff; color: #7c3aed; }
.status-resuelto { background: #d1fae5; color: #065f46; }
.status-cerrado { background: #e2e8f0; color: #475569; }
.status-default { background: #f1f5f9; color: #64748b; }

.ticket-body {
  margin-bottom: 20px;
}

.ticket-description {
  color: #475569;
  line-height: 1.6;
  margin-bottom: 20px;
}

.ticket-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8fafc;
  border-radius: 8px;
}

.detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
}

.detail-value {
  color: #334155;
  font-weight: 500;
}

.ticket-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 4px 10px;
  background: #e0e7ff;
  color: #3730a3;
  border-radius: 16px;
  font-size: 0.85rem;
}

.ticket-actions {
  display: flex;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.btn-view {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background 0.3s;
}

.btn-view:hover {
  background: #2563eb;
}

.btn-edit {
  padding: 8px 16px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-edit:hover {
  background: #059669;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.page-btn {
  padding: 8px 16px;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  cursor: pointer;
  color: #475569;
  font-weight: 500;
  transition: all 0.3s;
}

.page-btn:hover:not(:disabled) {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #64748b;
  font-weight: 500;
}
</style>