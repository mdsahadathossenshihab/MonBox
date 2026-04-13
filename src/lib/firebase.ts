import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromCache, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging } from 'firebase/messaging';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;
export const googleProvider = new GoogleAuthProvider();

// Test Firestore connection
async function testConnection() {
  try {
    // We use getDocFromServer to force a network request and verify the config
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The Firestore client is offline, which usually indicates an invalid database ID or project configuration.");
    }
    // Other errors (like permission denied) are expected since the document doesn't exist
    // and we just want to verify the client can reach the server.
  }
}

testConnection();
