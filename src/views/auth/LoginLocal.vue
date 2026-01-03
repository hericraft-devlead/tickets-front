<template>
  <div class="login-container">
    <div class="login-form">
      <h2>Acceso Administrativo</h2>
      <p class="subtitle">Solo usuarios autorizados del sistema</p>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">Email:</label>
          <input
            id="email"
            v-model="credentials.email"
            type="text"
            required
            placeholder="Email"
            :disabled="loading"
          />
        </div>

        <div class="form-group">
          <label for="password">Contraseña:</label>
          <input
            id="password"
            v-model="credentials.password"
            type="password"
            required
            placeholder="Contraseña"
            :disabled="loading"
          />
        </div>

        <button
          type="submit"
          class="login-btn"
          :disabled="loading"
        >
          {{ loading ? 'Validando...' : 'Entrar como Admin' }}
        </button>
      </form>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div v-if="success" class="success-message">
        {{ success }}
      </div>

      <div class="back-link">
        <a @click.prevent="goToMoodleLogin" href="#">
          ← Volver al login principal
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import AuthLocalService from '@/services/authLocal.service.js'
import { useAdminAuthStore } from '@/stores/adminAuth'

export default {
  name: 'LoginLocal',

  data() {
    return {
      credentials: {
        email: '',
        password: ''
      },
      loading: false,
      error: '',
      success: ''
    }
  },

  methods: {
    async handleLogin() {
      this.loading = true
      this.error = ''

      try {
        const response = await AuthLocalService.login(this.credentials)

        const authStore = useAdminAuthStore()

        authStore.login({
          token: response.token,
          user: response.user
        })

        this.success = `Bienvenido ${response.user.name}`

        setTimeout(() => {
          this.$router.push('/admin/dashboard')
        }, 800)

      } catch (err) {
        this.error = err.message || 'Error al iniciar sesión'
      } finally {
        this.loading = false
      }
    },

    goToMoodleLogin() {
      this.$router.push('/login')
    }
  }
}
</script>


<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
}

.login-form {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
}

.login-form h2 {
  text-align: center;
  margin-bottom: 0.5rem;
  color: #111827;
  font-size: 1.8rem;
}

.subtitle {
  text-align: center;
  color: #555;
  margin-bottom: 2rem;
  font-size: 0.85rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  font-weight: 600;
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-size: 0.9rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 1rem;
}

.form-group input:focus {
  outline: none;
  border-color: #111827;
}

.login-btn {
  width: 100%;
  padding: 0.75rem;
  background: #111827;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.login-btn:hover:not(:disabled) {
  background: #000;
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #fee;
  color: #c33;
  border: 1px solid #fcc;
  border-radius: 6px;
  text-align: center;
  font-size: 0.9rem;
}

.success-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #efe;
  color: #14532d;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  text-align: center;
  font-size: 0.9rem;
}

.back-link {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.75rem;
}

.back-link a {
  color: #4f46e5;
  text-decoration: none;
  font-weight: 600;
}

.back-link a:hover {
  text-decoration: underline;
}
</style>
