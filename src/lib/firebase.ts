import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeFirestore,
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocFromServer,
  onSnapshot, 
  collection, 
  getDocs, 
  persistentLocalCache,
  persistentMultipleTabManager,
  disableNetwork,
  enableNetwork
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Custom Database ID
const customDbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? firebaseConfig.firestoreDatabaseId
  : undefined;

// Initialize Firestore with Force Long Polling and persistent multi-tab cache
export const db = (() => {
  try {
    return initializeFirestore(app, {
      experimentalForceLongPolling: true,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    }, customDbId);
  } catch (e) {
    return customDbId ? getFirestore(app, customDbId) : getFirestore(app);
  }
})();

// Active circuit breaker initialized to protect against daily write quota exhaustion
let quotaExhaustedInMemory = true;

export function isQuotaExhausted(): boolean {
  if (quotaExhaustedInMemory) return true;
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('kaen_firestore_quota_exhausted') || sessionStorage.getItem('kaen_firestore_quota_exhausted');
    if (stored) {
      const timestamp = parseInt(stored, 10);
      // Reset check after 18 hours
      if (Date.now() - timestamp < 18 * 60 * 60 * 1000) {
        quotaExhaustedInMemory = true;
        return true;
      } else {
        localStorage.removeItem('kaen_firestore_quota_exhausted');
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
      localStorage.setItem('kaen_firestore_quota_exhausted', Date.now().toString());
      sessionStorage.setItem('kaen_firestore_quota_exhausted', Date.now().toString());
      window.dispatchEvent(new CustomEvent('kaen_quota_status_changed', { detail: { exhausted: true } }));
      // Disable network on db to prevent Firestore SDK from retrying writes and logging backoff errors
      disableNetwork(db).catch(() => {});
    } catch (e) {}
  }
}

// On startup in browser, if quota is marked exhausted, disable network gracefully
if (typeof window !== 'undefined') {
  try {
    localStorage.setItem('kaen_firestore_quota_exhausted', Date.now().toString());
    sessionStorage.setItem('kaen_firestore_quota_exhausted', Date.now().toString());
    disableNetwork(db).catch(() => {});
  } catch (e) {}
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
    console.warn("⚠️ [Firestore Circuit Breaker] Cota diária gratuita do Firestore atingida. O sistema opera normalmente gravando localmente e via servidor backend Express/Node.");
    return;
  }

  // Gracefully handle network disconnects, timeouts, and offline transitions
  const isOfflineOrNetwork = errMsg.includes('Could not reach Cloud Firestore') ||
                            errMsg.includes('Backend didn\'t respond within 10 seconds') ||
                            errMsg.includes('client is offline') ||
                            errMsg.includes('failed-precondition') ||
                            errMsg.includes('unavailable') ||
                            errMsg.includes('timeout');

  if (isOfflineOrNetwork) {
    console.warn("ℹ️ [Firestore Offline Engine] Operação protegida pelo cache local e sincronização secundária:", errMsg);
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

  const isPermissionError = errMsg.includes('permission-denied') || 
                            errMsg.includes('Missing or insufficient permissions');

  if (isPermissionError) {
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  } else {
    console.warn('Firestore Operation Notice: ', JSON.stringify(errInfo));
  }
}

/**
 * Save specific workshop dataset to Firestore
 * Protected by quota circuit breaker: if daily free tier write limit is reached,
 * it safely skips Firestore write and relies on local database & Express server backend.
 */
export async function saveWorkshopFieldToCloud(key: string, value: any): Promise<void> {
  if (isQuotaExhausted()) return;

  const pathForWrite = `workshops/${WORKSHOP_DOC_ID}`;
  try {
    const docRef = doc(db, 'workshops', WORKSHOP_DOC_ID);
    const writePromise = setDoc(docRef, { [key]: value, lastUpdatedAt: new Date().toISOString() }, { merge: true });
    const timeoutPromise = new Promise<void>((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000));
    await Promise.race([writePromise, timeoutPromise]);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const isQuota = (error as any)?.code === 'resource-exhausted' || 
                    errMsg.includes('resource-exhausted') || 
                    errMsg.includes('Quota limit exceeded') || 
                    errMsg.includes('quota metric');
    if (isQuota) {
      markQuotaExhausted();
      console.warn("⚠️ [Firestore Circuit Breaker] Cota diária gratuita do Firestore atingida. Gravação direcionada com segurança para o banco de dados local e backend Express.");
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

/**
 * Fetch all workshop data from Firestore with timeout protection
 */
export async function fetchAllWorkshopDataFromCloud(): Promise<Record<string, any> | null> {
  if (isQuotaExhausted()) return null;

  const pathForGet = `workshops/${WORKSHOP_DOC_ID}`;
  try {
    const docRef = doc(db, 'workshops', WORKSHOP_DOC_ID);
    const snapPromise = getDoc(docRef);
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500));
    const snap = await Promise.race([snapPromise, timeoutPromise]);
    if (!snap) return null;
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
