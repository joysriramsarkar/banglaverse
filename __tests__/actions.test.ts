import { performSpellCheck, getWordDetails } from '../src/app/actions';
import { JSDOM } from 'jsdom';

// Mock FormData
const jsdom = new JSDOM();
global.FormData = jsdom.window.FormData;

// Mock the AI flows because they cause environment issues in Jest
// The paths here must match what's being imported in `src/app/actions.ts`
jest.mock('@/ai/flows/grammar-check', () => ({
  grammarCheck: jest.fn(),
}));
jest.mock('@/ai/flows/advanced-text-correction', () => ({
  correctBanglaText: jest.fn(),
}));


describe('performSpellCheck', () => {
  it('should not return suggestions for correctly spelled words separated by punctuation', async () => {
    const formData = new FormData();
    formData.append('text', 'আমি,ভাত');
    const result = await performSpellCheck({}, formData);
    expect(result.suggestions).toEqual([]);
  });
});

describe('getWordDetails', () => {
  it('should return details for an existing word', async () => {
    const result = await getWordDetails('carry-on');
    // Ensure no error is returned
    expect(result.error).toBeUndefined();

    // Check if the word property exists and is correct
    if ('word' in result) {
      expect(result.word).toBe('carry-on');
      expect(result.pronunciation).toBe('Bahana ana');
      expect(result.meaning).toBe('বহন অন');
      expect(result.synonyms).toEqual([]);
      expect(result.examples).toEqual([
        "And it can be attached to purses, laptops, <b>carry-ons</b> , and suitcases.",
        "Though the no-bags option is an appealing one, I think I'll stick to <b>carry-on</b> luggage."
      ]);
    } else {
      // Fail the test if word property is not in the result
      fail('Word details not found for "carry-on"');
    }
  });

  it('should return an error for a non-existent word', async () => {
    const result = await getWordDetails('nonexistentword');
    expect(result.error).toBe('"nonexistentword" শব্দটি অভিধানে পাওয়া যায়নি।');
  });

  it('should return an error for an empty input', async () => {
    const result = await getWordDetails('');
    expect(result.error).toBe('অনুগ্রহ করে একটি শব্দ লিখুন।');
  });
});