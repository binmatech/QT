import { collection, query, getDocs, orderBy, Timestamp, addDoc, doc, deleteDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { NewsEvent } from '../types';

const EVENTS_COLLECTION = 'events';

export const getEventById = async (id: string) => {
  try {
    const docRef = doc(db, EVENTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
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

    const querySnapshot = await getDocs(q);
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
  try {
    const docRef = await addDoc(collection(db, EVENTS_COLLECTION), {
      ...eventData,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, EVENTS_COLLECTION);
  }
};

export const updateEvent = async (eventId: string, eventData: Partial<NewsEvent>) => {
  try {
    const docRef = doc(db, EVENTS_COLLECTION, eventId);
    await updateDoc(docRef, eventData);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, EVENTS_COLLECTION);
    return false;
  }
};

export const deleteEvent = async (eventId: string) => {
  try {
    await deleteDoc(doc(db, EVENTS_COLLECTION, eventId));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, EVENTS_COLLECTION);
    return false;
  }
};
