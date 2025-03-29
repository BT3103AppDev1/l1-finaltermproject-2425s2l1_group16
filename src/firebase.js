import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyA4KWw_HW2J3SVfXxuhgF-QNjfO_Eho08M",
  authDomain: "interntracker-376f9.firebaseapp.com",
  projectId: "interntracker-376f9",
  storageBucket: "interntracker-376f9.firebasestorage.app",
  messagingSenderId: "664568891405",
  appId: "1:664568891405:web:10fae588020df1a3aa2d44",
  measurementId: "G-E7VW7E3WT6",
};

const firebaseApp = initializeApp(firebaseConfig);
export default firebaseApp;
