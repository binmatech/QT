import { collection, query, getDocs, orderBy, Timestamp, addDoc, doc, deleteDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { Expert } from '../types';

const EXPERTS_COLLECTION = 'experts';

export const getExpertById = async (id: string) => {
  try {
    const docRef = doc(db, EXPERTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
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

    const querySnapshot = await getDocs(q);
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
  try {
    const docRef = await addDoc(collection(db, EXPERTS_COLLECTION), {
      ...expertData,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, EXPERTS_COLLECTION);
  }
};

export const updateExpert = async (expertId: string, expertData: Partial<Expert>) => {
  try {
    const docRef = doc(db, EXPERTS_COLLECTION, expertId);
    await updateDoc(docRef, expertData);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, EXPERTS_COLLECTION);
    return false;
  }
};

export const deleteExpert = async (expertId: string) => {
  try {
    await deleteDoc(doc(db, EXPERTS_COLLECTION, expertId));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, EXPERTS_COLLECTION);
    return false;
  }
};
