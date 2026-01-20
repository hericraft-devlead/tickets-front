<template>
  <div class="quick-view-modal">
    <!-- Encabezado -->
    <div class="modal-header">
      <div class="ticket-info">
        <div class="ticket-title-section">
          <h3 class="ticket-title">{{ ticket.title }}</h3>
          <div class="ticket-meta">
            <span class="ticket-id">#{{ ticket.id }}</span>
            <span class="ticket-date">{{ formatDate(ticket.created_at) }}</span>
          </div>
        </div>
        
        <div class="ticket-status">
          <span class="status-badge" :class="getStatusClass(ticket.status)">
            {{ ticket.status?.name || 'Sin estado' }}
          </span>
          <span class="priority-badge" :class="getPriorityClass(ticket.priority)">
            {{ ticket.priority?.name || 'Sin prioridad' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Contenido principal -->
    <div class="modal-content">
      <!-- Descripción breve -->
      <div class="description-section">
        <h4 class="section-title">Descripción</h4>
        <div class="description-content">
          <p>{{ truncateDescription(ticket.description) }}</p>
          <button 
            v-if="ticket.description && ticket.description.length > 200" 
            @click="toggleDescription"
            class="btn-show-more"
          >
            {{ showFullDescription ? 'Mostrar menos' : 'Mostrar más' }}
          </button>
        </div>
      </div>

      <!-- Información clave -->
      <div class="key-info">
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Categoría:</span>
            <span class="value">{{ ticket.category?.name || 'Sin categoría' }}</span>
          </div>
          
          <div v-if="ticket.department" class="info-item">
            <span class="label">Departamento:</span>
            <span class="value">{{ ticket.department.name }}</span>
          </div>
          
          <div v-if="ticket.assigned_user" class="info-item">
            <span class="label">Asignado a:</span>
            <span class="value">{{ ticket.assigned_user.name }}</span>
          </div>
          
          <div v-if="ticket.moodle_user" class="info-item">
            <span class="label">Solicitante:</span>
            <span class="value">{{ ticket.moodle_user.name || ticket.moodle_user.email }}</span>
          </div>
          
          <div class="info-item">
            <span class="label">Creado:</span>
            <span class="value">{{ formatDateTime(ticket.created_at) }}</span>
          </div>
          
          <div class="info-item">
            <span class="label">Actualizado:</span>
            <span class="value">{{ formatDateTime(ticket.updated_at) }}</span>
          </div>
          
          <div v-if="ticket.due_date" class="info-item">
            <span class="label">Fecha límite:</span>
            <span class="value" :class="{ 'overdue': isOverdue(ticket.due_date) }">
              {{ formatDate(ticket.due_date) }}
              <span v-if="isOverdue(ticket.due_date)" class="overdue-badge">⚠️</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Tags -->
      <div v-if="ticket.tags && ticket.tags.length > 0" class="tags-section">
        <h4 class="section-title">Etiquetas</h4>
        <div class="tags-list">
          <span 
            v-for="tag in ticket.tags.slice(0, 5)" 
            :key="tag.id"
            class="tag"
          >
            {{ tag.name }}
          </span>
          <span v-if="ticket.tags.length > 5" class="tag-more">
            +{{ ticket.tags.length - 5 }}
          </span>
        </div>
      </div>

      <!-- Estadísticas rápidas -->
      <div class="quick-stats">
        <div class="stat-item">
          <div class="stat-icon">💬</div>
          <div class="stat-content">
            <div class="stat-value">{{ ticket.comments_count || 0 }}</div>
            <div class="stat-label">Comentarios</div>
          </div>
        </div>
        
        <div class="stat-item">
          <div class="stat-icon">📎</div>
          <div class="stat-content">
            <div class="stat-value">{{ ticket.attachments_count || 0 }}</div>
            <div class="stat-label">Archivos</div>
          </div>
        </div>
        
        <div class="stat-item">
          <div class="stat-icon">⏱️</div>
          <div class="stat-content">
            <div class="stat-value">{{ calculateAge(ticket.created_at) }}</div>
            <div class="stat-label">Días activo</div>
          </div>
        </div>
      </div>

      <!-- Comentario reciente -->
      <div v-if="recentComment" class="recent-comment">
        <h4 class="section-title">Último comentario</h4>
        <div class="comment-preview">
          <div class="comment-header">
            <span class="comment-author">{{ recentComment.user?.name || 'Usuario' }}</span>
            <span class="comment-date">{{ formatTimeAgo(recentComment.created_at) }}</span>
          </div>
          <p class="comment-content">{{ truncateText(recentComment.content, 150) }}</p>
        </div>
      </div>

      <!-- Acciones rápidas -->
      <div class="quick-actions">
        <h4 class="section-title">Acciones</h4>
        <div class="actions-grid">
          <button @click="viewFull" class="btn-action view">
            👁️ Ver completo
          </button>
          <button 
            v-if="canEdit" 
            @click="editTicket" 
            class="btn-action edit"
          >
            ✏️ Editar
          </button>
          <button 
            @click="addComment" 
            class="btn-action comment"
          >
            💬 Comentar
          </button>
          <button 
            @click="changeStatus" 
            class="btn-action status"
          >
            🔄 Estado
          </button>
          <button 
            @click="assignTicket" 
            class="btn-action assign"
          >
            👤 Asignar
          </button>
          <button 
            @click="closeModal" 
            class="btn-action close"
          >
            ❌ Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  ticket: {
    type: Object,
    required: true
  },
  currentUser: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'edit', 'view-full', 'add-comment', 'change-status', 'assign'])

