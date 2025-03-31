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

    <div class="interview-questions-section">
      <button 
        @click="toggleInterviewQuestions"
        class="interview-questions-btn"
      >
        View Interview Questions
      </button>

      <div v-if="showInterviewQuestions" class="questions-list">
        <h3>Interview Questions for Singtel - Data Analyst Intern</h3>
        <div class="question-items">
          <div class="question-item">
            <div class="question-type">Technical</div>
            <div class="question-text">Explain merge sort</div>
            <div class="question-description">Asked for time complexity also</div>
            <div class="question-actions">
              <button class="action-btn upvote-btn">
                <span>👍 Upvote</span>
                <span class="count">0</span>
              </button>
              <button class="action-btn report-btn">
                <span>⚠️ Report</span>
                <span class="count">0</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase'

const showPassword = ref(false);
const showInterviewQuestions = ref(false);

const localApp = reactive({
  company: '',
  position: '',
  status: '',
  statusDate: '2025-03-25',
  deadline: '2025-04-01',
  username: 'johndoe@example.com',
  password: 'password123',
  description: 'Exciting opportunity to work on backend systems.',
  notes: 'Prepare for behavioral and technical rounds.'
});

// Getting the doc.. please edit this when we have the actual user HAHAH
// i edited the code a little, but kept some stuff to make it work with the firestore
onMounted(async () => {
  const docRef = doc(db, "Users", "insights_me", "application_folder", "3JQC4QcVShXVJzX3lPJM");
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    Object.assign(localApp, data);
  } else {
    console.error("No such document!");
  }
});

const statusOptions = [
  'Applied', 'Assessment', 'Interview', 'Accepted', 'Rejected', 'Turned Down'
];

const toggleInterviewQuestions = () => {
  showInterviewQuestions.value = !showInterviewQuestions.value;
  console.log('Viewing interview questions');
};
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

.interview-questions-section {
  margin-top: 16px;
  border-top: 1px solid #e2e8f0;
  padding-top: 16px;
}

.interview-questions-btn {
  width: 100%;
  padding: 10px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.interview-questions-btn:hover {
  background-color: #45a049;
}

.questions-list {
  margin-top: 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
}

.questions-list h3 {
  margin-bottom: 16px;
  color: #334155;
  font-size: 1.1rem;
}

.question-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-item {
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.question-type {
  font-size: 0.875rem;
  color: #4CAF50;
  font-weight: 600;
  margin-bottom: 8px;
}

.question-text {
  font-size: 1rem;
  color: #334155;
  margin-bottom: 8px;
  font-weight: 500;
}

.question-description {
  font-size: 0.875rem;
  color: #64748b;
}

.question-actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.upvote-btn {
  color: #4CAF50;
}

.upvote-btn:hover {
  background-color: #e8f5e9;
  border-color: #4CAF50;
}

.report-btn {
  color: #f44336;
}

.report-btn:hover {
  background-color: #ffebee;
  border-color: #f44336;
}

.count {
  background-color: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
}
</style>
