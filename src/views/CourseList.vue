<template>
  <div class="course-list">
    <h2>Cursos de Moodle</h2>
    
    <div v-if="loading" class="loading">
      Cargando cursos...
    </div>
    
    <div v-else-if="error" class="error">
      Error: {{ error }}
    </div>
    
    <div v-else class="courses">
      <div 
        v-for="course in courses" 
        :key="course.id" 
        class="course-card"
      >
        <h3>{{ course.fullname }}</h3>
        <p><strong>Código:</strong> {{ course.shortname }}</p>
        <p><strong>Categoría ID:</strong> {{ course.categoryid }}</p>
        <p><strong>Formato:</strong> {{ course.format }}</p>
        <p><strong>Visible:</strong> {{ course.visible ? 'Sí' : 'No' }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import MoodleService from '@/services/moodleService';

export default {
  name: 'CourseList',
  data() {
    return {
      courses: [],
      loading: false,
      error: null
    };
  },
  async mounted() {
    await this.loadCourses();
  },
  methods: {
    async loadCourses() {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await MoodleService.getCourses();
        this.courses = response;
      } catch (error) {
        this.error = error.message;
        console.error('Error loading courses:', error);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.course-list {
  padding: 20px;
}

.loading, .error {
  text-align: center;
  padding: 20px;
  font-size: 18px;
}

.error {
  color: #f44336;
}

.courses {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.course-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  background-color: #f9f9f9;
}

.course-card h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.course-card p {
  margin: 5px 0;
  font-size: 14px;
}
</style>