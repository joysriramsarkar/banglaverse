'use server';

/**
 * @fileOverview Provides comprehensive dictionary lookups for Bangla words using an AI model.
 *
 * - dictionaryLookup - A function that provides details for a given Bangla word.
 * - DictionaryLookupInput - The input type for the dictionaryLookup function.
 * - DictionaryLookupOutput - The return type for the dictionaryLookup function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const DictionaryLookupInputSchema = z.object({
  word: z.string().describe('The Bangla word to look up in the dictionary.'),
});
export type DictionaryLookupInput = z.infer<typeof DictionaryLookupInputSchema>;

const DictionaryLookupOutputSchema = z.object({
  pronunciation: z.string().describe("The pronunciation of the word, in IPA or a common transliteration format."),
  meaning: z.string().describe('A detailed meaning or definition of the word.'),
  examples: z.array(z.string()).describe('A list of example sentences using the word.'),
});
export type DictionaryLookupOutput = z.infer<typeof DictionaryLookupOutputSchema>;

export async function dictionaryLookup(input: DictionaryLookupInput): Promise<DictionaryLookupOutput> {
  return dictionaryLookupFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dictionaryLookupPrompt',
  input: {schema: DictionaryLookupInputSchema},
  output: {schema: DictionaryLookupOutputSchema},
  model: googleAI.model('gemini-1.5-flash'),
  prompt: `You are a highly knowledgeable Bangla language expert and lexicographer. Your task is to provide detailed information about a given Bangla word.

For the word "{{word}}", please provide the following:
1.  **Pronunciation**: The correct pronunciation of the word.
2.  **Meaning**: A clear and comprehensive definition of the word.
3.  **Examples**: Two or more example sentences that clearly demonstrate the word's usage.

If the word is not a valid Bangla word, please indicate that in the meaning field.`,
});

const dictionaryLookupFlow = ai.defineFlow(
  {
    name: 'dictionaryLookupFlow',
    inputSchema: DictionaryLookupInputSchema,
    outputSchema: DictionaryLookupOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
