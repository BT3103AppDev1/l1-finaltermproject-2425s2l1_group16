<template>
  <div class="complete-interview-page">
    <button
      @click.prevent="checkAndOpenModal"
      class="complete-button"
      :class="{ disabled: allRoundsCompleted }"
    >
      {{ allRoundsCompleted ? "All Rounds Documented" : "Complete Interview" }}
    </button>

    <div v-if="isModalOpen" class="modal" @mousedown.self="closeModal">
      <div class="modal-content">
        <span class="close" @click="closeModal">&times;</span>
        <h2 class="modal-title">Document Your Interview Questions</h2>
        <p class="modal-description">
          Your submissions will be anonymised. These questions will help your
          peers in their interview preparation and we hope that one day you will
          benefit from this same help too!
        </p>

        <!-- Round Navigation -->
        <div class="round-indicator-wrapper">
          <p class="round-indicator-text">
            Round {{ currentRoundIndex + 1 }} of {{ interviewRounds.length }}
          </p>
        </div>
        <div class="round-navigation">
          <button
            @click="previousRound"
            class="nav-button"
            :disabled="currentRoundIndex === 0"
          >
            ← Previous Round
          </button>
          <button
            v-if="currentRoundIndex !== 0"
            @click="removeRound"
            class="delete-round-button"
          >
            Delete Round
          </button>
          <button
            @click="nextRound"
            class="nav-button"
            :disabled="currentRoundIndex === interviewRounds.length - 1"
          >
            Next Round →
          </button>
        </div>

        <!-- Current Round Info -->
        <div class="round-info" v-if="currentRound">
          <div class="round-header">
            <div style="flex: 2">
              <label class="round-label">Stage Name</label>
              <input
                type="text"
                v-model="currentRound.roundName"
                placeholder="Round Name"
                class="round-name-input"
                disabled
              />
            </div>
            <div style="flex: 1">
              <label class="round-label">Stage Date</label>
              <input
                type="date"
                v-model="currentRound.date"
                class="round-date-input"
                disabled
              />
            </div>
          </div>

          <!-- Question entries for current round -->
          <div v-if="currentRound.isCompleted" class="completed-round-message">
            This round has been completed. Questions are displayed for reference
            only.
          </div>
          <div
            v-for="(entry, index) in currentRound.questions"
            :key="index"
            class="question-entry"
          >
            <label :for="'questionType' + index">Question Type*</label>
            <select
              v-model="entry.questionType"
              :id="'questionType' + index"
              :disabled="currentRound.isCompleted"
            >
              <option value="Technical">Technical</option>
              <option value="General">General</option>
              <option value="Current Affairs">Current Affairs</option>
            </select>

            <label :for="'question' + index">Question*</label>
            <input
              type="text"
              v-model="entry.question"
              :id="'question' + index"
              placeholder="E.g., How would you make a circle?"
              :disabled="currentRound.isCompleted"
            />

            <label :for="'description' + index">Description</label>
            <textarea
              v-model="entry.description"
              :id="'description' + index"
              placeholder="Your description here..."
              :disabled="currentRound.isCompleted"
            ></textarea>

            <button
              v-if="index > 0 && !currentRound.isCompleted"
              @click.stop="removeQuestion(index)"
              class="remove-button"
            >
              Remove
            </button>
          </div>

          <!-- Add question button - only show for incomplete rounds -->
          <button
            v-if="!currentRound.isCompleted"
            @click="addQuestion"
            class="add-button"
          >
            <span class="plus-icon">+</span> Add Another Question
          </button>
        </div>

        <div class="modal-actions">
          <button
            v-if="!currentRound.isCompleted"
            @click="handleSubmit"
            class="submit-button"
          >
            Submit
          </button>
          <button @click="closeModal" class="cancel-button">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { db } from "@/firebase";
