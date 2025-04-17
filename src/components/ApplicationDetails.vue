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
      <div style="display: flex; align-items: center; gap: 8px">
        <select v-model="localApp.status" disabled>
          <option v-for="option in statusOptions" :key="option">
            {{ option }}
          </option>
        </select>
        <button
          type="button"
          class="add-stage-btn"
          @click="showSubStageModal = true"
        >
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
        <input
          :type="showPassword ? 'text' : 'password'"
          v-model="localApp.password"
          disabled
        />
        <button
          type="button"
          class="toggle-btn"
          @click="showPassword = !showPassword"
        >
          {{ showPassword ? "Hide" : "Show" }}
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
      <button @click="toggleInterviewQuestions" class="interview-questions-btn">
        View Interview Questions
      </button>

      <div v-if="showInterviewQuestions" class="questions-list">
        <h3>
          Interview Questions for {{ localApp.company }} -
          {{ localApp.position }}
        </h3>
        <div class="question-items">
          <div
            class="question-item"
            v-for="question in questions"
            :key="question.id"
          >
            <div class="question-type">{{ question.type }}</div>
            <div class="question-text">{{ question.question }}</div>
            <div class="question-description">{{ question.description }}</div>
            <div class="question-actions">
              <div class="main-buttons">
                <button
                  @click="increment_upvote(question.id)"
                  class="action-btn"
                >
                  <font-awesome-icon :icon="['far', 'thumbs-up']" />
                  {{ question.upvoteCount }}
                </button>
                <button
                  @click="openReportPopup(question.id)"
                  class="action-btn"
                >
                  <font-awesome-icon :icon="['far', 'flag']" />
                </button>
              </div>

              <!-- Report Popup -->
              <div
                v-if="showPopup && currentQuestionId === question.id"
                class="popup-overlay"
              >
                <div class="popup-content">
                  <p>Report Question</p>

                  <div
                    v-for="(reason, index) in reasons"
                    :key="index"
                    class="radio-option"
                  >
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
                  <br />

                  <div v-if="selectedReason" class="textarea-section">
                    <p>Kindly explain the reason for your report</p>
                    <textarea
                      id="reason-text"
                      v-model="reasonText"
                      placeholder="Type your reason here..."
                      rows="4"
                    ></textarea>
                  </div>

                  <div class="popup-buttons">
                    <button @click="showPopup = false">Cancel</button>
                    <button
                      :disabled="!selectedReason"
                      @click="increment_report(currentQuestionId)"
                    >
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
    <div class="detail-item" v-if="subStages.length">
      <label>Sub-Stages:</label>
      <ul class="sub-stages-list">
        <li
          v-for="(stage, index) in subStages"
          :key="index"
          class="sub-stage-item"
        >
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
          <input
            type="text"
            v-model="newSubStage"
            placeholder="e.g. Technical Round"
          />
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
import { ref, reactive, onMounted } from "vue";
import { useToast } from "vue-toastification";
import {
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  setDoc,
  collection,
  increment,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/firebase";
import { getAuth } from "firebase/auth";

const toast = useToast();
const showInterviewQuestions = ref(false);
const showPopup = ref(false);
const selectedReason = ref(null);
const currentQuestionId = ref(null);
const reasonText = ref(null);
const upvote_counter = ref(0);
const report_counter = ref(0);

// Get current user
const auth = getAuth();
const user = auth.currentUser;


const reasons = [
  "Sexual content",
  "Violent or repulsive content",
  "Hateful or abusive content",
  "Harassment or bullying",
  "Misinformation",
  "Spam or misleading",
];

// UI State
const showPassword = ref(false);
const showSubStageModal = ref(false);
const newSubStage = ref("");
const editedStageName = ref("");
const editingIndex = ref(null);
const newSubStageDate = ref("");

const subStages = ref([]);
const questions = ref([]);

// firestore data
const localApp = reactive({
  company: "",
  position: "",
  status: "",
  statusDate: "",
  deadline: "",
  username: "",
  password: "",
  description: "",
  notes: "",
});

// onMounted(async () => {
//  const docRef = doc(db, "Users", "insights_me", "application_folder", "3JQC4QcVShXVJzX3lPJM");
//  const docSnap = await getDoc(docRef);

//const statusOptions = [
//  'Applied', 'Assessment', 'Interview', 'Accepted', 'Rejected', 'Turned Down'
//];

const props = defineProps({
  userId: {
    type: String,
    required: true,
  },
  appId: {
    type: String,
    required: true,
  },
});

const docPath = doc(
  db,
  "Users",
  props.userId,
  "application_folder",
  props.appId
);

const emit = defineEmits();

onMounted(async () => {
  const docSnap = await getDoc(docPath);
  if (docSnap.exists()) {
    const data = docSnap.data();
    Object.assign(localApp, data);
    subStages.value = data.subStages || [];
    // emit company name to Parent (ApplicationCard.vue)
    emit("passCompany", localApp.company);
  } else {
    console.error("No such document!");
  }
  await display();
});

const statusOptions = [
  "Applied",
  "Assessment",
  "Interview",
  "Accepted",
  "Rejected",
  "Turned Down",
];

const toggleInterviewQuestions = async () => {
  showInterviewQuestions.value = !showInterviewQuestions.value;
  if (showInterviewQuestions.value) {
    await fetchQuestions();
  }
};

const fetchQuestions = async () => {
  try {
    const questionsRef = collection(db, "InterviewQuestions");
    const q = query(
      questionsRef,
      where("company", "==", localApp.company),
      where("role", "==", localApp.position)
    );
    const querySnapshot = await getDocs(q);

    // Initialize questions array
    questions.value = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      upvoteCount: 0,
      reportCount: 0,
    }));

    // Get upvote and report counts
    for (const question of questions.value) {
      // Get upvote count by counting documents in upvote collection
      const upvoteCollection = collection(
        db,
        "InterviewQuestions",
        question.id,
        "upvote"
      );
      const upvoteSnapshot = await getDocs(upvoteCollection);
      question.upvoteCount = upvoteSnapshot.size;

      // Get report count
      const reportDoc = await getDoc(
        doc(db, "InterviewQuestions", question.id, "report", "insights_me")
      );
      if (reportDoc.exists()) {
        const reportData = reportDoc.data();
        question.reportCount = reportData.username
          ? reportData.username.length
          : 0;
      }
    }
  } catch (error) {
    console.error("Error fetching questions:", error);
  }
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

