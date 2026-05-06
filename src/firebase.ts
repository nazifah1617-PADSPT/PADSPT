import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getDocFromServer, doc, enableIndexedDbPersistence } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore with the explicit database ID from config
// This ID is specific to the "e-kariah PADSPT" project setup
const databaseId = "ai-studio-07ecc092-644a-4284-8e97-4c7e62847529";
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, databaseId);

try {
  enableIndexedDbPersistence(db).catch((err) => {
    console.warn('Firebase persistence warning:', err);
  });
} catch (e) {
  console.error('Firebase persistence error:', e);
}

export const auth = getAuth();

// Verification log
console.log("Firebase initialized for project:", firebaseConfig.projectId, "Database:", databaseId);
