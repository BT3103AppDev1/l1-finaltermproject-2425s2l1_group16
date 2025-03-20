<template>
    <div class="statistics-component">
        <div class="statistics-line">
            <div class="stat-item">
                <h3 class="stat-label">Applied</h3>
                <h2 class="stat-value">{{ number_applied }}</h2>
            </div>
            <div class="stat-item">
                <h3 class="stat-label">Interviewed</h3>
                <h2 class="stat-value">{{ number_interviewed }}</h2>
            </div>
            <div class="stat-item">
                <h3 class="stat-label">Offered</h3>
                <h2 class="stat-value">{{ number_offered }}</h2>
            </div>
            <div class="stat-item">
                <h3 class="stat-label">Rejected</h3>
                <h2 class="stat-value">{{ number_rejected }}</h2>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'Statistics',
    data() {
        return {
            number_applied: 127,
            number_interviewed: 98,
            number_offered: 3,
            number_rejected: 67
        }
    }
};
</script>

<style scoped>
.statistics-component {
  text-align: center;
  padding: 20px;
  background-color: #f4f4f4;
  border-radius: 10px;
}

.statistics-line {
  display: flex;
  justify-content: space-between; 
  gap: 12px; 
}

.stat-item {
  text-align: center;
}
</style>