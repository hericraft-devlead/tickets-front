<script setup>
import MoodleNavbar from '@/components/navbars/MoodleNavbar.vue';
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <MoodleNavbar />

    <main class="p-6">
      <router-view />
    </main>
  </div>
</template>
