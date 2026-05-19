import { collection, query, getDocs, orderBy, Timestamp, addDoc, doc, deleteDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { SpotlightStory } from '../types';

const SPOTLIGHT_COLLECTION = 'spotlight';

export const getSpotlightStoryById = async (id: string) => {
  try {
    const docRef = doc(db, SPOTLIGHT_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        ...docSnap.data(),
        id: docSnap.id
      } as SpotlightStory;
    }
    return null;
  } catch (error) {
    console.error("Error fetching spotlight story:", error);
    return null;
  }
};

export const getSpotlightStories = async () => {
  try {
    const q = query(
      collection(db, SPOTLIGHT_COLLECTION),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as SpotlightStory[];
  } catch (error) {
    console.error("Error fetching spotlight stories:", error);
    return [];
  }
};

export const createSpotlightStory = async (storyData: Omit<SpotlightStory, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, SPOTLIGHT_COLLECTION), {
      ...storyData,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, SPOTLIGHT_COLLECTION);
  }
};

export const updateSpotlightStory = async (storyId: string, storyData: Partial<SpotlightStory>) => {
  try {
    const docRef = doc(db, SPOTLIGHT_COLLECTION, storyId);
    await updateDoc(docRef, storyData);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, SPOTLIGHT_COLLECTION);
    return false;
  }
};

export const deleteSpotlightStory = async (storyId: string) => {
  try {
    await deleteDoc(doc(db, SPOTLIGHT_COLLECTION, storyId));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, SPOTLIGHT_COLLECTION);
    return false;
  }
};
