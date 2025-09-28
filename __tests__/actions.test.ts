import { performSpellCheck } from '../src/app/actions';
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