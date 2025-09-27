'use server';

import { suggestSynonyms, type SuggestSynonymsInput } from '@/ai/flows/synonym-suggestions';
import { spellCheck, type SpellCheckInput } from '@/ai/flows/spell-check';
import { grammarCheck, type GrammarCheckInput } from '@/ai/flows/grammar-check';
import { correctBanglaText, type CorrectBanglaTextInput } from '@/ai/flows/advanced-text-correction';
import { z } from 'zod';

// Mock dictionary data
const dictionary: { [key: string]: { pronunciation: string; meaning: string; examples: string[] } } = {
  'আনন্দ': {
    pronunciation: '[anondo]',
    meaning: 'হর্ষ, খুশি, তৃপ্তি, সুখ।',
    examples: ['তার মনে অনেক আনন্দ।', 'পূজার আনন্দে সবাই মেতে উঠেছে।'],
  },
  'ঘর': {
    pronunciation: '[ghor]',
    meaning: 'বাসস্থান, আবাস, নিলয়, গৃহ।',
    examples: ['সে তার নতুন ঘরে প্রবেশ করল।', 'পাখিরা সন্ধ্যায় ঘরে ফেরে।'],
  },
  'জল': {
    pronunciation: '[jol]',
    meaning: 'পানি, বারি, নীর।',
    examples: ['নদীর জল খুব স্বচ্ছ।', 'তৃষ্ণার্ত পথিক জল পান করল।']
  },
  ' আকাশ': {
    pronunciation: '[akash]',
    meaning: 'গগন, অম্বর, ব্যোম।',
    examples: ['নীল আকাশে সাদা মেঘ ভেসে বেড়াচ্ছে।', 'রাতের আকাশে অনেক তারা দেখা যায়।']
  }
};

export async function getWordDetails(word: string) {
  if (!word) {
    return { error: 'একটি শব্দ প্রদান করুন।' };
  }

  try {
    const synonymInput: SuggestSynonymsInput = { word };
    const synonymResult = await suggestSynonyms(synonymInput);

    const details = dictionary[word] || {
      pronunciation: 'দুঃখিত, উচ্চারণ পাওয়া যায়নি।',
      meaning: 'দুঃখিত, এই শব্দের অর্থ আমাদের অভিধানে নেই।',
      examples: [],
    };
    
    return {
      word,
      ...details,
      synonyms: synonymResult.synonyms,
    };
  } catch (e) {
    console.error(e);
    return { error: 'কিছু একটা ভুল হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' };
  }
}

const spellCheckSchema = z.object({
  text: z.string().min(1, 'অনুগ্রহ করে কিছু লেখা দিন।'),
});

export async function performSpellCheck(prevState: any, formData: FormData) {
  const validatedFields = spellCheckSchema.safeParse({
    text: formData.get('text'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.text?.[0],
    };
  }

  try {
    return await spellCheck(validatedFields.data as SpellCheckInput);
  } catch (e) {
    console.error(e);
    return { error: 'কিছু একটা ভুল হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' };
  }
}


const grammarCheckSchema = z.object({
  sentence: z.string().min(1, 'অনুগ্রহ করে একটি বাক্য দিন।'),
});

export async function performGrammarCheck(prevState: any, formData: FormData) {
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
    console.error(e);
    return { error: 'কিছু একটা ভুল হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' };
  }
}


const advancedCorrectionSchema = z.object({
  text: z.string().min(1, 'অনুগ্রহ করে কিছু লেখা দিন।'),
});

export async function performAdvancedCorrection(prevState: any, formData: FormData) {
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
    console.error(e);
    return { error: 'কিছু একটা ভুল হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' };
  }
}
