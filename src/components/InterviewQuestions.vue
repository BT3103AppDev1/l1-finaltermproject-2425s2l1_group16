<template>
  <div class="interview-questions-container">
    <div class="question-header">
      <h2 class="questions-title">{{ company }}: {{ role }}</h2>
      <p class="questions-text">Points: {{ contribution_pts }}</p>
    </div>
    <div class="questions-list">
      <div v-if="!questions.length" class="no-questions">
        No interview questions found for this application.
      </div>
      <div v-else>
        <div
          v-for="question in questions"
          :key="question.id"
          class="question-item"
        >
          <div
            v-if="
              ['Technical', 'Current Affairs'].includes(question.type) &&
              contribution_pts < 9
            "
            class="locked-overlay"
          >
            Earn 10 contribution points to unlock this
            {{ question.type }} question.
          </div>
          <div
            class="question-inner"
            :class="{
              blurred:
                ['Technical', 'Current Affairs'].includes(question.type) &&
                contribution_pts < 9,
            }"
          >
            <div class="question-type">{{ question.type }}</div>
            <div class="question-text">{{ question.question }}</div>
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
                  <font-awesome-icon
                    :icon="
                      question.reportedByCurrentUser
                        ? ['fas', 'flag']
                        : ['far', 'flag']
                    "
                  />
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
                    <label :for="'reason-' + index">{{ reason }}</label>
                  </div>
                  <br />
                  <div v-if="selectedReason" class="textarea-section">
                    <p>Kindly explain the reason for your report</p>
                    <textarea
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
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { db } from "@/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useToast } from "vue-toastification";

const props = defineProps({
  appId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  selectedCycle: {
    type: String,
    required: true,
  },
});

const toast = useToast();
const questions = ref([]);
const company = ref("");
const role = ref("");
const auth = getAuth();
const showPopup = ref(false);
const selectedReason = ref(null);
const currentQuestionId = ref(null);
const reasonText = ref(null);
const report_counter = ref(0);
const contribution_pts = ref(0);

const reasons = [
  "Sexual content",
  "Violent or repulsive content",
  "Hateful or abusive content",
  "Harassment or bullying",
  "Misinformation",
  "Spam or misleading",
];

const loadApplicationDetails = async () => {
  try {
    const appRef = doc(
      db,
      "Users",
      props.userId,
      props.selectedCycle,
      props.appId
    );
    const appDoc = await getDoc(appRef);
    if (appDoc.exists()) {
      const data = appDoc.data();
      company.value = data.company;
      role.value = data.position;
      await fetchQuestions();
    }
    //display contribution points
    const pointsRef = doc(db, "Users", props.userId);
    const pointsDoc = await getDoc(pointsRef);
    contribution_pts.value = pointsDoc.data().contribution_pts;
  } catch (error) {
    console.error("Error loading application details:", error);
  }
};

const fetchQuestions = async () => {
  try {
    const questionsRef = collection(db, "InterviewQuestions");
    const q = query(
      questionsRef,
      where("company", "==", company.value),
      where("role", "==", role.value),
      where("status", "==", "Checked")
    );
    const querySnapshot = await getDocs(q);

    questions.value = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      upvoteCount: 0,
      reportCount: 0,
    }));

    // Get upvote and report counts for each question
    for (const question of questions.value) {
      const upvoteCollection = collection(
        db,
        "InterviewQuestions",
        question.id,
        "upvote"
      );
      const upvoteSnapshot = await getDocs(upvoteCollection);
      question.upvoteCount = upvoteSnapshot.size;

      // Get report count
      const reportCollection = collection(
        db,
        "InterviewQuestions",
        question.id,
        "report"
      );
      const reportSnapshot = await getDocs(reportCollection);
      question.reportCount = reportSnapshot.size;
      question.reportedByCurrentUser = reportSnapshot.docs.some(
        (doc) => doc.id === auth.currentUser.uid
      );
    }
  } catch (error) {
    console.error("Error fetching questions:", error);
    toast.error("Failed to load interview questions");
  }
};

const increment_upvote = async (questionId) => {
  try {
    const currentUser = auth.currentUser.uid;
    const upvoteRef = doc(
      db,
      "InterviewQuestions",
      questionId,
      "upvote",
      currentUser
    );
    const docSnap = await getDoc(upvoteRef);

    if (docSnap.exists()) {
      // Remove upvote
      await deleteDoc(upvoteRef);
      const question = questions.value.find((q) => q.id === questionId);
      if (question) {
        question.upvoteCount = Math.max(0, question.upvoteCount - 1);
      }
    } else {
      // Add upvote
      await setDoc(upvoteRef, {
        timestamp: new Date(),
        userId: currentUser,
      });

      // Update contribution points
      const quesRef = doc(db, "InterviewQuestions", questionId);
      const quesSnap = await getDoc(quesRef);
      const authorOfQues = quesSnap.data().userID;
      if (authorOfQues != currentUser) {
        const pointsRef = doc(db, "Users", authorOfQues);
        await updateDoc(pointsRef, {
          contribution_pts: increment(1),
        });
      }

      const question = questions.value.find((q) => q.id === questionId);
      if (question) {
        question.upvoteCount++;
      }
    }
  } catch (error) {
    console.error("Error updating upvote:", error);
  }
};

const increment_report = async (questionId) => {
  let currentUser = auth.currentUser.uid;
  let currentQuestions = questionId;

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
      username: currentUser,
      reasonText: reasonText.value,
      lastUpdated: new Date(),
    });

    // Check if report count exceeds threshold
    const reportSnapshots = await getDocs(reportCollectionRef);
    if (reportSnapshots.size >= 9) {
      const questionRef = doc(db, "InterviewQuestions", currentQuestions);
      await updateDoc(questionRef, {
        status: "Removed",
      });

      const questionIndex = questions.value.findIndex(
        (q) => q.id === currentQuestions
      );
      if (questionIndex !== -1) {
        questions.value.splice(questionIndex, 1);
      }
    }

    showPopup.value = false;
    selectedReason.value = null;
    reasonText.value = null;
    toast.success("Report submitted successfully");

    //update to show that report has been made 
    const reportedQuestion = questions.value.find(
      (q) => q.id === currentQuestions
    );
    if (reportedQuestion) {
      reportedQuestion.reportedByCurrentUser = true;
    }

  } catch (error) {
    console.error("Error submitting report:", error);
    toast.error("Failed to submit report");
  }
};

const openReportPopup = (questionId) => {
  currentQuestionId.value = questionId;
  selectedReason.value = null;
  reasonText.value = null;
  showPopup.value = true;
};

onMounted(() => {
  loadApplicationDetails();
});
</script>

<style scoped>
.interview-questions-container {
  padding: 12px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
}

.questions-title {
  font-size: 1.25rem;
  font-weight: 500;
  color: #333;
  margin-bottom: 24px;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.no-questions {
  text-align: center;
  color: #666;
  padding: 20px;
  font-style: italic;
}

.question-item {
  background-color: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  margin-bottom: 16px;
  position: relative;
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

.question-actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.question-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.question-inner {
  position: relative;
}

.blurred {
  filter: blur(5px);
  pointer-events: none;
  user-select: none;
}
.locked-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-weight: bold;
  font-size: 14px;
  z-index: 10;
  pointer-events: none;
  padding: 16px;
  backdrop-filter: blur(2px);
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

.textarea-section {
  margin-top: 16px;
}

.textarea-section textarea {
  width: 100%;
  padding: 10px;
  font-size: 14px;
  border-radius: 6px;
  border: 1px solid #ccc;
  resize: vertical;
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

.question-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
</style>
