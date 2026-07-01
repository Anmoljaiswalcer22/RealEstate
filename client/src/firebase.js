import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Google sign-in is optional: the app works with email/password if these are empty
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey);
export const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
