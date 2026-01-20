<template>
  <div class="ticket-detail-view">
    <!-- Encabezado -->
    <div class="detail-header">
      <div class="header-main">
        <div class="ticket-title-section">
          <h1 class="ticket-title">{{ ticket.title }}</h1>
          <div class="ticket-meta">
            <span class="ticket-id">#{{ ticket.id }}</span>
            <span class="ticket-status">
              <span class="status-badge" :class="getStatusClass(ticket.status)">
                {{ ticket.status?.name || 'Sin estado' }}
              </span>
            </span>
            <span class="ticket-priority">
              <span class="priority-badge" :class="getPriorityClass(ticket.priority)">
                {{ ticket.priority?.name || 'Sin prioridad' }}
              </span>
            </span>
            <span class="ticket-date">{{ formatDateTime(ticket.created_at) }}</span>
          </div>
        </div>
        
        <div class="header-actions">
          <button @click="goBack" class="btn-back">
            ← Volver
          </button>
          <button 
            v-if="canEdit" 
            @click="editTicket" 
            class="btn-edit"
          >
            ✏️ Editar
          </button>
          <button 
            @click="toggleFavorite" 
            class="btn-favorite"
            :class="{ 'active': isFavorite }"
          >
            {{ isFavorite ? '★' : '☆' }}
          </button>
        </div>
      </div>
      
      <!-- Información rápida -->
      <div class="quick-info">
        <div class="info-item">
          <span class="label">Categoría:</span>
          <span class="value">{{ ticket.category?.name || 'Sin categoría' }}</span>
        </div>
        <div class="info-item">
          <span class="label">Departamento:</span>
          <span class="value">{{ ticket.department?.name || 'No asignado' }}</span>
        </div>
        <div v-if="ticket.assigned_user" class="info-item">
          <span class="label">Asignado a:</span>
          <span class="value user-info">
            <span class="user-avatar">{{ getInitials(ticket.assigned_user.name) }}</span>
            {{ ticket.assigned_user.name }}
          </span>
        </div>
        <div v-if="ticket.due_date" class="info-item">
          <span class="label">Fecha límite:</span>
          <span class="value" :class="{ 'overdue': isOverdue(ticket.due_date) }">
            {{ formatDate(ticket.due_date) }}
            <span v-if="isOverdue(ticket.due_date)" class="overdue-badge">⚠️ Vencido</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Contenido principal en dos columnas -->
    <div class="detail-content">
      <!-- Columna izquierda: Descripción y comentarios -->
      <div class="left-column">
        <!-- Descripción -->
        <div class="description-section">
          <div class="section-header">
            <h2>Descripción</h2>
            <button 
              v-if="canEdit" 
              @click="editDescription" 
              class="btn-edit-section"
            >
              ✏️ Editar
            </button>
          </div>
          <div class="description-content" v-html="formatDescription(ticket.description)"></div>
          
          <!-- Tags -->
          <div v-if="ticket.tags && ticket.tags.length > 0" class="tags-section">
            <h3>Etiquetas</h3>
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
        </div>

        <!-- Comentarios -->
        <div class="comments-section">
          <div class="section-header">
            <h2>Comentarios ({{ comments.length }})</h2>
          </div>
          
          <!-- Formulario de nuevo comentario -->
          <div v-if="canComment" class="new-comment-form">
            <textarea 
              v-model="newComment"
              placeholder="Escribe un comentario..."
              rows="4"
              class="comment-input"
              @keydown.ctrl.enter="addComment"
            ></textarea>
            <div class="comment-actions">
              <div class="comment-tools">
                <button @click="addAttachment" class="btn-tool" title="Adjuntar archivo">
                  📎
                </button>
                <button @click="addEmoji" class="btn-tool" title="Insertar emoji">
                  😀
                </button>
              </div>
              <button 
                @click="addComment" 
                :disabled="!newComment.trim()"
                class="btn-submit"
              >
                💬 Enviar comentario
              </button>
            </div>
          </div>
          
          <!-- Lista de comentarios -->
          <div class="comments-list">
            <div 
              v-for="comment in comments" 
              :key="comment.id"
              class="comment-item"
            >
              <div class="comment-header">
                <div class="comment-author">
                  <span class="author-avatar">{{ getInitials(comment.user?.name || 'U') }}</span>
                  <div class="author-info">
                    <span class="author-name">{{ comment.user?.name || 'Usuario' }}</span>
                    <span class="comment-role">{{ comment.user?.role || 'Usuario' }}</span>
                  </div>
                </div>
                <div class="comment-meta">
                  <span class="comment-date">{{ formatDateTime(comment.created_at) }}</span>
                  <button 
                    v-if="canDeleteComment(comment)"
                    @click="deleteComment(comment.id)"
                    class="btn-delete-comment"
                    title="Eliminar comentario"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <div class="comment-content">
                <p>{{ comment.content }}</p>
                
                <!-- Archivos adjuntos -->
                <div v-if="comment.attachments && comment.attachments.length > 0" class="comment-attachments">
                  <div 
                    v-for="attachment in comment.attachments" 
                    :key="attachment.id"
                    class="attachment-item"
                  >
                    <a 
                      :href="attachment.url" 
                      target="_blank" 
                      class="attachment-link"
                    >
                      📎 {{ attachment.original_name || attachment.name }}
                      <small>({{ formatFileSize(attachment.size) }})</small>
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-if="comments.length === 0" class="no-comments">
              <div class="empty-icon">💬</div>
              <p>No hay comentarios todavía</p>
              <p v-if="canComment">Sé el primero en comentar</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Columna derecha: Información y actividad -->
      <div class="right-column">
        <!-- Información del ticket -->
        <div class="info-section">
          <h2>Información del Ticket</h2>
          
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Solicitante:</span>
              <span class="value">{{ ticket.moodle_user?.name || ticket.moodle_user?.email || 'N/A' }}</span>
            </div>
            
            <div class="info-item">
              <span class="label">Email:</span>
              <span class="value">{{ ticket.moodle_user?.email || 'N/A' }}</span>
            </div>
            
            <div class="info-item">
              <span class="label">Teléfono:</span>
              <span class="value">{{ ticket.contact_phone || 'N/A' }}</span>
            </div>
            
            <div class="info-item">
              <span class="label">Ubicación:</span>
              <span class="value">{{ ticket.location || 'N/A' }}</span>
            </div>
            
            <div class="info-item">
              <span class="label">Tiempo estimado:</span>
              <span class="value">{{ ticket.estimated_time || 'No especificado' }}</span>
            </div>
            
            <div class="info-item">
              <span class="label">Tiempo real:</span>
              <span class="value">{{ ticket.actual_time || 'No registrado' }}</span>
            </div>
          </div>
        </div>

        <!-- Archivos adjuntos -->
        <div v-if="attachments.length > 0" class="attachments-section">
          <div class="section-header">
            <h2>Archivos adjuntos ({{ attachments.length }})</h2>
            <button 
              v-if="canEdit"
              @click="addAttachment"
              class="btn-add-attachment"
            >
              ➕ Agregar
            </button>
          </div>
          
          <div class="attachments-list">
            <div 
              v-for="attachment in attachments" 
              :key="attachment.id"
              class="attachment-card"
            >
              <div class="attachment-icon">
                {{ getFileIcon(attachment.type) }}
              </div>
              <div class="attachment-info">
                <a 
                  :href="attachment.url" 
                  target="_blank" 
                  class="attachment-name"
                >
                  {{ attachment.original_name || attachment.name }}
                </a>
                <div class="attachment-meta">
                  <span class="attachment-size">{{ formatFileSize(attachment.size) }}</span>
                  <span class="attachment-date">{{ formatDate(attachment.created_at) }}</span>
                </div>
              </div>
              <button 
                v-if="canDeleteAttachment(attachment)"
                @click="deleteAttachment(attachment.id)"
                class="btn-delete-attachment"
                title="Eliminar archivo"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>

        <!-- Historial de actividad -->
        <div class="activity-section">
          <div class="section-header">
            <h2>Historial de actividad</h2>
          </div>
          
          <div class="activity-timeline">
            <div 
              v-for="activity in activities" 
              :key="activity.id"
              class="activity-item"
            >
              <div class="activity-icon">
                {{ getActivityIcon(activity.type) }}
              </div>
              <div class="activity-content">
                <p class="activity-text">{{ activity.description }}</p>
                <div class="activity-meta">
                  <span class="activity-user">{{ activity.user?.name || 'Sistema' }}</span>
                  <span class="activity-date">{{ formatTimeAgo(activity.created_at) }}</span>
                </div>
              </div>
            </div>
            
            <div v-if="activities.length === 0" class="no-activity">
              <p>No hay actividad registrada</p>
            </div>
          </div>
        </div>

        <!-- Acciones rápidas -->
        <div class="quick-actions">
          <h2>Acciones rápidas</h2>
          <div class="actions-grid">
            <button 
              v-if="canChangeStatus"
              @click="changeStatus"
              class="action-btn status"
            >
              🔄 Cambiar estado
            </button>
            <button 
              v-if="canAssign"
              @click="assignTicket"
              class="action-btn assign"
            >
              👤 Asignar
            </button>
            <button 
              v-if="canEditPriority"
              @click="changePriority"
              class="action-btn priority"
            >
              ⚡ Cambiar prioridad
            </button>
            <button 
              @click="printTicket"
              class="action-btn print"
            >
              🖨️ Imprimir
            </button>
            <button 
              @click="shareTicket"
              class="action-btn share"
            >
              📤 Compartir
            </button>
            <button 
              v-if="canDelete"
              @click="deleteTicket"
              class="action-btn delete"
            >
              🗑️ Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para cambiar estado -->
    <div v-if="showStatusModal" class="modal-overlay" @click.self="closeStatusModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Cambiar estado del ticket</h3>
          <button @click="closeStatusModal" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <!-- Implementar selección de estado -->
        </div>
      </div>
    </div>

    <!-- Modal para adjuntar archivos -->
    <div v-if="showAttachmentModal" class="modal-overlay" @click.self="closeAttachmentModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Adjuntar archivo</h3>
          <button @click="closeAttachmentModal" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <!-- Implementar carga de archivos -->
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

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

