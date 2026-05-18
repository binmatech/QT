import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, browserPopupRedirectResolver } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Robust loading of the local config file if it exists.
// During production builds where this file is gitignored, we rely on VITE_ env vars.
const firebaseConfigs = import.meta.glob('../../firebase-applet-config.json', { eager: true });
const configFiles = Object.values(firebaseConfigs);
const firebaseConfigJson = (configFiles.length > 0 ? (configFiles[0] as any).default : {}) || {};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfigJson.measurementId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigJson.firestoreDatabaseId
};

// Check if we have the minimum required config
const hasRequiredConfig = firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId;

if (!hasRequiredConfig) {
  console.warn("Firebase configuration is missing required fields. Ensure environment variables are set correctly.");
}

if (!firebaseConfig.storageBucket) {
  console.warn("Firebase Storage Bucket is missing. File uploads will fail. If you are on Vercel, ensure VITE_FIREBASE_STORAGE_BUCKET is set.");
}

const app = initializeApp(firebaseConfig);

// Improved Firestore initialization with long-polling to prevent timeouts in restrictive networks (common in Vercel/Iframe environments)
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  useFetchStreams: false, 
}, firebaseConfig.firestoreDatabaseId || '(default)');

export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export const getFirebaseStatus = () => {
  const vars = {
    VITE_FIREBASE_API_KEY: !!import.meta.env.VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_AUTH_DOMAIN: !!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    VITE_FIREBASE_PROJECT_ID: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_STORAGE_BUCKET: !!import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    VITE_FIREBASE_APP_ID: !!import.meta.env.VITE_FIREBASE_APP_ID
  };

  return {
    isConfigured: hasRequiredConfig,
    hasStorage: !!firebaseConfig.storageBucket,
    projectId: firebaseConfig.projectId,
    vars,
    isLocalConfig: configFiles.length > 0 && !Object.values(vars).every(Boolean),
    missingVars: Object.entries(vars)
      .filter(([_, exists]) => !exists)
      .map(([name]) => name)
  };
};

// Connection test as per skill guidelines
async function testConnection() {
  try {
    // Attempting a simple read to verify connection
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection established successfully.");
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('the client is offline')) {
        console.error("Firebase is offline. This usually means the Firestore backend is still being provisioned or there is a network issue. Please wait a moment and refresh.");
      } else {
        console.error("Firebase connection error:", error.message);
      }
    }
  }
}
testConnection();

let signInPromise: Promise<any> | null = null;

export const signInWithGoogle = async () => {
  if (signInPromise) {
    return signInPromise;
  }

  signInPromise = (async () => {
    try {
      // Use the redirect resolver for better iframe compatibility
      const result = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
      return result;
    } catch (error: any) {
      const code = error.code;
      const message = error.message || "";

      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        return null;
      }
      
      if (code === 'auth/popup-blocked') {
        throw new Error("POPUP_BLOCKED");
      }

      if (message.includes('INTERNAL ASSERTION FAILED')) {
        throw new Error("FIREBASE_INTERNAL_ERROR");
      }

      console.error("Authentication error:", error);
      throw error;
    } finally {
      signInPromise = null;
    }
  })();

  return signInPromise;
};
export const logout = () => signOut(auth);

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
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
