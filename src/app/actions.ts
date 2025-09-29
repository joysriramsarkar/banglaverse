'use server';

import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      projectId: 'studio-6801224319-7a315',
    });
  } catch (error) {
    console.error('Firebase initialization error', error);
  }
}

const db = admin.firestore();

export interface SearchResult {
  bn: string;
  en: string[];
  bn_syns: string[];
  en_syns: string[];
  sents: string[];
}

export async function getWordDetails(word: string): Promise<SearchResult | null> {
  if (!word) {
    return null;
  }

  try {
    const docRef = db.collection('dictionary').doc(word.toLowerCase());
    const doc = await docRef.get();

    if (doc.exists) {
      return doc.data() as SearchResult;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching from Firestore:', error);
    return null;
  }
}
