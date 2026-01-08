<template>
  <div class="ticket-create">
    <h1>Crear Ticket</h1>

    <form @submit.prevent="submitTicket" class="form">

      <!-- Título -->
      <div class="field">
        <label>Título</label>
        <input v-model="form.title" type="text" required />
      </div>

      <!-- Descripción -->
      <div class="field">
        <label>Descripción</label>
        <textarea v-model="form.description" rows="5" required></textarea>
      </div>

      <!-- Categoría -->
      <div class="field">
        <label>Categoría</label>
        <select v-model="form.category_id" required>
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
      <div class="field">
        <label>Prioridad</label>
        <select v-model="form.priority_id" required>
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
      <div class="field">
      <label>Etiquetas</label>
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
        <small class="hint">Haz clic en las etiquetas para seleccionarlas</small>
      </div>
    </div>

      <!-- CONTACTO -->
      <div class="field">
        <label>Nombre</label>
        <input v-model="form.contact_name" type="text" required />
      </div>

      <div class="field">
        <label>Correo</label>
        <input v-model="form.contact_email" type="email" required />
      </div>

      <!-- Error -->
      <p v-if="error" class="error">{{ error }}</p>

      <!-- Botón -->
      <button type="submit" :disabled="loading">
        {{ loading ? 'Enviando...' : 'Crear Ticket' }}
      </button>
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
  max-width: 600px;
  margin: auto;
  background: white;
  padding: 20px;
  border-radius: 8px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.field label {
  font-weight: 600;
  margin-bottom: 5px;
  display: block;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  padding: 8px;
}

/* Estilos para etiquetas */
.chips-container {
  margin-top: 5px;
}

.chips-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.chip {
  padding: 6px 12px;
  background: #f1f1f1;
  border-radius: 20px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
}

.chip:hover {
  background: #e0e0e0;
}

.chip-selected {
  background: #2563eb;
  color: white;
}

.chip-selected:hover {
  background: #1d4ed8;
}

button {
  background: #2563eb;
  color: white;
  padding: 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
}

.error {
  color: red;
  font-size: 0.9rem;
}
</style>