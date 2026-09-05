'use server';

// AI-related imports
import { grammarCheck, type GrammarCheckInput } from '@/ai/flows/grammar-check';
import { correctBanglaText, type CorrectBanglaTextInput } from '@/ai/flows/advanced-text-correction';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

// Structure of the data in dictionary-full.json
interface DictionaryEntry {
  bn: string;
  en: string | string[];
  bn_syns: string[];
  en_syns: string[];
  sents: string[];
  pron: string[];
}

// Structure the client component expects
export type WordDetails = {
  word: string;
  pronunciation: string;
  meaning: string;
  examples: string[];
  synonyms: string[];
  englishSynonyms?: string[];
  similarWords?: string[];
  error?: string;
};

export type SpellCheckDetailedSuggestion = {
  word: string;
  suggestions: string[];
};

export type SpellCheckResult = {
  correctedText: string;
  suggestions: string[];
  detailedSuggestions?: SpellCheckDetailedSuggestion[];
  stats?: {
    totalWords: number;
    errorCount: number;
    accuracyPercent: number;
  };
  error: string | null;
};

// Caches for fast in-memory lookups
let dictionaryData: DictionaryEntry[] | null = null;
let bnIndex: Map<string, DictionaryEntry> = new Map();
let enIndex: Map<string, DictionaryEntry> = new Map();
let wordListCache: Set<string> | null = null;
let wordListArrayCache: string[] | null = null;

// Helper to reliably locate data files in any environment (local dev, standalone, Vercel, Firebase)
function getDataFilePath(filename: string): string {
  const candidates = [
    path.join(process.cwd(), 'data', filename),
    path.join(process.cwd(), '.next', 'server', 'data', filename),
    path.join(__dirname, 'data', filename),
    path.join(__dirname, '..', 'data', filename),
    path.join(__dirname, '..', '..', 'data', filename),
    path.resolve(process.cwd(), 'data', filename),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return path.join(process.cwd(), 'data', filename);
}

// Load and index dictionary data
async function getDictionaryData(): Promise<DictionaryEntry[]> {
  if (dictionaryData) {
    return dictionaryData;
  }
  try {
    const filePath = getDataFilePath('dictionary-full.json');
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    dictionaryData = JSON.parse(fileContent);

    // Build O(1) indexes for fast lookup
    bnIndex = new Map();
    enIndex = new Map();

    if (dictionaryData) {
      for (const entry of dictionaryData) {
        if (entry.bn) {
          const bnKey = entry.bn.trim().toLowerCase();
          if (!bnIndex.has(bnKey)) {
            bnIndex.set(bnKey, entry);
          }
        }
        if (typeof entry.en === 'string') {
          const enKey = entry.en.trim().toLowerCase();
          if (!enIndex.has(enKey)) {
            enIndex.set(enKey, entry);
          }
        } else if (Array.isArray(entry.en)) {
          for (const item of entry.en) {
            const enKey = item.trim().toLowerCase();
            if (!enIndex.has(enKey)) {
              enIndex.set(enKey, entry);
            }
          }
        }
      }
    }

    return dictionaryData!;
  } catch (error) {
    console.error("Error reading or parsing dictionary file:", error);
    throw new Error('অভিধানের ডেটা লোড করতে সমস্যা হয়েছে।');
  }
}

// Find similar/prefix-matching words when an exact match isn't found
function findSimilarWords(searchWord: string, dictionary: DictionaryEntry[], limit: number = 6): string[] {
  const query = searchWord.toLowerCase().trim();
  if (!query) return [];

  const matches: { word: string; score: number }[] = [];
  const seen = new Set<string>();

  for (const entry of dictionary) {
    const bn = entry.bn?.trim();
    if (bn && !seen.has(bn)) {
      const bnLower = bn.toLowerCase();
      if (bnLower.startsWith(query)) {
        seen.add(bn);
        matches.push({ word: bn, score: 1 });
      } else if (bnLower.includes(query)) {
        seen.add(bn);
        matches.push({ word: bn, score: 2 });
      }
    }
    if (typeof entry.en === 'string') {
      const en = entry.en.trim();
      if (en && !seen.has(en)) {
        const enLower = en.toLowerCase();
        if (enLower.startsWith(query)) {
          seen.add(en);
          matches.push({ word: en, score: 1 });
        }
      }
    }
    if (matches.length >= limit * 3) break;
  }

  matches.sort((a, b) => a.score - b.score);
  return matches.slice(0, limit).map(m => m.word);
}

// getWordDetails function using indexed dictionary
export async function getWordDetails(
  word: string,
): Promise<WordDetails | { error: string; similarWords?: string[] }> {
  if (!word || !word.trim()) {
    return { error: 'অনুগ্রহ করে একটি শব্দ লিখুন।' };
  }

  try {
    const dictionary = await getDictionaryData();
    const cleanWord = word.trim();
    const searchWord = cleanWord.toLowerCase();

    // Fast O(1) indexed lookup first
    let foundWord = bnIndex.get(searchWord) || enIndex.get(searchWord);

    // Fallback: full scan if needed
    if (!foundWord) {
      foundWord = dictionary.find(entry => {
        const isBengaliMatch = entry.bn.toLowerCase() === searchWord;
        const isEnglishMatch = (typeof entry.en === 'string')
          ? entry.en.toLowerCase() === searchWord
          : Array.isArray(entry.en)
            ? entry.en.some(enWord => enWord.toLowerCase() === searchWord)
            : false;
        return isBengaliMatch || isEnglishMatch;
      });
    }

    if (foundWord) {
      const pronunciation = (foundWord.pron && foundWord.pron.length > 1 && foundWord.pron[1])
        ? foundWord.pron[1]
        : (foundWord.pron && foundWord.pron[0])
          ? foundWord.pron[0]
          : foundWord.bn;

      const result: WordDetails = {
        word: foundWord.bn,
        pronunciation: pronunciation,
        meaning: Array.isArray(foundWord.en) ? foundWord.en.join(', ') : foundWord.en as string,
        synonyms: foundWord.bn_syns || [],
        englishSynonyms: foundWord.en_syns || [],
        examples: foundWord.sents || [],
      };
      return result;
    } else {
      const similar = findSimilarWords(cleanWord, dictionary);
      return {
        error: `"${word}" শব্দটি অভিধানে পাওয়া যায়নি।`,
        similarWords: similar.length > 0 ? similar : undefined,
      };
    }
  } catch (error) {
    console.error('Error in getWordDetails:', error);
    if (error instanceof Error) {
        return { error: error.message };
    }
    return { error: 'ডেটাবেস থেকে তথ্য আনতে সমস্যা হয়েছে।' };
  }
}

// Helper function to check for API Key for AI functions
function checkApiKey(): string | null {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'এখানে আপনার জেমিনি এপিআই কী লিখুন') {
    return 'অনুগ্রহ করে আপনার .env.local ফাইলে জেমিনি এপিআই কী সেট করুন।';
  }
  return null;
}

