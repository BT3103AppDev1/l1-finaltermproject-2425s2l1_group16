<script setup>
import Statistics from '../components/Statistics.vue'
import { ref } from 'vue';


const showPopup = ref(false);
const showAddStagePopup = ref(false);
const showStatusDropdown = ref(false);
const statusOptions = ['Applied', 'Interview', 'Offered', 'Rejected'];
const lastUsedStatus = ref('Interview');

const newStage = ref("");
const currentApplication = ref({
  company: 'Singtel',
  position: 'Software Engineer Intern',
  status: lastUsedStatus.value,
  stages: ['HR Screening', 'Technical Round 1']
});
const togglePopup = () => {
  showPopup.value = !showPopup.value;
};
const toggleAddStagePopup = () => {
  showAddStagePopup.value = !showAddStagePopup.value;
  if (showAddStagePopup.value) {
    newStage.value = '';
    //make sure current status is used correctly
    const validStatus = currentApplication.value.stages.includes(lastUsedStatus.value) 
      ? lastUsedStatus.value
      : (currentApplication.value.stages.length > 0 
          ? currentApplication.value.stages[currentApplication.value.stages.length - 1] 
          : statusOptions[0]);
    currentApplication.value.status = validStatus;
    lastUsedStatus.value = validStatus;
  }
};

const addNewStage = () => {
  if (newStage.value.trim()) {
    currentApplication.value.stages.push(newStage.value.trim());
    currentApplication.value.status = newStage.value.trim(); // set current status
    lastUsedStatus.value = newStage.value.trim();
    newStage.value = '';
    showAddStagePopup.value = false;
  }
};

const deleteStage = (index) => {
  const wasCurrentStatus = currentApplication.value.stages[index] === currentApplication.value.status;
  
  currentApplication.value.stages.splice(index, 1);
  
  if (wasCurrentStatus) {
    //find most recent status 
    const previousStage = currentApplication.value.stages[index - 1] || 
                         currentApplication.value.stages[0] || 
                         statusOptions[0];
    currentApplication.value.status = previousStage;
    lastUsedStatus.value = previousStage;
  }
};

// close popup if clicked outside the box
const closePopup = (e) => {
  if (e.target.id == 'popup-overlay') {
    showPopup.value = false;
  }
  if(e.target.id == 'add-stage-overlay') {
    showAddStagePopup.value = false;
  }
}
</script>

