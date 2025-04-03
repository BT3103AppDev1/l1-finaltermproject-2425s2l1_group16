<template>
  <div class="application-details-card">
    <div class="detail-item">
      <label>Company Name:</label>
      <input type="text" v-model="localApp.company" disabled />
    </div>

    <div class="detail-item">
      <label>Job Role:</label>
      <input type="text" v-model="localApp.position" disabled />
    </div>

    <div class="detail-item">
      <label>Status:</label>
      <div style="display: flex; align-items: center; gap: 8px;">
        <select v-model="localApp.status" disabled>
          <option v-for="option in statusOptions" :key="option">{{ option }}</option>
        </select>
        <button type="button" class="add-stage-btn" @click="showSubStageModal = true">
          + Add Sub-Stage
        </button>
      </div>
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

    <div class="detail-item" v-if="subStages.length">
      <label>Sub-Stages:</label>
      <ul class="sub-stages-list">
        <li v-for="(stage, index) in subStages" :key="index" class="sub-stage-item">
          <div v-if="editingIndex !== index">
            {{ stage.name }} – {{ formatDate(stage.date) }}            
            <button @click="startEditSubStage(index)">✏️</button>
            <button @click="deleteSubStage(index)">🗑️</button>
          </div>
          <div v-else>
            <input v-model="editedStageName" />
            <button @click="confirmEditSubStage(index)">✅</button>
            <button @click="cancelEditSubStage">❌</button>
          </div>
        </li>
      </ul>
    </div>

    <teleport to="body">
      <div v-if="showSubStageModal" class="modal-overlay">
        <div class="modal-content">
          <h3>Add Sub-Stage</h3>
          <input type="text" v-model="newSubStage" placeholder="e.g. Technical Round" />
          <input type="date" v-model="newSubStageDate" />
          <div class="modal-actions">
            <button @click="addSubStage">Add</button>
            <button @click="showSubStageModal = false">Cancel</button>
          </div>
      </div>
    </div>
  </teleport>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';

// UI State
const showPassword = ref(false);
const showSubStageModal = ref(false);
const newSubStage = ref('');
const editedStageName = ref('');
const editingIndex = ref(null);
const newSubStageDate = ref('');

const subStages = ref([]);

// firestore data
const localApp = reactive({
  company: '',
  position: '',
  status: '',
  statusDate: '',
  deadline: '',
  username: '',
  password: '',
  description: '',
  notes: ''
});

const statusOptions = [
  'Applied', 'Assessment', 'Interview', 'Accepted', 'Rejected', 'Turned Down'
];

const docPath = doc(db, "Users", "insights_me", "application_folder", "3JQC4QcVShXVJzX3lPJM");

const emit = defineEmits();

onMounted(async () => {
  const docSnap = await getDoc(docPath);
  if (docSnap.exists()) {
    const data = docSnap.data();
    Object.assign(localApp, data);
    subStages.value = data.subStages || [];
    // emit company name to Parent (ApplicationCard.vue)
    emit('passCompany', localApp.company);
  } else {
    console.error("No such document!");
  }
});

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return isNaN(d) ? dateStr : d.toLocaleDateString();
};

const addSubStage = async () => {
  if (newSubStage.value.trim() !== '' && newSubStageDate.value !== '') {
    const newStage = {
      name: newSubStage.value.trim(),
      date: newSubStageDate.value  
    };
    subStages.value.push(newStage);
    await updateDoc(docPath, { subStages: subStages.value });
    newSubStage.value = '';
    newSubStageDate.value = '';
    showSubStageModal.value = false;
  }
};

// delete sub-stage
const deleteSubStage = async (index) => {
  subStages.value.splice(index, 1);
  await updateDoc(docPath, { subStages: subStages.value });
};

// edit sub-stage
const startEditSubStage = (index) => {
  editingIndex.value = index;
  editedStageName.value = subStages.value[index].name;
};

const confirmEditSubStage = async (index) => {
  subStages.value[index].name = editedStageName.value;
  editingIndex.value = null;
  await updateDoc(docPath, { subStages: subStages.value });
};

const cancelEditSubStage = () => {
  editingIndex.value = null;
  editedStageName.value = '';
};
</script>

<style scoped>
.application-details-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 12px;
  background-color: white;
  border-radius: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-item label {
  font-weight: 600;
  margin-bottom: 8px;
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

.add-stage-btn {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 12px;
  width: 300px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.modal-content h3 {
  margin-top: 0;
  font-size: 1.2rem;
}

.modal-content input {
  width: 100%;
  margin-top: 12px;
  padding: 8px;
  font-size: 1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}

.sub-stages-list {
  padding-left: 0;
  list-style: none;
  margin-top: 8px;
}

.sub-stage-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.sub-stage-item button {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  padding: 2px 6px;
  transition: color 0.2s ease;
}

.sub-stage-item button:hover {
  color: #1d4ed8;
}

.sub-stage-item input {
  padding: 6px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
}
</style>
