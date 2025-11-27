<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
export default {
  name: 'App',
  async mounted() {
    // Verificar autenticación al cargar la app
    await this.checkAuthentication();
  },
  methods: {
    async checkAuthentication() {
      // Usar el servicio de autenticación inyectado
      const isAuthenticated = await this.$auth.checkAuth();
      
      // Solo redirigir a login si no está autenticado y no está ya en la página de login
      if (!isAuthenticated && this.$route.path !== '/login') {
        this.$router.push('/login');
      }
      
      // Opcional: Si está autenticado y en login, redirigir al dashboard
      if (isAuthenticated && this.$route.path === '/login') {
        this.$router.push('/dashboard');
      }
    }
  },
  watch: {
    // Verificar autenticación cuando cambia la ruta
    '$route': 'checkAuthentication'
  }
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Arial', sans-serif;
  background-color: #f5f5f5;
}

#app {
  min-height: 100vh;
}
</style>