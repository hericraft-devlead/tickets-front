<template>
  <div class="ticket-detail-panel">
    <!-- Encabezado del ticket -->
    <div class="panel-header">
      <div class="ticket-title-section">
        <h3 class="ticket-title">{{ ticket.title }}</h3>
        <div class="ticket-meta">
          <span class="ticket-id">#{{ ticket.id }}</span>
          <span class="ticket-date">{{ formatDate(ticket.created_at) }}</span>
        </div>
      </div>
    </div>

    <!-- Estado y prioridad -->
    <div class="status-section">
      <div class="status-row">
        <div class="status-item">
          <span class="label">Estado:</span>
          <span class="status-badge" :class="getStatusClass(ticket.status)">
            {{ ticket.status?.name || 'Sin estado' }}
          </span>
        </div>
        <div class="status-item">
          <span class="label">Prioridad:</span>
          <span class="priority-badge" :class="getPriorityClass(ticket.priority)">
            {{ ticket.priority?.name || 'Sin prioridad' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Información del ticket -->
    <div class="ticket-info-section">
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
        <span class="value user-value">
          <span class="user-avatar">{{ getInitials(ticket.assigned_user.name) }}</span>
          {{ ticket.assigned_user.name }}
        </span>
      </div>
      
      <div v-if="ticket.moodle_user" class="info-item">
        <span class="label">Solicitante:</span>
        <span class="value">{{ ticket.moodle_user.name || ticket.moodle_user.email }}</span>
      </div>
    </div>

    <!-- Descripción -->
    <div class="description-section">
      <h4 class="section-title">Descripción</h4>
      <div class="description-content" v-html="formatDescription(ticket.description)"></div>
    </div>

    <!-- Tags -->
    <div v-if="ticket.tags && ticket.tags.length > 0" class="tags-section">
      <h4 class="section-title">Etiquetas</h4>
      <div class="tags-list">
        <span 
          v-for="tag in ticket.tags" 
          :key="tag.id"
          class="tag"
        >
          {{ tag.name }}
        </span>
      </div>
    </div>

    <!-- Información adicional -->
    <div class="additional-info">
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
        <span class="value due-date" :class="{ 'overdue': isOverdue(ticket.due_date) }">
          {{ formatDate(ticket.due_date) }}
          <span v-if="isOverdue(ticket.due_date)" class="overdue-badge">⚠️ Vencido</span>
        </span>
      </div>
    </div>

    <!-- Comentarios recientes -->
    <div v-if="ticket.comments && ticket.comments.length > 0" class="recent-comments">
      <h4 class="section-title">Últimos comentarios</h4>
      <div class="comments-list">
        <div 
          v-for="comment in recentComments" 
          :key="comment.id"
          class="comment-item"
        >
          <div class="comment-header">
            <span class="comment-author">{{ comment.user?.name || 'Usuario' }}</span>
            <span class="comment-date">{{ formatTimeAgo(comment.created_at) }}</span>
          </div>
          <p class="comment-content">{{ truncateText(comment.content, 100) }}</p>
        </div>
      </div>
    </div>

    <!-- Estadísticas -->
    <div class="stats-section">
      <div class="stat-item">
        <span class="stat-icon">⏱️</span>
        <span class="stat-value">{{ calculateAge(ticket.created_at) }}</span>
        <span class="stat-label">Días</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  ticket: {
    type: Object,
    required: true
  },
  currentUserId: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['ticket-updated', 'view-full', 'edit-ticket', 'add-comment'])

// Computed
const recentComments = computed(() => {
  if (!props.ticket.comments) return []
  return props.ticket.comments
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 3)
})

const canEdit = computed(() => {
  if (!props.currentUserId) return false
  return props.ticket.moodle_user_id === props.currentUserId || 
         (props.ticket.assigned_user_id === props.currentUserId) ||
         [1, 2, 3].includes(props.ticket.status_id) // Estados editables
})

// Métodos
const viewFull = () => {
  emit('view-full')
}

