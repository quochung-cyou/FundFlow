// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Default config values (for direct deployment and CI/CD)
const defaultConfig = {
  apiKey: "AIzaSyA9DHumqRPnQn2dOv_ZERF2HvCATcYU0Bc",
  authDomain: "jadeg-money.firebaseapp.com",
  databaseURL: "https://jadeg-money-default-rtdb.firebaseio.com",
  projectId: "jadeg-money",
  storageBucket: "jadeg-money.firebasestorage.app",
  messagingSenderId: "851428868473",
  appId: "1:851428868473:web:cb6fb3fd76aae79eb1efa8",
  measurementId: "G-JVR230KBQV"
};

// Your web app's Firebase configuration with fallbacks to default values
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || defaultConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || defaultConfig.authDomain,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || defaultConfig.databaseURL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || defaultConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || defaultConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || defaultConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || defaultConfig.measurementId
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Only initialize analytics in production to avoid development errors
let analytics;
if (typeof window !== 'undefined' && import.meta.env.PROD) {
  analytics = getAnalytics(app);
}
export { analytics };

export const db = getFirestore(app);
export default app;
