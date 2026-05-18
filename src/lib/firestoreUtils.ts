import { collection, addDoc, Timestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from './firebase';

/**
 * Wraps a Firestore operation with a timeout to prevent hanging.
 */
export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 15000): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("Firebase operation timed out. This often happens if you are offline or if the connection is blocked. Check your network or Firebase project settings."));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    return result;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const createDocument = async (collectionName: string, data: any) => {
  try {
    return await withTimeout(
      addDoc(collection(db, collectionName), {
        ...data,
        createdAt: Timestamp.now(),
      })
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collectionName);
  }
};

export const deleteDocument = async (collectionName: string, id: string) => {
  try {
    await withTimeout(deleteDoc(doc(db, collectionName, id)));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, collectionName);
    return false;
  }
};

export const updateDocument = async (collectionName: string, id: string, data: any) => {
  try {
    await withTimeout(updateDoc(doc(db, collectionName, id), data));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, collectionName);
    return false;
  }
};
