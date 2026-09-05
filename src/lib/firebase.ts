import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  collection, 
  getDocs, 
  enableIndexedDbPersistence 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with custom databaseId if configured
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Enable offline persistence in browser if supported
if (typeof window !== 'undefined') {
  try {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time.
        console.warn('Firestore offline persistence warning: multiple tabs open.');
      } else if (err.code === 'unimplemented') {
        // The current browser does not support offline persistence.
        console.warn('Firestore offline persistence is not supported in this browser.');
      }
    });
  } catch (e) {
    // ignore
  }
}

export const WORKSHOP_DOC_ID = 'kaen_shared_database';

/**
 * Save specific workshop dataset to Firestore
 */
export async function saveWorkshopFieldToCloud(key: string, value: any): Promise<void> {
  try {
    const docRef = doc(db, 'workshops', WORKSHOP_DOC_ID);
    await setDoc(docRef, { [key]: value, lastUpdatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    console.error(`Error saving ${key} to Firestore:`, error);
    throw error;
  }
}

/**
 * Fetch all workshop data from Firestore
 */
export async function fetchAllWorkshopDataFromCloud(): Promise<Record<string, any> | null> {
  try {
    const docRef = doc(db, 'workshops', WORKSHOP_DOC_ID);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as Record<string, any>;
    }
    return null;
  } catch (error) {
    console.error('Error fetching workshop data from Firestore:', error);
    return null;
  }
}

/**
 * Subscribe to real-time changes from Firestore
 * Returns an unsubscribe function
 */
export function subscribeToWorkshopCloud(onUpdate: (data: Record<string, any>) => void): () => void {
  const docRef = doc(db, 'workshops', WORKSHOP_DOC_ID);
  
  return onSnapshot(
    docRef, 
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as Record<string, any>;
        onUpdate(data);
      }
    },
    (error) => {
      console.warn('Firestore real-time subscription error:', error);
    }
  );
}

export default db;
