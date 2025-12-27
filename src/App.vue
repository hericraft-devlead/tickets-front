<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
export default {
  name: 'App',
  async mounted() {
    await this.checkAuthentication();
  },
  methods: {
    async checkAuthentication() {
      const isAuthenticated = await this.$auth.checkAuth();
      
      if (!isAuthenticated && this.$route.path !== '/login') {
        this.$router.push('/login');
      }
      
      if (isAuthenticated && this.$route.path === '/login') {
        this.$router.push('/dashboard');
      }
    }
  },
  watch: {
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