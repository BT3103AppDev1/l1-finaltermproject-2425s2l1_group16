<template>
  <div class="main-buttons">
    <div class="upvote-button">
      <button @click="increment_upvote">
        <font-awesome-icon :icon="['far', 'thumbs-up']" /> 
        {{ upvote_counter }}
      </button>
    </div>
    <div class="report-button">
      <button @click="showPopup = true"><font-awesome-icon :icon="['far', 'flag']" /> {{ report_counter }}</button>
    </div>
  </div>

  <!-- <button @click="increment_report">Report {{ report_counter }}</button> -->
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
          <span class="tooltip">?</span>
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
</template>

<style scoped>

.main-buttons button {
  border: none;
  cursor: pointer;
  color: white;
  background: none;
  font-size: small;
}

.main-buttons button:hover {
  color: rgba(255, 255, 255, 0.401);
}


.main-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 20px
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
}

.popup-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
}

.popup-content p {
  color: black;
  margin-bottom: 20px;
}

.popup-content label {
  color: black;
}

.popup-content button {
  color: black;
}

.popup-buttons {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.popup-buttons button {
  padding: 6px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
}

input[type="radio"] {
  margin-right: 8px;
}
</style>

<script>
import { Filter } from "bad-words";
import firebaseApp from "../firebase.js";
import { getFirestore } from "firebase/firestore";
import {
  doc,
  setDoc,
  collection,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  increment,
} from "firebase/firestore";
import { useToast } from "vue-toastification";

const db = getFirestore(firebaseApp);

export default {
  setup() {
    const toast = useToast();
    return { toast };
  },
  data() {
    return {
      upvote_counter: 0,
      report_counter: 0,
      showPopup: false,
      selectedReason: null,
      reasons: [
        "Sexual content",
        "Violent or repulsive content",
        "Hateful or abusive content",
        "Harassment or bullying",
        "Misinformation",
        "Spam or misleading",
      ],
    };
  },
  mounted() {
    this.display();
    this.quality_check();
  },
  methods: {
    async display() {
      // this will be within each interview ques in the db
      // mite need to change the code to get rl time data
      let currentQuestion = "question_2";
      const allUpvotes = await getDocs(
        collection(db, "InterviewQuestions", currentQuestion, "upvote")
      );
      this.upvote_counter = allUpvotes.size;

      const allReports = await getDocs(
        collection(db, "InterviewQuestions", currentQuestion, "report")
      );
      this.report_counter = allReports.size;
      // need to check if report is more than 9
      if (this.report_counter >= 9) {
        //update status to remove question from user view
      }
    },

    async increment_upvote() {
      // remeber to change to current user
      let currentUser = "insights_me";
      // will put under Interview Questions
      //get current questions
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
          // in interview questions db
          const docRef = await setDoc(
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
          //getting user info & adding points
          const pointsRef = doc(db, "Users", "insights_me");
          await updateDoc(pointsRef, {
            contribution_pts: increment(1),
          });

          this.toast.success("1 point has been added into your account ! ");
        }
      } catch (error) {
        console.error("Error adding document", error);
      }

      this.display();
    },

    async increment_report() {
      // remember change user
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
        // const docSnap = await getDoc(userRef);
        // if (docSnap.exists()) {
        //   // await deleteDoc(userRef);
        // } else {

        //allow user to report more than once ? so far they can only report once
        const docRef = await setDoc(
          doc(
            db,
            "InterviewQuestions",
            currentQuestions,
            "report",
            currentUser
          ),
          {
            username: currentUser,
            reasons: this.selectedReason,
          }
        );
        //}
        this.showPopup = false;
      } catch (error) {
        console.error("Error adding document", error);
      }

      this.display();
    },

    async quality_check() {
      const filter = new Filter();
      const allQuestions = await getDocs(collection(db, "InterviewQuestions"));
      //checking each question
      allQuestions.forEach(async (docs) => {
        let documentData = docs.data();

        if (
          documentData.status == "Checked" ||
          documentData.status == "Removed"
        ) {
          return;
        } else {
          const filter = new Filter();
          if (!filter.isProfane(documentData.question)) {
            //getting user info & adding points
            // get documentData.name instead but using placeholder for now
            const uploader = "insights_me";
            const pointsRef = doc(db, "Users", uploader);
            const updatePointsDoc = await updateDoc(pointsRef, {
              contribution_pts: increment(5),
            });
            const questionRef = doc(db, "InterviewQuestions", docs.id);
            updateDoc(questionRef, {
              status: "Checked",
            });
          } else {
            // delete the question ? remove ?
            const questionRef = doc(db, "InterviewQuestions", docs.id);
            updateDoc(questionRef, {
              status: "Removed",
            });
          }
        }
      });
    },
  },
};
</script>
