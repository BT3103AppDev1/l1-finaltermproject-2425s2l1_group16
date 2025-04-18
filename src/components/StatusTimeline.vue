<template>
    <div class="timeline">
      <h3>Status Timeline</h3>
      <ul>
        <li v-for="([key, value], index) in sortedStages" :key="index">
          <strong>{{ key }}</strong>:
          <span>{{ formatDate(value.date) }}</span>
          <span v-if="value.status">({{ value.status }})</span>
        </li>
      </ul>
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue';
  import { DateTime } from 'luxon';
  
  const props = defineProps({
    stages: Object
  });
  
  const sortedStages = computed(() => {
    return Object.entries(props.stages || {}).sort((a, b) => {
      return new Date(a[1].date) - new Date(b[1].date);
    });
  });
  
  const formatDate = (dateStr) => {
    return DateTime.fromISO(dateStr).toLocaleString(DateTime.DATETIME_SHORT);
  };
  </script>
  
  <style scoped>
  .timeline ul {
    list-style: none;
    padding-left: 0;
  }
  .timeline li {
    margin-bottom: 8px;
  }
  </style>
  