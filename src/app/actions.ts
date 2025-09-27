'use server';

import { suggestSynonyms, type SuggestSynonymsInput } from '@/ai/flows/synonym-suggestions';
import { spellCheck, type SpellCheckInput } from '@/ai/flows/spell-check';
import { grammarCheck, type GrammarCheckInput } from '@/ai/flows/grammar-check';
import { correctBanglaText, type CorrectBanglaTextInput } from '@/ai/flows/advanced-text-correction';
import { dictionaryLookup, type DictionaryLookupInput } from '@/ai/flows/dictionary-lookup';
import { z } from 'zod';


export async function getWordDetails(word: string) {
  if (!word) {
    return { error: 'একটি শব্দ প্রদান করুন।' };
  }

  try {
    const synonymInput: SuggestSynonymsInput = { word };
    const dictionaryInput: DictionaryLookupInput = { word };

    // Run both AI calls in parallel for better performance
    const [synonymResult, dictionaryResult] = await Promise.all([
        suggestSynonyms(synonymInput),
        dictionaryLookup(dictionaryInput)
    ]);
    
    return {
      word,
      pronunciation: dictionaryResult.pronunciation,
      meaning: dictionaryResult.meaning,
      examples: dictionaryResult.examples,
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