const editTicket = () => {
  emit('edit-ticket', props.ticket.id)
}

const addComment = () => {
  emit('add-comment', props.ticket.id)
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

const formatDescription = (description) => {
  if (!description) return '<p class="no-description">Sin descripción</p>'
  // Reemplazar saltos de línea por <br>
  return description.replace(/\n/g, '<br>')
}

const truncateText = (text, maxLength = 100) => {
  if (!text) return ''
  return text.length > maxLength 
    ? text.substring(0, maxLength) + '...' 
    : text
}

const getInitials = (name) => {
  if (!name) return '??'
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2)
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
.ticket-detail-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.panel-header {
  padding-bottom: 15px;
  border-bottom: 1px solid #e2e8f0;
}

.ticket-title-section .ticket-title {
  margin: 0 0 10px 0;
  color: #1e293b;
  font-size: 1.4rem;
  font-weight: 600;
  line-height: 1.3;
}

.ticket-meta {
  display: flex;
  gap: 15px;
  align-items: center;
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

.status-section {
  background: #f8fafc;
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #e2e8f0;
}

.status-row {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.status-item {
  flex: 1;
  min-width: 120px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-item .label {
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 500;
}

.status-badge,
.priority-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
  text-align: center;
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

.ticket-info-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  font-weight: 500;
  color: #64748b;
  font-size: 0.9rem;
}

.info-item .value {
  font-weight: 600;
  color: #334155;
  text-align: right;
  max-width: 60%;
  word-break: break-word;
}

.user-value {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  width: 28px;
  height: 28px;
  background: #4f46e5;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
}

.description-section {
  flex: 1;
  min-height: 150px;
}

.section-title {
  color: #475569;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
}

.description-content {
  color: #475569;
  line-height: 1.6;
  font-size: 0.95rem;
  max-height: 200px;
  overflow-y: auto;
  padding-right: 5px;
}

.description-content :deep(br) {
  margin-bottom: 8px;
  display: block;
  content: "";
}

.no-description {
  color: #94a3b8;
  font-style: italic;
}

.tags-section {
  margin-top: 10px;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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

.additional-info {
  background: #f8fafc;
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.due-date {
  display: flex;
  align-items: center;
  gap: 8px;
}

.due-date.overdue {
  color: #dc2626;
}

.overdue-badge {
  background: #fee2e2;
  color: #991b1b;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 500;
}

.actions-section {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.actions-section button {
  flex: 1;
  min-width: 100px;
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
}

.btn-view-full {
  background: #3b82f6;
  color: white;
}

.btn-view-full:hover {
  background: #2563eb;
  transform: translateY(-2px);
}

.btn-edit {
  background: #10b981;
  color: white;
}

.btn-edit:hover {
  background: #059669;
  transform: translateY(-2px);
}

.btn-comment {
  background: #8b5cf6;
  color: white;
}

.btn-comment:hover {
  background: #7c3aed;
  transform: translateY(-2px);
}

.recent-comments {
  max-height: 200px;
  overflow-y: auto;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-item {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.comment-author {
  font-weight: 600;
  color: #334155;
  font-size: 0.9rem;
}

.comment-date {
  color: #94a3b8;
  font-size: 0.8rem;
}

.comment-content {
  color: #475569;
  font-size: 0.9rem;
  line-height: 1.4;
  margin: 0;
}

.stats-section {
  display: flex;
  justify-content: space-around;
  background: #f8fafc;
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #e2e8f0;
  margin-top: 10px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.stat-icon {
  font-size: 1.5rem;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: bold;
  color: #4f46e5;
}

.stat-label {
  font-size: 0.8rem;
  color: #64748b;
}

@media (max-width: 768px) {
  .ticket-title {
    font-size: 1.2rem;
  }
  
  .status-row {
    flex-direction: column;
  }
  
  .actions-section {
    flex-direction: column;
  }
  
  .actions-section button {
    width: 100%;
  }
}
</style>