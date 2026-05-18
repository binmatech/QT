import { collection, query, getDocs, where, limit, orderBy, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { Article } from '../types';
import { ARTICLES } from '../constants';
import { createDocument, deleteDocument, withTimeout } from '../lib/firestoreUtils';

const ARTICLES_COLLECTION = 'articles';

export const getArticleById = async (id: string) => {
  try {
    const docRef = doc(db, ARTICLES_COLLECTION, id);
    const docSnap = await withTimeout(getDoc(docRef));
    
    if (docSnap.exists()) {
      return {
        ...docSnap.data(),
        id: docSnap.id
      } as Article;
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching article:", error);
    return null;
  }
};

export const getArticles = async (featuredOnly = false) => {
  try {
    let q = query(
      collection(db, ARTICLES_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    if (featuredOnly) {
      q = query(
        collection(db, ARTICLES_COLLECTION),
        where('featured', '==', true),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
    }

    const querySnapshot = await withTimeout(getDocs(q));
    const articles = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as Article[];

    return articles;
  } catch (error) {
    console.error("Error fetching articles:", error);
    return [];
  }
};

export const getArticlesByCategory = async (category: string) => {
  try {
    const q = query(
      collection(db, ARTICLES_COLLECTION),
      where('category', '==', category),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as Article[];
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, ARTICLES_COLLECTION);
    return [];
  }
};

export const getTrendingArticles = async () => {
  try {
    const q = query(
      collection(db, ARTICLES_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(6)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as Article[];
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, ARTICLES_COLLECTION);
    return [];
  }
};

export const createArticle = async (articleData: Omit<Article, 'id' | 'createdAt'>) => {
  const docRef = await createDocument(ARTICLES_COLLECTION, articleData);
  return docRef?.id;
};

export const deleteArticle = async (articleId: string) => {
  if (typeof articleId !== 'string') {
    throw new Error(`Invalid article ID type: ${typeof articleId}. ID must be a string.`);
  }
  return await deleteDocument(ARTICLES_COLLECTION, articleId);
};

export const seedDatabase = async (userId: string) => {
  try {
    const existing = await getArticles();
    if (existing.length > 0) return;

    console.log('Seeding database with initial articles...');
    for (const article of ARTICLES) {
      await addDoc(collection(db, ARTICLES_COLLECTION), {
        ...article,
        createdAt: Timestamp.now(),
        authorId: userId 
      });
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};
