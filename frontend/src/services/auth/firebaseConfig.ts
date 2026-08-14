import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA1OfRYKD1f1SvK5N5mP3E3jmDKK6B3aNU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "black-box-9aa5e.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://black-box-9aa5e-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "black-box-9aa5e",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "black-box-9aa5e.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "267973657914",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:267973657914:android:a8118c45a6a4226e353c03",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-H000XHX1C8",
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
