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

export { 
  auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification, 
  onAuthStateChanged,
  signOut 
};