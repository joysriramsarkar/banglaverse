'use server';

import { grammarCheck, type GrammarCheckInput } from '@/ai/flows/grammar-check';
import { correctBanglaText, type CorrectBanglaTextInput } from '@/ai/flows/advanced-text-correction';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';

type DictionaryEntry = {
    bn: string;
    pron: string[];
    en: string;
    bn_syns: string[];
    sents: string[];
};

// Helper function to check for API Key
function checkApiKey() {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'এখানে আপনার জেমিনি এপিআই কী লিখুন') {
    return 'অনুগ্রহ করে আপনার .env.local ফাইলে জেমিনি এপিআই কী সেট করুন।';
  }
  return null;
}

// Helper function to handle errors and return a consistent format
function handleError(e: unknown): { error: string } {
  console.error(e);
  if (e instanceof Error) {
    // Return the actual error message from the AI service
    return { error: e.message };
  }
  return { error: 'একটি অজানা ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।' };
}

export async function getWordDetails(word: string) {
  if (!word) {
    return { error: 'একটি শব্দ প্রদান করুন।' };
  }

  try {
    const filePath = path.join(process.cwd(), 'src', 'lib', 'data', 'dictionary-full.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const dictionary: DictionaryEntry[] = JSON.parse(fileContent);

    const foundWord = dictionary.find(entry => entry.bn.toLowerCase() === word.toLowerCase());

    if (foundWord) {
      return {
        word: foundWord.bn,
        pronunciation: foundWord.pron[1] || foundWord.pron[0] || '',
        meaning: foundWord.en,
        examples: foundWord.sents.map(s => s.replace(/<b>(.*?)<\/b>/g, '$1')),
        synonyms: foundWord.bn_syns,
      };
    } else {
      return { error: `"${word}" শব্দটি অভিধানে পাওয়া যায়নি।` };
    }
  } catch (e) {
      console.error(e);
      return { error: 'অভিধান ফাইল পড়তে সমস্যা হয়েছে।' };
  }
}

const spellCheckSchema = z.object({
  text: z.string().min(1, 'অনুগ্রহ করে কিছু লেখা দিন।'),
});

async function getWordList() {
    try {
        const filePath = path.join(process.cwd(), 'src', 'lib', 'data', 'word-list.txt');
        const fileContent = await fs.readFile(filePath, 'utf-8');
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
  let correctedText = '';

  wordsInText.forEach(word => {
    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()।]/g,"");
    if (cleanWord && !wordList.has(cleanWord.toLowerCase())) {
        if(!suggestions.includes(cleanWord)) {
            suggestions.push(cleanWord);
        }
    }
    correctedText += word;
  });

  return {
    correctedText: text, // Return original text as we are only providing suggestions
    suggestions: suggestions,
    error: null,
  };
}


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