const emit = defineEmits(['ticket-updated', 'ticket-deleted'])

const router = useRouter()

// Estados
const newComment = ref('')
const showStatusModal = ref(false)
const showAttachmentModal = ref(false)
const isFavorite = ref(false)
const comments = ref([])
const attachments = ref([])
const activities = ref([])

const notification = ref({
  show: false,
  message: '',
  type: 'info',
  icon: 'ℹ️'
})

// Computed
const canEdit = computed(() => {
  if (!props.currentUser) return false
  return props.currentUser.id === props.ticket.moodle_user_id ||
         props.currentUser.role === 'admin' ||
         props.currentUser.role === 'department_head'
})

const canComment = computed(() => {
  return props.currentUser !== null
})

const canDelete = computed(() => {
  if (!props.currentUser) return false
  return props.currentUser.id === props.ticket.moodle_user_id ||
         props.currentUser.role === 'admin'
})

const canChangeStatus = computed(() => {
  if (!props.currentUser) return false
  return props.currentUser.role === 'admin' ||
         props.currentUser.role === 'department_head' ||
         props.currentUser.id === props.ticket.assigned_user_id
})

const canAssign = computed(() => {
  if (!props.currentUser) return false
  return props.currentUser.role === 'admin' ||
         props.currentUser.role === 'department_head'
})

