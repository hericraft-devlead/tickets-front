<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authService } from './services/authService'

const route = useRoute()
const router = useRouter()

const checkAuthentication = async () => {
  const isAuthenticated = await authService.checkAuth()
  
  if (!isAuthenticated && route.path !== '/login') {
    router.push('/login')
  }
  
  if (isAuthenticated && route.path === '/login') {
    router.push('/dashboard')
  }
}

onMounted(() => {
  checkAuthentication()
})

watch(() => route.path, () => {
  checkAuthentication()
})
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