// GrammarCheck story: implements grammar checking for Bangla sentences with LLM-based reasoning.

'use server';

/**
 * @fileOverview Grammar check functionality for Bangla sentences.
 *
 * - grammarCheck - Checks grammar of Bangla sentences and suggests corrections.
 * - GrammarCheckInput - Input type for the grammarCheck function.
 * - GrammarCheckOutput - Return type for the grammarCheck function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GrammarCheckInputSchema = z.object({
  sentence: z.string().describe('The Bangla sentence to check for grammatical errors.'),
});
export type GrammarCheckInput = z.infer<typeof GrammarCheckInputSchema>;

const GrammarCheckOutputSchema = z.object({
  correctedSentence: z.string().describe('The corrected Bangla sentence, if any errors were found.'),
  explanation: z.string().describe('Explanation of the grammar corrections, or a message indicating no errors found.'),
});
export type GrammarCheckOutput = z.infer<typeof GrammarCheckOutputSchema>;

export async function grammarCheck(input: GrammarCheckInput): Promise<GrammarCheckOutput> {
  return grammarCheckFlow(input);
}

const grammarCheckPrompt = ai.definePrompt({
  name: 'grammarCheckPrompt',
  input: {schema: GrammarCheckInputSchema},
  output: {schema: GrammarCheckOutputSchema},
  prompt: `You are a Bangla grammar expert. You will receive a Bangla sentence and your task is to check it for any grammatical errors. If there are any errors, correct them and provide an explanation of the corrections you made.
If the sentence is grammatically correct, return the original sentence and indicate that no errors were found.

Sentence: {{{sentence}}}
`,
});

const grammarCheckFlow = ai.defineFlow(
  {
    name: 'grammarCheckFlow',
    inputSchema: GrammarCheckInputSchema,
    outputSchema: GrammarCheckOutputSchema,
  },
  async input => {
    const {output} = await grammarCheckPrompt(input);
    return output!;
  }
);
