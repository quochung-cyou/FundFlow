// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA9DHumqRPnQn2dOv_ZERF2HvCATcYU0Bc",
  authDomain: "jadeg-money.firebaseapp.com",
  databaseURL: "https://jadeg-money-default-rtdb.firebaseio.com",
  projectId: "jadeg-money",
  storageBucket: "jadeg-money.firebasestorage.app",
  messagingSenderId: "851428868473",
  appId: "1:851428868473:web:cb6fb3fd76aae79eb1efa8",
  measurementId: "G-JVR230KBQV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export default app;
