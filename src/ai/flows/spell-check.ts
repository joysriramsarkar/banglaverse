'use server';

/**
 * @fileOverview Implements Bangla spell check functionality using Genkit.
 *
 * - spellCheck - A function that accepts Bangla text and suggests spelling corrections.
 * - SpellCheckInput - The input type for the spellCheck function.
 * - SpellCheckOutput - The return type for the spellCheck function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SpellCheckInputSchema = z.object({
  text: z.string().describe('The Bangla text to check for spelling errors.'),
});
export type SpellCheckInput = z.infer<typeof SpellCheckInputSchema>;

const SpellCheckOutputSchema = z.object({
  correctedText: z.string().describe('The text with spelling errors corrected.'),
  suggestions: z.array(z.string()).describe('An array of spelling suggestions.'),
});
export type SpellCheckOutput = z.infer<typeof SpellCheckOutputSchema>;

export async function spellCheck(input: SpellCheckInput): Promise<SpellCheckOutput> {
  return spellCheckFlow(input);
}

const spellCheckPrompt = ai.definePrompt({
  name: 'spellCheckPrompt',
  input: {schema: SpellCheckInputSchema},
  output: {schema: SpellCheckOutputSchema},
  prompt: `You are a Bangla spell checker. Correct the spelling of the following Bangla text and provide spelling suggestions.

Text: {{{text}}}

Corrected Text:`,
});

const spellCheckFlow = ai.defineFlow(
  {
    name: 'spellCheckFlow',
    inputSchema: SpellCheckInputSchema,
    outputSchema: SpellCheckOutputSchema,
  },
  async input => {
    const {output} = await spellCheckPrompt(input);
    return output!;
  }
);
