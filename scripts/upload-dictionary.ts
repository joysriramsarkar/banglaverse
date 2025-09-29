
import * as admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

try {
  admin.initializeApp({
    projectId: 'studio-6801224319-7a315',
  });
} catch (error) {
  console.error('Firebase initialization error', error);
  process.exit(1);
}

const db = admin.firestore();
const dictionaryCollection = db.collection('dictionary');

const uploadDictionary = async () => {
  try {
    const filePath = path.join(process.cwd(), 'src', 'lib', 'data', 'dictionary-full.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const dictionary: any[] = JSON.parse(fileContent);

    const batchSize = 500;
    for (let i = 0; i < dictionary.length; i += batchSize) {
      const batch = db.batch();
      const chunk = dictionary.slice(i, i + batchSize);

      chunk.forEach(entry => {
        const docRef = dictionaryCollection.doc(entry.bn.toLowerCase());
        batch.set(docRef, entry);
      });

      await batch.commit();
      console.log(`Uploaded batch ${Math.floor(i / batchSize) + 1}`);
    }

    console.log('Dictionary uploaded successfully!');
  } catch (error) {
    console.error('Error uploading dictionary:', error);
  }
};

uploadDictionary();
