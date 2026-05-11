<template>
  <div class="auth-layout">
    <nav class="auth-navbar">
      <div class="logo">
        <RouterLink to="/">Sistema de Tickets Hericraft</RouterLink>
      </div>
      
      <div class="auth-options">
        <RouterLink to="/login" class="auth-btn moodle-btn">
          <span class="icon">🎓</span>
          Login Moodle
        </RouterLink>
        
        <RouterLink to="/login/local" class="auth-btn admin-btn">
          Admin
        </RouterLink>
      </div>
    </nav>

    <main class="auth-content">
      <router-view></router-view>
    </main>
  </div>
</template>

<script setup>
</script>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.auth-navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: #1e293b;
  color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.logo a {
  color: white;
  text-decoration: none;
  font-size: 1.5rem;
  font-weight: bold;
}

.auth-options {
  display: flex;
  gap: 1rem;
}

.auth-btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s;
}

.auth-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.moodle-btn {
  background: #4f46e5;
  color: white;
}

.admin-btn {
  background: #059669;
  color: white;
}

.icon {
  font-size: 1.2rem;
}

.auth-content {
  width: 100%;
}
</style>