import {
  collection,
  getDocs,
  setDoc,
  doc,
  updateDoc,
  increment,
  getDoc,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";
import { Filter } from "bad-words";
import { getAuth } from "firebase/auth";
import { useToast } from "vue-toastification";

const toast = useToast();

export default {
  name: "CompleteInterview",
  props: {
    company: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    appId: {
      type: String,
      required: true,
    },
    selectedCycle: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      isModalOpen: false,
      currentRoundIndex: 0,
      interviewRounds: [],
      allRoundsCompleted: false,
      unsubscribe: null,
    };
  },
  computed: {
    currentRound() {
      return this.interviewRounds[this.currentRoundIndex];
    },
  },
  methods: {
    async loadInterviewRounds() {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;

        const appRef = doc(
          db,
          "Users",
          user.uid,
          this.selectedCycle,
          this.appId
        );
        const appDoc = await getDoc(appRef);

        if (!appDoc.exists()) return;

        const stages = appDoc.data().stages || {};
        const interviewStages = Object.entries(stages)
          .filter(([key]) => key.startsWith("interview_"))
          .sort((a, b) => {
            const aNum = parseInt(a[0].split("_")[1]);
            const bNum = parseInt(b[0].split("_")[1]);
            return aNum - bNum;
          });

        this.interviewRounds = interviewStages.map(([key, value]) => {
          let questions;

          if (
            value.isCompleted &&
            value.questions &&
            value.questions.length > 0
          ) {
            questions = value.questions.map((q) => ({
              questionType: q.type || "Technical",
              question: q.question || "",
              description: q.description || "",
            }));
          } else {
            questions = [
              {
                questionType: "Technical",
                question: "",
                description: "",
              },
            ];
          }

          return {
            stageKey: key,
            roundNumber: parseInt(key.split("_")[1]),
            roundName: value.name || `Interview ${key.split("_")[1]}`,
            date:
              value.date?.split("T")[0] ||
              new Date().toISOString().split("T")[0],
            isCompleted: value.isCompleted || false,
            questions,
          };
        });

        this.allRoundsCompleted = this.interviewRounds.every(
          (round) => round.isCompleted
        );

        if (this.allRoundsCompleted) {
          console.log("All interview rounds have been documented");
        }
      } catch (error) {
        console.error("Error loading interview rounds:", error);
      }
    },
    async checkAndOpenModal(event) {
      event.stopPropagation();
      await this.loadInterviewRounds();

      if (this.interviewRounds.length === 0) {
        alert("No interview rounds found for this application.");
        return;
      }

      const incompleteIndex = this.interviewRounds.findIndex(
        (round) => !round.isCompleted
      );
      if (incompleteIndex !== -1) {
        this.currentRoundIndex = incompleteIndex;
      }

      this.isModalOpen = true;
    },
    closeModal(event) {
      if (event) event.stopPropagation();
      this.isModalOpen = false;
      this.resetForm();
    },
    resetForm() {
      this.currentRoundIndex = 0;
      this.loadInterviewRounds();
    },
    previousRound() {
      if (this.currentRoundIndex > 0) {
        this.currentRoundIndex--;
      }
    },
    nextRound() {
      if (this.currentRoundIndex < this.interviewRounds.length - 1) {
        this.currentRoundIndex++;
      }
    },
    addQuestion() {
      if (!this.currentRound.questions) {
        this.currentRound.questions = [];
      }
      this.currentRound.questions.push({
        questionType: "Technical",
        question: "",
        description: "",
      });
    },
    removeQuestion(index) {
      this.currentRound.questions.splice(index, 1);
    },
    async handleSubmit() {
      try {
        // Validate only incomplete rounds that have questions filled
        for (const round of this.interviewRounds) {
          if (!round.isCompleted) {
            // Only validate incomplete rounds
            for (const entry of round.questions) {
              if (!entry.question || !entry.questionType) {
                toast.error(
                  `Please fill in all required fields marked with * in ${round.roundName}`
                );
                return;
              }
            }
          }
        }

        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
          throw new Error("No authenticated user found");
        }

        // Quality check only questions from incomplete rounds
        const filter = new Filter();
        for (const round of this.interviewRounds) {
          if (!round.isCompleted) {
            // Only check incomplete rounds
            for (const entry of round.questions) {
              if (filter.isProfane(entry.question)) {
                toast.error("Please refrain from using any profanities");
                return;
              }

              if (this.countWords(entry.question) < 5) {
                toast.error("Your question must be at least 5 words long");
                return;
              }
            }
          }
        }

        let nextQuestionNumber = await this.getNextQuestionNumber();
        const applicationRef = doc(
          db,
          "Users",
          user.uid,
          this.selectedCycle,
          this.appId
        );
        const appDoc = await getDoc(applicationRef);
        const currentData = appDoc.data();
        const stages = { ...currentData.stages };
        const updatedStages = { ...stages };

        // Save questions only from incomplete rounds
        for (const round of this.interviewRounds) {
          if (!round.isCompleted) {
            // Only process incomplete rounds
            const savedQuestions = [];

            for (const entry of round.questions) {
              const docId = `question_${nextQuestionNumber}`;

              const questionData = {
                company: this.company,
                description: entry.description || "",
                question: entry.question,
                role: this.role,
                type: entry.questionType,
                userID: user.uid,
                roundName: round.roundName,
                interviewDate: round.date,
                status: "Checked",
                upvoteCount: 0,
                reportCount: 0,
                roundNumber: round.roundNumber,
                stageKey: round.stageKey,
              };

              // Add the question document
              const questionsRef = collection(db, "InterviewQuestions");
              const questionDocRef = doc(questionsRef, docId);
              await setDoc(questionDocRef, questionData);

              savedQuestions.push({
                id: docId,
                ...questionData,
              });

              nextQuestionNumber++;
            }

            // Update the stages object only for this incomplete round
            updatedStages[round.stageKey] = {
              ...stages[round.stageKey],
              isCompleted: true,
              questions: savedQuestions,
            };
          }
        }

        // Update the application document with all stages
        await updateDoc(applicationRef, {
          stages: updatedStages,
        });

        // Award points since user passed quality checks
        const appRef = doc(db, "Users", user.uid);
        await updateDoc(appRef, {
          contribution_pts: increment(5),
        });

        toast.success("Questions submitted successfully! You have earned 5 points!")
        this.closeModal();
      } catch (error) {
        console.error("Error in handleSubmit:", error);
        alert(
          `Error submitting questions: ${error.message}. Please try again.`
        );
      }
    },
    countWords(text) {
      if (!text) return 0;
      text = text.trim();
      let wordList = text.split(/\s/);
      return wordList.filter((word) => word !== "").length;
    },
    async getNextQuestionNumber() {
      const querySnapshot = await getDocs(collection(db, "InterviewQuestions"));
      let maxNumber = 0;

      querySnapshot.forEach((doc) => {
        const docId = doc.id;
        if (docId.startsWith("question_")) {
          const numberStr = docId.split("_")[1];
          const number = parseInt(numberStr);
          if (!isNaN(number) && number > maxNumber) {
            maxNumber = number;
          }
        }
      });

      return maxNumber + 1;
    },
    setupRealtimeListener() {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const appRef = doc(db, "Users", user.uid, this.selectedCycle, this.appId);

      this.unsubscribe = onSnapshot(appRef, (doc) => {
        if (doc.exists()) {
          const stages = doc.data().stages || {};
          const interviewStages = Object.entries(stages)
            .filter(([key]) => key.startsWith("interview_"))
            .sort((a, b) => {
              const aNum = parseInt(a[0].split("_")[1]);
              const bNum = parseInt(b[0].split("_")[1]);
              return aNum - bNum;
            });

          this.interviewRounds = interviewStages.map(([key, value]) => {
            let questions;

            if (
              value.isCompleted &&
              value.questions &&
              value.questions.length > 0
            ) {
              // For completed stages, use the questions directly from Firestore
              questions = value.questions.map((q) => ({
                questionType: q.type || "Technical", // Map the 'type' field to 'questionType'
                question: q.question || "",
                description: q.description || "",
              }));
            } else {
              // For incomplete stages, start with one empty question
              questions = [
                {
                  questionType: "Technical",
                  question: "",
                  description: "",
                },
              ];
            }

            return {
              stageKey: key,
              roundNumber: parseInt(key.split("_")[1]),
              roundName: value.name || `Interview ${key.split("_")[1]}`,
              date:
                value.date?.split("T")[0] ||
                new Date().toISOString().split("T")[0],
              isCompleted: value.isCompleted || false,
              questions,
            };
          });

          this.allRoundsCompleted = this.interviewRounds.every(
            (round) => round.isCompleted
          );
        }
      });
    },
    async removeRound() {
      if (!this.currentRound || this.currentRoundIndex === 0) return;

      if (
        confirm(
          `Are you sure you want to remove ${this.currentRound.roundName}? This action cannot be undone.`
        )
      ) {
        try {
          const auth = getAuth();
          const user = auth.currentUser;
          if (!user) return;

          const applicationRef = doc(
            db,
            "Users",
            user.uid,
            this.selectedCycle,
            this.appId
          );
          const appDoc = await getDoc(applicationRef);
          const currentData = appDoc.data();
          const stages = { ...currentData.stages };

          // Delete questions from InterviewQuestions collection
          const questionsRef = collection(db, "InterviewQuestions");
          const querySnapshot = await getDocs(questionsRef);
          const deletePromises = [];

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.stageKey === this.currentRound.stageKey) {
              deletePromises.push(deleteDoc(doc.ref));
            }
          });

          await Promise.all(deletePromises);

          // Remove the stage from stages object
          delete stages[this.currentRound.stageKey];

          // Update the application document
          await updateDoc(applicationRef, { stages });

          // Move to previous round
          this.currentRoundIndex--;

          // The realtime listener will update interviewRounds automatically
        } catch (error) {
          console.error("Error removing round:", error);
          alert("Failed to remove round. Please try again.");
        }
      }
    },
  },
  mounted() {
    this.setupRealtimeListener();
    this.$watch("isModalOpen", (newVal) => {
      if (newVal) {
        document.body.style.overflow = "hidden"; // Disable scrolling
      } else {
        document.body.style.overflow = ""; // Enable scrolling again
      }
    });
  },
  beforeUnmount() {
    // Clean up the listener when the component is destroyed
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  },
};
</script>

