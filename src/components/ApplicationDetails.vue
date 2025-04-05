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
              <div class="main-buttons">
                <button @click="increment_upvote" class="action-btn">
                  <font-awesome-icon :icon="['far', 'thumbs-up']" />
                  {{ upvote_counter }}
                </button>
                <button @click="showPopup = true" class="action-btn">
                  <font-awesome-icon :icon="['far', 'flag']" />
                  {{ report_counter }}
                </button>
              </div>

              <!-- Report Popup -->
              <div v-if="showPopup" class="popup-overlay">
                <div class="popup-content">
                  <p>Report Question</p>

                  <div v-for="(reason, index) in reasons" :key="index" class="radio-option">
                    <input
                      type="radio"
                      :id="'reason-' + index"
                      name="report"
                      :value="reason"
                      v-model="selectedReason"
                    />
                    <label :for="'reason-' + index">
                      {{ reason }}
                    </label>
                  </div>

                  <div class="popup-buttons">
                    <button @click="showPopup = false">Cancel</button>
                    <button :disabled="!selectedReason" @click="increment_report">
                      Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { Filter } from "bad-words";
import { useToast } from "vue-toastification";
import { 
  doc, 
  getDoc, 
  getDocs,
  updateDoc, 
  deleteDoc,
  setDoc,
  collection,
  increment 
} from 'firebase/firestore';
import { db } from '@/firebase';

const toast = useToast();
const showPassword = ref(false);
const showInterviewQuestions = ref(false);
const showPopup = ref(false);
const selectedReason = ref(null);
const upvote_counter = ref(0);
const report_counter = ref(0);

const reasons = [
  "Sexual content",
  "Violent or repulsive content",
  "Hateful or abusive content",
  "Harassment or bullying",
  "Misinformation",
  "Spam or misleading",
];

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

onMounted(async () => {
  const docRef = doc(db, "Users", "insights_me", "application_folder", "3JQC4QcVShXVJzX3lPJM");
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    Object.assign(localApp, data);
  } else {
    console.error("No such document!");
  }
  await display();
  await quality_check();
});

const statusOptions = [
  'Applied', 'Assessment', 'Interview', 'Accepted', 'Rejected', 'Turned Down'
];

const toggleInterviewQuestions = () => {
  showInterviewQuestions.value = !showInterviewQuestions.value;
  console.log('Viewing interview questions');
};

const display = async () => {
  let currentQuestion = "question_2";
  const allUpvotes = await getDocs(
    collection(db, "InterviewQuestions", currentQuestion, "upvote")
  );
  upvote_counter.value = allUpvotes.size;

  const allReports = await getDocs(
    collection(db, "InterviewQuestions", currentQuestion, "report")
  );
  report_counter.value = allReports.size;
  
  if (report_counter.value >= 9) {
    const questionRef = doc(db, "InterviewQuestions", currentQuestion);
    await updateDoc(questionRef, {
      status: "Removed",
    });
  }
};

const increment_upvote = async () => {
  let currentUser = "insights_me";
  let currentQuestions = "question_2";
  const userRef = doc(
    db,
    "InterviewQuestions",
    currentQuestions,
    "upvote",
    currentUser
  );
  
  try {
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      const pointsRef = doc(db, "Users", currentUser);
      await updateDoc(pointsRef, {
        contribution_pts: increment(-1),
      });
      await deleteDoc(userRef);
    } else {
      await setDoc(
        doc(
          db,
          "InterviewQuestions",
          currentQuestions,
          "upvote",
          currentUser
        ),
        {
          username: currentUser,
        }
      );
      
      const pointsRef = doc(db, "Users", "insights_me");
      await updateDoc(pointsRef, {
        contribution_pts: increment(1),
      });

      toast.success("1 point has been added into your account!");
    }
  } catch (error) {
    console.error("Error adding document", error);
    toast.error("Failed to update upvote");
  }

  await display();
};

const increment_report = async () => {
  let currentUser = "insights_me";
  let currentQuestions = "question_2";

  const userRef = doc(
    db,
    "InterviewQuestions",
    currentQuestions,
    "report",
    currentUser
  );
  
  try {
    await setDoc(userRef, {
      username: currentUser,
      reasons: selectedReason.value,
    });
    showPopup.value = false;
    selectedReason.value = null;
    toast.success("Report submitted successfully");
  } catch (error) {
    console.error("Error adding document", error);
    toast.error("Failed to submit report");
  }

  await display();
};

const quality_check = async () => {
  const filter = new Filter();
  const allQuestions = await getDocs(collection(db, "InterviewQuestions"));
  
  allQuestions.forEach(async (docs) => {
    let documentData = docs.data();

    if (documentData.status == "Checked" || documentData.status == "Removed") {
      return;
    }
    
    if (!filter.isProfane(documentData.question)) {
      const uploader = "insights_me";
      const pointsRef = doc(db, "Users", uploader);
      await updateDoc(pointsRef, {
        contribution_pts: increment(5),
      });
      const questionRef = doc(db, "InterviewQuestions", docs.id);
      await updateDoc(questionRef, {
        status: "Checked",
      });
    } else {
      const questionRef = doc(db, "InterviewQuestions", docs.id);
      await updateDoc(questionRef, {
        status: "Removed",
      });
    }
  });
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

.main-buttons {
  display: flex;
  gap: 12px;
  background-color: #1a1a1a;
  padding: 8px;
  border-radius: 4px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: white;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
}

.action-btn:hover {
  opacity: 0.8;
}

.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.popup-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
}

.popup-content p {
  color: black;
  margin-bottom: 20px;
  font-weight: bold;
}

.radio-option {
  margin: 10px 0;
}

.radio-option label {
  color: black;
  margin-left: 8px;
}

.popup-buttons {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.popup-buttons button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.popup-buttons button:first-child {
  background-color: #e2e8f0;
}

.popup-buttons button:last-child {
  background-color: #dc3545;
  color: white;
}

.popup-buttons button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.7;
}
</style>