const canEditPriority = computed(() => {
  if (!props.currentUser) return false
  return props.currentUser.role === 'admin' ||
         props.currentUser.role === 'department_head'
})

// Métodos principales
const goBack = () => {
  router.back()
}

const editTicket = () => {
  router.push(`/moodle/ticket/${props.ticket.id}/edit`)
}

const toggleFavorite = () => {
  isFavorite.value = !isFavorite.value
  showNotification(
    isFavorite.value ? 'Ticket agregado a favoritos' : 'Ticket removido de favoritos',
    'info',
    isFavorite.value ? '⭐' : '☆'
  )
}

const addComment = async () => {
  if (!newComment.value.trim()) return
  
  try {
    const response = await api.post(`/tickets/${props.ticket.id}/comments`, {
      content: newComment.value
    })
    
    comments.value.unshift(response.data)
    newComment.value = ''
    
    showNotification('Comentario agregado', 'success', '💬')
  } catch (error) {
    console.error('Error agregando comentario:', error)
    showNotification('Error al agregar comentario', 'error', '❌')
  }
}

const deleteComment = async (commentId) => {
  if (!confirm('¿Estás seguro de eliminar este comentario?')) return
  
  try {
    await api.delete(`/tickets/comments/${commentId}`)
    comments.value = comments.value.filter(c => c.id !== commentId)
    showNotification('Comentario eliminado', 'success', '🗑️')
  } catch (error) {
    console.error('Error eliminando comentario:', error)
    showNotification('Error al eliminar comentario', 'error', '❌')
  }
}

