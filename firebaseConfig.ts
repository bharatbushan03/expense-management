import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB_oezWBDii0ikzPrYZezbD2kzcQNmNrsU",
  authDomain: "expense-management-syste-451cf.firebaseapp.com",
  projectId: "expense-management-syste-451cf",
  storageBucket: "expense-management-syste-451cf.firebasestorage.app",
  messagingSenderId: "627462238056",
  appId: "1:627462238056:web:405b9dce9f4df40b9c70dd",
  measurementId: "G-V6YRRXCQZ6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Auth and Firestore instances
export const auth = getAuth(app);
export const db = getFirestore(app);