<template>
  <div class="pop-up-button">
    <button @click="togglePopup">Open Application Information</button>
  </div>

  <div v-show="showPopup" id="popup-overlay" class="popup-overlay" @click="closePopup">
    <div class="application-info-pop-up">

      <!-- place X button at top right of the pop-up -->
      <button @click="togglePopup" class="close-btn">&times;</button>
      
      <div class="box">
        <section class="application-info">
          <div class="header-section">
            <h2 class="card-header">Application Information</h2>
          </div>
          <div class="application-details">
            <div class="detail-item">
              <span class="detail-label">Company:</span>
              <span class="detail-value">{{ currentApplication.company }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Position:</span>
              <span class="detail-value">{{ currentApplication.position }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Current Status:</span>
              <span class="detail-value status-badge">{{ currentApplication.status }}</span>
            </div>
            <div class="stages-section">
              <h3 class="section-title">Application Stages</h3>
              <div class="stages-list">
                <div v-for="(stage, index) in currentApplication.stages" :key="index" class="stage-item"> 
  <span class="stage-name">{{ stage }}</span> 
  <button @click.stop="deleteStage(index)" class="delete-stage-btn" title="Delete stage">
    &times;    </button>
</div>
</div>

<button @click="toggleAddStagePopup" class="add-stage-btn">
  + Add Stage  
</button> 
            </div>
          </div>
        </section>

          <section class="insights">
            <h2 class="card-header">Insights & Statistics</h2>
            <Statistics />
          </section>
        </div>
    </div>
  </div>

  <div v-show="showAddStagePopup" id="add-stage-overlay" class="popup-overlay" @click="closePopup">
    <div class="add-stage-popup">
      <div class="header-section">
        <h2>Add New Stage</h2>
        <button @click="toggleAddStagePopup" class="close-btn">&times;</button>
      </div>
      <div class="prefilled-info">
        <div class="prefilled-item">
          <span class="prefilled-label">Company:</span>
          <span class="prefilled-value">{{ currentApplication.company }}</span>
        </div>
        <div class="prefilled-item">
          <span class="prefilled-label">Position:</span>
          <span class="prefilled-value">{{ currentApplication.position }}</span>
        </div>
        <div class="prefilled-item">
          <span class="prefilled-label">Status:</span>
          <span class="prefilled-value status-badge">{{ currentApplication.status }}</span>
        </div>
      </div>
      <div class="new-stage-input">
        <label for="stage-name">New Stage Name</label>
        <input 
          type="text" 
          id="stage-name" 
          v-model="newStage" 
          placeholder="e.g. Technical Round 2, Final Interview"
          @keyup.enter="addNewStage"
        >
        <p class="input-hint">Enter the name of the new stage</p>
      </div>
      <div class="popup-buttons">
        <button @click="toggleAddStagePopup" class="secondary-btn">Cancel</button>
        <button @click="addNewStage" class="primary-btn" :disabled="!newStage.trim()">Add Stage</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.application-info-pop-up {
  position: relative;
}

.card-header {
  font-weight: bold;
}

.box {
  display: flex;
  background-color: #f8fafc;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  width: 100%;
  max-width: 1200px;
  gap: 24px;
}

.application-info, .insights {
  padding: 24px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin: 0;
  flex: 1;
}

.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-section h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #1e293b;
}

.close-btn {
  position: absolute;
  top: 2px;
  right: 6px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #64748b;
  padding: 4px;
  line-height: 1;
}

.close-btn:hover {
  color: #475569;
}

.application-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-item {
  display: flex;
  gap: 8px;
}

.detail-label {
  font-weight: 500;
  color: #475569;
  min-width: 120px;
}

.detail-value {
  color: #1e293b;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  background-color: #e2e8f0;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #334155;
}

.section-title {
  font-size: 1.125rem;
  color: #1e293b;
  margin: 24px 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
}

.stages-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.stage-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f8fafc;
  border-radius: 8px;
  border-left: 4px solid #94a3b8;
  transition: all 0.2s ease;
}

.stage-item:hover {
  background-color: #f1f5f9;
  transform: translateY(-1px);
}

.stage-name {
  color: #1e293b;
}

.delete-stage-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-stage-btn:hover {
  color: #ef4444;
}

.primary-btn {
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.primary-btn:hover {
  background-color: #2563eb;
}

.primary-btn:disabled {
  background-color: #cbd5e1;
  cursor: not-allowed;
}

.secondary-btn {
  background-color: white;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.secondary-btn:hover {
  background-color: #f8fafc;
  color: #475569;
}

.add-stage-btn {
  background-color: white;
  color: #3b82f6;
  border: 1px dashed #94a3b8;
  border-radius: 8px;
  padding: 10px 16px;
  font-weight: 500;
  cursor: pointer;
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.add-stage-btn:hover {
  background-color: #f8fafc;
  border-color: #3b82f6;
}

.add-stage-popup {
  background-color: white;
  padding: 24px;
  border-radius: 12px;
  width: 90%;
  max-width: 480px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.prefilled-info {
  background-color: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
}

.prefilled-item {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.prefilled-item:last-child {
  margin-bottom: 0;
}

.prefilled-label {
  font-weight: 500;
  color: #475569;
  min-width: 80px;
}

.prefilled-value {
  color: #1e293b;
}

.new-stage-input {
  margin: 24px 0;
}

.new-stage-input label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #475569;
}

.new-stage-input input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.new-stage-input input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input-hint {
  font-size: 0.875rem;
  color: #64748b;
  margin-top: 4px;
}

.popup-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

@media (max-width: 768px) {
  .box {
    flex-direction: column;
  }
  
  .application-info, .insights {
    width: 100%;
  }
}
</style>