<template>
  <button @click="increment_upvote">Upvotes {{ upvote_counter }}</button>
  <button @click="increment_report">Report {{ report_counter }}</button>
</template>

<script>
import firebaseApp from "../firebase.js";
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
      // mite need to change the code to get rl time data
      let allUpvotes = await getDocs(collection(db, "Upvotes"));
      this.upvote_counter = allUpvotes.size;

      let allReports = await getDocs(collection(db, "Reports"));
      this.report_counter = allReports.size;
      // need to check if report is more than 9
      if (this.report_counter >= 9) {
        //update status to remove question from user view
      }
    }
    display();

    async function increment_upvote() {
      let allUpvotes = await getDocs(collection(db, "Upvotes"));
      allUpvotes.forEach(async (docs) => {
        let documentData = docs.data();
        //verify the same name is used in firebase
        let username = documentData.username;
        //check if current user is in the list
        if (username == "user") {
          //delete or remove from list
          await deleteDoc(doc(db, "Upvotes", username));
        } else {
          // add name into list
          try {
            const docRef = await setDoc(doc(db, "Upvotes", username), {
              User: username,
              //include upvote time ?
            });
          } catch (error) {
            console.error("Error adding document: ", error);
          }
        }
         
        // need to check if value will be updated
        display();
      });
    }

    async function increment_report() {
      let allReports = await getDocs(collection(db, "Reports"));
      allReports.forEach(async (docs) => {
        let documentData = docs.data();
        //verify the same name is used in firebase
        let username = documentData.username;

        //check if current user is in the list
        if (username == "user") {
          //delete or remove from list
          await deleteDoc(doc(db, "Reports", username));
        } else {
          // add name into list
          try {
            const docRef = await setDoc(doc(db, "Reports", username), {
              User: username,
              //include report time ?
            });
          } catch (error) {
            console.error("Error adding document: ", error);
          }
        }
        // need to check if value will be updated
        display();
      });
    }
  },
  methods: {},
};
</script>
