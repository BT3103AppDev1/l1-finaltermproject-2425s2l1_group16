<template>
  <button @click="increment_upvote">Upvotes {{ upvote_counter }}</button>
  <button @click="increment_report">Report {{ report_counter }}</button>
</template>

<script>
import firebaseApp from "@/firebase";
import { getFirestore } from "firebase/firestore";
import {
  doc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
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
    async function display() {
  
      // this will be within each interview ques in the db
      let allUpvotes = await getDocs(collection(db, "Upvotes"));
      this.upvote_counter = allUpvotes.data().count();

      allUpvotes.forEach((docs) => {
        let documentData = docs.data();
      });

      let allReports = await getDocs(collection(db, "Reports"));
      this.report_counter = allReports.data().count();

      allReports.forEach((docs) => {
        let documentData = docs.data();
      });
    }
  },
  methods: {
    increment_upvote() {
      this.upvote_counter += 1;
    },
    increment_report() {
      this.upvote_report += 1;
    },
  },
};
</script>
