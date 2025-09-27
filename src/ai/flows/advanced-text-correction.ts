'use server';

/**
 * @fileOverview An AI agent to correct spelling and grammar in large Bangla text documents.
 *
 * - correctBanglaText - A function that corrects Bangla text and provides corrected and highlighted versions.
 * - CorrectBanglaTextInput - The input type for the correctBanglaText function.
 * - CorrectBanglaTextOutput - The return type for the correctBanglaText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const CorrectBanglaTextInputSchema = z.object({
  textDocument: z
    .string()
    .describe('The complete Bangla text document to be corrected.'),
});
export type CorrectBanglaTextInput = z.infer<typeof CorrectBanglaTextInputSchema>;

const CorrectBanglaTextOutputSchema = z.object({
  correctedText: z
    .string()
    .describe('The complete Bangla text document with spelling and grammar corrections applied.'),
  highlightedCorrections: z
    .string()
    .describe(
      'The complete Bangla text document with spelling and grammar corrections highlighted.'
    ),
});
export type CorrectBanglaTextOutput = z.infer<typeof CorrectBanglaTextOutputSchema>;

export async function correctBanglaText(input: CorrectBanglaTextInput): Promise<CorrectBanglaTextOutput> {
  return correctBanglaTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'correctBanglaTextPrompt',
  input: {schema: CorrectBanglaTextInputSchema},
  output: {schema: CorrectBanglaTextOutputSchema},
  model: googleAI.model('gemini-1.5-flash'),
  prompt: `You are a highly skilled Bangla language expert, specializing in correcting spelling and grammar in Bangla text documents. You will receive a complete Bangla text document as input, and you will return two versions of the document:

  1.  correctedText: A version of the document with all spelling and grammar errors corrected.
  2.  highlightedCorrections: A version of the document where all the corrections are highlighted, for example, using Markdown.

  Here is the Bangla text document:
  {{{textDocument}}}`,
});

const correctBanglaTextFlow = ai.defineFlow(
  {
    name: 'correctBanglaTextFlow',
    inputSchema: CorrectBanglaTextInputSchema,
    outputSchema: CorrectBanglaTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
