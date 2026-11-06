import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocFromServer,
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

let quotaExhaustedInMemory = false;

export function isQuotaExhausted(): boolean {
  if (quotaExhaustedInMemory) return true;
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem('kaen_firestore_quota_exhausted');
    if (stored) {
      const timestamp = parseInt(stored, 10);
      // Reset check after 6 hours
      if (Date.now() - timestamp < 6 * 60 * 60 * 1000) {
        quotaExhaustedInMemory = true;
        return true;
      } else {
        sessionStorage.removeItem('kaen_firestore_quota_exhausted');
      }
    }
  }
  return false;
}

export function markQuotaExhausted() {
  quotaExhaustedInMemory = true;
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('kaen_firestore_quota_exhausted', Date.now().toString());
      window.dispatchEvent(new CustomEvent('kaen_quota_status_changed', { detail: { exhausted: true } }));
    } catch (e) {}
  }
}

// Validate connection to Firestore as mandated by skill
if (typeof window !== 'undefined') {
  async function testConnection() {
    if (isQuotaExhausted()) return;
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      if ((error as any)?.code === 'resource-exhausted' || errMsg.includes('resource-exhausted') || errMsg.includes('Quota limit exceeded')) {
        markQuotaExhausted();
        return;
      }
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.warn("Aviso de conectividade Firebase Firestore:", error.message);
      }
    }
  }
  testConnection();
}

// Enable offline persistence in browser if supported
if (typeof window !== 'undefined') {
  try {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Firestore offline persistence warning: multiple tabs open.');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore offline persistence is not supported in this browser.');
      }
    });
  } catch (e) {
    // ignore
  }
}

export const WORKSHOP_DOC_ID = 'kaen_shared_database';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

export function getQuotaUpgradeUrl(): string {
  const projectId = firebaseConfig.projectId || 'inner-cortex-507pf';
  const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
  return `https://console.firebase.google.com/project/${projectId}/firestore/databases/${dbId}/data?openUpgradeDialog=true`;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  const isQuota = (error as any)?.code === 'resource-exhausted' || 
                  errMsg.includes('resource-exhausted') || 
                  errMsg.includes('Quota limit exceeded') || 
                  errMsg.includes('quota metric');

  if (isQuota) {
    markQuotaExhausted();
    console.warn("⚠️ [Firestore] Cota diária do banco de dados na nuvem atingida. O sistema continua funcionando normalmente gravando localmente e via servidor backend Express/Node para não travar a oficina.");
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: 'rafael',
      email: 'automecanicakaen@gmail.com',
      emailVerified: true,
      isAnonymous: false,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Save specific workshop dataset to Firestore
 * Streamlined to 1 single write to avoid consuming free tier quotas
 */
export async function saveWorkshopFieldToCloud(key: string, value: any): Promise<void> {
  if (isQuotaExhausted()) return;

  const pathForWrite = `workshops/${WORKSHOP_DOC_ID}`;
  try {
    const docRef = doc(db, 'workshops', WORKSHOP_DOC_ID);
    await setDoc(docRef, { [key]: value, lastUpdatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

/**
 * Fetch all workshop data from Firestore
 */
export async function fetchAllWorkshopDataFromCloud(): Promise<Record<string, any> | null> {
  if (isQuotaExhausted()) return null;

  const pathForGet = `workshops/${WORKSHOP_DOC_ID}`;
  try {
    const docRef = doc(db, 'workshops', WORKSHOP_DOC_ID);
    const snap = await getDoc(docRef);
    let result: Record<string, any> = {};
    if (snap.exists()) {
      result = { ...snap.data() };
    }
    return Object.keys(result).length > 0 ? result : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, pathForGet);
    return null;
  }
}

/**
 * Subscribe to real-time changes from Firestore
 * Returns an unsubscribe function
 */
export function subscribeToWorkshopCloud(onUpdate: (data: Record<string, any>) => void): () => void {
  if (isQuotaExhausted()) {
    return () => {};
  }

  const pathForSubscribe = `workshops/${WORKSHOP_DOC_ID}`;
  const docRef = doc(db, 'workshops', WORKSHOP_DOC_ID);
  
  try {
    return onSnapshot(
      docRef, 
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Record<string, any>;
          onUpdate(data);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, pathForSubscribe);
      }
    );
  } catch (e) {
    return () => {};
  }
}

export default db;