<style scoped>
.complete-interview-page {
  width: 100%;
  display: block;
  margin: 4px 0 0 0;
}

.complete-button {
  padding: 6px 12px;
  font-size: 12px;
  font-weight: bold;
  background-color: #c24600;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;
  margin: 0;
  transition: background-color 0.2s ease;
}

.complete-button:hover {
  background-color: #fc640d;
}

.complete-button.disabled {
  background-color: #cccccc;
}

.modal {
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  z-index: 1;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
  background-color: white;
  border-radius: 12px;
  padding: 40px;
  width: 800px;
  min-height: 500px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  position: relative;
  color: black;
  font-family: Arial, sans-serif;
  display: flex;
  flex-direction: column;
}

.modal-title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #1a1a1a;
}

.modal-description {
  font-size: 16px;
  color: #666;
  margin-bottom: 16px;
  line-height: 1.6;
}

.question-entry {
  border: 1px solid #e0e0e0;
  padding: 24px;
  margin-bottom: 20px;
  border-radius: 8px;
  background-color: #fafafa;
  position: relative;
}

label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
  font-size: 15px;
}

input,
select,
textarea {
  width: 100%;
  padding: 12px;
  margin-bottom: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 15px;
  background-color: white;
  transition: border-color 0.2s ease;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: #4caf50;
}

