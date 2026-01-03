<template>
  <div class="login-container">
    <div class="login-form">
      <h2>Iniciar Sesión con Moodle</h2>
      <p class="subtitle">Usa tus credenciales de la plataforma Moodle</p>
      
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="username">Usuario de Moodle:</label>
          <input
            id="username"
            v-model="credentials.username"
            type="text"
            required
            placeholder="Tu usuario de Moodle"
            :disabled="loading"
          >
        </div>

        <div class="form-group">
          <label for="password">Contraseña:</label>
          <input
            id="password"
            v-model="credentials.password"
            type="password"
            required
            placeholder="Tu contraseña de Moodle"
            :disabled="loading"
          >
        </div>

        <button 
          type="submit" 
          :disabled="loading"
          class="login-btn"
        >
          {{ loading ? 'Verificando en Moodle...' : 'Iniciar Sesión' }}
        </button>
      </form>

      <div v-if="error" class="error-message">
        ❌ {{ error }}
      </div>

      <div v-if="success" class="success-message">
        ✅ {{ success }} Redirigiendo...
      </div>

      <div class="login-info">
        <h4>Información del sistema:</h4>
        <p>• Conectado a: <strong>Moodle HeriCraft</strong></p>
        <p>• Tu usuario será verificado en la plataforma educativa</p>
      </div>
      <div class="admin-link">
        <span>
          ¿Eres administrador?
          <a @click.prevent="goToAdminLogin" href="#">Admin</a>
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import AuthService from '@/services/authService'
import MoodleService from '@/services/moodleService'

export default {
  name: 'Login',

  data() {
    return {
      credentials: {
        username: '',
        password: ''
      },
      loading: false,
      error: '',
      success: ''
    }
  },

  methods: {
    async handleLogin() {
      if (!this.credentials.username || !this.credentials.password) {
        this.error = 'Por favor ingresa usuario y contraseña'
        return
      }

      this.loading = true
      this.error = ''
      this.success = ''

      try {
        const result = await AuthService.login(this.credentials)

        if (!result.success) {
          this.error = result.message || 'Error en el login'
          return
        }

        const user = result.user
        const userId = user.id

        const infoResponse = await MoodleService.getUserInfoData(userId)

        if (!infoResponse.success || !infoResponse.data.length) {
          throw new Error('No se pudo obtener la información del usuario')
        }

        const tipoUsuario = infoResponse.data.find(
          item => item.fieldid === 6
        )?.data

        if (!tipoUsuario) {
          throw new Error('No se pudo determinar el tipo de usuario')
        }

        localStorage.setItem(
          'moodle_user',
          JSON.stringify({
            auth_type: 'moodle',
            token: result.token,
            token_type: result.token_type,

            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              firstname: user.firstname,
              lastname: user.lastname,
              fullname: user.fullname,
              tipoUsuario
            }
          })
        )


        this.success = `¡Bienvenido ${user.firstname}!`

        setTimeout(() => {
          if (tipoUsuario === 'Profesor') {
            this.$router.push('/profesor/dashboard')
          } else if (tipoUsuario === 'Estudiante') {
            this.$router.push('/alumno/dashboard')
          }
        }, 1200)

      } catch (error) {
        console.error('Login error:', error)
        this.error = error.message || 'Error al iniciar sesión'
      } finally {
        this.loading = false
      }
    },

     goToAdminLogin() {
      this.$router.push('/login/local')
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-form {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 420px;
}

.login-form h2 {
  text-align: center;
  margin-bottom: 0.5rem;
  color: #333;
  font-size: 1.8rem;
}

.subtitle {
  text-align: center;
  color: #666;
  margin-bottom: 2rem;
  font-size: 0.9rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #555;
  font-size: 0.9rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.login-btn {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
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
  color: #363;
  border: 1px solid #cfc;
  border-radius: 6px;
  text-align: center;
  font-size: 0.9rem;
}

.login-info {
  margin-top: 2rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #667eea;
}

.login-info h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 0.9rem;
}

.login-info p {
  margin: 0.25rem 0;
  font-size: 0.8rem;
  color: #666;
}

.admin-link {
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.75rem;
  color: #888;
}

.admin-link a {
  margin-left: 4px;
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.admin-link a:hover {
  text-decoration: underline;
}

</style>