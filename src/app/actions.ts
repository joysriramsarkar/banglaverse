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

// This is the structure of the data in Firestore
interface FirestoreWord {
  bn: string;
  en: string[];
  bn_syns: string[];
  en_syns: string[];
  sents: string[];
}

// This is the structure the client component expects
export type WordDetails = {
  word: string;
  pronunciation: string;
  meaning: string;
  examples: string[];
  synonyms: string[];
};

export async function getWordDetails(
  word: string,
): Promise<WordDetails | { error: string }> {
  if (!word) {
    return { error: 'অনুগ্রহ করে একটি শব্দ লিখুন।' };
  }

  try {
    const docRef = db.collection('dictionary').doc(word.toLowerCase());
    const doc = await docRef.get();

    if (doc.exists) {
      const data = doc.data() as FirestoreWord;

      const result: WordDetails = {
        word: word,
        pronunciation: data.bn,
        meaning: data.en.join(', '),
        synonyms: data.bn_syns,
        examples: data.sents,
      };
      return result;
    } else {
      return { error: `"${word}" শব্দটি অভিধানে পাওয়া যায়নি।` };
    }
  } catch (error) {
    console.error('Error fetching from Firestore:', error);
    return { error: 'ডেটাবেস থেকে তথ্য আনতে সমস্যা হয়েছে।' };
  }
}