const increment_upvote = async (id) => {
  let currentUser = user.uid;
  let currentQuestions = id;

  try {
    // First, ensure the question document exists
    const questionRef = doc(db, "InterviewQuestions", currentQuestions);
    const questionDoc = await getDoc(questionRef);

    if (!questionDoc.exists()) {
      toast.error("Question not found");
      return;
    }

    // Reference to the upvote collection and user's upvote document
    const upvoteCollectionRef = collection(
      db,
      "InterviewQuestions",
      currentQuestions,
      "upvote"
    );
    const userUpvoteRef = doc(upvoteCollectionRef, currentUser);

    const docSnap = await getDoc(userUpvoteRef);

    if (docSnap.exists()) {
      // User has already upvoted, remove their upvote document only
      try {
        await deleteDoc(userUpvoteRef);
        console.log("Successfully removed upvote");

        // Update UI to decrease count
        const questionIndex = questions.value.findIndex((q) => q.id === id);
        if (questionIndex !== -1) {
          questions.value[questionIndex].upvoteCount = Math.max(
            0,
            questions.value[questionIndex].upvoteCount - 1
          );
        }
      } catch (deleteError) {
        console.error("Error removing upvote:", deleteError);
        toast.error("Failed to remove upvote");
        return;
      }
    } else {
      // User hasn't upvoted, add their upvote
      try {
        await setDoc(userUpvoteRef, {
          timestamp: new Date(),
          userId: currentUser,
        });

        // Update contribution points
        const pointsRef = doc(db, "Users", user.uid);
        await updateDoc(pointsRef, {
          contribution_pts: increment(1),
        });

        // Update UI to increase count
        const questionIndex = questions.value.findIndex((q) => q.id === id);
        if (questionIndex !== -1) {
          questions.value[questionIndex].upvoteCount++;
        }

        console.log("Successfully added upvote");
        toast.success("1 point has been added into your account!");
      } catch (addError) {
        console.error("Error adding upvote:", addError);
        toast.error("Failed to add upvote");
        return;
      }
    }

    // Verify upvote count after operation
    const finalUpvoteSnapshot = await getDocs(upvoteCollectionRef);
    console.log(
      `Current upvote count for question ${id}: ${finalUpvoteSnapshot.size}`
    );
  } catch (error) {
    console.error("Error in upvote operation:", error);
    toast.error("Failed to update upvote");
  }
};

const increment_report = async (id) => {
  let currentUser = user.uid; // Using the actual UID
  let currentQuestions = id;

  try {
    // Reference to the report collection
    const reportCollectionRef = collection(
      db,
      "InterviewQuestions",
      currentQuestions,
      "report"
    );

    // Get existing document
    const userReporRef = doc(reportCollectionRef, currentUser);
    const reportDoc = await getDoc(userReporRef);

    if (reportDoc.exists()) {
      toast.error("You have already reported this question");
      showPopup.value = false;
      selectedReason.value = null;
      return;
    }

    // Update document
    await setDoc(userReporRef, {
      reasonCategory: selectedReason.value,
      username: user.uid,
      reasonText: reasonText.value,
      lastUpdated: new Date(),
    });

    // Update the UI
    const questionIndex = questions.value.findIndex(
      (q) => q.id === currentQuestions
    );
    // if (questionIndex !== -1) {
    //   questions.value[questionIndex].reportCount = currentUsernames.length;
    // }

    // Check if report count exceeds threshold
    if (reportCollectionRef.count >= 9) {
      const questionRef = doc(db, "InterviewQuestions", currentQuestions);
      await updateDoc(questionRef, {
        status: "Removed",
      });

      if (questionIndex !== -1) {
        questions.value.splice(questionIndex, 1);
      }
    }

    showPopup.value = false;
    selectedReason.value = null;
    reasonText.value=null;
    toast.success("Report submitted successfully");
  } catch (error) {
    console.error("Error submitting report:", error);
    toast.error("Failed to submit report");
  }
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return isNaN(d) ? dateStr : d.toLocaleDateString();
};

const addSubStage = async () => {
  if (newSubStage.value.trim() !== "" && newSubStageDate.value !== "") {
    const newStage = {
      name: newSubStage.value.trim(),
      date: newSubStageDate.value,
    };
    subStages.value.push(newStage);
    await updateDoc(docPath, { subStages: subStages.value });
    newSubStage.value = "";
    newSubStageDate.value = "";
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
  editedStageName.value = "";
};

const openReportPopup = (questionId) => {
  currentQuestionId.value = questionId;
  showPopup.value = true;
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

.interview-questions-section {
  margin-top: 16px;
  border-top: 1px solid #e2e8f0;
  padding-top: 16px;
}

.interview-questions-btn {
  width: 100%;
  padding: 10px;
  background-color: #4caf50;
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
  color: #4caf50;
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

.textarea-section textarea {
  width: 100%;
  padding: 10px;
  font-size: 14px;
  border-radius: 6px;
  border: 1px solid #ccc;
  resize: vertical;
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
