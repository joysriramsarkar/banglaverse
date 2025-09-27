'use server';

/**
 * @fileOverview Provides synonym suggestions for Bangla words.
 *
 * - suggestSynonyms - A function that suggests synonyms for a given Bangla word.
 * - SuggestSynonymsInput - The input type for the suggestSynonyms function.
 * - SuggestSynonymsOutput - The return type for the suggestSynonyms function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const SuggestSynonymsInputSchema = z.object({
  word: z.string().describe('The Bangla word to find synonyms for.'),
});
export type SuggestSynonymsInput = z.infer<typeof SuggestSynonymsInputSchema>;

const SuggestSynonymsOutputSchema = z.object({
  synonyms: z.array(z.string()).describe('An array of synonym suggestions for the given word.'),
});
export type SuggestSynonymsOutput = z.infer<typeof SuggestSynonymsOutputSchema>;

export async function suggestSynonyms(input: SuggestSynonymsInput): Promise<SuggestSynonymsOutput> {
  return suggestSynonymsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSynonymsPrompt',
  input: {schema: SuggestSynonymsInputSchema},
  output: {schema: SuggestSynonymsOutputSchema},
  model: googleAI.model('gemini-1.5-flash'),
  prompt: `You are a helpful assistant that provides synonyms for Bangla words.

  Provide a list of synonyms for the following Bangla word:

  {{word}}

  Synonyms:`,
});

const suggestSynonymsFlow = ai.defineFlow(
  {
    name: 'suggestSynonymsFlow',
    inputSchema: SuggestSynonymsInputSchema,
    outputSchema: SuggestSynonymsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
