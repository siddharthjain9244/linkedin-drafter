// src/authService.js
import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification, 
  onAuthStateChanged,
  signOut 
} from 'firebase/auth';
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// Initialize Firebase App
// Use __firebase_config if available (Canvas environment), otherwise use .env variable
// const firebaseConfig = typeof __firebase_config !== 'undefined' 
//   ? JSON.parse(__firebase_config) 
//   : JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG || '{}');
const firebaseConfig = {
  apiKey: "AIzaSyB20cT9qmQIArI_-0-H3OvdjJQ6cFzRTME",
  authDomain: "linkedin-drafter-c9d39.firebaseapp.com",
  projectId: "linkedin-drafter-c9d39",
  storageBucket: "linkedin-drafter-c9d39.firebasestorage.app",
  messagingSenderId: "28633278556",
  appId: "1:28633278556:web:a776f3a21b63cbe6ca9e99",
  measurementId: "G-E5NRQEQ9TG"
};

const app = initializeApp(firebaseConfig);

const analytics = getAnalytics(app);
const auth = getAuth(app);
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('7474F0F4-0BB5-44F9-9948-A3AA05CA4086'),
  // isTokenAutoRefreshEnabled: true
});

// Export Firebase Auth instance and related functions
export { 
  auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification, 
  onAuthStateChanged,
  signOut 
};