const canDeleteComment = (comment) => {
  if (!props.currentUser) return false
  return props.currentUser.id === comment.user_id ||
         props.currentUser.role === 'admin'
}

const addAttachment = () => {
  showAttachmentModal.value = true
}

const deleteAttachment = async (attachmentId) => {
  if (!confirm('¿Estás seguro de eliminar este archivo?')) return
  
  try {
    await api.delete(`/attachments/${attachmentId}`)
    attachments.value = attachments.value.filter(a => a.id !== attachmentId)
    showNotification('Archivo eliminado', 'success', '🗑️')
  } catch (error) {
    console.error('Error eliminando archivo:', error)
    showNotification('Error al eliminar archivo', 'error', '❌')
  }
}

const canDeleteAttachment = (attachment) => {
  if (!props.currentUser) return false
  return props.currentUser.id === attachment.user_id ||
         props.currentUser.role === 'admin'
}

const changeStatus = () => {
  showStatusModal.value = true
}

const assignTicket = () => {
  // Implementar asignación
  showNotification('Función de asignación en desarrollo', 'info', '👤')
}

const changePriority = () => {
  // Implementar cambio de prioridad
  showNotification('Función de cambio de prioridad en desarrollo', 'info', '⚡')
}

const printTicket = () => {
  window.print()
}

const shareTicket = () => {
  if (navigator.share) {
    navigator.share({
      title: `Ticket #${props.ticket.id}: ${props.ticket.title}`,
      text: `Revisa este ticket: ${props.ticket.title}`,
      url: window.location.href
    })
  } else {
    // Copiar al portapapeles
    navigator.clipboard.writeText(window.location.href)
    showNotification('Enlace copiado al portapapeles', 'success', '📋')
  }
}

const deleteTicket = async () => {
  if (!confirm('¿Estás seguro de eliminar este ticket? Esta acción no se puede deshacer.')) return
  
  try {
    await api.delete(`/tickets/${props.ticket.id}`)
    emit('ticket-deleted', props.ticket.id)
    showNotification('Ticket eliminado correctamente', 'success', '🗑️')
    setTimeout(() => {
      router.push('/moodle/tickets')
    }, 1000)
  } catch (error) {
    console.error('Error eliminando ticket:', error)
    showNotification('Error al eliminar el ticket', 'error', '❌')
  }
}

// Utilidades
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES')
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

const isOverdue = (dueDate) => {
  if (!dueDate) return false
  const due = new Date(dueDate)
  const now = new Date()
  return due < now
}