// Estados
const showFullDescription = ref(false)

// Computed
const canEdit = computed(() => {
  if (!props.currentUser) return false
  return props.currentUser.id === props.ticket.moodle_user_id ||
         props.currentUser.role === 'admin' ||
         props.currentUser.role === 'department_head'
})

const recentComment = computed(() => {
  if (!props.ticket.comments || props.ticket.comments.length === 0) return null
  return props.ticket.comments
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
})

// Métodos
const closeModal = () => {
  emit('close')
}

const viewFull = () => {
  emit('view-full')
  closeModal()
}

const editTicket = () => {
  emit('edit', props.ticket.id)
  closeModal()
}

const addComment = () => {
  emit('add-comment', props.ticket.id)
  closeModal()
}

const changeStatus = () => {
  emit('change-status', props.ticket.id)
  closeModal()
}

const assignTicket = () => {
  emit('assign', props.ticket.id)
  closeModal()
}

const toggleDescription = () => {
  showFullDescription.value = !showFullDescription.value
}

// Utilidades
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
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
    return `Hace ${diffMins} min`
  } else if (diffHours < 24) {
    return `Hace ${diffHours} h`
  } else if (diffDays < 7) {
    return `Hace ${diffDays} d`
  } else {
    return formatDate(dateString)
  }
}

const calculateAge = (dateString) => {
  if (!dateString) return 0
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

const isOverdue = (dueDate) => {
  if (!dueDate) return false
  const due = new Date(dueDate)
  const now = new Date()
  return due < now
}

const truncateDescription = (description) => {
  if (!description) return 'Sin descripción'
  const maxLength = showFullDescription.value ? 1000 : 200
  return description.length > maxLength
    ? description.substring(0, maxLength) + '...'
    : description
}

const truncateText = (text, maxLength = 100) => {
  if (!text) return ''
  return text.length > maxLength
    ? text.substring(0, maxLength) + '...'
    : text
}

const getStatusClass = (status) => {
  if (!status) return 'status-default'
  const statusName = status.name.toLowerCase()
  if (statusName.includes('abierto')) return 'status-open'
  if (statusName.includes('progreso')) return 'status-progress'
  if (statusName.includes('pendiente')) return 'status-pending'
  if (statusName.includes('resuelto')) return 'status-resolved'
  if (statusName.includes('cerrado')) return 'status-closed'
  return 'status-default'
}

const getPriorityClass = (priority) => {
  if (!priority) return 'priority-default'
  const priorityName = priority.name.toLowerCase()
  if (priorityName.includes('urgente')) return 'priority-high'
  if (priorityName.includes('alta')) return 'priority-high'
  if (priorityName.includes('media')) return 'priority-medium'
  if (priorityName.includes('baja')) return 'priority-low'
  return 'priority-default'
}
</script>

<style scoped>
.quick-view-modal {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  border-radius: 12px 12px 0 0;
}

.ticket-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  flex-wrap: wrap;
}

