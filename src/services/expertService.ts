import { collection, query, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Expert } from '../types';
import { createDocument, deleteDocument, updateDocument, withTimeout } from '../lib/firestoreUtils';

const EXPERTS_COLLECTION = 'experts';

export const getExpertById = async (id: string) => {
  try {
    const docRef = doc(db, EXPERTS_COLLECTION, id);
    const docSnap = await withTimeout(getDoc(docRef));
    
    if (docSnap.exists()) {
      return {
        ...docSnap.data(),
        id: docSnap.id
      } as Expert;
    }
    return null;
  } catch (error) {
    console.error("Error fetching expert:", error);
    return null;
  }
};

export const getExperts = async () => {
  try {
    const q = query(
      collection(db, EXPERTS_COLLECTION),
      orderBy('name', 'asc')
    );

    const querySnapshot = await withTimeout(getDocs(q));
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as Expert[];
  } catch (error) {
    console.error("Error fetching experts:", error);
    return [];
  }
};

export const createExpert = async (expertData: Omit<Expert, 'id' | 'createdAt'>) => {
  const docRef = await createDocument(EXPERTS_COLLECTION, expertData);
  return docRef?.id;
};

export const updateExpert = async (expertId: string, expertData: Partial<Expert>) => {
  return await updateDocument(EXPERTS_COLLECTION, expertId, expertData);
};

export const deleteExpert = async (expertId: string) => {
  return await deleteDocument(EXPERTS_COLLECTION, expertId);
};