const formatDescription = (description) => {
  if (!description) return '<p class="no-description">Sin descripción</p>'
  return description.replace(/\n/g, '<br>')
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

const getFileIcon = (fileType) => {
  if (!fileType) return '📄'
  
  const type = fileType.toLowerCase()
  if (type.includes('pdf')) return '📕'
  if (type.includes('word') || type.includes('doc')) return '📘'
  if (type.includes('excel') || type.includes('xls')) return '📗'
  if (type.includes('image')) return '🖼️'
  if (type.includes('video')) return '🎬'
  if (type.includes('audio')) return '🎵'
  if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return '🗜️'
  return '📄'
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getActivityIcon = (type) => {
  const icons = {
    created: '📝',
    updated: '✏️',
    commented: '💬',
    assigned: '👤',
    status_changed: '🔄',
    priority_changed: '⚡',
    attachment_added: '📎',
    closed: '✅',
    reopened: '🔄'
  }
  return icons[type] || '📋'
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

const closeStatusModal = () => {
  showStatusModal.value = false
}

const closeAttachmentModal = () => {
  showAttachmentModal.value = false
}

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

// Inicialización
onMounted(async () => {
  // Cargar datos adicionales si es necesario
  if (props.ticket.id) {
    try {
      // Cargar comentarios
      const commentsRes = await api.get(`/tickets/${props.ticket.id}/comments`)
      comments.value = commentsRes.data
      
      // Cargar archivos adjuntos
      const attachmentsRes = await api.get(`/tickets/${props.ticket.id}/attachments`)
      attachments.value = attachmentsRes.data
      
      // Cargar actividad
      const activitiesRes = await api.get(`/tickets/${props.ticket.id}/activities`)
      activities.value = activitiesRes.data
      
    } catch (error) {
      console.error('Error cargando datos adicionales:', error)
    }
  }
})
</script>

<style scoped>
/* Estilos para el componente de vista de detalles */
.ticket-detail-view {
  height: 100%;
}

.detail-header {
  background: white;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 30px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 25px;
}

.ticket-title-section {
  flex: 1;
  margin-right: 20px;
}

.ticket-title {
  color: #1e293b;
  margin: 0 0 15px 0;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
}

.ticket-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
}

.ticket-id {
  font-family: monospace;
  font-weight: bold;
  color: #4f46e5;
  background: #f1f5f9;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 1rem;
}

.status-badge,
.priority-badge {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.95rem;
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

.ticket-date {
  color: #64748b;
  font-size: 0.95rem;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.btn-back,
.btn-edit,
.btn-favorite {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-back {
  background: #64748b;
  color: white;
}

.btn-back:hover {
  background: #475569;
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

.btn-favorite {
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #cbd5e1;
  font-size: 1.2rem;
  padding: 10px 15px;
}

.btn-favorite.active {
  background: #fef3c7;
  color: #92400e;
  border-color: #fde68a;
}

.btn-favorite:hover {
  transform: translateY(-2px);
}

.quick-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
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
  font-size: 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  background: #4f46e5;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: bold;
}

.overdue-badge {
  background: #fee2e2;
  color: #991b1b;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 500;
  margin-left: 8px;
}

.detail-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
}

@media (max-width: 1024px) {
  .detail-content {
    grid-template-columns: 1fr;
  }
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.right-column {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

/* Secciones comunes */
.description-section,
.comments-section,
.info-section,
.attachments-section,
.activity-section,
.quick-actions {
  background: white;
  border-radius: 12px;
  padding: 25px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e2e8f0;
}

.section-header h2 {
  color: #1e293b;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.btn-edit-section,
.btn-add-attachment {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-edit-section:hover,
.btn-add-attachment:hover {
  background: #2563eb;
  transform: translateY(-2px);
}

.description-content {
  color: #475569;
  line-height: 1.6;
  font-size: 1.05rem;
}

.tags-section {
  margin-top: 20px;
}

.tags-section h3 {
  color: #475569;
  font-size: 1.2rem;
  margin: 0 0 15px 0;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag {
  background: #e0e7ff;
  color: #4f46e5;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.9rem;
  font-weight: 500;
  border: 1px solid #c7d2fe;
}

/* Comentarios */
.new-comment-form {
  margin-bottom: 30px;
}

.comment-input {
  width: 100%;
  padding: 15px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  margin-bottom: 15px;
  transition: border-color 0.3s;
}

.comment-input:focus {
  outline: none;
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.comment-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.comment-tools {
  display: flex;
  gap: 10px;
}

.btn-tool {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.3s;
}

.btn-tool:hover {
  background: #e2e8f0;
  transform: translateY(-2px);
}

.btn-submit {
  padding: 10px 20px;
  background: #4f46e5;
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

.btn-submit:hover:not(:disabled) {
  background: #4338ca;
  transform: translateY(-2px);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comment-item {
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.comment-author {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-avatar {
  width: 40px;
  height: 40px;
  background: #4f46e5;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: bold;
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.author-name {
  font-weight: 600;
  color: #334155;
  font-size: 1rem;
}

.comment-role {
  color: #64748b;
  font-size: 0.85rem;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 15px;
}

.comment-date {
  color: #94a3b8;
  font-size: 0.9rem;
}

.btn-delete-comment {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 5px;
  transition: color 0.3s;
}

.btn-delete-comment:hover {
  color: #dc2626;
}

.comment-content p {
  color: #475569;
  line-height: 1.6;
  margin: 0 0 15px 0;
  font-size: 1rem;
}

.comment-attachments {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.attachment-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #3b82f6;
  text-decoration: none;
  font-size: 0.95rem;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  transition: all 0.3s;
}

.attachment-link:hover {
  background: #f1f5f9;
  border-color: #3b82f6;
}

.attachment-link small {
  color: #64748b;
  font-size: 0.85rem;
}

.no-comments {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 15px;
  opacity: 0.5;
}

/* Información del ticket */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

/* Archivos adjuntos */
.attachments-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.attachment-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  transition: all 0.3s;
}

.attachment-card:hover {
  background: white;
  border-color: #c7d2fe;
  transform: translateY(-2px);
}

.attachment-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.attachment-info {
  flex: 1;
  min-width: 0;
}

.attachment-name {
  display: block;
  color: #334155;
  font-weight: 500;
  text-decoration: none;
  margin-bottom: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-name:hover {
  color: #4f46e5;
}

.attachment-meta {
  display: flex;
  gap: 15px;
  color: #64748b;
  font-size: 0.85rem;
}

.btn-delete-attachment {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 5px;
  transition: color 0.3s;
}

.btn-delete-attachment:hover {
  color: #dc2626;
}

/* Historial de actividad */
.activity-timeline {
  position: relative;
  padding-left: 30px;
}

.activity-timeline::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e2e8f0;
}

.activity-item {
  position: relative;
  margin-bottom: 20px;
  display: flex;
  gap: 15px;
}

.activity-icon {
  position: absolute;
  left: -30px;
  top: 0;
  width: 20px;
  height: 20px;
  background: white;
  border: 2px solid #4f46e5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  z-index: 1;
}

.activity-content {
  flex: 1;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 15px;
}

.activity-text {
  color: #475569;
  margin: 0 0 10px 0;
  line-height: 1.4;
}

.activity-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #94a3b8;
  font-size: 0.85rem;
}

.activity-user {
  font-weight: 500;
  color: #64748b;
}

.no-activity {
  text-align: center;
  padding: 20px;
  color: #94a3b8;
  font-style: italic;
}

/* Acciones rápidas */
.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
}

.action-btn {
  padding: 12px 15px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  font-size: 0.9rem;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-btn.status {
  background: #dbeafe;
  color: #1e40af;
}

.action-btn.assign {
  background: #e0e7ff;
  color: #3730a3;
}

.action-btn.priority {
  background: #fef3c7;
  color: #92400e;
}

.action-btn.print {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
}

.action-btn.share {
  background: #d1fae5;
  color: #065f46;
}

.action-btn.delete {
  background: #fee2e2;
  color: #991b1b;
}

/* Modales y notificaciones */
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
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px;
  border-bottom: 1px solid #e2e8f0;
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
}

.modal-body {
  padding: 25px;
}

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
  z-index: 1100;
  max-width: 400px;
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
}

.notification-close:hover {
  opacity: 1;
}

/* Responsive */
@media (max-width: 768px) {
  .header-main {
    flex-direction: column;
    gap: 15px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .ticket-title {
    font-size: 1.6rem;
  }
  
  .ticket-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .quick-info {
    grid-template-columns: 1fr;
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>