export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  category: string;
  author: string;
  authorDesignation?: string;
  authorImage?: string;
  date: string;
  readTime: string;
  image: string;
  featured: boolean;
  createdAt?: any;
}

export interface NewsEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  image: string;
  registrationLink?: string;
  createdAt?: any;
}

export interface Expert {
  id: string;
  name: string;
  title: string;
  bio: string;
  image: string;
  twitter?: string;
  linkedin?: string;
  website?: string;
  contributionsCount?: number;
  createdAt?: any;
}

export interface SpotlightStory {
  id: string;
  founderName: string;
  companyName: string;
  title: string;
  story: string;
  image: string;
  link?: string;
  createdAt?: any;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  role: 'reader' | 'contributor' | 'editor';
}
