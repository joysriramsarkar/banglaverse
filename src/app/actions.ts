'use server';

// AI-related imports
import { grammarCheck, type GrammarCheckInput } from '@/ai/flows/grammar-check';
import { correctBanglaText, type CorrectBanglaTextInput } from '@/ai/flows/advanced-text-correction';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

// Firebase-related imports and initialization
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

// Structure of the data in Firestore
interface FirestoreWord {
  bn: string;
  en: string[];
  bn_syns: string[];
  en_syns: string[];
  sents: string[];
}

// Structure the client component expects
export type WordDetails = {
  word: string;
  pronunciation: string;
  meaning: string;
  examples: string[];
  synonyms: string[];
  error?: string;
};

// getWordDetails function using Firebase
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

// Helper function to check for API Key for AI functions
function checkApiKey() {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'এখানে আপনার জেমিনি এপিআই কী লিখুন') {
    return 'অনুগ্রহ করে আপনার .env.local ফাইলে জেমিনি এপিআই কী সেট করুন।';
  }
  return null;
}

// Helper function to handle errors consistently
function handleError(e: unknown): { error: string } {
  console.error(e);
  if (e instanceof Error) {
    return { error: e.message };
  }
  return { error: 'একটি অজানা ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।' };
}

// --- Spell Check functionality ---
const spellCheckSchema = z.object({
  text: z.string().min(1, 'অনুগ্রহ করে কিছু লেখা দিন।'),
});

async function getWordList() {
    try {
        const filePath = path.join(process.cwd(), 'src', 'lib', 'data', 'word-list.txt');
        const fileContent = await fs.promises.readFile(filePath, 'utf-8');
        const words = fileContent.split('\n').map(w => w.trim().toLowerCase());
        return new Set(words);
    } catch (error) {
        console.error("Error reading word list:", error);
        return new Set();
    }
}

export async function performSpellCheck(prevState: any, formData: FormData) {
  const validatedFields = spellCheckSchema.safeParse({
    text: formData.get('text'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.text?.[0],
    };
  }

  const { text } = validatedFields.data;
  const wordList = await getWordList();
  
  const wordsInText = text.split(/([,.\s।]+)/);
  const suggestions: string[] = [];

  wordsInText.forEach(word => {
    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()।]/g,"");
    if (cleanWord && !wordList.has(cleanWord.toLowerCase())) {
        if(!suggestions.includes(cleanWord)) {
            suggestions.push(cleanWord);
        }
    }
  });

  return {
    correctedText: text,
    suggestions: suggestions,
    error: null,
  };
}

// --- Grammar Check functionality ---
const grammarCheckSchema = z.object({
  sentence: z.string().min(1, 'অনুগ্রহ করে একটি বাক্য দিন।'),
});

export async function performGrammarCheck(prevState: any, formData: FormData) {
  const apiKeyError = checkApiKey();
  if (apiKeyError) return { error: apiKeyError };

  const validatedFields = grammarCheckSchema.safeParse({
    sentence: formData.get('sentence'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.sentence?.[0],
    };
  }

  try {
    return await grammarCheck(validatedFields.data as GrammarCheckInput);
  } catch (e) {
    return handleError(e);
  }
}

// --- Advanced Correction functionality ---
const advancedCorrectionSchema = z.object({
  text: z.string().min(1, 'অনুগ্রহ করে কিছু লেখা দিন।'),
});

export async function performAdvancedCorrection(prevState: any, formData: FormData) {
  const apiKeyError = checkApiKey();
  if (apiKeyError) return { error: apiKeyError };

  const validatedFields = advancedCorrectionSchema.safeParse({
    text: formData.get('text'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.text?.[0],
    };
  }
  
  try {
    return await correctBanglaText({ textDocument: validatedFields.data.text });
  } catch (e) {
    return handleError(e);
  }
}