// Helper function to handle errors consistently
function handleError(e: unknown): { error: string } {
  console.error(e);
  if (e instanceof Error) {
    return { error: e.message };
  }
  return { error: 'একটি অজানা ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।' };
}

// --- Spell Check functionality ---
const spellCheckSchema = z.object({
  text: z.string().min(1, 'অনুগ্রহ করে কিছু লেখা দিন।'),
});

async function getWordList(): Promise<{ set: Set<string>; list: string[] }> {
  if (wordListCache && wordListArrayCache) {
    return { set: wordListCache, list: wordListArrayCache };
  }
  try {
    const filePath = getDataFilePath('word-list.txt');
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    const words = fileContent.split(/\r?\n/).map(w => w.trim().toLowerCase()).filter(Boolean);
    wordListCache = new Set(words);
    wordListArrayCache = words;
    return { set: wordListCache, list: wordListArrayCache };
  } catch (error) {
    console.error("Error reading word list:", error);
    return { set: new Set(), list: [] };
  }
}

// Fast Levenshtein distance for spelling suggestions
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + 1
        );
      }
    }
  }
  return dp[m][n];
}

// Find smart correction candidates for a misspelled Bangla word
function getSpellingSuggestions(misspelled: string, words: string[], limit = 4): string[] {
  const target = misspelled.toLowerCase();
  const firstChar = target.charAt(0);
  const candidates: { word: string; dist: number }[] = [];

  for (const w of words) {
    if (Math.abs(w.length - target.length) > 2) continue;
    if (w.charAt(0) !== firstChar && Math.abs(w.length - target.length) > 1) continue;

    const dist = levenshteinDistance(target, w);
    if (dist <= 2) {
      candidates.push({ word: w, dist });
      if (candidates.length >= 15) break;
    }
  }

  candidates.sort((a, b) => a.dist - b.dist);
  return candidates.slice(0, limit).map(c => c.word);
}

