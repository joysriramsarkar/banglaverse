'use server';

// AI-related imports
import { grammarCheck, type GrammarCheckInput } from '@/ai/flows/grammar-check';
import { correctBanglaText, type CorrectBanglaTextInput } from '@/ai/flows/advanced-text-correction';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

// Structure of the data in dictionary-full.json
interface DictionaryEntry {
  bn: string;
  en: string | string[];
  bn_syns: string[];
  en_syns: string[];
  sents: string[];
  pron: string[];
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

let dictionaryData: DictionaryEntry[] | null = null;

async function getDictionaryData(): Promise<DictionaryEntry[]> {
  if (dictionaryData) {
    return dictionaryData;
  }
  try {
    const dataDir = process.env.NODE_ENV === 'production'
      ? path.join(process.cwd(), '.next/server/data')
      : path.join(process.cwd(), 'data');
    const filePath = path.join(dataDir, 'dictionary-full.json');
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    dictionaryData = JSON.parse(fileContent);
    return dictionaryData!;
  } catch (error) {
    console.error("Error reading or parsing dictionary file:", error);
    throw new Error('অভিধানের ডেটা লোড করতে সমস্যা হয়েছে।');
  }
}

// getWordDetails function using local dictionary file
export async function getWordDetails(
  word: string,
): Promise<WordDetails | { error: string }> {
  if (!word) {
    return { error: 'অনুগ্রহ করে একটি শব্দ লিখুন।' };
  }

  try {
    const dictionary = await getDictionaryData();
    const searchWord = word.toLowerCase();

    const foundWord = dictionary.find(entry => {
      const isBengaliMatch = entry.bn.toLowerCase() === searchWord;

      const isEnglishMatch = (typeof entry.en === 'string')
        ? entry.en.toLowerCase() === searchWord
        : Array.isArray(entry.en)
          ? entry.en.some(enWord => enWord.toLowerCase() === searchWord)
          : false;

      return isBengaliMatch || isEnglishMatch;
    });

    if (foundWord) {
      const pronunciation = (foundWord.pron && foundWord.pron.length > 1 && foundWord.pron[1]) ? foundWord.pron[1] : foundWord.bn;
      const result: WordDetails = {
        word: foundWord.bn, // Always show the Bengali word as the main word
        pronunciation: pronunciation,
        meaning: Array.isArray(foundWord.en) ? foundWord.en.join(', ') : foundWord.en as string, // Always show English as meaning
        synonyms: foundWord.bn_syns,
        examples: foundWord.sents,
      };
      return result;
    } else {
      return { error: `"${word}" শব্দটি অভিধানে পাওয়া যায়নি।` };
    }
  } catch (error) {
    console.error('Error in getWordDetails:', error);
    if (error instanceof Error) {
        return { error: error.message };
    }
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
        const dataDir = process.env.NODE_ENV === 'production'
          ? path.join(process.cwd(), '.next/server/data')
          : path.join(process.cwd(), 'data');
        const filePath = path.join(dataDir, 'word-list.txt');
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