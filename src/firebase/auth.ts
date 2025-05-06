import { 
  signOut, 
  UserCredential,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { auth } from "./config";

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Configure auth persistence - keep user logged in
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error('Error setting auth persistence:', error);
  });

// Sign in with Google
export const loginWithGoogle = async (): Promise<UserCredential> => {
  // Use persistent session
  await setPersistence(auth, browserLocalPersistence);
  return signInWithPopup(auth, googleProvider);
};

// Sign out
export const logoutUser = async (): Promise<void> => {
  return signOut(auth);
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Get current user
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};
