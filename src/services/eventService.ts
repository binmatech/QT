import { collection, query, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { NewsEvent } from '../types';
import { createDocument, deleteDocument, updateDocument, withTimeout } from '../lib/firestoreUtils';

const EVENTS_COLLECTION = 'events';

export const getEventById = async (id: string) => {
  try {
    const docRef = doc(db, EVENTS_COLLECTION, id);
    const docSnap = await withTimeout(getDoc(docRef));
    
    if (docSnap.exists()) {
      return {
        ...docSnap.data(),
        id: docSnap.id
      } as NewsEvent;
    }
    return null;
  } catch (error) {
    console.error("Error fetching event:", error);
    return null;
  }
};

export const getEvents = async () => {
  try {
    const q = query(
      collection(db, EVENTS_COLLECTION),
      orderBy('date', 'asc')
    );

    const querySnapshot = await withTimeout(getDocs(q));
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as NewsEvent[];
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
};

export const createEvent = async (eventData: Omit<NewsEvent, 'id' | 'createdAt'>) => {
  const docRef = await createDocument(EVENTS_COLLECTION, eventData);
  return docRef?.id;
};

export const updateEvent = async (eventId: string, eventData: Partial<NewsEvent>) => {
  return await updateDocument(EVENTS_COLLECTION, eventId, eventData);
};

export const deleteEvent = async (eventId: string) => {
  return await deleteDocument(EVENTS_COLLECTION, eventId);
};
