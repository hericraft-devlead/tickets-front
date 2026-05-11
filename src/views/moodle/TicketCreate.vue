<template>
  <div class="ticket-create">
    <div class="create-header">
      <h1>
        <span class="header-icon">🎫</span>
        Crear Ticket
      </h1>
    </div>

    <form @submit.prevent="submitTicket" class="form">

      <!-- Título -->
      <div class="form-group">
        <label class="form-label">
          <span class="label-icon">📝</span>
          Título *
        </label>
        <input
          v-model="form.title"
          type="text"
          class="form-input"
          :class="{ 'is-invalid': false }"
          required
          placeholder="Ingresa un título descriptivo"
        />
      </div>

      <!-- Descripción -->
      <div class="form-group">
        <label class="form-label">
          <span class="label-icon">📄</span>
          Descripción *
        </label>
        <textarea
          v-model="form.description"
          rows="5"
          class="form-input"
          :class="{ 'is-invalid': false }"
          required
          placeholder="Describe detalladamente tu problema o consulta"
        ></textarea>
      </div>

      <!-- Categoría -->
      <div class="form-group">
        <label class="form-label">
          <span class="label-icon">📂</span>
          Categoría *
        </label>
        <select
          v-model="form.category_id"
          class="form-select"
          :class="{ 'is-invalid': false }"
          required
        >
          <option value="">Selecciona una categoría</option>
          <option
            v-for="cat in categories"
            :key="cat.id"
            :value="cat.id"
          >
            {{ cat.name }}
          </option>
        </select>
      </div>

      <!-- Prioridad -->
      <div class="form-group">
        <label class="form-label">
          <span class="label-icon">⚠️</span>
          Prioridad *
        </label>
        <select
          v-model="form.priority_id"
          class="form-select"
          :class="{ 'is-invalid': false }"
          required
        >
          <option value="">Selecciona prioridad</option>
          <option
            v-for="priority in priorities"
            :key="priority.id"
            :value="priority.id"
          >
            {{ priority.name }}
          </option>
        </select>
      </div>

      <!-- ETIQUETAS (TAGS) -->
      <div class="form-group">
        <label class="form-label">
          <span class="label-icon">🏷️</span>
          Etiquetas
        </label>
        <div class="chips-container">
          <div class="chips-list">
            <span 
              v-for="tag in tags" 
              :key="tag.id"
              :class="['chip', { 'chip-selected': form.tag_ids.includes(tag.id) }]"
              @click="toggleTag(tag.id)"
            >
              {{ tag.name }}
            </span>
          </div>
          <small class="form-hint">Haz clic en las etiquetas para seleccionarlas</small>
        </div>
      </div>

      <!-- CONTACTO -->
      <div class="form-group">
        <label class="form-label">
          <span class="label-icon">👤</span>
          Nombre *
        </label>
        <input
          v-model="form.contact_name"
          type="text"
          class="form-input"
          :class="{ 'is-invalid': false }"
          required
          placeholder="Nombre del contacto"
        />
      </div>

      <div class="form-group">
        <label class="form-label">
          <span class="label-icon">📧</span>
          Correo *
        </label>
        <input
          v-model="form.contact_email"
          type="email"
          class="form-input"
          :class="{ 'is-invalid': false }"
          required
          placeholder="correo@ejemplo.com"
        />
      </div>

      <!-- Error -->
      <p v-if="error" class="error-message">
        {{ error }}
      </p>

      <!-- Botones -->
      <div class="form-footer">
        <button
          type="button"
          @click="resetForm"
          class="btn-secondary"
          :disabled="loading"
        >
          Limpiar
        </button>
        <button
          type="submit"
          class="btn-primary"
          :disabled="loading"
        >
          <span v-if="loading" class="spinner-small"></span>
          {{ loading ? 'Enviando...' : 'Crear Ticket' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import ticketService from '@/services/ticket.service'
import tagService from '@/services/tag.service'
import { useMoodleAuthStore } from '@/stores/moodleAuth'

const moodleAuth = useMoodleAuthStore()

const form = ref({
  title: '',
  description: '',
  category_id: '',
  priority_id: '',
  tag_ids: [], 
  contact_name: '',
  contact_email: '',
  moodle_user_id: null,
})

const categories = ref([])
const priorities = ref([])
const tags = ref([])

const loading = ref(false)
const error = ref(null)

function resetForm() {
  form.value = {
    title: '',
    description: '',
    category_id: '',
    priority_id: '',
    tag_ids: [], 
    contact_name: moodleAuth.user?.name || '',
    contact_email: moodleAuth.user?.email || '',
    moodle_user_id: moodleAuth.user?.id || null,
  }
  error.value = null
}

onMounted(async () => {
  try {
    const [categoriesRes, prioritiesRes, tagsRes] = await Promise.all([
      api.get('/categories'),
      api.get('/priorities'),
      tagService.getAll() 
    ])

    categories.value = categoriesRes.data
    priorities.value = prioritiesRes.data
    tags.value = tagsRes.data || []

    // Autocompletar datos del usuario si está logueado
    if (moodleAuth.user) {
      form.value.contact_name = moodleAuth.user.name
      form.value.contact_email = moodleAuth.user.email
      form.value.moodle_user_id = moodleAuth.user.id
    }
  } catch {
    error.value = 'No se pudieron cargar los datos'
  }
})

async function submitTicket() {
  loading.value = true
  error.value = null

  try {
    const ticketData = {
      ...form.value,
      tag_ids: Array.isArray(form.value.tag_ids) ? form.value.tag_ids : []
    }

    await ticketService.create(ticketData)
    alert('Ticket creado correctamente')
    resetForm()
  } catch (err) {
    error.value =
      err.response?.data?.message || 'Error al crear el ticket'
  } finally {
    loading.value = false
  }
}

function toggleTag(tagId) {
  const index = form.value.tag_ids.indexOf(tagId)
  if (index === -1) {
    form.value.tag_ids.push(tagId)
  } else {
    form.value.tag_ids.splice(index, 1)
  }
}
</script>

<style scoped>
.ticket-create {
  max-width: 700px;
  margin: 2rem auto;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.create-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
}

.create-header h1 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #111827;
  font-size: 1.75rem;
  font-weight: 600;
}

.header-icon {
  font-size: 1.75rem;
}

.form {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Estilos del formulario (consistentes con el modal) */
.form-group {
  margin-bottom: 0;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.label-icon {
  font-size: 1rem;
}

.form-hint {
  font-size: 0.75rem;
  color: #6b7280;
  font-style: italic;
  margin-left: 0.5rem;
  font-weight: normal;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s;
  background: white;
  font-family: inherit;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.form-input.is-invalid,
.form-select.is-invalid,
.form-textarea.is-invalid {
  border-color: #ef4444;
}

.form-input.is-invalid:focus,
.form-select.is-invalid:focus,
.form-textarea.is-invalid:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
  line-height: 1.5;
}

/* Estilos para etiquetas */
.chips-container {
  margin-top: 0.25rem;
}

.chips-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.chip {
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border-radius: 20px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
  font-size: 0.875rem;
  color: #374151;
  border: 1px solid transparent;
}

.chip:hover {
  background: #e5e7eb;
  transform: translateY(-1px);
}

.chip-selected {
  background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
  color: white;
  box-shadow: 0 2px 4px rgba(124, 58, 237, 0.2);
}

.chip-selected:hover {
  background: linear-gradient(135deg, #6d28d9 0%, #4c1d95 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(124, 58, 237, 0.3);
}

/* Error message */
.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  padding-left: 0.25rem;
  padding: 0.75rem;
  background: #fef2f2;
  border-radius: 0.5rem;
  border: 1px solid #fecaca;
}

/* Footer del formulario */
.form-footer {
  padding: 1.5rem 0 0;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

/* Botones (consistentes con el modal) */
.btn-primary,
.btn-secondary {
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
  min-width: 120px;
}

.btn-primary {
  background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(124, 58, 237, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover:not(:disabled) {
  background: #f3f4f6;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  .ticket-create {
    max-width: 95%;
    margin: 1rem auto;
  }
  
  .create-header {
    padding: 1rem;
  }
  
  .create-header h1 {
    font-size: 1.5rem;
  }
  
  .form {
    padding: 1.5rem;
    gap: 1rem;
  }
  
  .form-footer {
    padding: 1rem 0 0;
    flex-direction: column;
  }
  
  .btn-primary,
  .btn-secondary {
    width: 100%;
    min-width: auto;
  }
}

@media (max-width: 480px) {
  .ticket-create {
    margin: 0.5rem auto;
    border-radius: 0.5rem;
  }
  
  .create-header h1 {
    font-size: 1.25rem;
  }
  
  .form {
    padding: 1rem;
  }
  
  .chip {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
  }
}
</style>