.ticket-title-section {
  flex: 1;
  min-width: 200px;
}

.ticket-title {
  color: #1e293b;
  margin: 0 0 10px 0;
  font-size: 1.4rem;
  font-weight: 600;
  line-height: 1.3;
}

.ticket-meta {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.ticket-id {
  font-family: monospace;
  font-weight: bold;
  color: #4f46e5;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.95rem;
}

.ticket-date {
  color: #64748b;
  font-size: 0.9rem;
}

.ticket-status {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.status-badge,
.priority-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-open { background: #dbeafe; color: #1e40af; }
.status-progress { background: #fef3c7; color: #92400e; }
.status-pending { background: #f3e8ff; color: #7c3aed; }
.status-resolved { background: #d1fae5; color: #065f46; }
.status-closed { background: #e2e8f0; color: #475569; }
.status-default { background: #f1f5f9; color: #64748b; }

.priority-high { background: #fee2e2; color: #991b1b; }
.priority-medium { background: #fef3c7; color: #92400e; }
.priority-low { background: #d1fae5; color: #065f46; }
.priority-default { background: #e2e8f0; color: #475569; }

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-title {
  color: #475569;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
}

.description-section {
  background: #f8fafc;
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #e2e8f0;
}

.description-content {
  color: #475569;
  line-height: 1.6;
  font-size: 0.95rem;
}

.btn-show-more {
  background: none;
  border: none;
  color: #3b82f6;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  margin-top: 10px;
  padding: 5px 0;
  transition: color 0.3s;
}

.btn-show-more:hover {
  color: #2563eb;
}

.key-info {
  background: #f8fafc;
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #e2e8f0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-item .label {
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 500;
}

.info-item .value {
  font-weight: 600;
  color: #334155;
  font-size: 0.95rem;
  word-break: break-word;
}

.overdue-badge {
  display: inline-block;
  background: #fee2e2;
  color: #991b1b;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 500;
  margin-left: 5px;
}

.tags-section {
  background: #f8fafc;
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #e2e8f0;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.tag {
  background: #e0e7ff;
  color: #4f46e5;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
  border: 1px solid #c7d2fe;
}

.tag-more {
  background: #cbd5e1;
  color: #475569;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.stat-item {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
  transition: all 0.3s;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 2rem;
  width: 50px;
  height: 50px;
  background: #f1f5f9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #4f46e5;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 500;
}

.recent-comment {
  background: #f8fafc;
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #e2e8f0;
}

.comment-preview {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 15px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.comment-author {
  font-weight: 600;
  color: #334155;
  font-size: 0.95rem;
}

.comment-date {
  color: #94a3b8;
  font-size: 0.85rem;
}

.comment-content {
  color: #475569;
  font-size: 0.9rem;
  line-height: 1.4;
  margin: 0;
}

.quick-actions {
  background: #f8fafc;
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #e2e8f0;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.btn-action {
  padding: 10px 15px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.9rem;
  white-space: nowrap;
}

.btn-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.btn-action.view {
  background: #3b82f6;
  color: white;
}

.btn-action.edit {
  background: #10b981;
  color: white;
}

.btn-action.comment {
  background: #8b5cf6;
  color: white;
}

.btn-action.status {
  background: #f59e0b;
  color: white;
}

.btn-action.assign {
  background: #64748b;
  color: white;
}

.btn-action.close {
  background: #ef4444;
  color: white;
}

@media (max-width: 768px) {
  .ticket-info {
    flex-direction: column;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .quick-stats {
    grid-template-columns: 1fr;
  }
  
  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .actions-grid {
    grid-template-columns: 1fr;
  }
  
  .ticket-title {
    font-size: 1.2rem;
  }
}
</style>