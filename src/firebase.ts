import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, getDocFromServer, doc, enableIndexedDbPersistence } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore with a specific database ID if provided, otherwise use (default)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const auth = getAuth();

// Persistence can sometimes cause issues in sandboxed iframes, disabling for now to troubleshoot
/*
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
    } else if (err.code === 'unimplemented') {
      console.warn("The current browser does not support all of the features required to enable persistence.");
    }
  });
} catch (e) {
  console.error("Error enabling persistence:", e);
}
*/

async function testConnection() {
  try {
    console.log("Testing Firestore connection to database:", firebaseConfig.firestoreDatabaseId || '(default)');
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection successful.");
  } catch (error: any) {
    console.error("Firestore connection test failed:", error.code, error.message);
    if(error.code === 'unavailable' || error.message.includes('the client is offline')) {
      console.error("CRITICAL: Could not reach Firestore backend. This may be due to incorrect project/database configuration or network restrictions.");
    }
  }
}
testConnection();
