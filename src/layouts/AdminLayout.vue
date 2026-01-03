<script setup>
import AdminNavbar from '@/components/navbars/AdminNavbar.vue'
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <AdminNavbar />

    <main class="p-6">
      <router-view />
    </main>
  </div>
</template>
