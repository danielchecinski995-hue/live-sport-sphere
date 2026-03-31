/**
 * Firebase Configuration
 * Replace with your Firebase project config from Firebase Console
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCxDSDonoGtYz_Li7fCOsgMIREkrC3wiM4',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'live-sport-sphere.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'live-sport-sphere',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'live-sport-sphere.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '694574979605',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:694574979605:web:63661f89eb9de00fdccc1c',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