export async function performSpellCheck(prevState: any, formData: FormData): Promise<SpellCheckResult> {
  const validatedFields = spellCheckSchema.safeParse({
    text: formData.get('text'),
  });

  if (!validatedFields.success) {
    return {
      correctedText: '',
      suggestions: [],
      error: validatedFields.error.flatten().fieldErrors.text?.[0] || 'ত্রুটি ঘটেছে',
    };
  }

  const { text } = validatedFields.data;
  const { set: wordList, list: wordsArray } = await getWordList();
  
  const tokens = text.split(/([,.\s।!?:;"'()]+)/);
  const suggestions: string[] = [];
  const detailedSuggestions: SpellCheckDetailedSuggestion[] = [];
  let totalWords = 0;

  for (const token of tokens) {
    const cleanWord = token.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()।!?:;"']/g, '').trim();
    if (!cleanWord || /^\d+$/.test(cleanWord)) continue;

    totalWords++;
    const lower = cleanWord.toLowerCase();
    
    // Check if word is valid in word-list or dictionary
    const isValid = wordList.has(lower) || (bnIndex.size > 0 && bnIndex.has(lower));
    
    if (!isValid) {
      if (!suggestions.includes(cleanWord)) {
        suggestions.push(cleanWord);
        const candidateWords = getSpellingSuggestions(cleanWord, wordsArray);
        detailedSuggestions.push({
          word: cleanWord,
          suggestions: candidateWords,
        });
      }
    }
  }

  const errorCount = suggestions.length;
  const accuracyPercent = totalWords > 0 ? Math.max(0, Math.round(((totalWords - errorCount) / totalWords) * 100)) : 100;

  return {
    correctedText: text,
    suggestions: suggestions,
    detailedSuggestions: detailedSuggestions,
    stats: {
      totalWords,
      errorCount,
      accuracyPercent,
    },
    error: null,
  };
}

// --- Rule-Based Bangla Grammar Analyzer Engine ---
function analyzeBengaliGrammar(sentence: string): { correctedSentence: string; explanation: string; rulesApplied: string[] } {
  let corrected = sentence;
  const explanations: string[] = [];
  const rulesApplied: string[] = [];

  // 1. বহুবচনের বাহুল্য বা দ্বিত্ব দোষ (Plural Redundancy)
  const redundancyRules = [
    { pattern: /সকল\s+([\u0980-\u09FF]+)গণ/g, replace: 'সকল $1', desc: 'সকল এবং -গণ একসাথে ব্যবহারে বাহুল্য দোষ হয়।', rule: 'বহুবচনের বাহুল্য দোষ' },
    { pattern: /সকল\s+([\u0980-\u09FF]+)বৃন্দ/g, replace: 'সকল $1', desc: 'সকল এবং -বৃন্দ একসাথে ব্যবহারে বাহুল্য দোষ ঘটে।', rule: 'বহুবচনের বাহুল্য দোষ' },
    { pattern: /সব\s+([\u0980-\u09FF]+)গুলো/g, replace: 'সব $1', desc: 'সব এবং -গুলো একসাথে ব্যবহারে দ্বিত্ব দোষ হয়।', rule: 'দ্বিত্ব দোষ' },
    { pattern: /সব\s+([\u0980-\u09FF]+)রা/g, replace: 'সব $1', desc: 'সব এবং -রা ব্যবহারে বাহুল্য দোষ ঘটে।', rule: 'দ্বিত্ব দোষ' },
    { pattern: /উভয়\s+পক্ষদ্বয়/g, replace: 'উভয় পক্ষ', desc: '"উভয় পক্ষদ্বয়" অশুদ্ধ, শুদ্ধ রূপ "উভয় পক্ষ" বা "পক্ষদ্বয়"।', rule: 'দ্বিত্ব দোষ' },
    { pattern: /যাবতীয়\s+([\u0980-\u09FF]+)বৃন্দ/g, replace: 'যাবতীয় $1', desc: 'যাবতীয় এর সাথে -বৃন্দ যুক্ত হওয়া বাহুল্য দোষ।', rule: 'বহুবচনের বাহুল্য দোষ' },
  ];

  for (const r of redundancyRules) {
    if (r.pattern.test(corrected)) {
      corrected = corrected.replace(r.pattern, r.replace);
      explanations.push(r.desc);
      rulesApplied.push(r.rule);
    }
  }

  // 2. বহুল প্রচলিত ব্যাকরণিক ও বানান অশুদ্ধি
  const commonErrors = [
    { pattern: /(?<![\u0980-\u09FF])ইতিমধ্যে(?![\u0980-\u09FF])/g, replace: 'ইতোমধ্যে', note: '"ইতিমধ্যে" ভুল রূপ, ব্যাকরণগতভাবে শুদ্ধ রূপ হলো "ইতোমধ্যে"।', rule: 'বানান শুদ্ধি' },
    { pattern: /(?<![\u0980-\u09FF])উপরোক্ত(?![\u0980-\u09FF])/g, replace: 'উপর্যুক্ত', note: '"উপরোক্ত" ব্যাকরণসিদ্ধ নয়, সঠিক রূপ "উপর্যুক্ত" বা "উপরি-উক্ত"।', rule: 'সন্ধি/শব্দ প্রয়োগ' },
    { pattern: /(?<![\u0980-\u09FF])শিরচ্ছেদ(?![\u0980-\u09FF])/g, replace: 'শিরশ্ছেদ', note: 'সন্ধির নিয়মে "শিরচ্ছেদ" নয়, শুদ্ধ রূপ "শিরশ্ছেদ"।', rule: 'সন্ধি নিয়ম' },
    { pattern: /(?<![\u0980-\u09FF])লজ্জাস্কর(?![\u0980-\u09FF])/g, replace: 'লজ্জাকর', note: '"লজ্জাস্কর" ভুল, সঠিক রূপ "লজ্জাকর"।', rule: 'প্রত্যয় প্রয়োগ' },
    { pattern: /(?<![\u0980-\u09FF])দারিদ্রতা(?![\u0980-\u09FF])/g, replace: 'দরিদ্রতা', note: '"দারিদ্রতা" প্রত্যয়জনিত ভুল, শুদ্ধ রূপ "দরিদ্রতা" বা "দারিদ্র্য"।', rule: 'প্রত্যয়জনিত ভুল' },
    { pattern: /(?<![\u0980-\u09FF])ধন্যবাধ(?![\u0980-\u09FF])/g, replace: 'ধন্যবাদ', note: '"ধন্যবাধ" ভুল বানান, শুদ্ধ রূপ "ধন্যবাদ"।', rule: 'বানান শুদ্ধি' },
    { pattern: /(?<![\u0980-\u09FF])অধ্যায়ন(?![\u0980-\u09FF])/g, replace: 'অধ্যয়ন', note: '"অধ্যায়ন" ভুল বানান, শুদ্ধ রূপ "অধ্যয়ন"।', rule: 'বানান শুদ্ধি' },
    { pattern: /(?<![\u0980-\u09FF])সস্ত্রীক\s+সহ(?![\u0980-\u09FF])/g, replace: 'সস্ত্রীক', note: '"সস্ত্রীক সহ" ব্যবহারে বাহুল্য দোষ হয়, শুদ্ধ হলো "সস্ত্রীক" বা "স্ত্রীসহ"।', rule: 'বাহুল্য দোষ' },
    { pattern: /(?<![\u0980-\u09FF])অত্র(?![\u0980-\u09FF])/g, replace: 'এই', note: '"অত্র" শব্দের অর্থ "এখানে", নির্দেশক বিশেষণ হিসেবে "এই" শুদ্ধ।', rule: 'শব্দ প্রয়োগ' },
    { pattern: /(?<![\u0980-\u09FF])ফলশ্রুতিতে(?![\u0980-\u09FF])/g, replace: 'এর ফলে', note: 'ফলাফল বোঝাতে "ফলশ্রুতিতে" ভুল, "এর ফলে" বা "পরিণামে" শুদ্ধ।', rule: 'শব্দ প্রয়োগ' },
    { pattern: /(?<![\u0980-\u09FF])নিরপরাধী(?![\u0980-\u09FF])/g, replace: 'নিরপরাধ', note: '"নিরপরাধী" ব্যাকরণগতভাবে অশুদ্ধ, শুদ্ধ রূপ "নিরপরাধ"।', rule: 'বিশেষণ প্রয়োগ' },
    { pattern: /(?<![\u0980-\u09FF])নির্দোষী(?![\u0980-\u09FF])/g, replace: 'নির্দোষ', note: '"নির্দোষী" ভুল, সঠিক রূপ "নির্দোষ"।', rule: 'বিশেষণ প্রয়োগ' },
    { pattern: /(?<![\u0980-\u09FF])অহোরাত্রি(?![\u0980-\u09FF])/g, replace: 'অহোরাত্র', note: '"অহোরাত্রি" সমাসগতভাবে অশুদ্ধ, শুদ্ধ রূপ "অহোরাত্র"।', rule: 'সমাস নিয়ম' },
  ];

  for (const item of commonErrors) {
    if (item.pattern.test(corrected)) {
      corrected = corrected.replace(item.pattern, item.replace);
      explanations.push(item.note);
      rulesApplied.push(item.rule);
    }
  }

  // 3. গুরুচণ্ডালী দোষ (সাধু ও চলিত ভাষার মিশ্রণ)
  const sadhuMarkers = [
    { word: 'যাহা', replace: 'যা' },
    { word: 'তাহা', replace: 'তা' },
    { word: 'তাহাদের', replace: 'তাদের' },
    { word: 'তাহারা', replace: 'তারা' },
    { word: 'যাহারা', replace: 'যারা' },
    { word: 'যাহাদের', replace: 'যাদের' },
    { word: 'করিয়া', replace: 'করে' },
    { word: 'বলিয়া', replace: 'বলে' },
    { word: 'খাইয়া', replace: 'খেয়ে' },
    { word: 'যাইয়া', replace: 'গিয়ে' },
    { word: 'দেখিয়া', replace: 'দেখে' },
    { word: 'আসিয়া', replace: 'এসে' },
    { word: 'বসিয়া', replace: 'বসে' },
    { word: 'হইয়া', replace: 'হয়ে' },
    { word: 'হইলেন', replace: 'হলেন' },
    { word: 'হইয়াছিল', replace: 'হয়েছিল' },
    { word: 'করিয়াছিল', replace: 'করেছিল' },
    { word: 'বলিয়াছিল', replace: 'বলেছিল' },
    { word: 'হইয়াছে', replace: 'হয়েছে' },
    { word: 'করিতেছি', replace: 'করছি' },
    { word: 'করিতেছে', replace: 'করছে' },
  ];

  let hasSadhu = false;
  for (const s of sadhuMarkers) {
    const reg = new RegExp(`(?<![\\u0980-\\u09FF])${s.word}(?![\\u0980-\\u09FF])`, 'g');
    if (reg.test(corrected)) {
      hasSadhu = true;
      corrected = corrected.replace(reg, s.replace);
    }
  }

  if (hasSadhu) {
    explanations.push('সাধু ও চলিত ভাষার মিশ্রণ (গুরুচণ্ডালী দোষ) পরিহার করে প্রমিত চলিত রূপ প্রয়োগ করা হয়েছে।');
    rulesApplied.push('গুরুচণ্ডালী দোষ');
  }

  if (explanations.length === 0) {
    return {
      correctedSentence: sentence,
      explanation: 'বাক্যটিতে কোনো ব্যাকরণগত বা বানানগত ত্রুটি পাওয়া যায়নি। বাক্যটি শুদ্ধ রয়েছে।',
      rulesApplied: [],
    };
  }

  return {
    correctedSentence: corrected,
    explanation: explanations.join(' | '),
    rulesApplied: Array.from(new Set(rulesApplied)),
  };
}

export type GrammarCheckResult = {
  correctedSentence: string;
  explanation: string;
  rulesApplied?: string[];
  isOffline?: boolean;
  error: string | null;
};

export type AdvancedCorrectionResult = {
  correctedText: string;
  highlightedCorrections: string;
  stats?: {
    changedCount?: number;
  };
  isOffline?: boolean;
  error: string | null;
};

// --- Grammar Check functionality ---
const grammarCheckSchema = z.object({
  sentence: z.string().min(1, 'অনুগ্রহ করে একটি বাক্য দিন।'),
});

export async function performGrammarCheck(
  prevState: any,
  formData: FormData
): Promise<GrammarCheckResult> {
  const validatedFields = grammarCheckSchema.safeParse({
    sentence: formData.get('sentence'),
  });

  if (!validatedFields.success) {
    return {
      correctedSentence: '',
      explanation: '',
      rulesApplied: [],
      isOffline: false,
      error: validatedFields.error.flatten().fieldErrors.sentence?.[0] || 'ত্রুটি',
    };
  }

  const { sentence } = validatedFields.data;
  const apiKeyError = checkApiKey();

  if (apiKeyError) {
    // Intelligent rule-based fallback when Gemini API key is not configured
    const ruleResult = analyzeBengaliGrammar(sentence);
    return {
      correctedSentence: ruleResult.correctedSentence,
      explanation: `${ruleResult.explanation} (অফলাইন ব্যাকরণ ইঞ্জিন দ্বারা বিশ্লেষিত)`,
      rulesApplied: ruleResult.rulesApplied,
      isOffline: true,
      error: null,
    };
  }

  try {
    const aiResult = await grammarCheck(validatedFields.data as GrammarCheckInput);
    return {
      correctedSentence: aiResult.correctedSentence,
      explanation: aiResult.explanation,
      rulesApplied: [],
      isOffline: false,
      error: null,
    };
  } catch (e) {
    console.warn('AI grammar check error, falling back to rule-based engine:', e);
    const ruleResult = analyzeBengaliGrammar(sentence);
    return {
      correctedSentence: ruleResult.correctedSentence,
      explanation: ruleResult.explanation,
      rulesApplied: ruleResult.rulesApplied,
      isOffline: true,
      error: null,
    };
  }
}

// --- Advanced Correction functionality ---
const advancedCorrectionSchema = z.object({
  text: z.string().min(1, 'অনুগ্রহ করে কিছু লেখা দিন।'),
});

export async function performAdvancedCorrection(
  prevState: any,
  formData: FormData
): Promise<AdvancedCorrectionResult> {
  const validatedFields = advancedCorrectionSchema.safeParse({
    text: formData.get('text'),
  });

  if (!validatedFields.success) {
    return {
      correctedText: '',
      highlightedCorrections: '',
      isOffline: false,
      error: validatedFields.error.flatten().fieldErrors.text?.[0] || 'ত্রুটি',
    };
  }

  const { text } = validatedFields.data;
  const apiKeyError = checkApiKey();

  if (apiKeyError) {
    // Robust rule-based engine for document correction
    const segments = text.split(/([।!?\n]+)/);
    let correctedText = '';
    let highlightedCorrections = '';
    let changedSegmentsCount = 0;

    for (const part of segments) {
      if (!part.trim() || /^[।!?\n\s]+$/.test(part)) {
        correctedText += part;
        highlightedCorrections += part;
        continue;
      }

      const analyzed = analyzeBengaliGrammar(part);
      correctedText += analyzed.correctedSentence;

      if (analyzed.correctedSentence !== part) {
        changedSegmentsCount++;
        highlightedCorrections += `<mark class="bg-amber-200 text-amber-950 font-medium px-1 rounded">${analyzed.correctedSentence}</mark>`;
      } else {
        highlightedCorrections += part;
      }
    }

    return {
      correctedText,
      highlightedCorrections,
      stats: {
        changedCount: changedSegmentsCount,
      },
      isOffline: true,
      error: null,
    };
  }

  try {
    const aiResult = await correctBanglaText({ textDocument: validatedFields.data.text });
    return {
      correctedText: aiResult.correctedText,
      highlightedCorrections: aiResult.highlightedCorrections,
      stats: {
        changedCount: 0,
      },
      isOffline: false,
      error: null,
    };
  } catch (e) {
    console.warn('AI advanced correction error, falling back to rule-based analyzer:', e);
    const analyzed = analyzeBengaliGrammar(text);
    return {
      correctedText: analyzed.correctedSentence,
      highlightedCorrections: `<mark class="bg-amber-200 text-amber-950 font-medium px-1 rounded">${analyzed.correctedSentence}</mark>`,
      stats: {
        changedCount: 0,
      },
      isOffline: true,
      error: null,
    };
  }
}