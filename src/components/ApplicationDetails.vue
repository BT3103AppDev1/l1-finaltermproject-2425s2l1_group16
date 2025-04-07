<template>
  <div class="application-details-card">
   

    <div class="detail-item">
      <label>Company Name:</label>
      <input type="text" v-model="localApp.company" disabled />
    </div>

    <div class="detail-item">
      <label>Job Role:</label>
      <input type="text" v-model="localApp.role" disabled />
    </div>

    <div class="detail-item">
      <label>Status:</label>
      <select v-model="localApp.status" disabled>
        <option v-for="option in statusOptions" :key="option">{{ option }}</option>
      </select>
    </div>

    <div class="detail-item">
      <label>Status Date:</label>
      <input type="date" v-model="localApp.statusDate" disabled />
    </div>

    <div class="detail-item">
      <label>Pending Deadline:</label>
      <input type="date" v-model="localApp.deadline" disabled />
    </div>

    <div class="detail-item">
      <label>Portal Username:</label>
      <input type="text" v-model="localApp.username" disabled />
    </div>

    <div class="detail-item">
      <label>Portal Password:</label>
      <div class="password-wrapper">
      <input :type="showPassword ? 'text' : 'password'" v-model="localApp.password" disabled />
      <button type="button" class="toggle-btn" @click="showPassword = !showPassword">
       {{ showPassword ? 'Hide' : 'Show' }}
       </button>
</div>
    </div>

    <div class="detail-item">
      <label>Job Description:</label>
      <textarea rows="3" v-model="localApp.description" disabled></textarea>
    </div>

    <div class="detail-item">
      <label>Personal Notes:</label>
      <textarea rows="3" v-model="localApp.notes" disabled></textarea>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, reactive, watch } from 'vue';
const showPassword = ref(false);
<<<<<<< HEAD
const showSubStageModal = ref(false);
const newSubStage = ref('');
const editedStageName = ref('');
const editingIndex = ref(null);
const newSubStageDate = ref('');

const props = defineProps({
  application: Object
});

const subStages = ref([]);

// firestore data
const localApp = reactive({ ...props.application });
  /* company: '',
  position: '',
  status: '',
  statusDate: '',
  deadline: '',
  username: '',
  password: '',
  description: '',
  notes: ''
}); */
=======
>>>>>>> main

const props = defineProps({ //place holder - - replace with firebase in future
  application: {
    type: Object,
    default: () => ({
      company: 'Singtel',
      role: 'Software Engineer Intern',
      status: 'Applied',
      statusDate: '2025-03-25',
      deadline: '2025-04-01',
      username: 'johndoe@example.com',
      password: 'password123',
      description: 'Exciting opportunity to work on backend systems.',
      notes: 'Prepare for behavioral and technical rounds.'
    })
  }
});



const emit = defineEmits(['updateApplication']);
const statusOptions = [
  'Applied', 'Assessment', 'Interview', 'Accepted', 'Rejected', 'Turned Down'
];

const localApp = reactive({ ...props.application });

const emitUpdate = () => {
  emit('updateApplication', { ...localApp });
};

watch(() => props.application, (newVal) => {
  Object.assign(localApp, newVal);
});


</script>

<style scoped>
.application-details-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  background-color: white;
  border-radius: 12px;
}
.detail-item {
  display: flex;
  flex-direction: column;
}
.detail-item label {
  font-weight: 600;
  margin-bottom: 4px;
  color: #334155;
}
.detail-item input,
.detail-item textarea,
.detail-item select {
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  background-color: #f1f5f9;
  color: #334155;
}

.password-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-btn {
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 4px 8px;
  transition: color 0.2s ease;
}

.toggle-btn:hover {
  color: #1d4ed8;
}
</style>
