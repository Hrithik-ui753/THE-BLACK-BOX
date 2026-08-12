import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCHQmfaFdoMafhsuRqVgey8MMdlsI4V7D8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "black-box-24537.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://black-box-24537-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "black-box-24537",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "black-box-24537.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "218270638774",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:218270638774:web:2a96a800b0f573f92c3c17",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-H000XHX1C8",
};

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
