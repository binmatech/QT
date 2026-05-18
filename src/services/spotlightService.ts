import { collection, query, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SpotlightStory } from '../types';
import { createDocument, deleteDocument, updateDocument, withTimeout } from '../lib/firestoreUtils';

const SPOTLIGHT_COLLECTION = 'spotlight';

export const getSpotlightStoryById = async (id: string) => {
  try {
    const docRef = doc(db, SPOTLIGHT_COLLECTION, id);
    const docSnap = await withTimeout(getDoc(docRef));
    
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

    const querySnapshot = await withTimeout(getDocs(q));
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
  const docRef = await createDocument(SPOTLIGHT_COLLECTION, storyData);
  return docRef?.id;
};

export const updateSpotlightStory = async (storyId: string, storyData: Partial<SpotlightStory>) => {
  return await updateDocument(SPOTLIGHT_COLLECTION, storyId, storyData);
};

export const deleteSpotlightStory = async (storyId: string) => {
  return await deleteDocument(SPOTLIGHT_COLLECTION, storyId);
};
