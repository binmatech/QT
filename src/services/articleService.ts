import { collection, query, getDocs, where, limit, orderBy, Timestamp, addDoc, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { Article } from '../types';
import { ARTICLES } from '../constants';

const ARTICLES_COLLECTION = 'articles';

export const getArticleById = async (id: string) => {
  try {
    const docRef = doc(db, ARTICLES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
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

    const querySnapshot = await getDocs(q);
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
  try {
    const docRef = await addDoc(collection(db, ARTICLES_COLLECTION), {
      ...articleData,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, ARTICLES_COLLECTION);
  }
};

export const deleteArticle = async (articleId: string) => {
  try {
    if (typeof articleId !== 'string') {
      throw new Error(`Invalid article ID type: ${typeof articleId}. ID must be a string.`);
    }
    await deleteDoc(doc(db, ARTICLES_COLLECTION, articleId));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, ARTICLES_COLLECTION);
    return false;
  }
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
