<template>
  <div v-if="visible" class="modal-overlay" @click.self="closeModal">
    <div class="modal-container">
      <div class="modal-header">
        <h3>
          <span class="modal-icon">{{ isEditing ? '✏️' : '➕' }}</span>
          {{ isEditing ? 'Editar Usuario' : 'Nuevo Usuario' }}
        </h3>
        <button @click="closeModal" class="modal-close">×</button>
      </div>
      
      <form @submit.prevent="handleSubmit">
        <div class="modal-body">
          <!-- Contenedor con scroll para los campos del formulario -->
          <div class="modal-content">
            <div class="form-group">
              <label for="name" class="form-label">
                <span class="label-icon">👤</span> Nombre *
              </label>
              <input
                type="text"
                id="name"
                v-model="formData.name"
                class="form-input"
                :class="{ 'is-invalid': errors.name }"
                required
                placeholder="Nombre completo del usuario"
              />
              <div v-if="errors.name" class="error-message">
                {{ errors.name[0] }}
              </div>
            </div>

            <div class="form-group">
              <label for="email" class="form-label">
                <span class="label-icon">📧</span> Email *
              </label>
              <input
                type="email"
                id="email"
                v-model="formData.email"
                class="form-input"
                :class="{ 'is-invalid': errors.email }"
                required
                placeholder="correo@ejemplo.com"
              />
              <div v-if="errors.email" class="error-message">
                {{ errors.email[0] }}
              </div>
            </div>

            <div class="form-group">
              <label for="password" class="form-label">
                <span class="label-icon">🔒</span> 
                {{ isEditing ? 'Nueva contraseña' : 'Contraseña *' }}
                <span v-if="isEditing" class="form-hint">(dejar en blanco para no cambiar)</span>
              </label>
              <input
                type="password"
                id="password"
                v-model="formData.password"
                class="form-input"
                :class="{ 'is-invalid': errors.password }"
                :required="!isEditing"
                placeholder="••••••••"
              />
              <div v-if="errors.password" class="error-message">
                {{ errors.password[0] }}
              </div>
            </div>

            <div class="form-group">
              <label for="role" class="form-label">
                <span class="label-icon">👑</span> Rol *
              </label>
              <select
                id="role"
                v-model="formData.role"
                class="form-select"
                :class="{ 'is-invalid': errors.role }"
                required
              >
                <option value="">-- Seleccionar rol --</option>
                <option value="0">Administrador</option>
                <option value="1">Agente de Soporte</option>
              </select>
              <div v-if="errors.role" class="error-message">
                {{ errors.role[0] }}
              </div>
            </div>

            <div class="form-group">
              <label for="department_id" class="form-label">
                <span class="label-icon">🏢</span> Departamento
              </label>
              <select
                id="department_id"
                v-model="formData.department_id"
                class="form-select"
                :class="{ 'is-invalid': errors.department_id }"
              >
                <option value="">-- Sin departamento --</option>
                <option 
                  v-for="department in departments" 
                  :key="department.id" 
                  :value="department.id"
                >
                  {{ department.name }}
                </option>
              </select>
              <div v-if="errors.department_id" class="error-message">
                {{ errors.department_id[0] }}
              </div>
              <div class="form-hint">
                Nota: Los administradores sin departamento son Super Administradores
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button
            type="button"
            @click="closeModal"
            class="btn-secondary"
            :disabled="saving"
          >
            Cancelar
          </button>
          <button type="submit" class="btn-primary" :disabled="saving">
            <span v-if="saving" class="spinner-small"></span>
            {{ isEditing ? 'Actualizar' : 'Crear' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, reactive, watch, computed } from 'vue'

export default {
  name: 'UserModal',
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    isEditing: {
      type: Boolean,
      default: false
    },
    userData: {
      type: Object,
      default: () => ({})
    },
    departments: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    errors: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['close', 'submit', 'update:visible'],
  
  setup(props, { emit }) {
    const saving = ref(false)
    
    // Datos del formulario
    const formData = reactive({
      id: null,
      name: '',
      email: '',
      password: '',
      role: '',
      department_id: null
    })
    
    // Watcher para actualizar formData cuando cambia userData
    watch(() => props.userData, (newUserData) => {
      if (props.isEditing && newUserData) {
        Object.assign(formData, {
          id: newUserData.id,
          name: newUserData.name || '',
          email: newUserData.email || '',
          password: '',
          role: newUserData.role ? newUserData.role.toString() : '',
          department_id: newUserData.department_id || null
        })
      }
    }, { immediate: true })
    
    // Watcher para resetear formulario cuando se abre para crear
    watch(() => props.visible, (visible) => {
      if (visible && !props.isEditing) {
        resetForm()
      }
    })
    
    // Computed para el título del modal
    const modalTitle = computed(() => {
      return props.isEditing ? 'Editar Usuario' : 'Nuevo Usuario'
    })
    
    // Métodos
    const resetForm = () => {
      Object.assign(formData, {
        id: null,
        name: '',
        email: '',
        password: '',
        role: '',
        department_id: null
      })
    }
    
    const closeModal = () => {
      emit('update:visible', false)
      emit('close')
      resetForm()
    }
    
    const handleSubmit = () => {
      // Preparar datos para enviar
      const submitData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department_id: formData.department_id || null
      }
      
      // Agregar contraseña solo si se proporcionó
      if (formData.password) {
        submitData.password = formData.password
      } else if (!props.isEditing) {
        // Para nuevos usuarios, establecer contraseña por defecto
        submitData.password = 'password123'
      }
      
      // Si estamos editando, agregar el ID
      if (props.isEditing && formData.id) {
        submitData.id = formData.id
      }
      
      emit('submit', submitData)
    }
    
    return {
      formData,
      saving,
      modalTitle,
      closeModal,
      handleSubmit,
      resetForm
    }
  }
}
</script>

