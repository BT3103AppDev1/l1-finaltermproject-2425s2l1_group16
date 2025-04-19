import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "@/firebase";

export async function resetPoints() {
  const auth = getAuth();
  const user = auth.currentUser;

  const userRef = doc(db, "Users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return;

  const data = userSnap.data();
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const savedMonth = data.lastResetMonth;
  const savedYear = data.lastResetYear;

  if (currentMonth != savedMonth || currentYear != savedYear) {
    await updateDoc(userRef, {
      contribution_pts: 0,
      lastResetPointsMonth: currentMonth, 
      lastResetPointsYear: currentYear
    });
  }
}
