<template>
  <button @click="increment_upvote">Upvotes {{ upvote_counter }}</button>
  <button @click="increment_report">Report {{ report_counter }}</button>
</template>

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
const db = getFirestore(firebaseApp);

export default {
  data() {
    return {
      upvote_counter: 0,
      report_counter: 0,
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
      const allUpvotes = await getDocs(collection(db, "Upvotes"));
      this.upvote_counter = allUpvotes.size;

      const allReports = await getDocs(collection(db, "Reports"));
      this.report_counter = allReports.size;
      // need to check if report is more than 9
      if (this.report_counter >= 9) {
        //update status to remove question from user view
      }
    },

    async increment_upvote() {
      let current = "user";
      const userRef = doc(db, "Upvotes", current);
      try {
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          await deleteDoc(userRef);
          //delete points if they un upvote ?
        } else {
          const docRef = await setDoc(doc(db, "Upvotes", current), {
            username: current,
          });
          //getting user info & adding points
          const pointsRef = doc(db, "Users", "insights_me");
          await updateDoc(pointsRef, {
            contribution_pts: increment(1),
          });
        }
      } catch (error) {
        console.error("Error adding document", error);
      }

      this.display();
    },

    async increment_report() {
      let current = "user";
      const userRef = doc(db, "Reports", current);
      try {
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          await deleteDoc(userRef);
        } else {
          const docRef = await setDoc(doc(db, "Reports", current), {
            username: current,
          });
        }
      } catch (error) {
        console.error("Error adding document", error);
      }

      this.display();
    },

    async quality_check() {
      const filter = new Filter();
      const allQuestions = await getDocs(collection(db, "Interview_Questions"));
      //checking each question
      allQuestions.forEach(async (docs) => {
        let documentData = docs.data();
        if (documentData.status == "Checked") {
          return;
        } else {
          const filter = new Filter();
          if (!filter.isProfane(documentData.question)) {
            
            //getting user info & adding points
            // get documentData.name instead but using placeholder for now
            const uploader = "insights_me"
            const pointsRef = doc(db, "Users", uploader);
            const updatePointsDoc = await updateDoc(pointsRef, {
              contribution_pts: increment(5),
            });
            const questionRef = doc(db, "Interview_Questions", docs.id);
            updateDoc(questionRef, {
              status: "Checked",
            });
          }
          else {
            // delete the question ? remove ? 
            const questionRef = doc(db, "Interview_Questions", docs.id);
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
