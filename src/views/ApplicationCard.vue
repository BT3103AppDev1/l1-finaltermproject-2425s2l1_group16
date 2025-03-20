<script setup>
import Statistics from '../components/Statistics.vue'
</script>

<template>
  <main class="card-container">
    <div class="box">
      <section class="application-info">
        <h2>Application Information</h2>
        <Statistics />
      </section>

      <section class="insights">
        <h2>Insights & Statistics</h2>
        <Statistics />
      </section>
    </div>
  </main>
</template>

<style scoped>
.card-container {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.box {
  display: flex;
  background-color: #f0f0f0;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 1200px;
}

.application-info, .insights {
  flex: 1;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin: 10px; 
}

.application-info {
  border-right: 2px solid #ddd;
}
</style>
