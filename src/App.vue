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
      const isAuthenticated =
        localStorage.getItem('token') || sessionStorage.getItem('token');

      const isLoginRoute = this.$route.path.startsWith('/login');

      if (!isAuthenticated && !isLoginRoute) {
        this.$router.push('/login');
      }

      if (isAuthenticated && isLoginRoute) {
        this.$router.push('/dashboard');
      }
    }
  },

  watch: {
    '$route'() {
      this.checkAuthentication();
    }
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