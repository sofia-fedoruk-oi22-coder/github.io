import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth, getIdToken } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import localConfig from '../firebaseConfig';

const envConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || '',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '',
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || '',
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || '',
};

// Prefer a local `src/firebaseConfig.js` when provided (useful for development),
// otherwise fall back to environment variables.
export const firebaseConfig = (localConfig && localConfig.apiKey)
  ? localConfig
  : envConfig;

export const hasFirebaseConfig = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.storageBucket,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId,
].every(Boolean);

export const missingFirebaseVars = Object.entries({
  REACT_APP_FIREBASE_API_KEY: firebaseConfig.apiKey,
  REACT_APP_FIREBASE_AUTH_DOMAIN: firebaseConfig.authDomain,
  REACT_APP_FIREBASE_PROJECT_ID: firebaseConfig.projectId,
  REACT_APP_FIREBASE_STORAGE_BUCKET: firebaseConfig.storageBucket,
  REACT_APP_FIREBASE_MESSAGING_SENDER_ID: firebaseConfig.messagingSenderId,
  REACT_APP_FIREBASE_APP_ID: firebaseConfig.appId,
})
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const firebaseApp = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;
export const auth = firebaseApp ? getAuth(firebaseApp) : null;

const firestoreDatabaseId = process.env.REACT_APP_FIREBASE_FIRESTORE_DATABASE_ID || '';
export const firestoreDb = firebaseApp
  ? (firestoreDatabaseId ? getFirestore(firebaseApp, firestoreDatabaseId) : getFirestore(firebaseApp))
  : null;

if (firebaseApp && firebaseConfig.measurementId && typeof window !== 'undefined') {
  getAnalytics(firebaseApp);
}

export async function getFreshIdToken(user) {
  return getIdToken(user, true);
}
