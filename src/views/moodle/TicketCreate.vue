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

      <!-- CONTACTO (SIEMPRE) -->
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
import { useMoodleAuthStore } from '@/stores/moodleAuth'

const moodleAuth = useMoodleAuthStore()

const form = ref({
  title: '',
  description: '',
  category_id: '',
  priority_id: '',
  contact_name: '',
  contact_email: '',
  moodle_user_id: null,
})

const categories = ref([])
const priorities = ref([])

const loading = ref(false)
const error = ref(null)

function resetForm() {
  form.value = {
    title: '',
    description: '',
    category_id: '',
    priority_id: '',
    contact_name: moodleAuth.user?.name || '',
    contact_email: moodleAuth.user?.email || '',
    moodle_user_id: moodleAuth.user?.id || null,
  }
}

onMounted(async () => {
  try {
    const [categoriesRes, prioritiesRes] = await Promise.all([
      api.get('/categories'),
      api.get('/priorities'),
    ])

    categories.value = categoriesRes.data
    priorities.value = prioritiesRes.data


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
    await ticketService.create(form.value)
    alert('Ticket creado correctamente')
    resetForm()
  } catch (err) {
    error.value =
      err.response?.data?.message || 'Error al crear el ticket'
  } finally {
    loading.value = false
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