textarea {
  height: 150px;
  resize: none;
}

.add-button {
  width: 100%;
  padding: 16px;
  background-color: #f0f9f0;
  color: #4caf50;
  border: 2px dashed #4caf50;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.add-button:hover {
  background-color: #e8f5e9;
}

.plus-icon {
  font-size: 20px;
  margin-right: 8px;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: auto;
  padding-top: 32px;
}

.submit-button,
.cancel-button {
  padding: 12px 28px;
  font-size: 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s ease;
  min-width: 120px;
  text-align: center;
}

.submit-button {
  background-color: #c24600;
  color: white;
  border: none;
}

.submit-button:hover {
  background: #fc640d;
}

.cancel-button {
  background-color: #e2e8f0;
  color: #334155;
  border: none;
}

.remove-button {
  position: absolute;
  top: 16px;
  right: 25px;
  background-color: #f44336;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s ease;
}

.remove-button:hover {
  background-color: #d32f2f;
}

.close {
  position: absolute;
  top: 24px;
  right: 24px;
  font-size: 28px;
  color: #666;
  cursor: pointer;
  transition: color 0.2s ease;
}

.close:hover {
  color: #333;
}

.round-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 8px;
  gap: 12px;
}

.nav-button {
  padding: 8px 16px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s ease;
}

.nav-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.round-indicator {
  font-weight: 500;
  color: #333;
  padding: 8px 16px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.round-header {
  display: flex;
  gap: 16px;
}

.round-label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
  color: #444;
}

.round-name-input {
  flex: 2;
}

.round-date-input {
  flex: 1;
}

.round-name-input:disabled,
.round-date-input:disabled {
  background-color: #f5f5f5;
  color: #666;
}

.delete-round-button {
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  padding: 8px 16px;
  font-size: 14px;
  transition: background-color 0.2s ease;
}

.delete-round-button:hover {
  background-color: #d32f2f;
}

.completed-round-message {
  background-color: #e8f5e9;
  color: #2e7d32;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-weight: 500;
  text-align: center;
}

input:disabled,
select:disabled,
textarea:disabled {
  background-color: #f5f5f5;
  color: #666;
  cursor: not-allowed;
  border-color: #ddd;
}

.round-indicator-wrapper {
  text-align: center;
  margin-bottom: 16px;
}

.round-indicator-text {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}
</style>