<style scoped>
/* Estilos del modal */
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
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-container {
  background: white;
  border-radius: 0.75rem;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-radius: 0.75rem 0.75rem 0 0;
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #111827;
  font-size: 1.25rem;
  font-weight: 600;
}

.modal-icon {
  font-size: 1.5rem;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.75rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0.25rem;
  border-radius: 0.25rem;
  line-height: 1;
  transition: all 0.2s;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #111827;
}

.modal-body {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.modal-content {
  padding: 1.5rem;
  overflow-y: auto;
  max-height: 60vh;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  background: #f9fafb;
  border-radius: 0 0 0.75rem 0.75rem;
  flex-shrink: 0;
}

/* Estilos del formulario */
.form-group {
  margin-bottom: 1.5rem;
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
.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s;
  background: white;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.form-input.is-invalid,
.form-select.is-invalid {
  border-color: #ef4444;
}

.form-input.is-invalid:focus,
.form-select.is-invalid:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.error-message {
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  padding-left: 0.25rem;
}

/* Botones */
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
  min-width: 100px;
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

/* Scroll personalizado */
.modal-content::-webkit-scrollbar {
  width: 6px;
}

.modal-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.modal-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.modal-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Responsive */
@media (max-width: 768px) {
  .modal-container {
    max-width: 95%;
    max-height: 85vh;
  }
  
  .modal-header {
    padding: 1rem;
  }
  
  .modal-content {
    padding: 1rem;
    max-height: 55vh;
  }
  
  .modal-footer {
    padding: 1rem;
  }
  
  .btn-primary,
  .btn-secondary {
    padding: 0.625rem 1rem;
    min-width: 80px;
    font-size: 0.75rem;
  }
}

@media (max-width: 480px) {
  .modal-overlay {
    padding: 0.5rem;
  }
  
  .modal-header h3 {
    font-size: 1rem;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  .form-input,
  .form-select {
    padding: 0.625rem;
  }
  
  .modal-content {
    max-height: 50vh;
  }
}
</style>